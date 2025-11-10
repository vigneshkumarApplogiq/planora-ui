import { authApiService } from "./authApi";
import { getApiUrl } from "../config/api";

export class NotificationApiService {
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

  async getNotifications(params: { unread_only?: boolean } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params.unread_only)
      searchParams.append("unread_only", params.unread_only.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/notifications/${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    const endpoint = `/api/v1/notifications/${notificationId}/mark-read`;
    return this.makeRequest(endpoint, { method: "POST" });
  }
  async markAllNotificationsAsRead(): Promise<any> {
    const endpoint = `/api/v1/notifications/mark-all-read`;
    return this.makeRequest(endpoint, { method: "POST" });
  }

  async getNotificationSettings(): Promise<any> {
    const endpoint = `/api/v1/notifications/settings/`;
    return this.makeRequest(endpoint);
  }

  async updateNotificationSettings(data: any): Promise<any> {
    const endpoint = `/api/v1/notifications/settings/`;
    return this.makeRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

export const notificationApiService = new NotificationApiService();
