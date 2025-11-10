import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Shield,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Key,
  Database,
  Mail,
  Globe,
  Lock,
  UserPlus,
  UserX,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { UserManagement } from "./user-management";

interface AdminProps {
  user?: any;
}

// Mock data for roles
const mockRoles = [
  {
    id: 1,
    name: "Super Admin",
    description: "Full system access and control",
    userCount: 2,
    permissions: [
      "manage_users",
      "manage_roles",
      "manage_settings",
      "view_audit_logs",
      "manage_projects",
    ],
  },
  {
    id: 2,
    name: "Admin",
    description: "Administrative access with some restrictions",
    userCount: 5,
    permissions: ["manage_users", "view_audit_logs", "manage_projects"],
  },
  {
    id: 3,
    name: "Project Manager",
    description: "Manage projects and teams",
    userCount: 12,
    permissions: ["manage_projects", "manage_teams", "view_reports"],
  },
  {
    id: 4,
    name: "Developer",
    description: "Development access to assigned projects",
    userCount: 45,
    permissions: ["view_projects", "manage_tasks", "update_status"],
  },
];

// Mock data for system settings
const systemSettings = [
  {
    category: "General",
    settings: [
      { key: "site_name", label: "Site Name", value: "Planora", type: "text" },
      {
        key: "timezone",
        label: "Default Timezone",
        value: "UTC",
        type: "select",
      },
      {
        key: "maintenance_mode",
        label: "Maintenance Mode",
        value: false,
        type: "boolean",
      },
    ],
  },
  {
    category: "Security",
    settings: [
      {
        key: "require_2fa",
        label: "Require Two-Factor Authentication",
        value: false,
        type: "boolean",
      },
      {
        key: "session_timeout",
        label: "Session Timeout (minutes)",
        value: "30",
        type: "number",
      },
      {
        key: "password_min_length",
        label: "Minimum Password Length",
        value: "8",
        type: "number",
      },
    ],
  },
  {
    category: "Email",
    settings: [
      {
        key: "smtp_host",
        label: "SMTP Host",
        value: "smtp.example.com",
        type: "text",
      },
      { key: "smtp_port", label: "SMTP Port", value: "587", type: "number" },
      {
        key: "email_notifications",
        label: "Enable Email Notifications",
        value: true,
        type: "boolean",
      },
    ],
  },
];

// Mock data for audit logs
const mockAuditLogs = [
  {
    id: 1,
    timestamp: "2025-01-14 10:30:25",
    user: "John Doe (john@example.com)",
    action: "User Login",
    category: "Authentication",
    severity: "info",
    details: "Successful login from Chrome browser",
    ipAddress: "192.168.1.100",
  },
  {
    id: 2,
    timestamp: "2025-01-14 10:15:10",
    user: "Admin User (admin@example.com)",
    action: "Role Updated",
    category: "User Management",
    severity: "warning",
    details: "Updated permissions for Developer role",
    ipAddress: "192.168.1.50",
  },
  {
    id: 3,
    timestamp: "2025-01-14 09:45:30",
    user: "System",
    action: "Configuration Change",
    category: "System Configuration",
    severity: "info",
    details: "Updated SMTP settings",
    ipAddress: "127.0.0.1",
  },
  {
    id: 4,
    timestamp: "2025-01-14 09:30:15",
    user: "Jane Smith (jane@example.com)",
    action: "Failed Login",
    category: "Authentication",
    severity: "critical",
    details: "Multiple failed login attempts detected",
    ipAddress: "203.0.113.42",
  },
  {
    id: 5,
    timestamp: "2025-01-14 09:00:00",
    user: "Admin User (admin@example.com)",
    action: "User Created",
    category: "User Management",
    severity: "info",
    details: "Created new user account for developer@example.com",
    ipAddress: "192.168.1.50",
  },
  {
    id: 6,
    timestamp: "2025-01-13 16:45:22",
    user: "System",
    action: "Backup Completed",
    category: "System Maintenance",
    severity: "info",
    details: "Daily database backup completed successfully",
    ipAddress: "127.0.0.1",
  },
  {
    id: 7,
    timestamp: "2025-01-13 15:20:10",
    user: "Admin User (admin@example.com)",
    action: "Permission Modified",
    category: "Permission Management",
    severity: "warning",
    details: "Modified project access permissions for team lead",
    ipAddress: "192.168.1.50",
  },
  {
    id: 8,
    timestamp: "2025-01-13 14:30:45",
    user: "Project Manager (pm@example.com)",
    action: "Project Created",
    category: "Project Management",
    severity: "info",
    details: "Created new project: E-Commerce Platform",
    ipAddress: "192.168.1.75",
  },
  {
    id: 9,
    timestamp: "2025-01-13 13:15:30",
    user: "Security System",
    action: "Security Scan",
    category: "Security",
    severity: "warning",
    details: "Detected unusual access pattern from IP 203.0.113.42",
    ipAddress: "127.0.0.1",
  },
  {
    id: 10,
    timestamp: "2025-01-13 12:00:00",
    user: "System",
    action: "Session Cleanup",
    category: "System Maintenance",
    severity: "info",
    details: "Cleaned up expired user sessions",
    ipAddress: "127.0.0.1",
  },
  {
    id: 11,
    timestamp: "2025-01-13 11:30:20",
    user: "Admin User (admin@example.com)",
    action: "Settings Updated",
    category: "System Configuration",
    severity: "info",
    details: "Updated session timeout to 30 minutes",
    ipAddress: "192.168.1.50",
  },
  {
    id: 12,
    timestamp: "2025-01-13 10:45:15",
    user: "Developer (dev@example.com)",
    action: "API Key Generated",
    category: "Security",
    severity: "info",
    details: "Generated new API key for external integration",
    ipAddress: "192.168.1.120",
  },
];

export function Admin({ user }: AdminProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  });

  // Audit logs state
  const [currentPage, setCurrentPage] = useState(1);
  const [auditFilter, setAuditFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-[#DC3545] text-white";
      case "admin":
        return "bg-[#DC3545] text-white";
      case "project_manager":
        return "bg-[#007BFF] text-white";
      case "developer":
        return "bg-[#28A745] text-white";
      case "tester":
        return "bg-[#FFC107] text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-[#28A745] text-white"
      : "bg-gray-500 text-white";
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error("Please fill in all required fields");
      return;
    }
    // Mock user creation
    toast.success("User created successfully");
    setShowAddUser(false);
    setNewUser({ name: "", email: "", role: "", password: "" });
  };

  const handleUpdateSetting = (key: string, value: any) => {
    // Mock setting update
    toast.success("Setting updated successfully");
  };

  // Audit logs functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-[#DC3545] text-white";
      case "warning":
        return "bg-[#FFC107] text-white";
      case "info":
        return "bg-[#007BFF] text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Authentication":
        return "bg-[#28A745]/10 text-[#28A745] border-[#28A745]/20";
      case "User Management":
        return "bg-[#007BFF]/10 text-[#007BFF] border-[#007BFF]/20";
      case "System Configuration":
        return "bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/20";
      case "Permission Management":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "System Maintenance":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      case "Security":
        return "bg-[#DC3545]/10 text-[#DC3545] border-[#DC3545]/20";
      case "Project Management":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  // Filter and search audit logs
  const filteredAuditLogs = mockAuditLogs.filter((log) => {
    const matchesFilter =
      auditFilter === "all" ||
      log.category.toLowerCase().includes(auditFilter.toLowerCase());
    const matchesSearch =
      searchTerm === "" ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAuditLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredAuditLogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Check if current user is admin or super_admin
  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied: You don't have permission to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            System Administration
          </h1>
          <p className="text-muted-foreground">
            Manage users, roles, permissions, and system settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          {/* Roles and Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockRoles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{role.userCount} users</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permissions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {role.permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-[#28A745]" />
                          <span className="text-sm">
                            {permission.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/20">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Role
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* System Settings */}
          {systemSettings.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle>{category.category} Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.settings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{setting.label}</p>
                      </div>
                      <div className="w-48">
                        {setting.type === "boolean" ? (
                          <Switch
                            checked={setting.value as boolean}
                            onCheckedChange={(checked: boolean) =>
                              handleUpdateSetting(setting.key, checked)
                            }
                          />
                        ) : setting.type === "select" ? (
                          <Select value={setting.value as string}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={setting.value as string}>
                                {setting.value}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={setting.type}
                            value={setting.value as string}
                            onChange={(e) =>
                              handleUpdateSetting(setting.key, e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed Login Attempts (24h)</span>
                    <span className="font-medium text-[#DC3545]">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Two-Factor Enabled</span>
                    <span className="font-medium text-[#28A745]">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Password Compliance</span>
                    <span className="font-medium text-[#FFC107]">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-[#28A745] rounded-full"></div>
                    <span>User john@example.com logged in</span>
                    <span className="text-muted-foreground">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-[#007BFF] rounded-full"></div>
                    <span>Role permissions updated</span>
                    <span className="text-muted-foreground">15 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-[#DC3545] rounded-full"></div>
                    <span>Failed login attempt</span>
                    <span className="text-muted-foreground">1 hour ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-[#FFC107] rounded-full"></div>
                    <span>System settings changed</span>
                    <span className="text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Audit Logs</CardTitle>
                  <CardDescription>
                    Comprehensive log of all system activities and user actions
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={auditFilter} onValueChange={setAuditFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="authentication">
                        Authentication
                      </SelectItem>
                      <SelectItem value="user">User Management</SelectItem>
                      <SelectItem value="system">
                        System Configuration
                      </SelectItem>
                      <SelectItem value="permission">
                        Permission Management
                      </SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="maintenance">
                        System Maintenance
                      </SelectItem>
                      <SelectItem value="project">
                        Project Management
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Audit Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-[#28A745]/5 rounded-lg border border-[#28A745]/20">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-[#28A745]" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Events
                      </p>
                      <p className="text-xl font-semibold">
                        {mockAuditLogs.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#007BFF]/5 rounded-lg border border-[#007BFF]/20">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-[#007BFF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Today's Events
                      </p>
                      <p className="text-xl font-semibold">
                        {
                          mockAuditLogs.filter((log) =>
                            log.timestamp.includes("2025-01-14")
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#FFC107]/5 rounded-lg border border-[#FFC107]/20">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-[#FFC107]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                      <p className="text-xl font-semibold">
                        {
                          mockAuditLogs.filter(
                            (log) => log.severity === "warning"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#DC3545]/5 rounded-lg border border-[#DC3545]/20">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#DC3545]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-xl font-semibold">
                        {
                          mockAuditLogs.filter(
                            (log) => log.severity === "critical"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Timestamp</span>
                        </div>
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {log.timestamp.split(" ")[1]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.timestamp.split(" ")[0]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {log.user.split(" (")[0]}
                            </span>
                            {log.user.includes("(") && (
                              <span className="text-xs text-muted-foreground">
                                {log.user.match(/\((.*?)\)/)?.[1]}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{log.action}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getCategoryColor(log.category)}
                          >
                            {log.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p
                              className="text-sm text-muted-foreground truncate"
                              title={log.details}
                            >
                              {log.details}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                IP: {log.ipAddress}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredAuditLogs.length)} of{" "}
                    {filteredAuditLogs.length} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
