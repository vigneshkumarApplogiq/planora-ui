import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export interface Milestone {
  id?: string;
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_id: string;
  phase_name: string;
  milestone_order: number;
  status: "pending" | "in-progress" | "completed" | "delayed" | "at-risk";
  progress: number;
  due_date: string;
  completion_date?: string;
  owner_id: string;
  owner_name: string;
  priority: "low" | "medium" | "high" | "critical";
  criteria: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMilestoneRequest {
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_id: string;
  phase_name: string;
  milestone_order: number;
  status: "pending" | "in-progress" | "completed" | "delayed" | "at-risk";
  progress: number;
  due_date: string;
  completion_date?: string;
  owner_id: string;
  owner_name: string;
  priority: "low" | "medium" | "high" | "critical";
  criteria: string;
  notes?: string;
}

export interface UpdateMilestoneRequest
  extends Partial<CreateMilestoneRequest> {
  id?: string;
}

export interface MilestonesResponse {
  items: Milestone[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class MilestoneApiService {
  async getMilestones(
    projectId?: string,
    phaseId?: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<MilestonesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append("project_id", projectId);
    }

    if (phaseId) {
      params.append("phase_id", phaseId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/milestones${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<MilestonesResponse>(endpoint);

    return response.data;
  }

  async getMilestoneById(id: string): Promise<Milestone> {
    const response = await axiosInstance.get<Milestone>(
      `/api/v1/milestones/${id}`
    );
    return response.data;
  }

  async createMilestone(
    milestoneData: CreateMilestoneRequest
  ): Promise<Milestone> {
    const response = await axiosInstance.post<Milestone>(
      "/api/v1/milestones/",
      milestoneData
    );
    return response.data;
  }

  async updateMilestone(
    id: string,
    milestoneData: UpdateMilestoneRequest
  ): Promise<Milestone> {
    const response = await axiosInstance.put<Milestone>(
      `/api/v1/milestones/${id}`,
      milestoneData
    );
    return response.data;
  }

  async deleteMilestone(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(
      `/api/v1/milestones/${id}`
    );
    return response.data;
  }

  async updateMilestoneStatus(id: string, status: string): Promise<Milestone> {
    const response = await axiosInstance.patch<Milestone>(
      `/api/v1/milestones/${id}`,
      { status }
    );
    return response.data;
  }

  async updateMilestoneProgress(
    id: string,
    progress: number
  ): Promise<Milestone> {
    const response = await axiosInstance.patch<Milestone>(
      `/api/v1/milestones/${id}`,
      { progress }
    );
    return response.data;
  }
}

export const milestoneApiService = new MilestoneApiService();
