import axiosInstance from "../config/api";

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
}

export interface CreateSprintRequest {
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  goal: string;
  project_id: string;
  scrum_master_id?: string;
  burndown_trend?: string;
}

export interface UpdateSprintRequest extends Partial<CreateSprintRequest> {
  id: string;
}

export interface SprintsResponse {
  items: Sprint[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class SprintsApiService {
  async getSprints(
    projectId?: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<SprintsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append("project_id", projectId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/sprints${queryString ? `?${queryString}` : ""}`;
    const response = await axiosInstance.get<SprintsResponse>(endpoint);
    return response.data;
  }

  async getSprint(id: string): Promise<Sprint> {
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
    sprintData: Partial<CreateSprintRequest>
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
    const response = await this.getSprints(projectId);
    return response.items;
  }
}

export const sprintsApiService = new SprintsApiService();
