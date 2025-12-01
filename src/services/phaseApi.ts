import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export interface Phase {
  id?: string;
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_order: number;
  status: "pending" | "active" | "completed" | "delayed" | "on-hold";
  progress: number;
  start_date: string;
  end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  owner_id: string;
  owner_name: string;
  budget: number;
  spent: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePhaseRequest {
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_order: number;
  status: "pending" | "active" | "completed" | "delayed" | "on-hold";
  progress: number;
  start_date: string;
  end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  owner_id: string;
  owner_name: string;
  budget: number;
  spent?: number;
  notes?: string;
}

export interface UpdatePhaseRequest extends Partial<CreatePhaseRequest> {
  id?: string;
}

export interface PhasesResponse {
  items: Phase[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class PhaseApiService {
  async getPhases(
    projectId?: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<PhasesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append("project_id", projectId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/phases${queryString ? `?${queryString}` : ""}`;
    const response = await axiosInstance.get<PhasesResponse>(endpoint);

    return response.data;
  }

  async getPhaseById(id: string): Promise<Phase> {
    const response = await axiosInstance.get<Phase>(`/api/v1/phases/${id}`);
    return response.data;
  }

  async createPhase(phaseData: CreatePhaseRequest): Promise<Phase> {
    const response = await axiosInstance.post<Phase>(
      "/api/v1/phases/",
      phaseData
    );
    return response.data;
  }

  async updatePhase(id: string, phaseData: UpdatePhaseRequest): Promise<Phase> {
    const response = await axiosInstance.put<Phase>(
      `/api/v1/phases/${id}`,
      phaseData
    );
    return response.data;
  }

  async deletePhase(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/phases/${id}`);
    return response.data;
  }

  async updatePhaseStatus(id: string, status: string): Promise<Phase> {
    const response = await axiosInstance.patch<Phase>(`/api/v1/phases/${id}`, {
      status,
    });
    return response.data;
  }

  async updatePhaseProgress(id: string, progress: number): Promise<Phase> {
    const response = await axiosInstance.patch<Phase>(`/api/v1/phases/${id}`, {
      progress,
    });
    return response.data;
  }
}

export const phaseApiService = new PhaseApiService();
