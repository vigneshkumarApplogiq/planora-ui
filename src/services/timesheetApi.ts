import axiosInstance from "../config/api";

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
  start_time: string;
  end_time: string;
  hours: number;
  description: string;
  notes?: string;
  activity_type:
    | "development"
    | "testing"
    | "design"
    | "review"
    | "meeting"
    | "documentation"
    | "bug_fix"
    | "research"
    | "planning"
    | "deployment";
  billable: boolean;
  status: "draft" | "submitted" | "approved" | "rejected";
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
  start_time: string;
  end_time: string;
  hours: number;
  description: string;
  notes?: string;
  activity_type:
    | "development"
    | "testing"
    | "design"
    | "review"
    | "meeting"
    | "documentation"
    | "bug_fix"
    | "research"
    | "planning"
    | "deployment";
  billable?: boolean;
  status?: "draft" | "submitted";
}

export interface UpdateTimeEntryRequest
  extends Partial<CreateTimeEntryRequest> {
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
  async getTimeEntries(
    params: TimeEntriesQueryParams = {}
  ): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    if (params.user_id) searchParams.append("user_id", params.user_id);
    if (params.project_id) searchParams.append("project_id", params.project_id);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.end_date) searchParams.append("end_date", params.end_date);
    if (params.approved !== undefined)
      searchParams.append("approved", params.approved.toString());
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.per_page)
      searchParams.append("per_page", params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/entries${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<TimeEntriesResponse>(endpoint);

    return response.data;
  }

  async getMyTimeEntries(
    params: Omit<TimeEntriesQueryParams, "user_id"> = {}
  ): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    if (params.project_id) searchParams.append("project_id", params.project_id);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.end_date) searchParams.append("end_date", params.end_date);
    if (params.approved !== undefined)
      searchParams.append("approved", params.approved.toString());
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.per_page)
      searchParams.append("per_page", params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/my-entries${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<TimeEntriesResponse>(endpoint);
    return response.data;
  }

  async getTimeEntryById(id: string): Promise<TimeEntry> {
    const response = await axiosInstance.get<TimeEntry>(
      `/api/v1/timesheet/entries/${id}`
    );
    return response.data;
  }

  async createTimeEntry(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    const response = await axiosInstance.post<TimeEntry>(
      "/api/v1/timesheet/entries",
      data
    );
    return response.data;
  }

  async updateTimeEntry(
    id: string,
    data: UpdateTimeEntryRequest
  ): Promise<TimeEntry> {
    const response = await axiosInstance.put<TimeEntry>(
      `/api/v1/timesheet/entries/${id}`,
      data
    );
    return response.data;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(
      `/api/v1/timesheet/entries/${id}`
    );
    return response.data;
  }

  async getTimesheetSummary(
    params: TimeEntriesQueryParams = {}
  ): Promise<TimesheetSummary> {
    const searchParams = new URLSearchParams();

    if (params.user_id) searchParams.append("user_id", params.user_id);
    if (params.project_id) searchParams.append("project_id", params.project_id);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.end_date) searchParams.append("end_date", params.end_date);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/summary${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<TimesheetSummary>(endpoint);

    return response.data;
  }

  async getMyTimesheetSummary(
    params: Omit<TimeEntriesQueryParams, "user_id"> = {}
  ): Promise<TimesheetSummary> {
    const searchParams = new URLSearchParams();

    if (params.project_id) searchParams.append("project_id", params.project_id);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.end_date) searchParams.append("end_date", params.end_date);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/my-summary${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<TimesheetSummary>(endpoint);
    return response.data;
  }

  async approveTimeEntry(id: string): Promise<TimeEntry> {
    const response = await axiosInstance.post<TimeEntry>(
      `/api/v1/timesheet/entries/${id}/approve`
    );
    return response.data;
  }

  async rejectTimeEntry(id: string, reason?: string): Promise<TimeEntry> {
    const response = await axiosInstance.post<TimeEntry>(
      `/api/v1/timesheet/entries/${id}/reject`,
      { reason }
    );
    return response.data;
  }

  // Task-specific time logging
  async logTimeForTask(
    taskId: string,
    hours: number,
    description: string,
    activityType: CreateTimeEntryRequest["activity_type"]
  ): Promise<TimeEntry> {
    const response = await axiosInstance.post<TimeEntry>(
      `/api/v1/tasks/${taskId}/log-time`,
      {
        hours,
        description,
        activity_type: activityType,
        date: new Date().toISOString().split("T")[0],
      }
    );
    return response.data;
  }

  async getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
    const response = await axiosInstance.get<TimeEntry[]>(
      `/api/v1/tasks/${taskId}/time-entries`
    );
    return response.data;
  }

  // Submit time entries for approval
  async submitTimeEntry(id: string): Promise<TimeEntry> {
    const response = await axiosInstance.post<TimeEntry>(
      `/api/v1/timesheet/entries/${id}/submit`
    );
    return response.data;
  }

  async submitMultipleEntries(ids: string[]): Promise<TimeEntry[]> {
    const response = await axiosInstance.post<TimeEntry[]>(
      `/api/v1/timesheet/entries/submit-bulk`,
      { entry_ids: ids }
    );
    return response.data;
  }

  // Get pending approvals (for managers)
  async getPendingApprovals(
    params: TimeEntriesQueryParams = {}
  ): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    if (params.project_id) searchParams.append("project_id", params.project_id);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.end_date) searchParams.append("end_date", params.end_date);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.per_page)
      searchParams.append("per_page", params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/pending-approvals${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<TimeEntriesResponse>(endpoint);
    return response.data;
  }

  // Bulk approve/reject
  async bulkApprove(ids: string[]): Promise<TimeEntry[]> {
    const response = await axiosInstance.post<TimeEntry[]>(
      "/api/v1/timesheet/entries/approve-bulk",
      { entry_ids: ids }
    );
    return response.data;
  }

  async bulkReject(ids: string[], reason?: string): Promise<TimeEntry[]> {
    const response = await axiosInstance.post<TimeEntry[]>(
      "/api/v1/timesheet/entries/reject-bulk",
      { entry_ids: ids, reason }
    );
    return response.data;
  }

  // File attachments
  async uploadAttachment(
    entryId: string,
    file: File
  ): Promise<TimeEntryAttachment> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `/api/v1/timesheet/entries/${entryId}/attachments`;
    const response = await axiosInstance.post<TimeEntryAttachment>(
      url,
      formData
    );

    return response.data;
  }

  async deleteAttachment(entryId: string, attachmentId: string): Promise<void> {
    const response = await axiosInstance.delete<void>(
      `/api/v1/timesheet/entries/${entryId}/attachments/${attachmentId}`
    );
    return response.data;
  }

  // Get entries by status
  async getEntriesByStatus(
    status: TimeEntry["status"],
    params: TimeEntriesQueryParams = {}
  ): Promise<TimeEntriesResponse> {
    const searchParams = new URLSearchParams();

    searchParams.append("status", status);
    if (params.project_id) searchParams.append("project_id", params.project_id);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.end_date) searchParams.append("end_date", params.end_date);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.per_page)
      searchParams.append("per_page", params.per_page.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timesheet/my-entries${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<TimeEntriesResponse>(endpoint);
    return response.data;
  }
}

export const timesheetApiService = new TimesheetApiService();
