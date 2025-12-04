/**
 * HTTP Client - A wrapper around fetch API with interceptors and error handling
 * Following the Singleton pattern
 */

import { API_CONFIG } from "../constants";
import { ApiError, ApiResponse } from "../../types/common.types";
import { showErrorToast } from "../toast";

type RequestInterceptor = (
  config: RequestInit
) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

class HttpClient {
  private static instance: HttpClient;
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

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
  private async handleError(response: Response): Promise<never> {
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

    // Show error toast notification
    showErrorToast(errorMessage);

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      // Clear auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        // Redirect to login page
        window.location.href = "/login";
      }
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
        await this.handleError(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
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
   */
  public post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  public put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  public patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  public delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...(data && { body: JSON.stringify(data) }),
    });
  }

  /**
   * POST request with FormData (for file uploads)
   */
  public postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // DEBUG: Log the FormData contents
    console.log('=== DEBUG: postFormData ===');
    console.log('url:', url);
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(name=${value.name}, size=${value.size}, type=${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    const headers: HeadersInit = {};
    const authHeader = (this.defaultHeaders as any).Authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    console.log('headers:', headers);

    return fetch(url, {
      method: "POST",
      headers,
      body: formData,
    }).then(async (response) => {
      console.log('=== DEBUG: postFormData response ===');
      console.log('response.ok:', response.ok);
      console.log('response.status:', response.status);
      
      if (!response.ok) {
        await this.handleError(response);
      }
      return response.json();
    });
  }

  /**
   * PATCH request with FormData (for file uploads)
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
    }).then(async (response) => {
      if (!response.ok) {
        await this.handleError(response);
      }
      return response.json();
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
