import { authApiService } from "./authApi";
import { getApiUrl } from "../config/api";

export class DashboardApiService {
  private async makeRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = getApiUrl(endpoint);

    // Get the access token for authorization
    const token = authApiService.getAccessToken();
    const tokenType = authApiService.getTokenType();

    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `${tokenType} ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Handle unauthorized/forbidden errors
      if (response.status === 401 || response.status === 403) {
        try {
          await authApiService.refreshToken();
          // Retry the request with new token
          const newToken = authApiService.getAccessToken();
          const newTokenType = authApiService.getTokenType();

          if (!newToken) {
            throw new Error("Failed to get new token after refresh");
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...defaultHeaders,
              Authorization: `${newTokenType} ${newToken}`,
              ...options?.headers,
            },
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }

          const retryErrorData = await retryResponse.json().catch(() => ({}));
          throw new Error(
            retryErrorData.detail ||
              `API Error after retry: ${retryResponse.status} ${retryResponse.statusText}`
          );
        } catch (refreshError) {
          authApiService.clearTokens();
          authApiService.clearUserProfile();
          throw new Error("Authentication failed. Please login again.");
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          `API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getScrumdashboardbyId(project_id?: string): Promise<any> {
    const endpoint = `/api/v1/dashboard/scrum/${project_id}`;

    return this.makeRequest(endpoint);
  }

  async getScrumOverview(project_id?: string): Promise<any> {
    const endpoint = `/api/v1/dashboard/scrum/${project_id}/overview`;
    return this.makeRequest(endpoint);
  }
}

export const dashboardApiService = new DashboardApiService();
