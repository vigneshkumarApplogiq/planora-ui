import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

export interface TimeEntryAttachment {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  user_name?: string;
  project_id: string;
  task_id?: string;
  story_id?: string;
  bug_id?: string;
  date: string;
  hours: number;
  description: string;
  notes?: string;
  activity_type: 'development' | 'testing' | 'design' | 'review' | 'meeting' | 'documentation' | 'bug_fixing' | 'other';
  billable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  attachments: TimeEntryAttachment[];
  created_at: string;
  updated_at: string;
  project_name?: string;
  task_name?: string;
}

export interface CreateTimeEntryRequest {
  project_id: string;
  task_id?: string;
  story_id?: string;
  bug_id?: string;
  date: string;
  hours: number;
  description: string;
  notes?: string;
  activity_type: 'development' | 'testing' | 'design' | 'review' | 'meeting' | 'documentation' | 'bug_fixing' | 'other';
  billable?: boolean;
  status?: 'draft' | 'submitted';
}

export interface UpdateTimeEntryRequest extends Partial<CreateTimeEntryRequest> {
  approved?: boolean;
}

export interface TimeEntriesResponse {
  items: TimeEntry[];
  total: number;
  total_hours: number;
  billable_hours: number;
}

export interface TimesheetSummary {
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  entries_count: number;
  by_activity: {
    [key: string]: number;
  };
  by_project: {
    project_id: string;
    project_name: string;
    hours: number;
  }[];
}

export interface TimeEntriesQueryParams {
  user_id?: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
  approved?: boolean;
  page?: number;
  per_page?: number;
}

export class TimesheetApiService {
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
          throw new Error(retryErrorData.detail || `API Error after retry: ${retryResponse.status}`);
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

  async getTimeEntries(params: TimeEntriesQueryParams = {}): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.project_id) searchParams.append('project_id', params.project_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.approved !== undefined) searchParams.append('approved', params.approved.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/entries${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TimeEntriesResponse>(endpoint);
  }

  async getMyTimeEntries(params: Omit<TimeEntriesQueryParams, 'user_id'> = {}): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    if (params.project_id) searchParams.append('project_id', params.project_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.approved !== undefined) searchParams.append('approved', params.approved.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/my-entries${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TimeEntriesResponse>(endpoint);
  }

  async getTimeEntryById(id: string): Promise<TimeEntry> {
    return this.makeRequest<TimeEntry>(`/api/v1/timesheet/entries/${id}`);
  }

  async createTimeEntry(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    return this.makeRequest<TimeEntry>('/api/v1/timesheet/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTimeEntry(id: string, data: UpdateTimeEntryRequest): Promise<TimeEntry> {
    return this.makeRequest<TimeEntry>(`/api/v1/timesheet/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeEntry(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/timesheet/entries/${id}`, {
      method: 'DELETE',
    });
  }

  async getTimesheetSummary(params: TimeEntriesQueryParams = {}): Promise<TimesheetSummary> {
    const searchParams = new URLSearchParams();

    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.project_id) searchParams.append('project_id', params.project_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/summary${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TimesheetSummary>(endpoint);
  }

  async getMyTimesheetSummary(params: Omit<TimeEntriesQueryParams, 'user_id'> = {}): Promise<TimesheetSummary> {
    const searchParams = new URLSearchParams();

    if (params.project_id) searchParams.append('project_id', params.project_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/my-summary${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TimesheetSummary>(endpoint);
  }

  async approveTimeEntry(id: string): Promise<TimeEntry> {
    return this.makeRequest<TimeEntry>(`/api/v1/timesheet/entries/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectTimeEntry(id: string, reason?: string): Promise<TimeEntry> {
    return this.makeRequest<TimeEntry>(`/api/v1/timesheet/entries/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Task-specific time logging
  async logTimeForTask(taskId: string, hours: number, description: string, activityType: CreateTimeEntryRequest['activity_type']): Promise<TimeEntry> {
    return this.makeRequest<TimeEntry>(`/api/v1/tasks/${taskId}/log-time`, {
      method: 'POST',
      body: JSON.stringify({
        hours,
        description,
        activity_type: activityType,
        date: new Date().toISOString().split('T')[0]
      }),
    });
  }

  async getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
    return this.makeRequest<TimeEntry[]>(`/api/v1/tasks/${taskId}/time-entries`);
  }

  // Submit time entries for approval
  async submitTimeEntry(id: string): Promise<TimeEntry> {
    return this.makeRequest<TimeEntry>(`/api/v1/timesheet/entries/${id}/submit`, {
      method: 'POST',
    });
  }

  async submitMultipleEntries(ids: string[]): Promise<TimeEntry[]> {
    return this.makeRequest<TimeEntry[]>('/api/v1/timesheet/entries/submit-bulk', {
      method: 'POST',
      body: JSON.stringify({ entry_ids: ids }),
    });
  }

  // Get pending approvals (for managers)
  async getPendingApprovals(params: TimeEntriesQueryParams = {}): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    if (params.project_id) searchParams.append('project_id', params.project_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/pending-approvals${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TimeEntriesResponse>(endpoint);
  }

  // Bulk approve/reject
  async bulkApprove(ids: string[]): Promise<TimeEntry[]> {
    return this.makeRequest<TimeEntry[]>('/api/v1/timesheet/entries/approve-bulk', {
      method: 'POST',
      body: JSON.stringify({ entry_ids: ids }),
    });
  }

  async bulkReject(ids: string[], reason?: string): Promise<TimeEntry[]> {
    return this.makeRequest<TimeEntry[]>('/api/v1/timesheet/entries/reject-bulk', {
      method: 'POST',
      body: JSON.stringify({ entry_ids: ids, reason }),
    });
  }

  // File attachments
  async uploadAttachment(entryId: string, file: File): Promise<TimeEntryAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const url = getApiUrl(`/api/v1/timesheet/entries/${entryId}/attachments`);
    const token = authApiService.getAccessToken();
    const tokenType = authApiService.getTokenType();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `${tokenType} ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload attachment');
    }

    return response.json();
  }

  async deleteAttachment(entryId: string, attachmentId: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/timesheet/entries/${entryId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // Get entries by status
  async getEntriesByStatus(status: TimeEntry['status'], params: TimeEntriesQueryParams = {}): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    searchParams.append('status', status);
    if (params.project_id) searchParams.append('project_id', params.project_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/my-entries${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TimeEntriesResponse>(endpoint);
  }
}

export const timesheetApiService = new TimesheetApiService();
