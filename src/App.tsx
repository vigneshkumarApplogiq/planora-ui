import { useState, useEffect, useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "./router/AppRouter";
import { toast } from "sonner";
import { authApiService } from "./services/authApi";
import logoImage from "figma:asset/6748e9361ee0546a59b88c4fb2d8d612f9260020.png";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authApiService.isAuthenticated()) {
          const userProfile = authApiService.getUserProfile();
          if (userProfile) {
            // Transform stored profile to match expected format
            const transformedUser = {
              id: userProfile.id,
              email: userProfile.email,
              name: userProfile.name,
              role: userProfile.role_id.startsWith("role_")
                ? userProfile.role_id.replace("role_", "")
                : userProfile.role_id,
              user_profile:
                userProfile.user_profile || "/public/user-profile/default.png",
              lastLogin: userProfile.last_login,
              status: userProfile.is_active ? "active" : "inactive",
              department: userProfile.department,
              phone: userProfile.phone,
              skills: userProfile.skills,
              timezone: userProfile.timezone,
              created_at: userProfile.created_at,
              updated_at: userProfile.updated_at,
            };
            setUser(transformedUser);
          } else {
            // Try to fetch current user profile if token exists but no cached profile
            const currentUser = await authApiService.getCurrentUser();
            const transformedUser = {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name,
              role: currentUser.role_id.startsWith("role_")
                ? currentUser.role_id.replace("role_", "")
                : currentUser.role_id,
              avatar:
                currentUser.avatar ||
                currentUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join(""),
              lastLogin: currentUser.last_login,
              status: currentUser.is_active ? "active" : "inactive",
              department: currentUser.department,
              phone: currentUser.phone,
              skills: currentUser.skills,
              timezone: currentUser.timezone,
              created_at: currentUser.created_at,
              updated_at: currentUser.updated_at,
            };
            authApiService.setUserProfile(currentUser);
            setUser(transformedUser);
          }
        }
      } catch (error) {
        authApiService.clearTokens();
        authApiService.clearUserProfile();
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await authApiService.logout();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      // Clear local state even if API call fails
      authApiService.clearTokens();
      authApiService.clearUserProfile();
      setUser(null);
      toast.success("Logged out successfully");
    }
  };

  // Create the router with current user state - recreate when user changes
  const router = useMemo(() => {
    return createAppRouter(user, handleLogin, handleLogout);
  }, [user]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={logoImage}
              alt="Planora Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-bold text-[#28A745]">Planora</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28A745] mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider key={user?.id || "no-user"} router={router} />;
}
