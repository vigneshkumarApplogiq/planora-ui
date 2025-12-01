export interface Role {
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string | null;
}

export interface User {
  email: string;
  name: string;
  avatar: string;
  role_id: string;
  user_profile: string;
  is_active: boolean;
  department: string;
  skills: string[];
  phone: string;
  timezone: string;
  id: string;
  last_login: string;
  created_at: string;
  updated_at: string | null;
  role: Role;
}

export interface UsersResponse {
  items?: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UsersQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  role_id?: string;
  is_active?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role_id: string;
  user_profile: string | File;
  is_active: boolean;
  department: string;
  skills: string[];
  phone: string;
  timezone: string;
  password: string;
  user_profile_file?: File;
}

export interface RoleCount {
  role_name: string;
  count: number;
}

export interface UserSummary {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_roles: number;
  role_counts: RoleCount[];
}

import axiosInstance from "../config/api";

export class UserApiService {
  async getUsers(params: UsersQueryParams = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined)
      searchParams.append("page", params.page.toString());
    if (params.per_page !== undefined)
      searchParams.append("per_page", params.per_page.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.role_id) searchParams.append("role_id", params.role_id);
    if (params.is_active !== undefined)
      searchParams.append("is_active", params.is_active.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/users/${queryString ? `?${queryString}` : ""}`;

    try {
      const response = await axiosInstance.get<UsersResponse>(endpoint);

      // Ensure the response has the expected structure
      if (response && Array.isArray(response?.data?.items)) {
        return response?.data;
      }

      // If the response doesn't have the expected structure, transform it
      console.warn(
        "[UserAPI] Response does not have expected structure, transforming..."
      );
      return {
        items: Array.isArray(response) ? (response as unknown as User[]) : [],
        total: Array.isArray(response)
          ? (response as unknown as User[]).length
          : 0,
        page: params.page || 1,
        per_page: params.per_page || 10,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      };
    } catch (error) {
      // If 403 error, it means user doesn't have permission - this is expected for non-admin users
      if (error instanceof Error && error.message.includes("403")) {
        console.warn(
          "⚠️ [UserAPI] User does not have permission to access users list. This is expected for non-admin users."
        );
        // Return empty response instead of throwing
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
      throw error;
    }
  }

  // Alternative method for getting team members (project-specific, doesn't require admin permissions)
  async getProjectTeamMembers(projectId: string): Promise<User[]> {
    try {
      const response = await axiosInstance.get<{ members: User[] }>(
        `/api/v1/projects/${projectId}/members`
      );
      return response?.data?.members || [];
    } catch (error) {
      console.error(
        "❌ [UserAPI] Failed to fetch project team members:",
        error
      );
      return [];
    }
  }

  // Get current user's info (doesn't require admin permissions)
  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get<User>("/api/v1/users/me");
    return response.data;
  }

  // Original getUsers method (keeping for backward compatibility)
  private async getUsersOriginal(
    params: UsersQueryParams = {}
  ): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined)
      searchParams.append("page", params.page.toString());
    if (params.per_page !== undefined)
      searchParams.append("per_page", params.per_page.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.role_id) searchParams.append("role_id", params.role_id);
    if (params.is_active !== undefined)
      searchParams.append("is_active", params.is_active.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/users/${queryString ? `?${queryString}` : ""}`;

    const response = await axiosInstance.get<UsersResponse>(endpoint);

    // Ensure the response has the expected structure
    if (response && Array.isArray(response?.data?.items)) {
      return response.data;
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

  async getUserById(id: string): Promise<User> {
    const response = await axiosInstance.get<User>(`/api/v1/users/${id}`);
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const formData = new FormData();

    // Add all user fields to FormData
    formData.append("name", userData.name);
    formData.append("email", userData.email);
    formData.append("role_id", userData.role_id);
    formData.append("is_active", userData.is_active.toString());
    formData.append("department", userData.department);
    formData.append("phone", userData.phone);
    formData.append("timezone", userData.timezone);
    formData.append("password", userData.password);

    // Add skills as JSON string or individual items
    if (userData.skills && userData.skills.length > 0) {
      formData.append("skills", JSON.stringify(userData.skills));
    }

    // Add user_profile - handles both file upload and URL string
    if (userData.user_profile_file) {
      formData.append("user_profile", userData.user_profile_file);
    } else if (userData.user_profile) {
      formData.append("user_profile", userData.user_profile);
    }

    const response = await axiosInstance.post<User>(
      "/api/v1/users/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  async updateUser(
    id: string,
    userData: Partial<User>,
    userProfileFile?: File
  ): Promise<User> {
    // Always use FormData for consistency and to ensure all fields are handled properly
    const formData = new FormData();

    // Add user fields to FormData - explicitly handle all fields
    if (userData.name !== undefined) formData.append("name", userData.name);
    if (userData.email !== undefined) formData.append("email", userData.email);
    if (userData.role_id !== undefined)
      formData.append("role_id", userData.role_id);
    if (userData.is_active !== undefined) {
      formData.append("is_active", userData.is_active.toString());
    }
    if (userData.department !== undefined)
      formData.append("department", userData.department || "");
    if (userData.phone !== undefined)
      formData.append("phone", userData.phone || "");
    if (userData.timezone !== undefined)
      formData.append("timezone", userData.timezone);

    // Add skills if provided
    if (userData.skills !== undefined) {
      formData.append("skills", JSON.stringify(userData.skills));
    }

    // Add the profile picture file only if provided
    if (userProfileFile) {
      formData.append("user_profile", userProfileFile);
    }
    // Note: Don't send user_profile string unless there's an actual file upload

    const response = await axiosInstance.put<User>(
      `/api/v1/users/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    const response = await axiosInstance.delete<void>(`/api/v1/users/${id}`);
    return response.data;
  }

  async toggleUserStatus(id: string, is_active: boolean): Promise<User> {
    const response = await axiosInstance.patch<User>(
      `/api/v1/users/${id}`,
      { is_active },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  async getUserSummary(): Promise<UserSummary> {
    const response = await axiosInstance.get<UserSummary>(
      "/api/v1/users/summary"
    );
    return response.data;
  }

  async getTeamMembers(params: UsersQueryParams = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined)
      searchParams.append("page", params.page.toString());
    if (params.per_page !== undefined)
      searchParams.append("per_page", params.per_page.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.role_id) searchParams.append("role_id", params.role_id);
    if (params.is_active !== undefined)
      searchParams.append("is_active", params.is_active.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/users/team-members/${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await axiosInstance.get<UsersResponse>(endpoint);

    // Ensure the response has the expected structure
    if (response && Array.isArray(response?.data?.items)) {
      return response?.data;
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
}

export const userApiService = new UserApiService();
