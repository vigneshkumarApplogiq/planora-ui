import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export interface UserRole {
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  email: string;
  name: string;
  role_id: string;
  avatar: string;
  is_active: boolean;
  department: string;
  skills: string[];
  phone: string;
  timezone: string;
  id: string;
  last_login: string;
  created_at: string;
  updated_at: string;
  role: UserRole;
}

export interface SprintProject {
  name: string;
  description: string;
  status: string;
  progress: number;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  customer: string;
  customer_id: string;
  priority: string;
  team_lead_id: string;
  team_members: string[];
  tags: string[];
  color: string;
  methodology: string;
  project_type: string;
  id: string;
  created_at: string;
  updated_at: string;
  team_lead: User;
}

export interface Sprint {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  goal: string;
  total_points: number;
  completed_points: number;
  total_tasks: number;
  completed_tasks: number;
  velocity: number;
  project_id: string;
  scrum_master_id: string;
  team_size: number;
  burndown_trend: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  scrum_master_name: string;
  project: SprintProject;
  scrum_master: User;
}

export interface CreateSprintRequest {
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  goal: string;
  total_points: number;
  completed_points: number;
  total_tasks: number;
  completed_tasks: number;
  velocity: number;
  project_id: string;
  scrum_master_id: string;
  team_size: number;
  burndown_trend: "On Track" | "Behind" | "Ahead";
}

export interface UpdateSprintRequest extends Partial<CreateSprintRequest> {}

export interface SprintsResponse {
  items: Sprint[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SprintsQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  project_id?: string;
  scrum_master_id?: string;
}

export class SprintApiService {
  async getSprints(params: SprintsQueryParams = {}): Promise<SprintsResponse> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined)
      searchParams.append("page", params.page.toString());
    if (params.per_page !== undefined)
      searchParams.append("per_page", params.per_page.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.project_id) searchParams.append("project_id", params.project_id);
    if (params.scrum_master_id)
      searchParams.append("scrum_master_id", params.scrum_master_id);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/sprints${queryString ? `?${queryString}` : ""}`;
    const res = await axiosInstance.get<SprintsResponse>(endpoint);
    const response = res.data;

    if (response && Array.isArray(response.items)) {
      return response;
    } else {
      return {
        items: [],
        total: 0,
        page: params.page || 1,
        per_page: params.per_page || 10,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      };
    }
  }

  async getSprintById(id: string): Promise<Sprint> {
    const response = await axiosInstance.get<Sprint>(`/api/v1/sprints/${id}`);
    return response.data;
  }

  async createSprint(sprintData: CreateSprintRequest): Promise<Sprint> {
    const response = await axiosInstance.post<Sprint>(
      "/api/v1/sprints/",
      sprintData
    );
    return response.data;
  }

  async updateSprint(
    id: string,
    sprintData: UpdateSprintRequest
  ): Promise<Sprint> {
    const response = await axiosInstance.put<Sprint>(
      `/api/v1/sprints/${id}`,
      sprintData
    );
    return response.data;
  }

  async deleteSprint(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/sprints/${id}`);
    return response.data;
  }

  async updateSprintStatus(id: string, status: string): Promise<Sprint> {
    const response = await axiosInstance.patch<Sprint>(
      `/api/v1/sprints/${id}`,
      { status }
    );
    return response.data;
  }

  async getSprintsByProject(projectId: string): Promise<Sprint[]> {
    const response = await this.getSprints({ project_id: projectId });
    return response.items;
  }

  async getActiveSprintsByProject(projectId: string): Promise<Sprint[]> {
    const response = await this.getSprints({
      project_id: projectId,
      status: "Active",
    });
    return response.items;
  }

  async getSprintsByStatus(status: string): Promise<Sprint[]> {
    const response = await this.getSprints({ status });
    return response.items;
  }
}

export const sprintApiService = new SprintApiService();
