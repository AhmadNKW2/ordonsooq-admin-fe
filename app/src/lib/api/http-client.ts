/**
 * HTTP Client - A wrapper around fetch API with interceptors and error handling
 * Following the Singleton pattern
 * Supports cookie-based authentication with automatic token refresh
 */

import { API_CONFIG } from "../constants";
import { ApiError, ApiResponse } from "../../types/common.types";
import { showErrorToast } from "../toast";
import { sessionManager } from "../session/session-manager";
import { invalidateAllQueries } from "../query-client";

type RequestInterceptor = (
  config: RequestInit
) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

// Event type for auth state changes
export type AuthStateChangeHandler = (isAuthenticated: boolean) => void;

class HttpClient {
  private static instance: HttpClient;
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private authStateHandlers: Set<AuthStateChangeHandler> = new Set();

  private constructor() {
    this.baseURL = API_CONFIG.baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Add a request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Subscribe to auth state changes (for 401 handling)
   */
  public onAuthStateChange(handler: AuthStateChangeHandler): () => void {
    this.authStateHandlers.add(handler);
    return () => {
      this.authStateHandlers.delete(handler);
    };
  }

  /**
   * Notify all handlers of auth state change
   */
  private notifyAuthStateChange(isAuthenticated: boolean): void {
    this.authStateHandlers.forEach(handler => handler(isAuthenticated));
  }

  /**
   * Attempt to refresh the access token using refresh token cookie
   */
  private async refreshToken(): Promise<boolean> {
    // If already refreshing, wait for the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return false;
        }

        // Token refreshed successfully via cookies
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Apply all request interceptors
   */
  private async applyRequestInterceptors(
    config: RequestInit
  ): Promise<RequestInit> {
    let modifiedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Apply all response interceptors
   */
  private async applyResponseInterceptors(
    response: Response
  ): Promise<Response> {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response, originalRequest?: { endpoint: string; options: RequestInit }): Promise<never> {
    let errorMessage = "An error occurred";
    let errors: Record<string, string[]> | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error?.message || errorMessage;
      errors = errorData.errors;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    const error: ApiError = {
      message: errorMessage,
      statusCode: response.status,
      errors,
    };

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && originalRequest) {
      // Try to refresh the token
      const refreshSuccess = await this.refreshToken();
      
      if (refreshSuccess) {
        // Retry the original request
        const retryResponse = await fetch(
          `${this.baseURL}${originalRequest.endpoint}`,
          {
            ...originalRequest.options,
            credentials: 'include',
          }
        );
        
        if (retryResponse.ok) {
          // Return the successful response (caller will handle this)
          // We need to throw a special error that includes the retry response
          throw { __retryResponse: retryResponse };
        }
      }
      
      // Refresh failed or retry failed - clear session and redirect
      if (typeof window !== "undefined") {
        sessionManager.clearSession();
        // Save intended URL for after login
        sessionManager.setIntendedUrl(window.location.pathname + window.location.search);
        // Notify listeners of auth state change
        this.notifyAuthStateChange(false);
        // Redirect to login
        window.location.href = "/login";
      }
    }

    // Show error toast notification (except for auth errors which redirect)
    if (response.status !== 401) {
      showErrorToast(errorMessage);
    }

    throw error;
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    let config: RequestInit = {
      ...options,
      credentials: 'include', // Always include cookies for auth
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    try {
      let response = await fetch(url, config);

      // Apply response interceptors
      response = await this.applyResponseInterceptors(response);

      if (!response.ok) {
        await this.handleError(response, { endpoint, options: config });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Check if this is a retry response (successful after token refresh)
      if ((error as any)?.__retryResponse) {
        const retryResponse = (error as any).__retryResponse as Response;
        const data = await retryResponse.json();
        return data;
      }
      
      if ((error as ApiError).statusCode) {
        throw error;
      }

      // Network error or other fetch error
      const networkError = "Network error. Please check your connection.";
      showErrorToast(networkError);
      throw {
        message: networkError,
        statusCode: 0,
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : "";

    return this.request<T>(`${endpoint}${queryString}`, {
      method: "GET",
    });
  }

  /**
   * POST request
   * Invalidates all queries on success to ensure fresh data
   */
  public async post<T>(endpoint: string, data?: any): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Invalidate all queries after successful mutation
    invalidateAllQueries();
    return result;
  }

  /**
   * PUT request
   * Invalidates all queries on success to ensure fresh data
   */
  public async put<T>(endpoint: string, data?: any): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    // Invalidate all queries after successful mutation
    invalidateAllQueries();
    return result;
  }

  /**
   * PATCH request
   * Invalidates all queries on success to ensure fresh data
   */
  public async patch<T>(endpoint: string, data?: any): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    // Invalidate all queries after successful mutation
    invalidateAllQueries();
    return result;
  }

  /**
   * DELETE request
   * Invalidates all queries on success to ensure fresh data
   */
  public async delete<T>(endpoint: string, data?: any): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: "DELETE",
      ...(data && { body: JSON.stringify(data) }),
    });
    // Invalidate all queries after successful mutation
    invalidateAllQueries();
    return result;
  }

  /**
   * POST request with FormData (for file uploads)
   * Invalidates all queries on success to ensure fresh data
   */
  public postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Don't set Content-Type for FormData - browser will set it with boundary
    const headers: HeadersInit = {};
    const authHeader = (this.defaultHeaders as any).Authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    return fetch(url, {
      method: "POST",
      headers,
      body: formData,
      credentials: 'include', // Include cookies for auth
    }).then(async (response) => {
      if (!response.ok) {
        await this.handleError(response, { endpoint, options: { method: 'POST', body: formData } });
      }
      const result = await response.json();
      // Invalidate all queries after successful mutation
      invalidateAllQueries();
      return result;
    });
  }

  /**
   * PATCH request with FormData (for file uploads)
   * Invalidates all queries on success to ensure fresh data
   */
  public patchFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Don't set Content-Type for FormData - browser will set it with boundary
    const headers: HeadersInit = {};
    const authHeader = (this.defaultHeaders as any).Authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    return fetch(url, {
      method: "PATCH",
      headers,
      body: formData,
      credentials: 'include', // Include cookies for auth
    }).then(async (response) => {
      if (!response.ok) {
        await this.handleError(response, { endpoint, options: { method: 'PATCH', body: formData } });
      }
      const result = await response.json();
      // Invalidate all queries after successful mutation
      invalidateAllQueries();
      return result;
    });
  }

  /**
   * Set authorization token
   */
  public setAuthToken(token: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Remove authorization token
   */
  public removeAuthToken(): void {
    const { Authorization, ...rest } = this.defaultHeaders as any;
    this.defaultHeaders = rest;
  }
}

export const httpClient = HttpClient.getInstance();
