import axiosInstance from "../config/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
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
  last_login: string;
  created_at: string;
  updated_at: string;
}
export class AuthApiService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>(
      "/api/v1/auth/login",
      credentials
    );
    return response.data;
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await axiosInstance.get<UserProfile>("/api/v1/auth/me");
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await axiosInstance.post<void>("/api/v1/auth/logout");
    } catch (error) {
      console.warn("⚠️ [AuthAPI] Logout API call failed:", error);
      // Continue with cleanup even if API call fails
    }
    this.clearTokens();
  }

  // Token management
  setTokens(tokens: LoginResponse): void {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("token_type", tokens.token_type);

    // Verify tokens were saved
    const savedAccessToken = localStorage.getItem("access_token");
    if (!savedAccessToken || savedAccessToken !== tokens.access_token) {
      console.error(
        "❌ [AuthAPI] CRITICAL: Token was NOT saved correctly to localStorage!"
      );
      console.error(
        "❌ [AuthAPI] This could be a browser storage issue or localStorage is disabled"
      );
    }
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.warn(
        "⚠️ [AuthAPI] getAccessToken() called but no token found in localStorage"
      );
    }
    return token;
  }

  getRefreshToken(): string | null {
    const token = localStorage.getItem("refresh_token");
    if (!token) {
      console.warn(
        "⚠️ [AuthAPI] getRefreshToken() called but no token found in localStorage"
      );
    }
    return token;
  }

  getTokenType(): string | null {
    return localStorage.getItem("token_type") || "Bearer";
  }

  clearTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_profile");
    // alert("You have been logged out");
    // window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // User profile storage
  setUserProfile(user: UserProfile): void {
    localStorage.setItem("user_profile", JSON.stringify(user));
  }

  getUserProfile(): UserProfile | null {
    const profile = localStorage.getItem("user_profile");
    return profile ? JSON.parse(profile) : null;
  }

  clearUserProfile(): void {
    localStorage.removeItem("user_profile");
  }
}

export const authApiService = new AuthApiService();
