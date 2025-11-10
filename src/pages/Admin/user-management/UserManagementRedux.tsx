import React, { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  setFilters,
  setPagination,
  clearError,
} from "../../../store/slices/userSlice";
import {
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersFilters,
  selectPaginationInfo,
  selectUsersStats,
} from "../../../store/selectors/userSelectors";
import { User } from "../../../services/userApi";

// Mock role data - this should ideally come from an API
const userRoles = {
  admin: { name: "Admin", color: "bg-red-500", permissions: ["*"] },
  project_manager: {
    name: "Project Manager",
    color: "bg-blue-500",
    permissions: [
      "projects:read",
      "projects:write",
      "tasks:read",
      "tasks:write",
      "users:read",
    ],
  },
  developer: {
    name: "Developer",
    color: "bg-green-500",
    permissions: ["projects:read", "tasks:read", "tasks:write"],
  },
  client: {
    name: "Client",
    color: "bg-purple-500",
    permissions: ["projects:read", "tasks:read"],
  },
};

export function UserManagementRedux() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectUsersLoading);
  const error = useAppSelector(selectUsersError);
  const filters = useAppSelector(selectUsersFilters);
  const paginationInfo = useAppSelector(selectPaginationInfo);
  const stats = useAppSelector(selectUsersStats);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role_id: "developer",
    department: "",
    phone: "",
    timezone: "UTC",
    skills: [],
  });

  useEffect(() => {
    dispatch(
      fetchUsers({
        page: paginationInfo.currentPage,
        per_page: paginationInfo.itemsPerPage,
        search: filters.search || undefined,
        role_id: filters.role_id || undefined,
        is_active: filters.is_active ?? undefined,
      })
    );
  }, [
    dispatch,
    filters,
    paginationInfo.currentPage,
    paginationInfo.itemsPerPage,
  ]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      await dispatch(
        createUser({
          ...newUser,
          avatar: newUser.name
            .split(" ")
            .map((n) => n[0])
            .join(""),
          is_active: true,
        })
      ).unwrap();

      setNewUser({
        name: "",
        email: "",
        role_id: "developer",
        department: "",
        phone: "",
        timezone: "UTC",
        skills: [],
      });
      setShowCreateUser(false);
      toast.success("User created successfully");
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      await dispatch(
        toggleUserStatus({ id: userId, is_active: !currentStatus })
      ).unwrap();
      toast.success("User status updated");
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      await dispatch(
        updateUser({ id: userId, userData: { role_id: newRoleId } })
      ).unwrap();
      toast.success("User role updated");
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleSearchChange = (search: string) => {
    dispatch(setFilters({ search }));
    dispatch(setPagination({ page: 1 })); // Reset to first page
  };

  const handleRoleFilterChange = (role_id: string) => {
    dispatch(setFilters({ role_id: role_id === "all" ? "" : role_id }));
    dispatch(setPagination({ page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    dispatch(setPagination({ page }));
  };

  const handlePerPageChange = (per_page: number) => {
    dispatch(setPagination({ page: 1, per_page })); // Reset to page 1 when changing page size
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500 text-white" : "bg-red-500 text-white";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Inactive</span>
            </div>
            <p className="text-2xl font-bold">{stats.inactive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Roles</span>
            </div>
            <p className="text-2xl font-bold">
              {Object.keys(stats.roleStats).length}
            </p>
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
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filters.role_id || "all"}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Roles</option>
              {Object.entries(userRoles).map(([key, role]) => (
                <option key={key} value={`role_${key}`}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>System Users</span>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#28A745] text-white text-xs">
                              {user.avatar}
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
                        <select
                          value={user.role_id}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="text-xs px-2 py-1 border border-border rounded bg-background"
                        >
                          {Object.entries(userRoles).map(([key, role]) => (
                            <option key={key} value={key}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${getStatusColor(
                            user.is_active
                          )}`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.department || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>{formatDate(user.last_login)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleUserStatus(user.id, user.is_active)
                            }
                            className="h-8 w-8 p-0"
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
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {paginationInfo.totalItems > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {paginationInfo.startItem} to{" "}
                    {paginationInfo.endItem} of {paginationInfo.totalItems}{" "}
                    users
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Rows per page</span>
                      <select
                        value={paginationInfo.itemsPerPage}
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
                      Page {paginationInfo.currentPage} of{" "}
                      {paginationInfo.totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(1)}
                        disabled={!paginationInfo.hasPrevPage || loading}
                      >
                        <span className="sr-only">Go to first page</span>
                        ⟨⟨
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handlePageChange(paginationInfo.currentPage - 1)
                        }
                        disabled={!paginationInfo.hasPrevPage || loading}
                      >
                        <span className="sr-only">Go to previous page</span>⟨
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handlePageChange(paginationInfo.currentPage + 1)
                        }
                        disabled={!paginationInfo.hasNextPage || loading}
                      >
                        <span className="sr-only">Go to next page</span>⟩
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handlePageChange(paginationInfo.totalPages)
                        }
                        disabled={!paginationInfo.hasNextPage || loading}
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
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(userRoles).map(([roleKey, role]) => (
                <div key={roleKey} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${role.color} text-white`}>
                      {role.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stats.roleStats[roleKey] || 0} users
                    </span>
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
              ))}
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
                  <AvatarFallback className="bg-[#28A745] text-white">
                    {selectedUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                  <Badge
                    className={`text-xs ${
                      userRoles[selectedUser.role_id as keyof typeof userRoles]
                        ?.color
                    } text-white`}
                  >
                    {
                      userRoles[selectedUser.role_id as keyof typeof userRoles]
                        ?.name
                    }
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Current Permissions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {userRoles[
                    selectedUser.role_id as keyof typeof userRoles
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
    </div>
  );
}
