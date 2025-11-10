import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Heart,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import logoImage from "figma:asset/6748e9361ee0546a59b88c4fb2d8d612f9260020.png";
import { authApiService } from "../../services/authApi";
import { APP_VERSION } from "../../config/api";

interface AuthProps {
  onLogin: (user: any) => void;
}

// Mock user roles and permissions
const userRoles = {
  super_admin: {
    name: "Super Admin",
    permissions: ["*"], // All permissions
    color: "bg-red-500",
    description: "Full system access and management",
  },
  admin: {
    name: "Admin",
    permissions: [
      "users:read",
      "users:write",
      "projects:*",
      "tasks:*",
      "reports:read",
    ],
    color: "bg-purple-500",
    description: "Administrative access to most features",
  },
  project_manager: {
    name: "Project Manager",
    permissions: ["projects:*", "tasks:*", "reports:read", "customers:read"],
    color: "bg-blue-500",
    description: "Manage projects, tasks, and view reports",
  },
  developer: {
    name: "Developer",
    permissions: ["tasks:read", "tasks:write", "projects:read"],
    color: "bg-green-500",
    description: "Access to assigned tasks and project details",
  },
  tester: {
    name: "Tester",
    permissions: ["tasks:read", "tasks:write", "projects:read", "reports:read"],
    color: "bg-yellow-500",
    description: "Test and quality assurance access",
  },
  client: {
    name: "Client",
    permissions: ["projects:read", "tasks:read"],
    color: "bg-orange-500",
    description: "View project progress and milestones",
  },
};

export function Auth({ onLogin }: AuthProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API authentication
      const loginResponse = await authApiService.login({
        email: formData.email,
        password: formData.password,
      });

      // Store tokens
      authApiService.setTokens(loginResponse);

      // Get user profile
      const userProfile = await authApiService.getCurrentUser();

      // Transform user profile to match expected format
      const user = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role_id.startsWith("role_")
          ? userProfile.role_id.replace("role_", "")
          : userProfile.role_id,
        avatar:
          userProfile.avatar ||
          userProfile.name
            .split(" ")
            .map((n) => n[0])
            .join(""),
        lastLogin: userProfile.last_login,
        status: userProfile.is_active ? "active" : "inactive",
        department: userProfile.department,
        phone: userProfile.phone,
        skills: userProfile.skills,
        timezone: userProfile.timezone,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      };

      // Store user profile
      authApiService.setUserProfile(userProfile);

      toast.success(`Welcome back, ${user.name}!`);
      onLogin(user);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password reset link would be sent to your email");
  };

  return (
    <div className="min-h-screen h-full flex">
      {/* Left Panel - Branding Section (60%) */}
      <div className="hidden lg:flex w-3/5 relative bg-gradient-to-br from-[#28A745] via-[#20924A] to-[#1E7E34] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-sm"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-white rounded-lg rotate-45"></div>
          <div className="absolute bottom-32 left-20 w-28 h-28 bg-white rounded-full blur-md"></div>
          <div className="absolute bottom-10 right-32 w-20 h-20 bg-white rounded-lg"></div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between p-12 text-white relative z-10">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-8">
              Streamline Your Project Workflow with Planora
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              The comprehensive project management platform that brings teams
              together, tracks progress seamlessly, and delivers results
              efficiently.
            </p>
          </div>

          {/* Bottom Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Complete Project Control
                </h3>
                <p className="text-white/90 leading-relaxed">
                  From project initiation to delivery - manage timelines,
                  resources, budgets, and team collaboration in one powerful
                  platform. Track milestones, monitor progress, and ensure
                  on-time delivery with advanced reporting and analytics.
                </p>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-white/80" />
                <span className="text-sm text-white/80">Team Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-white/80" />
                <span className="text-sm text-white/80">Progress Tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-white/80" />
                <span className="text-sm text-white/80">Secure Platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-white/80" />
                <span className="text-sm text-white/80">Resource Planning</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section (40%) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 py-12 lg:px-12 xl:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <img
                src={logoImage}
                alt="Planora Logo"
                className="w-12 h-12 object-contain"
              />
              <span className="text-2xl font-bold text-[#28A745]">Planora</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Login to your account
            </h1>
            <p className="text-gray-600">
              Welcome back. Please provide your details below.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tenant@planora.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-[#28A745] focus:ring-[#28A745]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pl-10 pr-12 h-12 border-gray-300 focus:border-[#28A745] focus:ring-[#28A745]"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#FF3B3B] hover:text-[#DC3545] font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-[#28A745] hover:bg-[#218838] text-white font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 text-center mb-3">
              Quick Login (Demo):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    email: "manojkumar@planora.com",
                    password: "planora@123",
                  });
                  setTimeout(() => {
                    const form = document.querySelector(
                      "form"
                    ) as HTMLFormElement;
                    form?.requestSubmit();
                  }, 100);
                }}
                className="text-xs"
              >
                Super Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    email: "mohammedyasik@planora.com",
                    password: "planora@123",
                  });
                  setTimeout(() => {
                    const form = document.querySelector(
                      "form"
                    ) as HTMLFormElement;
                    form?.requestSubmit();
                  }, 100);
                }}
                className="text-xs"
              >
                Admin
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    email: "gowtham@planora.com",
                    password: "planora@123",
                  });
                  setTimeout(() => {
                    const form = document.querySelector(
                      "form"
                    ) as HTMLFormElement;
                    form?.requestSubmit();
                  }, 100);
                }}
                className="text-xs"
              >
                Project Manager
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    email: "grace.moore@planora.com",
                    password: "planora@123",
                  });
                  setTimeout(() => {
                    const form = document.querySelector(
                      "form"
                    ) as HTMLFormElement;
                    form?.requestSubmit();
                  }, 100);
                }}
                className="text-xs"
              >
                Developer
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    email: "aaryastrak@planora.com",
                    password: "planora@123",
                  });
                  setTimeout(() => {
                    const form = document.querySelector(
                      "form"
                    ) as HTMLFormElement;
                    form?.requestSubmit();
                  }, 100);
                }}
                className="text-xs"
              >
                QA Tester
              </Button>
            </div>
          </div>

          {/* Version Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">
                Planora Project Management System
              </p>
              <p className="text-xs text-gray-400">
                Version {APP_VERSION.version} • Build: {APP_VERSION.buildDate}
              </p>
              {APP_VERSION.environment !== "production" && (
                <p className="text-xs text-orange-500 font-medium">
                  Environment: {APP_VERSION.environment.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Background for smaller screens */}
      <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-[#28A745]/5 to-[#1E7E34]/5 -z-10"></div>
    </div>
  );
}

// Export user roles and permissions for use in other components
export { userRoles };
