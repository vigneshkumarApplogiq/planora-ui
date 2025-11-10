export interface Customer {
  id: string;
  name: string;
  industry: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  status: string;
  join_date: string;
  last_activity: string;
  total_revenue: number;
  project_ids: string[];
  priority: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  contractValue: number;
  clientPortalAccess: boolean;
  billingInfo: {
    billingContact: string;
    nextInvoice: string;
    paymentTerms: string;
  };
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CustomerListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  industry?: string;
  priority?: string;
}

export interface CreateCustomerRequest {
  name: string;
  industry: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  status: string;
  total_revenue: number;
  project_ids: string[];
  priority: string;
  notes: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

// Kanban Dashboard Types
export interface KanbanBoardColumn {
  status: string;
  label: string;
  count: number;
  limit: number;
  status_indicator: string;
}

export interface KanbanStatusDistribution {
  todo_count: number;
  todo_percentage: number;
  in_progress_count: number;
  in_progress_percentage: number;
  review_count: number;
  review_percentage: number;
  done_count: number;
  done_percentage: number;
  on_hold_count: number;
  on_hold_percentage: number;
}

export interface KanbanWipLimits {
  under_limit: number;
  at_limit: number;
  over_limit: number;
}

export interface KanbanFlowInsights {
  message: string;
  data: Record<string, any>;
}

export interface KanbanTaskMetrics {
  completion_rate: number;
  total_tasks: number;
  completed_tasks: number;
  flow_efficiency: number;
  throughput: number;
  cycle_time: number;
}

export interface KanbanBoardOverview {
  columns: KanbanBoardColumn[];
}

export interface KanbanTaskDashboard {
  metrics: KanbanTaskMetrics;
  board_overview: KanbanBoardOverview;
  status_distribution: KanbanStatusDistribution;
  wip_limits: KanbanWipLimits;
  flow_insights: KanbanFlowInsights;
}

export interface KanbanBugMetrics {
  total_bugs: number;
  open_bugs: number;
  resolved_bugs: number;
  critical_bugs: number;
}

export interface KanbanBugDashboard {
  metrics: KanbanBugMetrics;
  wip_status: KanbanWipLimits;
  flow_metrics: KanbanFlowInsights;
}

export interface KanbanTeamMember {
  member_id: string;
  member_name: string;
  avatar: string;
  role: string;
  total_tasks: number;
  done_tasks: number;
  completion_rate: number;
}

export interface KanbanTeamPerformance {
  team_members: KanbanTeamMember[];
  total_team_size: number;
  average_completion_rate: number;
  top_performer: KanbanTeamMember;
}

export interface KanbanDashboardResponse {
  project_id: string;
  project_name: string;
  methodology: string;
  task_dashboard: KanbanTaskDashboard;
  bug_dashboard: KanbanBugDashboard;
  team_performance: KanbanTeamPerformance;
  generated_at: string;
}

import { authApiService } from './authApi';
import { getApiUrl } from '../config/api';


export class CustomerApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);

    // Get the access token for authorization
    const token = authApiService.getAccessToken();

    const defaultHeaders = {
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
      // Handle unauthorized/forbidden errors
      if (response.status === 401 || response.status === 403) {
        // Token might be expired, try to refresh
        try {
          await authApiService.refreshToken();
          // Retry the request with new token
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
          // Refresh failed, user needs to login again
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

  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    return this.makeRequest<Customer>('/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: string, customerData: UpdateCustomerRequest): Promise<Customer> {
    return this.makeRequest<Customer>(`/api/v1/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async getCustomerById(id: string): Promise<Customer> {
    return this.makeRequest<Customer>(`/api/v1/customers/${id}`);
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/v1/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async getCustomers(params?: CustomerListParams): Promise<CustomerListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status && params.status !== 'All') searchParams.append('status', params.status);
    if (params?.industry && params.industry !== 'All') searchParams.append('industry', params.industry);
    if (params?.priority && params.priority !== 'All') searchParams.append('priority', params.priority);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/v1/customers/?${queryString}` : '/api/v1/customers/';

    return this.makeRequest<CustomerListResponse>(endpoint);
  }

  // Legacy method for backward compatibility
  async getAllCustomers(): Promise<Customer[]> {
    const response = await this.getCustomers({ size: 100 }); // Get a large number to simulate "all"
    return response.customers;
  }

  // Kanban Dashboard API Methods
  async getKanbanDashboard(projectId: string): Promise<KanbanDashboardResponse> {
    return this.makeRequest<KanbanDashboardResponse>(`/api/v1/dashboard/kanban/${projectId}`);
  }

  async getKanbanTaskDashboard(projectId: string): Promise<KanbanTaskDashboard> {
    return this.makeRequest<KanbanTaskDashboard>(`/api/v1/dashboard/kanban/${projectId}/tasks`);
  }

  async getKanbanBugDashboard(projectId: string): Promise<KanbanBugDashboard> {
    return this.makeRequest<KanbanBugDashboard>(`/api/v1/dashboard/kanban/${projectId}/bugs`);
  }

  async getKanbanTeamPerformance(projectId: string): Promise<KanbanTeamPerformance> {
    return this.makeRequest<KanbanTeamPerformance>(`/api/v1/dashboard/kanban/${projectId}/team-performance`);
  }
}

export const customerApiService = new CustomerApiService();