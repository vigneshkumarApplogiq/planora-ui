import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export class NotificationApiService {
  async getNotifications(params: { unread_only?: boolean } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params.unread_only)
      searchParams.append("unread_only", params.unread_only.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/notifications/${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<any>(endpoint);

    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    const endpoint = `/api/v1/notifications/${notificationId}/mark-read`;
    const response = await axiosInstance.post<any>(endpoint);
    return response.data;
  }
  async markAllNotificationsAsRead(): Promise<any> {
    const endpoint = `/api/v1/notifications/mark-all-read`;
    const response = await axiosInstance.post<any>(endpoint);
    return response?.data;
  }

  async getNotificationSettings(): Promise<any> {
    const endpoint = `/api/v1/notifications/settings/`;
    const response = await axiosInstance.get<any>(endpoint);
    return response?.data;
  }

  async updateNotificationSettings(data: any): Promise<any> {
    const endpoint = `/api/v1/notifications/settings/`;
    const response = await axiosInstance.put<any>(endpoint, data);
    return response?.data;
  }
}

export const notificationApiService = new NotificationApiService();
