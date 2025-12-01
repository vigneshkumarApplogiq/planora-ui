import axios, { AxiosInstance, AxiosError } from "axios";

/**
 * API Configuration
 * Centralized API base URL configuration for the entire application
 */

export const API_BASE_URL =
  (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";

console.log("API_BASE_URL: ", API_BASE_URL);

// Application Version Information
export const APP_VERSION = {
  version: "1.5.0",
  buildDate: "2025-01-22",
  environment: (import.meta as any).env?.MODE || "development",
};

// JWT Token Utilities
const decodeJWT = (token: string) => {
  try {
    const base64Payload = token.split(".")[1];
    return JSON.parse(atob(base64Payload));
  } catch (err) {
    console.error("Failed to decode JWT:", err);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

// Token Management
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const refreshTokenFn = async (): Promise<string> => {
  const refreshToken = localStorage.getItem("refresh_token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";

  if (!refreshToken) {
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("No refresh token found");
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `${tokenType} ${refreshToken}`,
        },
      }
    );

    const newAccessToken = response?.data?.access_token;
    const newRefreshToken = response?.data?.refresh_token;
    const newTokenType = response?.data?.token_type;

    if (!newAccessToken) {
      throw new Error("Failed to refresh token");
    }

    // Save new tokens
    localStorage.setItem("access_token", newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem("refresh_token", newRefreshToken);
    }
    if (newTokenType) {
      localStorage.setItem("token_type", newTokenType);
    }

    return newAccessToken;
  } catch (err) {
    console.error("Token refresh failed:", err);
    localStorage.clear();
    window.location.href = "/login";
    throw err;
  }
};

// Create Axios Instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - Auto-refresh tokens if expired
axiosInstance.interceptors.request.use(
  async (config) => {
    let accessToken = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    if (accessToken) {
      // Check if token is expired and refresh if needed
      if (isTokenExpired(accessToken)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            accessToken = await refreshTokenFn();
            isRefreshing = false;
            onTokenRefreshed(accessToken);
          } catch (err) {
            isRefreshing = false;
            throw err;
          }
        } else {
          // Wait for the token to be refreshed
          accessToken = await new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
              resolve(token);
            });
          });
        }
      }

      config.headers["Authorization"] = `${tokenType} ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle 401/403 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const prevRequest = error?.config as any;

    if (
      (error?.response?.status === 401 || error?.response?.status === 403) &&
      prevRequest &&
      !prevRequest._retry
    ) {
      prevRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccessToken = await refreshTokenFn();
          isRefreshing = false;
          onTokenRefreshed(newAccessToken);

          const tokenType = localStorage.getItem("token_type") || "Bearer";
          prevRequest.headers[
            "Authorization"
          ] = `${tokenType} ${newAccessToken}`;
          return axiosInstance(prevRequest);
        } catch (err) {
          isRefreshing = false;
          return Promise.reject(err);
        }
      } else {
        // Wait for token refresh
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string) => {
            const tokenType = localStorage.getItem("token_type") || "Bearer";
            prevRequest.headers["Authorization"] = `${tokenType} ${token}`;
            resolve(axiosInstance(prevRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to construct full API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to construct asset URLs (for user profiles, etc.)
export const getAssetUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

export default axiosInstance;
