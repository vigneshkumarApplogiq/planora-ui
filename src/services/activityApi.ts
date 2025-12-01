import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

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
  async getActivities(
    projectId: string,
    params?: GetActivitiesParams
  ): Promise<ActivitiesResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params?.activity_type)
      queryParams.append("activity_type", params.activity_type);
    if (params?.entity_type)
      queryParams.append("entity_type", params.entity_type);
    if (params?.user_id) queryParams.append("user_id", params.user_id);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/activities${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<ActivitiesResponse>(endpoint);
    return response.data;
  }
}

export const activityApiService = new ActivityApiService();
