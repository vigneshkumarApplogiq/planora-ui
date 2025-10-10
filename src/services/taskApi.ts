import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

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
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);

    const token = authApiService.getAccessToken();
    const tokenType = authApiService.getTokenType();

    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `${tokenType} ${token}`
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
          const newTokenType = authApiService.getTokenType();

          if (!newToken) {
            throw new Error('Failed to get new token after refresh');
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...defaultHeaders,
              Authorization: `${newTokenType} ${newToken}`,
              ...options?.headers,
            },
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }

          const retryErrorData = await retryResponse.json().catch(() => ({}));
          throw new Error(retryErrorData.detail || `API Error after retry: ${retryResponse.status} ${retryResponse.statusText}`);
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

  async getTasks(projectId?: string, page: number = 1, perPage: number = 50): Promise<TasksResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append('project_id', projectId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/tasks${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TasksResponse>(endpoint);
  }

  async getTask(id: string): Promise<Task> {
    return this.makeRequest<Task>(`/api/v1/tasks/${id}`);
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    return this.makeRequest<Task>('/api/v1/tasks/', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, taskData: Partial<CreateTaskRequest>): Promise<Task> {
    return this.makeRequest<Task>(`/api/v1/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    return this.makeRequest<Task>(`/api/v1/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateTaskProgress(id: string, progress: number): Promise<Task> {
    return this.makeRequest<Task>(`/api/v1/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }
}

export const taskApiService = new TaskApiService();