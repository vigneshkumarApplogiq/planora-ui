import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

export interface Activity {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  activity_type: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  description: string;
  activity_metadata: Record<string, any>;
  story_points?: number;
  file_size?: number;
  duration_weeks?: number;
  planned_points?: number;
  created_at: string;
  is_active: boolean;
}

export interface ActivitiesResponse {
  activities: Activity[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface GetActivitiesParams {
  page?: number;
  per_page?: number;
  activity_type?: string;
  entity_type?: string;
  user_id?: string;
}

export class ActivityApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);

    const token = authApiService.getAccessToken();

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        try {
          await authApiService.refreshToken();
          const newToken = authApiService.getAccessToken();

          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...defaultHeaders,
              ...(newToken && { Authorization: `Bearer ${newToken}` }),
              ...options?.headers,
            },
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch (refreshError) {
          authApiService.clearTokens();
          authApiService.clearUserProfile();
          throw new Error('Authentication failed. Please login again.');
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getActivities(
    projectId: string,
    params?: GetActivitiesParams
  ): Promise<ActivitiesResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.activity_type) queryParams.append('activity_type', params.activity_type);
    if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
    if (params?.user_id) queryParams.append('user_id', params.user_id);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/activities${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<ActivitiesResponse>(endpoint);
  }
}

export const activityApiService = new ActivityApiService();
