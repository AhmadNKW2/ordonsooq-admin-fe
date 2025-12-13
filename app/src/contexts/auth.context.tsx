/**
 * Auth Context for managing authentication state
 * Supports cookie-based auth, session management, activity monitoring, and cross-tab sync
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { authService } from "../services/auth/api/auth.service";
import { LoginRequest, User, AuthState, SessionInfo } from "../services/auth/types/auth.types";
import { httpClient } from "../lib/api/http-client";
import { sessionManager } from "../lib/session/session-manager";
import { showSuccessToast, showInfoToast, showErrorToast } from "../lib/toast";

// Session configuration
const SESSION_CONFIG = {
  // Warning before expiration (5 minutes)
  warningBeforeExpiry: 5 * 60 * 1000,
  // Activity check interval (1 minute)
  activityCheckInterval: 60 * 1000,
  // Session refresh threshold (when less than 10 minutes remaining)
  refreshThreshold: 10 * 60 * 1000,
  // Inactivity timeout for non-rememberMe sessions (30 minutes)
  inactivityTimeout: 30 * 60 * 1000,
} as const;

interface SessionWarning {
  show: boolean;
  expiresAt: number;
  timeRemaining: number;
}

interface AuthContextType extends Omit<AuthState, 'sessionExpiresAt'> {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  extendSession: () => Promise<void>;
  sessionWarning: SessionWarning | null;
  dismissSessionWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    sessionExpiresAt: null,
  });
  const [sessionWarning, setSessionWarning] = useState<SessionWarning | null>(null);
  
  // Refs for intervals and cleanup
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Clear all intervals
  const clearIntervals = useCallback(() => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
  }, []);

  // Refresh the session token
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.refreshToken();
      if (response.success && response.data) {
        if (response.data.access_token) {
          httpClient.setAuthToken(response.data.access_token);
        }
        const expiresAt = Date.now() + (response.data.expires_in * 1000);
        
        // Update session info
        const sessionInfo = sessionManager.getSessionInfo();
        if (sessionInfo) {
          sessionManager.setSessionInfo({
            ...sessionInfo,
            expiresAt,
            lastActivity: Date.now(),
          });
        }
        
        setAuthState(prev => ({
          ...prev,
          sessionExpiresAt: expiresAt,
        }));
        
        // Broadcast session refresh to other tabs
        sessionManager.broadcastEvent({ type: 'session_refresh', timestamp: Date.now() });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, []);

  // Check session and show warning if needed
  const checkSession = useCallback(async () => {
    const sessionInfo = sessionManager.getSessionInfo();
    if (!sessionInfo || !authState.isAuthenticated) return;
    
    const now = Date.now();
    const timeUntilExpiry = sessionInfo.expiresAt - now;
    
    // Check for inactivity (only for non-rememberMe sessions)
    if (!sessionInfo.rememberMe) {
      const timeSinceActivity = now - lastActivityRef.current;
      if (timeSinceActivity > SESSION_CONFIG.inactivityTimeout) {
        // Session expired due to inactivity
        showInfoToast('Your session has expired due to inactivity');
        await handleLogout(false);
        return;
      }
    }
    
    // Show warning if session expiring soon
    if (timeUntilExpiry <= SESSION_CONFIG.warningBeforeExpiry && timeUntilExpiry > 0) {
      setSessionWarning({
        show: true,
        expiresAt: sessionInfo.expiresAt,
        timeRemaining: timeUntilExpiry,
      });
      
      // Start countdown interval
      if (!warningIntervalRef.current) {
        warningIntervalRef.current = setInterval(() => {
          setSessionWarning(prev => {
            if (!prev) return null;
            const remaining = prev.expiresAt - Date.now();
            if (remaining <= 0) {
              clearInterval(warningIntervalRef.current!);
              warningIntervalRef.current = null;
              return null;
            }
            return { ...prev, timeRemaining: remaining };
          });
        }, 1000);
      }
    }
    
    // Session expired
    if (timeUntilExpiry <= 0) {
      showInfoToast('Your session has expired');
      await handleLogout(false);
      return;
    }
    
    // Proactively refresh if within threshold and has activity
    if (timeUntilExpiry <= SESSION_CONFIG.refreshThreshold) {
      const sessionInfo = sessionManager.getSessionInfo();
      if (sessionInfo?.rememberMe || (now - lastActivityRef.current < SESSION_CONFIG.activityCheckInterval)) {
        await refreshSession();
      }
    }
  }, [authState.isAuthenticated, refreshSession]);

  // Handle logout
  const handleLogout = useCallback(async (callApi: boolean = true) => {
    clearIntervals();
    setSessionWarning(null);
    
    try {
      if (callApi) {
        await authService.logout();
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      sessionManager.clearSession();
      httpClient.removeAuthToken();
      sessionManager.broadcastEvent({ type: 'logout', timestamp: Date.now() });

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        sessionExpiresAt: null,
      });

      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        router.push("/login");
      }
    }
  }, [router, clearIntervals]);

  // Extend session (called when user clicks "Stay logged in")
  const extendSession = useCallback(async () => {
    setSessionWarning(null);
    clearIntervals();
    
    const success = await refreshSession();
    if (success) {
      showSuccessToast('Session extended');
      // Restart session checking
      sessionCheckIntervalRef.current = setInterval(checkSession, SESSION_CONFIG.activityCheckInterval);
    } else {
      showInfoToast('Could not extend session. Please log in again.');
      await handleLogout(false);
    }
  }, [refreshSession, checkSession, clearIntervals, handleLogout]);

  // Dismiss session warning without extending
  const dismissSessionWarning = useCallback(() => {
    setSessionWarning(null);
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
  }, []);

  // Handle activity for session tracking
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      
      // Update session info
      const sessionInfo = sessionManager.getSessionInfo();
      if (sessionInfo) {
        sessionManager.setSessionInfo({
          ...sessionInfo,
          lastActivity: Date.now(),
        });
      }
      
      // Broadcast activity to other tabs
      sessionManager.broadcastEvent({ type: 'activity', timestamp: Date.now() });
    };

    // Throttle activity updates
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        handleActivity();
        throttleTimeout = null;
      }, 5000); // Throttle to once every 5 seconds
    };

    window.addEventListener('mousemove', throttledActivity);
    window.addEventListener('keydown', throttledActivity);
    window.addEventListener('click', throttledActivity);
    window.addEventListener('scroll', throttledActivity);

    return () => {
      window.removeEventListener('mousemove', throttledActivity);
      window.removeEventListener('keydown', throttledActivity);
      window.removeEventListener('click', throttledActivity);
      window.removeEventListener('scroll', throttledActivity);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, []);

  // Initialize auth state and set up cross-tab sync
  useEffect(() => {
    const initAuth = async () => {
      // Skip validation if on login page to prevent infinite loop
      if (typeof window !== 'undefined' && window.location.pathname === '/login') {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionExpiresAt: null,
        });
        return;
      }

      try {
        // Validate existing session via /auth/profile.
        // If it fails (e.g., access token expired), try a one-time silent refresh then validate again.
        const firstCheck = await authService.validateSession();

        let finalCheck = firstCheck;
        if (!firstCheck.valid) {
          const refreshed = await refreshSession();
          if (refreshed) {
            finalCheck = await authService.validateSession();
          }
        }

        if (finalCheck.valid && finalCheck.user) {
          const sessionInfo = sessionManager.getSessionInfo();
          const expiresAt = sessionInfo?.expiresAt || Date.now() + 30 * 60 * 1000;

          setAuthState({
            user: finalCheck.user,
            isAuthenticated: true,
            isLoading: false,
            sessionExpiresAt: expiresAt,
          });

          // Start session checking
          sessionCheckIntervalRef.current = setInterval(checkSession, SESSION_CONFIG.activityCheckInterval);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpiresAt: null,
          });
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionExpiresAt: null,
        });
      }
    };

    initAuth();

    // Set up cross-tab event listener
    const unsubscribe = sessionManager.onSessionEvent((event) => {
      switch (event.type) {
        case 'logout':
          // Another tab logged out
          clearIntervals();
          setSessionWarning(null);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpiresAt: null,
          });
          // Only redirect if not already on login page
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            router.push('/login');
          }
          break;
        case 'login':
          // Another tab logged in - refresh our state
          initAuth();
          break;
        case 'session_refresh':
          // Another tab refreshed - update our expiry
          const sessionInfo = sessionManager.getSessionInfo();
          if (sessionInfo) {
            setAuthState(prev => ({
              ...prev,
              sessionExpiresAt: sessionInfo.expiresAt,
            }));
          }
          break;
        case 'activity':
          // Another tab had activity - update our last activity
          lastActivityRef.current = event.timestamp;
          break;
      }
    });

    // Subscribe to HTTP client auth state changes
    const unsubscribeHttp = httpClient.onAuthStateChange((isAuthenticated) => {
      if (!isAuthenticated) {
        // HTTP client detected auth failure
        // Don't logout if already on login page
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          handleLogout(false);
        } else {
          // Just update state without redirect
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpiresAt: null,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeHttp();
      clearIntervals();
    };
  }, [handleLogout, clearIntervals]);

  // Login handler
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        const { user, expires_in, access_token } = response.data;
        if (access_token) {
          httpClient.setAuthToken(access_token);
        }
        const expiresAt = Date.now() + (expires_in * 1000);

        // Store session info
        sessionManager.setSessionInfo({
          expiresAt,
          lastActivity: Date.now(),
          rememberMe: credentials.rememberMe || false,
        });

        // Update state
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          sessionExpiresAt: expiresAt,
        });

        // Broadcast login to other tabs
        sessionManager.broadcastEvent({ type: 'login', timestamp: Date.now() });

        showSuccessToast("Login successful");

        // Start session checking
        sessionCheckIntervalRef.current = setInterval(checkSession, SESSION_CONFIG.activityCheckInterval);

        // Redirect to intended URL or dashboard
        const intendedUrl = sessionManager.getIntendedUrl();
        sessionManager.clearIntendedUrl();
        router.push(intendedUrl || "/");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Login failed. Please check your credentials.";
      showErrorToast(errorMessage);
      throw error;
    }
  }, [router, checkSession]);

  // Logout handler
  const logout = useCallback(async () => {
    await handleLogout(true);
  }, [handleLogout]);

  return (
    <AuthContext.Provider 
      value={{ 
        ...authState,
        login, 
        logout, 
        refreshSession,
        extendSession,
        sessionWarning,
        dismissSessionWarning,
      }}
    >
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
