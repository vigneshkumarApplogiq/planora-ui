import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';

// ============ Types & Interfaces ============

export interface OverviewMetrics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  blocked_tasks: number;
  completion_rate: number;
  throughput: number;
  wip_count: number;
}

export interface TaskDistributionByStatus {
  todo: number;
  in_progress: number;
  done: number;
  blocked: number;
}

export interface TaskDistributionByType {
  [type: string]: number;
}

export interface TaskDistributionByPriority {
  [priority: string]: number;
}

export interface OverviewResponse {
  metrics: OverviewMetrics;
  task_distribution_by_status: TaskDistributionByStatus;
  task_distribution_by_type: TaskDistributionByType;
  task_distribution_by_priority: TaskDistributionByPriority;
}

export interface FlowMetrics {
  flow_efficiency: number;
  throughput: number;
  wip_count: number;
  completed_tasks: number;
  blocked_tasks: number;
  recommendations: string[];
  insights: FlowInsights;
}

export interface FlowInsights {
  completion_status: 'excellent' | 'good' | 'needs_improvement';
  message: string;
  key_points: string[];
}

export interface CycleTimeMetrics {
  average_cycle_time: number;
  average_lead_time: number;
  time_efficiency: number;
  cycle_time_status: 'excellent' | 'good' | 'needs_improvement';
  lead_time_status: 'excellent' | 'good' | 'needs_improvement';
}

export interface WIPTask {
  id: string;
  task_id: string;
  title: string;
  status: string;
  assignee?: {
    id: string;
    name: string;
  };
  days_in_progress: number;
  is_aging: boolean;
  start_date: string;
  created_at: string;
}

export interface WIPAnalysis {
  current_wip: number;
  aging_wip_count: number;
  wip_health: number;
  wip_tasks: WIPTask[];
  recommendations: string[];
}

export interface TeamMemberPerformance {
  member_id: string;
  name: string;
  email?: string;
  role: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  average_cycle_time?: number;
}

export interface TeamPerformanceMetrics {
  team_size: number;
  total_tasks: number;
  completed_tasks: number;
  average_completion_rate: number;
  team_members: TeamMemberPerformance[];
}

export interface DateRangeParams {
  from_date?: string;
  to_date?: string;
}

export interface ReportParams extends DateRangeParams {
  report_type?: 'all' | 'flow' | 'cycle' | 'wip' | 'team';
}

// ============ API Service ============

export class KanbanReportsApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);

    const token = authApiService.getAccessToken();

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
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

          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...defaultHeaders,
              ...(newToken && { Authorization: `Bearer ${newToken}` }),
              ...options?.headers,
            },
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }
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

  /**
   * Get Overview metrics for Kanban board
   * Includes task distribution, completion rates, and throughput
   */
  async getOverviewMetrics(
    projectId: string,
    params?: DateRangeParams
  ): Promise<OverviewResponse> {
    const queryParams = new URLSearchParams();

    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/kanban-reports/overview${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<OverviewResponse>(endpoint);
  }

  /**
   * Get Flow Metrics
   * Includes flow efficiency, throughput, WIP count, and recommendations
   */
  async getFlowMetrics(
    projectId: string,
    params?: DateRangeParams
  ): Promise<FlowMetrics> {
    const queryParams = new URLSearchParams();

    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/kanban-reports/flow-metrics${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<FlowMetrics>(endpoint);
  }

  /**
   * Get Cycle Time and Lead Time metrics
   * Includes average cycle time, lead time, and time efficiency
   */
  async getCycleTimeMetrics(
    projectId: string,
    params?: DateRangeParams
  ): Promise<CycleTimeMetrics> {
    const queryParams = new URLSearchParams();

    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/kanban-reports/cycle-time${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<CycleTimeMetrics>(endpoint);
  }

  /**
   * Get WIP (Work in Progress) Analysis
   * Includes current WIP, aging tasks, and recommendations
   */
  async getWIPAnalysis(
    projectId: string,
    params?: DateRangeParams & { aging_threshold_days?: number }
  ): Promise<WIPAnalysis> {
    const queryParams = new URLSearchParams();

    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.aging_threshold_days) {
      queryParams.append('aging_threshold_days', params.aging_threshold_days.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/kanban-reports/wip-analysis${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<WIPAnalysis>(endpoint);
  }

  /**
   * Get Team Performance metrics
   * Includes individual team member performance and completion rates
   */
  async getTeamPerformance(
    projectId: string,
    params?: DateRangeParams
  ): Promise<TeamPerformanceMetrics> {
    const queryParams = new URLSearchParams();

    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/kanban-reports/team-performance${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TeamPerformanceMetrics>(endpoint);
  }

  /**
   * Export report data
   * Format can be 'csv', 'pdf', or 'excel'
   */
  async exportReport(
    projectId: string,
    reportType: 'overview' | 'flow' | 'cycle' | 'wip' | 'team',
    format: 'csv' | 'pdf' | 'excel' = 'csv',
    params?: DateRangeParams
  ): Promise<Blob> {
    const queryParams = new URLSearchParams({
      format: format,
      report_type: reportType
    });

    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const url = getApiUrl(`/api/v1/projects/${projectId}/kanban-reports/export?${queryParams.toString()}`);
    const token = authApiService.getAccessToken();

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export report');
    }

    return response.blob();
  }

  /**
   * Get comprehensive report with all metrics
   * Useful for dashboard or summary views
   */
  async getComprehensiveReport(
    projectId: string,
    params?: DateRangeParams
  ): Promise<{
    overview: OverviewResponse;
    flow: FlowMetrics;
    cycle_time: CycleTimeMetrics;
    wip: WIPAnalysis;
    team: TeamPerformanceMetrics;
  }> {
    const queryParams = new URLSearchParams();

    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/kanban-reports/comprehensive${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest(endpoint);
  }
}

export const kanbanReportsApiService = new KanbanReportsApiService();
