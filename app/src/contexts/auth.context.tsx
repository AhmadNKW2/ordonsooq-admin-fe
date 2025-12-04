/**
 * Auth Context for managing authentication state
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth/api/auth.service";
import { LoginRequest, User, AuthState } from "../services/auth/types/auth.types";
import { httpClient } from "../lib/api/http-client";
import { showSuccessToast } from "../lib/toast";

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const userStr = localStorage.getItem(USER_KEY);

        if (token && userStr) {
          const user = JSON.parse(userStr);
          httpClient.setAuthToken(token);
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        const { access_token, user } = response.data;

        // Store token and user
        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        // Set token in httpClient
        httpClient.setAuthToken(access_token);

        // Update state
        setAuthState({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
        });

        showSuccessToast("Login successful");

        // Redirect to dashboard
        router.push("/");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear storage and state regardless of API response
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      httpClient.removeAuthToken();

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
