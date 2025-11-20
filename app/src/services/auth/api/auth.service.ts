/**
 * Auth API Service
 */

import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse } from "../../../types/common.types";
import { LoginRequest, LoginResponse } from "../types/auth.types";

const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
} as const;

export const authService = {
  /**
   * Login with email and password
   */
  login: (data: LoginRequest) => {
    return httpClient.post<ApiResponse<LoginResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      data
    );
  },

  /**
   * Logout current user
   */
  logout: () => {
    return httpClient.post<ApiResponse<void>>(AUTH_ENDPOINTS.LOGOUT);
  },

  /**
   * Get current user profile
   */
  getMe: () => {
    return httpClient.get<ApiResponse<LoginResponse["user"]>>(
      AUTH_ENDPOINTS.ME
    );
  },
};
