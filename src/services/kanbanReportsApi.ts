import axiosInstance, { getApiUrl } from "../config/api";

// ============ Types & Interfaces ============

// Overview API Response Types
export interface OverviewMetrics {
  total_tasks: number;
  completion_rate: number;
  throughput: number;
  wip_count: number;
}

export interface TaskDistributionByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface TaskDistributionByType {
  story_count: number;
  story_percentage: number;
  bug_count: number;
  bug_percentage: number;
  task_count: number;
  task_percentage: number;
}

export interface PriorityDistribution {
  low_count: number;
  low_percentage: number;
  medium_count: number;
  medium_percentage: number;
  high_count: number;
  high_percentage: number;
  critical_count: number;
  critical_percentage: number;
}

export interface OverviewResponse {
  metrics: OverviewMetrics;
  task_distribution_by_status: TaskDistributionByStatus[];
  task_distribution_by_type: TaskDistributionByType;
  priority_distribution: PriorityDistribution;
}

// Flow Metrics API Response Types
export interface FlowMetricsData {
  flow_efficiency: number;
  throughput: number;
  wip_count: number;
}

export interface EfficiencyAnalysis {
  status: string;
  message: string;
  recommendation: string;
}

export interface KeyInsights {
  tasks_completed: number;
  tasks_finished_last_week: number;
  tasks_currently_in_progress: number;
  overall_flow_efficiency: number;
}

export interface FlowRecommendations {
  wip_status: string;
  blocked_tasks_status: string;
  suggestions: string[];
}

export interface FlowMetrics {
  metrics: FlowMetricsData;
  efficiency_analysis: EfficiencyAnalysis;
  key_insights: KeyInsights;
  recommendations: FlowRecommendations;
}

// Cycle/Lead Time API Response Types
export interface CycleLeadTimeMetrics {
  average_cycle_time: number;
  average_lead_time: number;
  time_efficiency: number;
}

export interface TimeAnalysis {
  cycle_time_days: number;
  cycle_time_status: string;
  cycle_time_description: string;
  lead_time_days: number;
  lead_time_status: string;
  lead_time_description: string;
}

export interface TimeInsights {
  cycle_time_explanation: string;
  lead_time_explanation: string;
  gap_analysis: string;
}

export interface CycleTimeMetrics {
  metrics: CycleLeadTimeMetrics;
  time_analysis: TimeAnalysis;
  insights: TimeInsights;
}

// WIP Analysis API Response Types
export interface WIPMetrics {
  current_wip: number;
  aging_wip: number;
  wip_health: number;
}

export interface WIPTask {
  task_id: string;
  task_title: string;
  assignee_name: string;
  status: string;
  days_in_progress: number;
  priority: string;
}

export interface WIPRecommendations {
  wip_status_message: string;
  suggestions: string[];
}

export interface WIPAnalysis {
  metrics: WIPMetrics;
  work_in_progress_details: WIPTask[];
  recommendations: WIPRecommendations;
}

// Team Performance API Response Types
export interface TeamMetrics {
  team_members_count: number;
  total_tasks: number;
  completed_tasks: number;
  average_completion_rate: number;
}

export interface TeamMemberPerformance {
  member_id: string;
  member_name: string;
  avatar: string;
  role: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
}

export interface TeamPerformanceMetrics {
  team_metrics: TeamMetrics;
  individual_performance: TeamMemberPerformance[];
  top_performer: TeamMemberPerformance;
}

export interface DateRangeParams {
  from_date?: string;
  to_date?: string;
}

export interface ReportParams extends DateRangeParams {
  report_type?: "all" | "flow" | "cycle" | "wip" | "team";
}

// ============ API Service ============

export class KanbanReportsApiService {
  /**
   * Get Overview metrics for Kanban board
   * Includes task distribution, completion rates, and throughput
   */

  async getOverviewMetrics(
    projectId: string,
    params?: DateRangeParams
  ): Promise<OverviewResponse> {
    const queryParams = new URLSearchParams();

    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/reports/kanban/${projectId}/overview${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<OverviewResponse>(endpoint);
    return response.data;
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

    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/reports/kanban/${projectId}/flow-metrics${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<FlowMetrics>(endpoint);
    return response.data;
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

    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/reports/kanban/${projectId}/cycle-lead-time${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<CycleTimeMetrics>(endpoint);
    return response.data;
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

    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);
    if (params?.aging_threshold_days) {
      queryParams.append(
        "aging_threshold_days",
        params.aging_threshold_days.toString()
      );
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/reports/kanban/${projectId}/wip-analysis${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<WIPAnalysis>(endpoint);
    return response.data;
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

    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/reports/kanban/${projectId}/team-performance${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<TeamPerformanceMetrics>(endpoint);
    return response.data;
  }

  /**
   * Export report data
   * Format can be 'csv', 'pdf', or 'excel'
   */
  async exportReport(
    projectId: string,
    reportType: "overview" | "flow" | "cycle" | "wip" | "team",
    format: "csv" | "pdf" | "excel" = "csv",
    params?: DateRangeParams
  ): Promise<Blob> {
    const queryParams = new URLSearchParams({
      format: format,
      report_type: reportType,
    });

    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);

    const url = getApiUrl(
      `/api/v1/projects/${projectId}/kanban-reports/export?${queryParams.toString()}`
    );

    const response = await axiosInstance.get(url, { responseType: "blob" });

    return response.data;
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

    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/projects/${projectId}/kanban-reports/comprehensive${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await axiosInstance.get<{
      overview: OverviewResponse;
      flow: FlowMetrics;
      cycle_time: CycleTimeMetrics;
      wip: WIPAnalysis;
      team: TeamPerformanceMetrics;
    }>(endpoint);
    return response.data;
  }
}

export const kanbanReportsApiService = new KanbanReportsApiService();
