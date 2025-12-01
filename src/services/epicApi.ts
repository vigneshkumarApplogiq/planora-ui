import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export interface Epic {
  title: string;
  description: string;
  priority: string;
  status: string;
  project_id: string;
  assignee_id: string;
  due_date: string;
  total_story_points: number;
  completed_story_points: number;
  total_tasks: number;
  completed_tasks: number;
  labels: string[];
  business_value: string;
  id: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  assignee_name: string;
  completion_percentage: number;
  project: {
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
    team_lead: {
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
      role: {
        name: string;
        description: string;
        permissions: string[];
        is_active: boolean;
        id: string;
        created_at: string;
        updated_at: string;
      };
    };
  };
  assignee: {
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
    role: {
      name: string;
      description: string;
      permissions: string[];
      is_active: boolean;
      id: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export interface EpicsResponse {
  items: Epic[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CreateEpicRequest {
  title: string;
  description: string;
  priority: string;
  status: string;
  project_id: string;
  assignee_id: string | null;
  due_date: string;
  total_story_points: number;
  completed_story_points: number;
  total_tasks: number;
  completed_tasks: number;
  labels: string[];
  business_value: string;
}

export interface UpdateEpicRequest extends Partial<CreateEpicRequest> {
  id: string;
}

export class EpicApiService {
  async getEpics(
    page: number = 1,
    per_page: number = 50,
    project_id?: string,
    status?: string,
    priority?: string,
    assignee_id?: string,
    search?: string
  ): Promise<EpicsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });

    if (project_id) params.append("project_id", project_id);
    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);
    if (assignee_id) params.append("assignee_id", assignee_id);
    if (search) params.append("search", search);

    const url = `/api/v1/epics/?${params.toString()}`;
    const response = await axiosInstance.get<EpicsResponse>(url);
    console.log("responsadasdsadsde: ", response, url);
    return response.data;
  }

  async getEpic(id: string): Promise<Epic> {
    const response = await axiosInstance.get<Epic>(`/api/v1/epics/${id}`);
    return response.data;
  }

  async createEpic(epicData: CreateEpicRequest): Promise<Epic> {
    const response = await axiosInstance.post<Epic>("/api/v1/epics/", epicData);
    return response.data;
  }

  async updateEpic(
    id: string,
    epicData: Partial<CreateEpicRequest>
  ): Promise<Epic> {
    const response = await axiosInstance.put<Epic>(
      `/api/v1/epics/${id}`,
      epicData
    );
    return response.data;
  }

  async deleteEpic(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/epics/${id}`);
    return response.data;
  }

  async getEpicsByProject(projectId: string): Promise<EpicsResponse> {
    const response = await axiosInstance.get<EpicsResponse>(
      `/project/${projectId}`
    );
    return response.data;
  }
}

export const epicApiService = new EpicApiService();
