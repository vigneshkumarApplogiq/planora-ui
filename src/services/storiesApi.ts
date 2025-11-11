import { authApiService } from "./authApi";
import { getApiUrl } from "../config/api";

export interface AssigneeDetail {
  id: string;
  name: string;
  email: string;
  user_profile: string;
}

export interface ReporterDetail {
  id: string;
  name: string;
  email: string;
  user_profile: string;
}

export interface Story {
  id: string;
  task_id?: string;
  title: string;
  description: string;
  story_type: string;
  priority: string;
  status: string;
  epic_id: string;
  epic_title: string;
  project_id: string;
  project_name: string;
  sprint_id: string;
  assignee_id: string;
  assignee_name: string;
  assignee?: AssigneeDetail;
  reporter_id: string;
  reporter_name: string;
  reporter?: ReporterDetail;
  story_points: number;
  business_value: string;
  effort?: string;
  labels: string[];
  acceptance_criteria: string[];
  subtasks: SubTask[];
  comments: Comment[];
  attached_files: AttachedFile[];
  progress: number;
  start_date: string;
  end_date: string;
  tags: string[];
  activity: Activity[];
  created_at?: string;
  updated_at?: string;
  // Waterfall methodology fields
  phase_id?: string;
  phase_name?: string;
  milestone_id?: string;
  milestone_name?: string;
  deliverable_id?: string;
  deliverable_name?: string;
  files?: any[];
  image_url?: string;
  due_date?: string;
}

export interface SubTask {
  task_name: string;
  description: string;
  assignee: string;
  priority: string;
  due_date: string;
}

export interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface AttachedFile {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface CreateStoryRequest {
  title: string;
  description: string;
  story_type: string;
  priority: string;
  status: string;
  epic_id?: string;
  epic_title?: string;
  project_id: string;
  project_name?: string;
  sprint_id?: string;
  assignee_id?: string | null;
  assignee_name?: string;
  reporter_id?: string;
  reporter_name?: string;
  story_points?: number;
  business_value?: string;
  labels?: string[];
  acceptance_criteria?: string[] | null;
  subtasks?: SubTask[];
  comments?: Comment[];
  attached_files?: AttachedFile[];
  progress?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  activity?: Activity[];
  // Waterfall methodology fields
  phase_id?: string;
  phase_name?: string;
  milestone_id?: string;
  milestone_name?: string;
  deliverable_id?: string;
  deliverable_name?: string;
  due_date?: string;
}

export interface UpdateStoryRequest extends Partial<CreateStoryRequest> {
  id: string;
}

export interface StoriesResponse {
  items: Story[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class StoriesApiService {
  private async makeRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = getApiUrl(endpoint);

    const token = authApiService.getAccessToken();

    const defaultHeaders: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Don't set Content-Type for FormData - browser will set it automatically
    if (!(options?.body instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

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

          const retryHeaders: HeadersInit = {
            ...(newToken && { Authorization: `Bearer ${newToken}` }),
          };

          if (!(options?.body instanceof FormData)) {
            retryHeaders["Content-Type"] = "application/json";
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...retryHeaders,
              ...options?.headers,
            },
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch (refreshError) {
          authApiService.clearTokens();
          authApiService.clearUserProfile();
          throw new Error("Authentication failed. Please login again.");
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          `API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getStories(
    projectId?: string,
    page: number = 1,
    perPage: number = 50,
    status?: string,
    assigneeId?: string
  ): Promise<StoriesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append("project_id", projectId);
    }

    if (status && status !== "all") {
      params.append("status", status);
    }

    if (assigneeId && assigneeId !== "all" && assigneeId !== "unassigned") {
      params.append("assignee_id", assigneeId);
    } else if (assigneeId === "unassigned") {
      params.append("assignee_id", "");
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/stories${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<StoriesResponse>(endpoint);
  }

  async getStory(id: string): Promise<Story> {
    return this.makeRequest<Story>(`/api/v1/stories/${id}`);
  }

  async createStory(storyData: CreateStoryRequest): Promise<Story> {
    return this.makeRequest<Story>("/api/v1/stories/", {
      method: "POST",
      body: JSON.stringify(storyData),
    });
  }

  async updateStory(
    id: string,
    storyData: Partial<CreateStoryRequest>
  ): Promise<Story> {
    return this.makeRequest<Story>(`/api/v1/stories/${id}`, {
      method: "PUT",
      body: JSON.stringify(storyData),
    });
  }

  async deleteStory(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/stories/${id}`, {
      method: "DELETE",
    });
  }

  async updateStoryStatus(id: string, status: string): Promise<Story> {
    return this.makeRequest<Story>(`/api/v1/stories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async updateStoryProgress(id: string, progress: number): Promise<Story> {
    return this.makeRequest<Story>(`/api/v1/stories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ progress }),
    });
  }
}

export const storiesApiService = new StoriesApiService();
