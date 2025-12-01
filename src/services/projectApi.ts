import axiosInstance from "../config/api";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  customer: string;
  customer_id: string;
  priority: string;
  team_lead_id: string;
  team_members: string[];
  tags: string[];
  color: string;
  methodology: string;
  project_type: string;
  created_at: string;
  updated_at: string;
  team_lead: ProjectOwner;
}

export interface ProjectMasterItem {
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectStatusItem extends ProjectMasterItem {
  color: string;
}

export interface ProjectPriorityItem extends ProjectMasterItem {
  color: string;
  level: number;
}

export interface ProjectMastersResponse {
  methodologies: ProjectMasterItem[];
  types: ProjectMasterItem[];
  statuses: ProjectStatusItem[];
  priorities: ProjectPriorityItem[];
  task_status: ProjectStatusItem[];
}

export interface ProjectOwner {
  email: string;
  name: string;
  role_id: string;
  avatar: string;
  is_active: boolean;
  department: string;
  skills: string[];
  phone: string;
  timezone: string;
  id: string;
  last_login: string | null;
  created_at: string;
  updated_at: string | null;
  role: {
    name: string;
    description: string;
    permissions: string[];
    is_active: boolean;
    id: string;
    created_at: string;
    updated_at: string | null;
  };
}

export interface ProjectOwnersResponse {
  items: ProjectOwner[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProjectMemberDetail {
  id: string;
  name: string;
  department: string;
  role_id: string;
  role_name: string;
  user_profile: string;
}

export interface ProjectTeamMembersResponse {
  project_id: string;
  project_name: string;
  team_lead_detail: ProjectMemberDetail;
  team_members_detail: ProjectMemberDetail[];
}

export interface ProjectMember {
  member_id: string;
  role_id: string;
  project_id: string;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  active_tasks: number;
  completed: number;
  hours: number;
  capacity: number;
  id: string;
  created_at: string;
  updated_at: string | null;
  member_name: string;
  member_email: string;
  member_profile: string;
  role_name: string;
}

export interface addTeamMember {
  member_id: string;
  role_id: string;
  project_id: string;
}
export type ProjectMembersResponse = ProjectMember[];

export interface MyProjectPermissions {
  public_project: boolean;
  guest_access: boolean;
  time_tracking: boolean;
  file_sharing: boolean;
  task_creation: boolean;
}

export interface MyProjectNotifications {
  task_updates: boolean;
  file_uploads: boolean;
  comments: boolean;
  mentions: boolean;
  deadlines: boolean;
  status_changes: boolean;
}

export interface MyProject {
  name: string;
  description: string;
  status: string;
  progress: number;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  customer: string;
  customer_id: string;
  priority: string;
  team_lead_id: string;
  team_members: string[];
  tags: string[];
  color: string;
  methodology: string;
  project_type: string;
  prefix: string;
  permissions: MyProjectPermissions;
  notifications: MyProjectNotifications;
  id: string;
  created_at: string;
  updated_at: string;
  team_lead_detail: ProjectMemberDetail;
  team_members_detail: ProjectMemberDetail[];
}

export type MyProjectsResponse = MyProject[];

export interface CreateProjectRequest {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  customer_id: string;
  customer: string;
  priority: string;
  team_lead_id: string;
  team_members: string[]; // Array of member IDs
  tags: string[];
  methodology: string;
  project_type: string;
  color?: string;
  prefix?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  spent?: number;
  progress?: number;
  color?: string;
}

export interface ProjectsResponse {
  items: Project[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProjectsQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  priority?: string;
  methodology?: string;
  projectType?: string;
  customerId?: string;
  teamLead?: string;
}

export class ProjectApiService {
  async getProjects(
    params: ProjectsQueryParams = {}
  ): Promise<ProjectsResponse> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined)
      searchParams.append("page", params.page.toString());
    if (params.per_page !== undefined)
      searchParams.append("per_page", params.per_page.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.priority) searchParams.append("priority", params.priority);
    if (params.methodology)
      searchParams.append("methodology", params.methodology);
    if (params.projectType)
      searchParams.append("project_type", params.projectType);
    if (params.customerId)
      searchParams.append("customer_id", params.customerId);
    if (params.teamLead) searchParams.append("team_lead", params.teamLead);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/projects${queryString ? `?${queryString}` : ""}`;
    const res = await axiosInstance.get<ProjectsResponse>(endpoint);
    const response = res.data;

    if (response && Array.isArray(response.items)) {
      return response;
    } else {
      return {
        items: [],
        total: 0,
        page: params.page || 1,
        per_page: params.per_page || 10,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      };
    }
  }

  async getProjectById(id: string): Promise<Project> {
    const response = await axiosInstance.get<Project>(`/api/v1/projects/${id}`);
    return response.data;
  }

  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const response = await axiosInstance.post<Project>(
      "/api/v1/projects/",
      projectData
    );
    return response.data;
  }

  async updateProject(
    id: string,
    projectData: UpdateProjectRequest
  ): Promise<Project> {
    const response = await axiosInstance.put<Project>(
      `/api/v1/projects/${id}`,
      projectData
    );
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/projects/${id}`);
    return response.data;
  }

  async addTeamMember(memberData: addTeamMember): Promise<void> {
    const response = await axiosInstance.post<void>(`/api/v1/projects/members/`, memberData);
    return response.data;
  }

  async removeMember(projectId: string, memberId: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/projects/members/${projectId}/${memberId}`);
    return response.data;
  }

  async updateProjectStatus(id: string, status: string): Promise<Project> {
    const response = await axiosInstance.patch<Project>(
      `/api/v1/projects/${id}`,
      { status }
    );
    return response.data;
  }

  async updateProjectProgress(id: string, progress: number): Promise<Project> {
    const response = await axiosInstance.patch<Project>(
      `/api/v1/projects/${id}`,
      { progress }
    );
    return response.data;
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    const response = await this.getProjects({ status });
    return response.items;
  }

  async getActiveProjects(): Promise<Project[]> {
    return this.getProjectsByStatus("Active");
  }

  async getCompletedProjects(): Promise<Project[]> {
    return this.getProjectsByStatus("Completed");
  }

  async getOnHoldProjects(): Promise<Project[]> {
    return this.getProjectsByStatus("On Hold");
  }

  async getPlanningProjects(): Promise<Project[]> {
    return this.getProjectsByStatus("Planning");
  }

  async getActiveProjectsList(): Promise<Project[]> {
    const response = await axiosInstance.get<Project[]>(
      "/api/v1/projects/active/list"
    );
    return response.data;
  }

  async getMyProjects(): Promise<MyProjectsResponse> {
    const response = await axiosInstance.get<MyProjectsResponse>(
      "/api/v1/projects/myprojects"
    );
    return response.data;
  }

  async getProjectMasters(): Promise<ProjectMastersResponse> {
    const response = await axiosInstance.get<ProjectMastersResponse>(
      "/api/v1/masters/project"
    );
    return response.data;
  }

  async getProjectOwners(): Promise<ProjectOwnersResponse> {
    const response = await axiosInstance.get<ProjectOwnersResponse>(
      "/api/v1/users/project-owner/"
    );
    return response.data;
  }

  async getProjectMembers(): Promise<ProjectMembersResponse> {
    const response = await axiosInstance.get<ProjectMembersResponse>(
      "/api/v1/users/team-members"
    );
    return response.data;
  }

  async getProjectTeamMembers(
    projectId: string
  ): Promise<ProjectTeamMembersResponse> {
    const response = await axiosInstance.get<ProjectTeamMembersResponse>(
      `/api/v1/projects/members/${projectId}`
    );
    return response.data;
  }

  async getProjectMembersV2(
    projectId: string
  ): Promise<ProjectMembersResponse> {
    const response = await axiosInstance.get<ProjectMembersResponse>(
      `/api/v1/projects/members/${projectId}`
    );
    return response.data;
  }

  async updateTask(
    taskId: string,
    updates: any
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await axiosInstance.patch<any>(
        `/api/v1/tasks/${taskId}`,
        updates
      );
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating task:", error);
      return { success: false };
    }
  }

  // Methodology API Methods
  async getMethodologyData(
    projectId: string,
    methodology: string
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/v1/projects/${projectId}/methodology/${methodology}`
      );
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching methodology data:", error);
      return { success: false };
    }
  }

  // Time Tracking API Methods
  async getTimeEntries(params: {
    projectId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ success: boolean; data?: any[] }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.projectId) searchParams.append("project_id", params.projectId);
      if (params.userId) searchParams.append("user_id", params.userId);
      if (params.startDate) searchParams.append("start_date", params.startDate);
      if (params.endDate) searchParams.append("end_date", params.endDate);
      if (params.limit) searchParams.append("limit", params.limit.toString());

      const queryString = searchParams.toString();
      const endpoint = `/api/v1/time-entries${queryString ? `?${queryString}` : ""
        }`;
      const response = await axiosInstance.get<any[]>(endpoint);
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching time entries:", error);
      return { success: false };
    }
  }

  async getTimeTrackingSummary(params: {
    projectId?: string;
    userId?: string;
    period?: string;
  }): Promise<{ success: boolean; data?: any }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.projectId) searchParams.append("project_id", params.projectId);
      if (params.userId) searchParams.append("user_id", params.userId);
      if (params.period) searchParams.append("period", params.period);

      const queryString = searchParams.toString();
      const endpoint = `/api/v1/time-tracking/summary${queryString ? `?${queryString}` : ""
        }`;
      const response = await axiosInstance.get<any>(endpoint);
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching time tracking summary:", error);
      return { success: false };
    }
  }

  async getActiveTimer(
    userId?: string
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const endpoint = userId
        ? `/api/v1/time-tracking/active?user_id=${userId}`
        : "/api/v1/time-tracking/active";
      const response = await axiosInstance.get<any>(endpoint);
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching active timer:", error);
      return { success: false };
    }
  }

  async startTimer(params: {
    taskId?: string;
    projectId?: string;
    userId: string;
    description: string;
    category: string;
  }): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await axiosInstance.post<any>(
        "/api/v1/time-tracking/start",
        params
      );
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error starting timer:", error);
      return { success: false };
    }
  }

  async stopTimer(timerId: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await axiosInstance.patch<any>(
        `/api/v1/time-tracking/${timerId}/stop`
      );
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error stopping timer:", error);
      return { success: false };
    }
  }

  async createTimeEntry(entry: any): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await axiosInstance.post<any>(
        "/api/v1/time-entries",
        entry
      );
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error creating time entry:", error);
      return { success: false };
    }
  }

  async updateTimeEntry(
    entryId: string,
    updates: any
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await axiosInstance.patch<any>(
        `/api/v1/time-entries/${entryId}`
      );
      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating time entry:", error);
      return { success: false };
    }
  }

  async deleteTimeEntry(entryId: string): Promise<{ success: boolean }> {
    try {
      await axiosInstance.delete<any>(`/api/v1/time-entries/${entryId}`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting time entry:", error);
      return { success: false };
    }
  }
}

export const projectApiService = new ProjectApiService();
