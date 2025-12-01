import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Separator } from "../../../components/ui/separator";
import { Switch } from "../../../components/ui/switch";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Settings,
  Activity,
  UserPlus,
  Lock,
  Unlock,
  X,
} from "lucide-react";
import { userRoles } from "../../Login/Auth";
import { toast } from "sonner";
import {
  User,
  CreateUserRequest,
  userApiService,
} from "../../../services/userApi";
import { authApiService } from "../../../services/authApi";
import {
  getProfilePictureUrl,
  getUserInitials,
} from "../../../utils/profileUtils";
import { RootState, AppDispatch } from "../../../store";
import { fetchUserSummary } from "../../../store/slices/userSlice";
import { masterApiService, Department } from "../../../services/masterApi";

// Initial empty users array - will be populated from API
const initialUsers: User[] = [];

// Mock audit logs
const auditLogs: any = [];

export function UserManagement() {
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const dispatch = useDispatch<AppDispatch>();
  const { summary, summaryLoading } = useSelector(
    (state: RootState) => state.users
  );
  const isMountedRef = useRef(false);

  // Component mount/unmount tracking
  useEffect(() => {
    return () => {};
  }, []);

  // Fetch departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await masterApiService.getDepartments();
        setDepartments(depts);
      } catch (error) {
        toast.error("Failed to load departments");
      }
    };

    loadDepartments();
  }, []);

  // Check if current user has permission to edit users
  const getCurrentUserPermissions = () => {
    try {
      const currentUser = authApiService.getUserProfile();

      if (!currentUser) return { canEdit: false, canCreate: false };

      // Get role permissions from userRoles
      const roleKey = currentUser.role_id?.replace("role_", "") || "";
      const userRole = userRoles[roleKey as keyof typeof userRoles];

      if (!userRole) return { canEdit: false, canCreate: false };

      // Check if user has all permissions or specific user management permissions
      const hasAllPermissions = userRole.permissions.includes("*");
      const canEditUsers =
        hasAllPermissions ||
        userRole.permissions.includes("users:write") ||
        userRole.permissions.includes("users:*");
      const canCreateUsers =
        hasAllPermissions ||
        userRole.permissions.includes("users:write") ||
        userRole.permissions.includes("users:*");

      return {
        canEdit: canEditUsers,
        canCreate: canCreateUsers,
        role: userRole.name,
      };
    } catch (error) {
      return { canEdit: false, canCreate: false };
    }
  };

  const userPermissions = getCurrentUserPermissions();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    name: "",
    email: "",
    role_id: "role_developer",
    user_profile: "",
    user_profile_file: undefined,
    is_active: true,
    department: "",
    skills: [],
    phone: "",
    timezone: "UTC",
    password: "",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editUserProfileFile, setEditUserProfileFile] = useState<File | null>(
    null
  );

  // Department and skill management states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [editNewSkill, setEditNewSkill] = useState("");

  // Validation states
  const [createUserErrors, setCreateUserErrors] = useState({
    email: "",
    phone: "",
    user_profile_file: "",
  });
  const [editUserErrors, setEditUserErrors] = useState({
    email: "",
    phone: "",
  });

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (phone: string): string => {
    if (!phone) return ""; // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return "Please enter a valid phone number";
    }
    return "";
  };

  const validateUserProfileFile = (file: File | undefined): string => {
    if (!file) return ""; // File is optional

    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a JPEG or PNG image file";
    }

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return "File size must be less than 2MB";
    }

    return "";
  };

  const validateCreateUserForm = (): boolean => {
    const emailError = validateEmail(newUser.email);
    const phoneError = validatePhone(newUser.phone);
    const userProfileFileError = validateUserProfileFile(
      newUser.user_profile_file
    );

    setCreateUserErrors({
      email: emailError,
      phone: phoneError,
      user_profile_file: userProfileFileError,
    });

    return !emailError && !phoneError && !userProfileFileError;
  };

  // Handle user profile file selection
  const handleUserProfileFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      // Validate file immediately
      const error = validateUserProfileFile(file);
      setCreateUserErrors({ ...createUserErrors, user_profile_file: error });

      if (!error) {
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Update user state
        setNewUser({ ...newUser, user_profile_file: file });
      } else {
        // Clear preview and file if validation fails
        setAvatarPreview(null);
        setNewUser({ ...newUser, user_profile_file: undefined });
      }
    } else {
      // Clear preview and file if no file selected
      setAvatarPreview(null);
      setNewUser({ ...newUser, user_profile_file: undefined });
      setCreateUserErrors({ ...createUserErrors, user_profile_file: "" });
    }
  };

  const validateEditUserForm = (): boolean => {
    if (!editingUser) return false;

    const emailError = validateEmail(editingUser.email);
    const phoneError = validatePhone(editingUser.phone);

    setEditUserErrors({
      email: emailError,
      phone: phoneError,
    });

    return !emailError && !phoneError;
  };

  // Skill management functions
  const handleAddSkill = () => {
    const skillToAdd = newSkill.trim();
    if (skillToAdd && !newUser.skills.includes(skillToAdd)) {
      setNewUser((prev) => ({
        ...prev,
        skills: [...prev.skills, skillToAdd],
      }));
      setNewSkill("");
    } else if (newUser.skills.includes(skillToAdd)) {
      toast.error("Skill already added");
    } else if (!skillToAdd) {
      toast.error("Please enter a skill name");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setNewUser((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleAddEditSkill = () => {
    if (!editingUser) return;

    const skillToAdd = editNewSkill.trim();
    if (skillToAdd && !editingUser.skills.includes(skillToAdd)) {
      setEditingUser((prev) =>
        prev
          ? {
              ...prev,
              skills: [...prev.skills, skillToAdd],
            }
          : null
      );
      setEditNewSkill("");
    } else if (editingUser.skills.includes(skillToAdd)) {
      toast.error("Skill already added");
    } else if (!skillToAdd) {
      toast.error("Please enter a skill name");
    }
  };

  const handleRemoveEditSkill = (skill: string) => {
    if (!editingUser) return;

    setEditingUser((prev) =>
      prev
        ? {
            ...prev,
            skills: prev.skills.filter((s) => s !== skill),
          }
        : null
    );
  };

  // Fetch users function
  const fetchUsers = async (
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      role_id?: string;
    } = {}
  ) => {
    setLoading(true);
    try {
      const response = await userApiService.getUsers({
        page: params.page || pagination.page,
        per_page: params.per_page || pagination.per_page,
        search:
          params.search !== undefined ? params.search : searchTerm || undefined,
        role_id:
          params.role_id !== undefined
            ? params.role_id
            : selectedRole !== "all"
            ? `role_${selectedRole}`
            : undefined,
      });

      setUsers(response.items || []);
      setPagination({
        page: response.page,
        per_page: response.per_page,
        total: response.total,
        total_pages: response.total_pages,
        has_next: response.has_next,
        has_prev: response.has_prev,
      });
    } catch (error) {
      toast.error("Failed to load users");
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount - only runs once
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      try {
        const response = await userApiService.getUsers({
          page: 1,
          per_page: 10,
        });
        setUsers(response.items || []);
        setPagination({
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          total_pages: response.total_pages,
          has_next: response.has_next,
          has_prev: response.has_prev,
        });

        // Fetch summary
        dispatch(fetchUserSummary());
        isMountedRef.current = true;
      } catch (error) {
        toast.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, [dispatch]);

  // Debounced search effect - only run after component is mounted and when values actually change
  useEffect(() => {
    // Skip initial render
    if (!isMountedRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await userApiService.getUsers({
          page: 1,
          per_page: pagination.per_page,
          search: searchTerm || undefined,
          role_id: selectedRole !== "all" ? `role_${selectedRole}` : undefined,
        });

        setUsers(response.items || []);
        setPagination({
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          total_pages: response.total_pages,
          has_next: response.has_next,
          has_prev: response.has_prev,
        });
      } catch (error) {
        toast.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole]);

  // Since we're doing server-side filtering, we don't need client-side filtering
  const filteredUsers = Array.isArray(users) ? users : [];

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    fetchUsers({
      page: newPage,
      search: searchTerm || undefined,
      role_id: selectedRole !== "all" ? `role_${selectedRole}` : undefined,
    });
  };

  const handlePerPageChange = (perPage: number) => {
    fetchUsers({
      page: 1,
      per_page: perPage,
      search: searchTerm || undefined,
      role_id: selectedRole !== "all" ? `role_${selectedRole}` : undefined,
    });
  };

  const filteredAuditLogs = auditLogs.slice(0, 10); // Show recent logs

  const handleCreateUser = async () => {
    // Validate form before submission
    if (!validateCreateUserForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      const userData: CreateUserRequest = {
        ...newUser,
        user_profile: newUser.user_profile || "",
      };

      await userApiService.createUser(userData);

      // Refresh the users list and summary
      await fetchUsers();

      setNewUser({
        name: "",
        email: "",
        role_id: "role_developer",
        user_profile: "",
        user_profile_file: undefined,
        is_active: true,
        department: "",
        skills: [],
        phone: "",
        timezone: "UTC",
        password: "",
      });
      setCreateUserErrors({ email: "", phone: "", user_profile_file: "" });
      setAvatarPreview(null);
      setShowCreateUser(false);

      toast.success("User created successfully");
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    // Validate form before submission
    if (!validateEditUserForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      // Only include user_profile in updateData if there's a file upload
      const updateData: Partial<User> = {
        name: editingUser.name,
        email: editingUser.email,
        role_id: editingUser.role_id,
        is_active: editingUser.is_active,
        department: editingUser.department,
        skills: editingUser.skills,
        phone: editingUser.phone,
        timezone: editingUser.timezone,
      };

      // Only add user_profile if there's no file being uploaded
      // (if file is uploaded, it will be handled separately)
      if (!editUserProfileFile) {
        // Don't include user_profile at all - let backend keep existing image
      }

      await userApiService.updateUser(
        editingUser.id,
        updateData,
        editUserProfileFile || undefined
      );

      // Refresh the users list
      await fetchUsers();

      setEditingUser(null);
      setEditUserErrors({ email: "", phone: "" });
      setEditUserProfileFile(null);
      setShowEditUser(false);

      toast.success("User updated successfully");
    } catch (error: any) {
      // Check for specific authorization errors
      if (
        error.message?.includes("Authentication failed") ||
        error.message?.includes("401") ||
        error.message?.includes("403")
      ) {
        toast.error(
          "You do not have permission to edit users. Please contact your administrator."
        );
      } else if (error.message?.includes("Network")) {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        toast.error(
          `Failed to update user: ${error.message || "Unknown error"}`
        );
      }
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      await userApiService.toggleUserStatus(userId, !user.is_active);

      // Refresh the users list
      await fetchUsers();

      toast.success("User status updated");
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.active_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Users
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.inactive_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">Disabled accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_roles || 0}
            </div>
            <p className="text-xs text-muted-foreground">System roles</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center justify-end space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground min-w-[150px]"
            >
              <option value="all">All Roles</option>
              {Object.entries(userRoles).map(([key, role]) => (
                <option key={key} value={key}>
                  {role.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => {
                setShowCreateUser(true);
                setCreateUserErrors({
                  email: "",
                  phone: "",
                  user_profile_file: "",
                });
              }}
              disabled={!userPermissions.canCreate}
              className="bg-[#28A745] hover:bg-[#218838]"
              title={
                !userPermissions.canCreate
                  ? `You don't have permission to Add users. Current role: ${
                      userPermissions.role || "Unknown"
                    }`
                  : "Add new user"
              }
            >
              <UserPlus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>System Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={getProfilePictureUrl(user.user_profile)}
                              alt={user.name}
                            />
                            <AvatarFallback className="bg-[#28A745] text-white text-xs">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <Badge variant="outline" className="text-xs">
                            {user.role?.name || user.role_id || "Unknown"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            user.is_active
                              ? "bg-green-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>
                            {user.last_login
                              ? formatDate(user.last_login)
                              : "Never"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setEditUserErrors({ email: "", phone: "" });
                              setEditUserProfileFile(null);
                              setShowEditUser(true);
                            }}
                            className="h-8 w-8 p-0"
                            disabled={!userPermissions.canEdit}
                            title={
                              !userPermissions.canEdit
                                ? `You don't have permission to edit users. Current role: ${
                                    userPermissions.role || "Unknown"
                                  }`
                                : "Edit user"
                            }
                          >
                            <Edit
                              className={`h-4 w-4 ${
                                userPermissions.canEdit
                                  ? "text-blue-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id)}
                            className="h-8 w-8 p-0"
                            title={
                              user.is_active
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            {user.is_active ? (
                              <Lock className="h-4 w-4 text-red-500" />
                            ) : (
                              <Unlock className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowPermissionDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="View permissions"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {pagination.total > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.per_page + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.per_page,
                      pagination.total
                    )}{" "}
                    of {pagination.total} users
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Rows per page</span>
                      <select
                        value={pagination.per_page}
                        onChange={(e) =>
                          handlePerPageChange(Number(e.target.value))
                        }
                        className="px-3 py-1 border border-border rounded bg-background text-foreground text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Page {pagination.page} of {pagination.total_pages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(1)}
                        disabled={!pagination.has_prev || loading}
                      >
                        <span className="sr-only">Go to first page</span>
                        ⟨⟨
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.has_prev || loading}
                      >
                        <span className="sr-only">Go to previous page</span>⟨
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.has_next || loading}
                      >
                        <span className="sr-only">Go to next page</span>⟩
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(pagination.total_pages)}
                        disabled={!pagination.has_next || loading}
                      >
                        <span className="sr-only">Go to last page</span>
                        ⟩⟩
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Permissions Matrix</span>
              </CardTitle>
              <CardDescription>
                Configure permissions for each role in the system
                {summaryLoading && (
                  <span className="text-blue-500">
                    {" "}
                    (Loading user counts...)
                  </span>
                )}
                {!summary && !summaryLoading && (
                  <span className="text-red-500">
                    {" "}
                    (Unable to load user counts)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(userRoles).map(([roleKey, role]) => {
                // Create a mapping between API role names and local role names
                const getRoleCount = (roleName: string) => {
                  const apiRoleMapping: { [key: string]: string[] } = {
                    "Super Admin": ["super_admin", "Super Admin"],
                    Administrator: ["admin", "Administrator"],
                    "Project Manager": ["project_manager", "Project Manager"],
                    Developer: ["developer", "Developer"],
                    Tester: ["tester", "Tester"],
                    Client: ["client", "Client"],
                  };

                  // Find matching role from API response
                  for (const [apiRole, localRoles] of Object.entries(
                    apiRoleMapping
                  )) {
                    if (
                      localRoles.includes(roleKey) ||
                      localRoles.includes(roleName)
                    ) {
                      const found = summary?.role_counts.find(
                        (rc) => rc.role_name === apiRole
                      );
                      if (found) return found.count;
                    }
                  }

                  // Fallback: try direct match with role name
                  const directMatch = summary?.role_counts.find(
                    (rc) =>
                      rc.role_name.toLowerCase() === roleName.toLowerCase() ||
                      rc.role_name.toLowerCase() === roleKey.toLowerCase()
                  );

                  return directMatch?.count || 0;
                };

                const roleCount = getRoleCount(role.name);

                return (
                  <div key={roleKey} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={`${role.color} text-white`}>
                          {role.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {roleCount} user{roleCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="pl-4 space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {role.permissions.includes("*") ? (
                          <Badge variant="outline" className="text-xs">
                            All Permissions
                          </Badge>
                        ) : (
                          role.permissions.map((permission) => (
                            <Badge
                              key={permission}
                              variant="outline"
                              className="text-xs"
                            >
                              {permission}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <Separator />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* User Permission Dialog */}
      <Dialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Permissions</DialogTitle>
            <DialogDescription>
              Manage permissions for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={getProfilePictureUrl(selectedUser.user_profile)}
                    alt={selectedUser.name}
                  />
                  <AvatarFallback className="bg-[#28A745] text-white">
                    {getUserInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                  <Badge
                    className={`text-xs ${
                      userRoles[
                        selectedUser.role?.name as keyof typeof userRoles
                      ]?.color
                    } text-white`}
                  >
                    {selectedUser.role?.name}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Current Permissions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {userRoles[
                    selectedUser.role?.name as keyof typeof userRoles
                  ]?.permissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center justify-between p-2 bg-muted/10 rounded"
                    >
                      <span className="text-sm">{permission}</span>
                      <Switch checked={true} disabled />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with their details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => {
                  setNewUser({ ...newUser, email: e.target.value });
                  // Clear error when user starts typing
                  if (createUserErrors.email) {
                    setCreateUserErrors({ ...createUserErrors, email: "" });
                  }
                }}
                onBlur={() => {
                  const emailError = validateEmail(newUser.email);
                  setCreateUserErrors({
                    ...createUserErrors,
                    email: emailError,
                  });
                }}
                placeholder="john@company.com"
                className={createUserErrors.email ? "border-red-500" : ""}
              />
              {createUserErrors.email && (
                <p className="text-sm text-red-500">{createUserErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => {
                  setNewUser({ ...newUser, phone: e.target.value });
                  // Clear error when user starts typing
                  if (createUserErrors.phone) {
                    setCreateUserErrors({ ...createUserErrors, phone: "" });
                  }
                }}
                onBlur={() => {
                  const phoneError = validatePhone(newUser.phone);
                  setCreateUserErrors({
                    ...createUserErrors,
                    phone: phoneError,
                  });
                }}
                placeholder="+1 (555) 123-4567"
                className={createUserErrors.phone ? "border-red-500" : ""}
              />
              {createUserErrors.phone && (
                <p className="text-sm text-red-500">{createUserErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={newUser.department}
                onChange={(e) =>
                  setNewUser({ ...newUser, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={newUser.timezone}
                onChange={(e) =>
                  setNewUser({ ...newUser, timezone: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={newUser.role_id}
                onChange={(e) =>
                  setNewUser({ ...newUser, role_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                {Object.entries(userRoles).map(([key, role]) => (
                  <option key={key} value={`role_${key}`}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_profile">Profile Picture</Label>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <Input
                    id="user_profile"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleUserProfileFileChange}
                    className={
                      createUserErrors.user_profile_file ? "border-red-500" : ""
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a JPEG or PNG image (max 2MB)
                  </p>
                  {createUserErrors.user_profile_file && (
                    <p className="text-sm text-red-500 mt-1">
                      {createUserErrors.user_profile_file}
                    </p>
                  )}
                </div>
                {avatarPreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4 md:col-span-2">
              <Label className="text-base font-medium">Skills</Label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-4">
                  {/* Current skills display */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Added Skills
                    </h4>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      {newUser.skills?.length > 0 ? (
                        newUser.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            <span className="text-sm">{skill}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-red-500 hover:text-white rounded-full"
                              onClick={() => handleRemoveSkill(skill)}
                              title="Remove skill"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No skills added yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add new skill */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Add Skills
                    </h4>
                    <div className="flex space-x-3">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Type a skill and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddSkill}
                        variant="outline"
                        size="default"
                        disabled={!newSkill.trim()}
                        className="bg-[#28A745] text-white hover:bg-[#218838] border-[#28A745]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                type="checkbox"
                id="is_active"
                checked={newUser.is_active}
                onChange={(e) =>
                  setNewUser({ ...newUser, is_active: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="is_active">User is active</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUser.name || !newUser.email || !newUser.password}
            >
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => {
                    setEditingUser({ ...editingUser, email: e.target.value });
                    // Clear error when user starts typing
                    if (editUserErrors.email) {
                      setEditUserErrors({ ...editUserErrors, email: "" });
                    }
                  }}
                  onBlur={() => {
                    const emailError = validateEmail(editingUser.email);
                    setEditUserErrors({ ...editUserErrors, email: emailError });
                  }}
                  placeholder="john@company.com"
                  className={editUserErrors.email ? "border-red-500" : ""}
                />
                {editUserErrors.email && (
                  <p className="text-sm text-red-500">{editUserErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingUser.phone}
                  onChange={(e) => {
                    setEditingUser({ ...editingUser, phone: e.target.value });
                    // Clear error when user starts typing
                    if (editUserErrors.phone) {
                      setEditUserErrors({ ...editUserErrors, phone: "" });
                    }
                  }}
                  onBlur={() => {
                    const phoneError = validatePhone(editingUser.phone);
                    setEditUserErrors({ ...editUserErrors, phone: phoneError });
                  }}
                  placeholder="+1 (555) 123-4567"
                  className={editUserErrors.phone ? "border-red-500" : ""}
                />
                {editUserErrors.phone && (
                  <p className="text-sm text-red-500">{editUserErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <select
                  id="edit-department"
                  value={editingUser.department}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      department: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-timezone">Timezone</Label>
                <select
                  id="edit-timezone"
                  value={editingUser.timezone}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <select
                  id="edit-role"
                  value={editingUser.role_id}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  {Object.entries(userRoles).map(([key, role]) => (
                    <option key={key} value={`role_${key}`}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-4 md:col-span-2">
                <Label className="text-base font-medium">Profile Picture</Label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current profile picture display */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Current Picture
                      </h4>
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-20 h-20 border-2 border-gray-200">
                          <AvatarImage
                            src={getProfilePictureUrl(editingUser.user_profile)}
                            alt={editingUser.name}
                          />
                          <AvatarFallback className="bg-[#28A745] text-white text-xl">
                            {getUserInitials(editingUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 break-all">
                            {editingUser.user_profile
                              ? editingUser.user_profile.split("/").pop()
                              : "Default image"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Upload new image option */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Upload New Picture
                      </h4>
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                          <Input
                            id="edit-user_profile_file"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setEditUserProfileFile(file || null);
                            }}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#28A745] file:text-white hover:file:bg-[#218838]"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Supported formats: JPEG, PNG • Max size: 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 md:col-span-2">
                <Label className="text-base font-medium">Skills</Label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-4">
                    {/* Current skills display */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Current Skills
                      </h4>
                      <div className="flex flex-wrap gap-2 min-h-[40px]">
                        {editingUser.skills?.length > 0 ? (
                          editingUser.skills?.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            >
                              <span className="text-sm">{skill}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-red-500 hover:text-white rounded-full"
                                onClick={() => handleRemoveEditSkill(skill)}
                                title="Remove skill"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No skills added yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Add new skill */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Add New Skill
                      </h4>
                      <div className="flex space-x-3">
                        <Input
                          value={editNewSkill}
                          onChange={(e) => setEditNewSkill(e.target.value)}
                          placeholder="Type a skill and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddEditSkill();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAddEditSkill}
                          variant="outline"
                          size="default"
                          disabled={!editNewSkill.trim()}
                          className="bg-[#28A745] text-white hover:bg-[#218838] border-[#28A745]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="edit-is_active"
                  checked={editingUser.is_active}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      is_active: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="edit-is_active">User is active</Label>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditUser(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={!editingUser?.name || !editingUser?.email}
            >
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
