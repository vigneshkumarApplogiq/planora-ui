import { authApiService } from './authApi'
import { getApiUrl } from '../config/api'

// Date range parameters
export interface DateRangeParams {
  from_date?: string
  to_date?: string
}

// Velocity Metrics
export interface VelocityMetrics {
  current_velocity: number
  average_velocity: number
  velocity_trend: 'increasing' | 'stable' | 'decreasing'
  sprint_data: SprintVelocityData[]
}

export interface SprintVelocityData {
  sprint_name: string
  planned_points: number
  completed_points: number
  velocity: number
}

// Burndown Metrics
export interface BurndownMetrics {
  total_story_points: number
  completed_story_points: number
  remaining_story_points: number
  ideal_burndown: number[]
  actual_burndown: number[]
  days: string[]
}

// Sprint Overview
export interface SprintOverview {
  total_sprints: number
  active_sprints: number
  completed_sprints: number
  average_sprint_duration: number
  total_story_points: number
  completed_story_points: number
  completion_rate: number
}

// Team Performance
export interface ScrumTeamMember {
  member_id: string
  member_name: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  story_points_completed: number
  completion_rate: number
  average_task_duration: number
}

export interface ScrumTeamPerformance {
  team_size: number
  total_tasks: number
  completed_tasks: number
  average_velocity: number
  team_members: ScrumTeamMember[]
}

// Task Completion Metrics
export interface TaskCompletionMetrics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  todo_tasks: number
  blocked_tasks: number
  completion_rate: number
  task_distribution: {
    status: string
    count: number
    percentage: number
  }[]
}

// Quality Metrics
export interface QualityMetrics {
  total_bugs: number
  bugs_fixed: number
  bugs_open: number
  average_resolution_time: number
  code_reviews_completed: number
  test_coverage: number
}

// API Response Types
export interface VelocityResponse {
  metrics: VelocityMetrics
}

export interface BurndownResponse {
  metrics: BurndownMetrics
}

export interface SprintOverviewResponse {
  overview: SprintOverview
}

export interface TeamPerformanceResponse {
  performance: ScrumTeamPerformance
}

export interface TaskCompletionResponse {
  metrics: TaskCompletionMetrics
}

export interface QualityMetricsResponse {
  metrics: QualityMetrics
}

class ScrumReportsApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint)

    const token = authApiService.getAccessToken()

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        try {
          await authApiService.refreshToken()
          const newToken = authApiService.getAccessToken()

          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...defaultHeaders,
              ...(newToken && { Authorization: `Bearer ${newToken}` }),
              ...options?.headers,
            },
          })

          if (retryResponse.ok) {
            return retryResponse.json()
          }
        } catch (refreshError) {
          authApiService.clearTokens()
          authApiService.clearUserProfile()
          throw new Error('Authentication failed. Please login again.')
        }
      }

      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  private getAuthToken(): string | null {
    return authApiService.getAccessToken()
  }

  /**
   * Get sprint velocity metrics
   */
  async getVelocityMetrics(projectId: string, params?: DateRangeParams): Promise<VelocityResponse> {
    const queryParams = new URLSearchParams()
    if (params?.from_date) queryParams.append('from_date', params.from_date)
    if (params?.to_date) queryParams.append('to_date', params.to_date)

    const queryString = queryParams.toString()
    const url = `/api/v1/reports/scrum/${projectId}/velocity${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<VelocityResponse>(url)
  }

  /**
   * Get sprint burndown metrics
   */
  async getBurndownMetrics(projectId: string, sprintId?: string, params?: DateRangeParams): Promise<BurndownResponse> {
    const queryParams = new URLSearchParams()
    if (sprintId) queryParams.append('sprint_id', sprintId)
    if (params?.from_date) queryParams.append('from_date', params.from_date)
    if (params?.to_date) queryParams.append('to_date', params.to_date)

    const queryString = queryParams.toString()
    const url = `/api/v1/reports/scrum/${projectId}/burndown${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<BurndownResponse>(url)
  }

  /**
   * Get sprint overview
   */
  async getSprintOverview(projectId: string, params?: DateRangeParams): Promise<SprintOverviewResponse> {
    const queryParams = new URLSearchParams()
    if (params?.from_date) queryParams.append('from_date', params.from_date)
    if (params?.to_date) queryParams.append('to_date', params.to_date)

    const queryString = queryParams.toString()
    const url = `/api/v1/reports/scrum/${projectId}/overview${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<SprintOverviewResponse>(url)
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformance(projectId: string, params?: DateRangeParams): Promise<TeamPerformanceResponse> {
    const queryParams = new URLSearchParams()
    if (params?.from_date) queryParams.append('from_date', params.from_date)
    if (params?.to_date) queryParams.append('to_date', params.to_date)

    const queryString = queryParams.toString()
    const url = `/api/v1/reports/scrum/${projectId}/team-performance${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<TeamPerformanceResponse>(url)
  }

  /**
   * Get task completion metrics
   */
  async getTaskCompletionMetrics(projectId: string, params?: DateRangeParams): Promise<TaskCompletionResponse> {
    const queryParams = new URLSearchParams()
    if (params?.from_date) queryParams.append('from_date', params.from_date)
    if (params?.to_date) queryParams.append('to_date', params.to_date)

    const queryString = queryParams.toString()
    const url = `/api/v1/reports/scrum/${projectId}/task-completion${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<TaskCompletionResponse>(url)
  }

  /**
   * Get quality metrics
   */
  async getQualityMetrics(projectId: string, params?: DateRangeParams): Promise<QualityMetricsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.from_date) queryParams.append('from_date', params.from_date)
    if (params?.to_date) queryParams.append('to_date', params.to_date)

    const queryString = queryParams.toString()
    const url = `/api/v1/reports/scrum/${projectId}/quality${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<QualityMetricsResponse>(url)
  }

  /**
   * Export report in various formats
   */
  async exportReport(
    projectId: string,
    reportType: 'velocity' | 'burndown' | 'overview' | 'team' | 'tasks' | 'quality',
    format: 'csv' | 'pdf' | 'excel',
    params?: DateRangeParams
  ): Promise<Blob> {
    const queryParams = new URLSearchParams()
    queryParams.append('format', format)
    queryParams.append('report_type', reportType)
    if (params?.from_date) queryParams.append('from_date', params.from_date)
    if (params?.to_date) queryParams.append('to_date', params.to_date)

    const url = `/api/v1/projects/${projectId}/scrum-reports/export?${queryParams.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.blob()
  }
}

export const scrumReportsApiService = new ScrumReportsApiService()
