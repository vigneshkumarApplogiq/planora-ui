import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

export interface Milestone {
  id?: string;
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_id: string;
  phase_name: string;
  milestone_order: number;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'at-risk';
  progress: number;
  due_date: string;
  completion_date?: string;
  owner_id: string;
  owner_name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
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
  status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'at-risk';
  progress: number;
  due_date: string;
  completion_date?: string;
  owner_id: string;
  owner_name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  criteria: string;
  notes?: string;
}

export interface UpdateMilestoneRequest extends Partial<CreateMilestoneRequest> {
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

  async getMilestones(projectId?: string, phaseId?: string, page: number = 1, perPage: number = 50): Promise<MilestonesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append('project_id', projectId);
    }

    if (phaseId) {
      params.append('phase_id', phaseId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/milestones${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<MilestonesResponse>(endpoint);
  }

  async getMilestoneById(id: string): Promise<Milestone> {
    return this.makeRequest<Milestone>(`/api/v1/milestones/${id}`);
  }

  async createMilestone(milestoneData: CreateMilestoneRequest): Promise<Milestone> {
    return this.makeRequest<Milestone>('/api/v1/milestones/', {
      method: 'POST',
      body: JSON.stringify(milestoneData),
    });
  }

  async updateMilestone(id: string, milestoneData: UpdateMilestoneRequest): Promise<Milestone> {
    return this.makeRequest<Milestone>(`/api/v1/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(milestoneData),
    });
  }

  async deleteMilestone(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/milestones/${id}`, {
      method: 'DELETE',
    });
  }

  async updateMilestoneStatus(id: string, status: string): Promise<Milestone> {
    return this.makeRequest<Milestone>(`/api/v1/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateMilestoneProgress(id: string, progress: number): Promise<Milestone> {
    return this.makeRequest<Milestone>(`/api/v1/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }
}

export const milestoneApiService = new MilestoneApiService();
