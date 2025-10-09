import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

export interface Phase {
  id?: string;
  name: string;
  description: string;
  project_id: string;
  project_name: string;
  phase_order: number;
  status: 'pending' | 'active' | 'completed' | 'delayed' | 'on-hold';
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
  status: 'pending' | 'active' | 'completed' | 'delayed' | 'on-hold';
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

  async getPhases(projectId?: string, page: number = 1, perPage: number = 50): Promise<PhasesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (projectId) {
      params.append('project_id', projectId);
    }

    const queryString = params.toString();
    const endpoint = `/api/v1/phases${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<PhasesResponse>(endpoint);
  }

  async getPhaseById(id: string): Promise<Phase> {
    return this.makeRequest<Phase>(`/api/v1/phases/${id}`);
  }

  async createPhase(phaseData: CreatePhaseRequest): Promise<Phase> {
    return this.makeRequest<Phase>('/api/v1/phases/', {
      method: 'POST',
      body: JSON.stringify(phaseData),
    });
  }

  async updatePhase(id: string, phaseData: UpdatePhaseRequest): Promise<Phase> {
    return this.makeRequest<Phase>(`/api/v1/phases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(phaseData),
    });
  }

  async deletePhase(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/phases/${id}`, {
      method: 'DELETE',
    });
  }

  async updatePhaseStatus(id: string, status: string): Promise<Phase> {
    return this.makeRequest<Phase>(`/api/v1/phases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updatePhaseProgress(id: string, progress: number): Promise<Phase> {
    return this.makeRequest<Phase>(`/api/v1/phases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }
}

export const phaseApiService = new PhaseApiService();
