import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

export interface Deliverable {
  id?: string;
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_id: string;
  phase_name: string;
  milestone_id: string;
  milestone_name: string;
  story_id?: string;
  deliverable_type: string;
  status: 'pending' | 'in-progress' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'completed';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  submission_date?: string;
  approval_date?: string;
  owner_id: string;
  owner_name: string;
  reviewer_id: string;
  reviewer_name: string;
  acceptance_criteria: string;
  review_comments?: string;
  file_path?: string;
  version: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDeliverableRequest {
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_id: string;
  phase_name: string;
  milestone_id: string;
  milestone_name: string;
  story_id?: string;
  deliverable_type: string;
  status: 'pending' | 'in-progress' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'completed';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  submission_date?: string;
  approval_date?: string;
  owner_id: string;
  owner_name: string;
  reviewer_id: string;
  reviewer_name: string;
  acceptance_criteria: string;
  review_comments?: string;
  file_path?: string;
  version: string;
  notes?: string;
}

export interface UpdateDeliverableRequest extends Partial<CreateDeliverableRequest> {
  id?: string;
}

export interface DeliverablesResponse {
  items: Deliverable[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class DeliverableApiService {
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

  async getDeliverables(
    projectId?: string,
    phaseId?: string,
    milestoneId?: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<DeliverablesResponse> {
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

    if (milestoneId) {
      params.append('milestone_id', milestoneId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/deliverables${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<DeliverablesResponse>(endpoint);
  }

  async getDeliverableById(id: string): Promise<Deliverable> {
    return this.makeRequest<Deliverable>(`/api/v1/deliverables/${id}`);
  }

  async createDeliverable(deliverableData: CreateDeliverableRequest): Promise<Deliverable> {
    return this.makeRequest<Deliverable>('/api/v1/deliverables/', {
      method: 'POST',
      body: JSON.stringify(deliverableData),
    });
  }

  async updateDeliverable(id: string, deliverableData: UpdateDeliverableRequest): Promise<Deliverable> {
    return this.makeRequest<Deliverable>(`/api/v1/deliverables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deliverableData),
    });
  }

  async deleteDeliverable(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/deliverables/${id}`, {
      method: 'DELETE',
    });
  }

  async updateDeliverableStatus(id: string, status: string): Promise<Deliverable> {
    return this.makeRequest<Deliverable>(`/api/v1/deliverables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateDeliverableProgress(id: string, progress: number): Promise<Deliverable> {
    return this.makeRequest<Deliverable>(`/api/v1/deliverables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }

  async submitDeliverable(id: string, submissionDate: string, filePath?: string): Promise<Deliverable> {
    return this.makeRequest<Deliverable>(`/api/v1/deliverables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'submitted',
        submission_date: submissionDate,
        file_path: filePath
      }),
    });
  }

  async approveDeliverable(id: string, approvalDate: string, reviewComments?: string): Promise<Deliverable> {
    return this.makeRequest<Deliverable>(`/api/v1/deliverables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        approval_date: approvalDate,
        review_comments: reviewComments
      }),
    });
  }

  async rejectDeliverable(id: string, reviewComments: string): Promise<Deliverable> {
    return this.makeRequest<Deliverable>(`/api/v1/deliverables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'rejected',
        review_comments: reviewComments
      }),
    });
  }
}

export const deliverableApiService = new DeliverableApiService();
