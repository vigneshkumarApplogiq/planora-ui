import axiosInstance from "../config/api";

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskStatus {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentsResponse {
  items: Department[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class MasterApiService {
  async getDepartments(): Promise<Department[]> {
    try {
      const res = await axiosInstance.get<DepartmentsResponse>(
        `/api/v1/masters/department`
      );
      const response = res.data;

      // Return just the items array, or empty array if response doesn't have expected structure
      if (response && Array.isArray(response.items)) {
        return response.items;
      } else if (Array.isArray(response)) {
        // Handle case where API returns array directly
        return response as unknown as Department[];
      } else {
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      throw error;
    }
  }

  async getIndustries(): Promise<Industry[]> {
    try {
      const res = await axiosInstance.get<Industry[]>(
        `/api/v1/masters/industry`
      );
      const response = res.data;

      // Handle direct array response
      if (Array.isArray(response)) {
        return response
          .filter((industry) => industry.is_active)
          .sort((a, b) => a.sort_order - b.sort_order);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch industries:", error);
      throw error;
    }
  }

  async getTaskStatuses(): Promise<TaskStatus[]> {
    const res = await axiosInstance.get<TaskStatus[]>(
      `/api/v1/masters/project`
    );
    const response = res.data;
    // Handle response and extract task_status if it exists in the response
    if (response && typeof response === "object" && "task_status" in response) {
      const taskStatuses = response?.task_status;
      if (Array.isArray(taskStatuses)) {
        return taskStatuses
          .filter((status: TaskStatus) => status.is_active)
          .sort((a: TaskStatus, b: TaskStatus) => a.sort_order - b.sort_order);
      }
    }

    return [];
  }

  async getProjectMastersWithTaskStatus(): Promise<any> {
    const response = await axiosInstance.get<any>("/api/v1/masters/project");
    return response.data;
  }
}

export const masterApiService = new MasterApiService();
