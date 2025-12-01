import axiosInstance from "../config/api";

export class DashboardApiService {
  async getScrumdashboardbyId(project_id?: string): Promise<any> {
    const endpoint = `/api/v1/dashboard/scrum/${project_id}`;
    const response = await axiosInstance.get(endpoint);
    return response.data;
  }

  async getScrumOverview(project_id?: string): Promise<any> {
    const endpoint = `/api/v1/dashboard/scrum/${project_id}/overview`;
    const response = await axiosInstance.get(endpoint);
    return response.data;
  }
}

export const dashboardApiService = new DashboardApiService();
