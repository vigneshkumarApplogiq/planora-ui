import { authApiService } from "./authApi";
import axiosInstance, { getApiUrl } from "../config/api";

export interface Task {
  id?: string;
  task_id?: string;
  title: string;
  description: string;
  type?: string;
  status: string;
  priority: string;
  project_id: string;
  sprint_id?: string | null;
  phase_id?: string | null;
  milestone_id?: string | null;
  deliverable_id?: string | null;
  assignee_id?: string | null;
  start_date?: string;
  due_date?: string;
  progress: number;
  tags: string[];
  acceptance_criteria?: string[];
  subtasks: any[];
  comments: any[];
  attachments: any[];
  files?: any[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  assignee_name?: string;
  sprint_name?: string;
  phase_name?: string;
  milestone_name?: string;
  deliverable_name?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority?: string;
  dueDate?: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploaded_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: string;
  priority: string;
  project_id: string;
  sprint_id?: string | null;
  phase_id?: string | null;
  milestone_id?: string | null;
  deliverable_id?: string | null;
  assignee_id?: string | null;
  assignee_name?: string;
  start_date?: string;
  due_date?: string;
  progress?: number;
  tags?: string[];
  acceptance_criteria?: string[];
  subtasks?: any[];
  comments?: any[];
  attachments?: any[];
  is_active?: boolean;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

export interface TasksResponse {
  items: Task[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class TaskApiService {
  async getTasks(
    projectId?: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<TasksResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append("project_id", projectId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/tasks${queryString ? `?${queryString}` : ""}`;
    const response = await axiosInstance.get<TasksResponse>(endpoint);

    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await axiosInstance.get<Task>(`/api/v1/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await axiosInstance.post<Task>("/api/v1/tasks/", taskData);
    return response.data;
  }

  async updateTask(
    id: string,
    taskData: Partial<CreateTaskRequest>
  ): Promise<Task> {
    const response = await axiosInstance.put<Task>(
      `/api/v1/tasks/${id}`,
      taskData
    );
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/tasks/${id}`);
    return response.data;
  }

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    const response = await axiosInstance.patch<Task>(`/api/v1/tasks/${id}`, {
      status,
    });
    return response.data;
  }

  async updateTaskProgress(id: string, progress: number): Promise<Task> {
    const response = await axiosInstance.patch<Task>(`/api/v1/tasks/${id}`, {
      progress,
    });
    return response.data;
  }
}

export const taskApiService = new TaskApiService();
