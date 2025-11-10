import React, { useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Switch } from "../../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle,
  Calendar,
  Target,
  Activity,
  BarChart3,
  FolderOpen,
  Timer,
  DollarSign,
  Settings,
  Layout,
  Plus,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Cpu,
  Server,
  FileText,
  Bug,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";

// Available widget types
const WIDGET_TYPES = {
  STATS: "stats",
  TASKS: "tasks",
  CHART: "chart",
  LIST: "list",
  ACTIVITY: "activity",
  TEAM: "team",
  SYSTEM: "system",
  CALENDAR: "calendar",
};

// Updated widget configurations (removed code-related widgets for developer role)
const DEFAULT_WIDGETS = {
  admin: [
    {
      id: "stats",
      type: WIDGET_TYPES.STATS,
      title: "System Stats",
      enabled: true,
      size: "full",
    },
    {
      id: "all_tasks",
      type: WIDGET_TYPES.TASKS,
      title: "All Tasks",
      enabled: true,
      size: "large",
    },
    {
      id: "sprint_progress_chart",
      type: WIDGET_TYPES.CHART,
      title: "Sprint Progress",
      enabled: true,
      size: "large",
    },
    {
      id: "system_health",
      type: WIDGET_TYPES.SYSTEM,
      title: "System Health",
      enabled: true,
      size: "medium",
    },
    {
      id: "project_health",
      type: WIDGET_TYPES.LIST,
      title: "Project Health",
      enabled: true,
      size: "medium",
    },
    {
      id: "user_activity",
      type: WIDGET_TYPES.ACTIVITY,
      title: "Recent Activity",
      enabled: true,
      size: "medium",
    },
    {
      id: "upcoming_deadlines",
      type: WIDGET_TYPES.CALENDAR,
      title: "Upcoming Deadlines",
      enabled: true,
      size: "medium",
    },
  ],
  project_manager: [
    {
      id: "stats",
      type: WIDGET_TYPES.STATS,
      title: "Project Stats",
      enabled: true,
      size: "full",
    },
    {
      id: "my_tasks",
      type: WIDGET_TYPES.TASKS,
      title: "Management Tasks",
      enabled: true,
      size: "large",
    },
    {
      id: "team_performance",
      type: WIDGET_TYPES.TEAM,
      title: "Team Performance",
      enabled: true,
      size: "medium",
    },
    {
      id: "sprint_velocity",
      type: WIDGET_TYPES.LIST,
      title: "Sprint Velocity",
      enabled: true,
      size: "medium",
    },
    {
      id: "project_timeline",
      type: WIDGET_TYPES.CHART,
      title: "Project Timeline",
      enabled: true,
      size: "large",
    },
    {
      id: "resource_allocation",
      type: WIDGET_TYPES.CHART,
      title: "Resource Allocation",
      enabled: true,
      size: "large",
    },
    {
      id: "budget_tracking",
      type: WIDGET_TYPES.LIST,
      title: "Budget Tracking",
      enabled: true,
      size: "medium",
    },
    {
      id: "upcoming_deadlines",
      type: WIDGET_TYPES.CALENDAR,
      title: "Upcoming Deadlines",
      enabled: true,
      size: "medium",
    },
  ],
  developer: [
    {
      id: "stats",
      type: WIDGET_TYPES.STATS,
      title: "Development Stats",
      enabled: true,
      size: "full",
    },
    {
      id: "my_tasks",
      type: WIDGET_TYPES.TASKS,
      title: "My Tasks",
      enabled: true,
      size: "large",
    },
    {
      id: "sprint_progress_chart",
      type: WIDGET_TYPES.CHART,
      title: "Sprint Progress",
      enabled: true,
      size: "large",
    },
    {
      id: "productivity_chart",
      type: WIDGET_TYPES.CHART,
      title: "Weekly Productivity",
      enabled: true,
      size: "large",
    },
    {
      id: "upcoming_deadlines",
      type: WIDGET_TYPES.CALENDAR,
      title: "Upcoming Deadlines",
      enabled: true,
      size: "medium",
    },
    {
      id: "user_activity",
      type: WIDGET_TYPES.ACTIVITY,
      title: "Recent Activity",
      enabled: true,
      size: "medium",
    },
  ],
  tester: [
    {
      id: "stats",
      type: WIDGET_TYPES.STATS,
      title: "Testing Stats",
      enabled: true,
      size: "full",
    },
    {
      id: "my_tasks",
      type: WIDGET_TYPES.TASKS,
      title: "My Tasks",
      enabled: true,
      size: "large",
    },
    {
      id: "testing_progress",
      type: WIDGET_TYPES.ACTIVITY,
      title: "Testing Progress",
      enabled: true,
      size: "medium",
    },
    {
      id: "test_coverage",
      type: WIDGET_TYPES.LIST,
      title: "Test Coverage",
      enabled: true,
      size: "medium",
    },
    {
      id: "bug_discovery",
      type: WIDGET_TYPES.CHART,
      title: "Bug Discovery",
      enabled: true,
      size: "large",
    },
    {
      id: "test_execution",
      type: WIDGET_TYPES.CHART,
      title: "Test Execution",
      enabled: true,
      size: "large",
    },
    {
      id: "automation_status",
      type: WIDGET_TYPES.LIST,
      title: "Automation Status",
      enabled: true,
      size: "medium",
    },
    {
      id: "quality_metrics",
      type: WIDGET_TYPES.LIST,
      title: "Quality Metrics",
      enabled: true,
      size: "medium",
    },
  ],
};

// TODO: Replace with dashboard data from API based on user role
const mockData = {
  admin: {
    stats: [
      {
        label: "Total Projects",
        value: "24",
        icon: FolderOpen,
        trend: "+12%",
        trendUp: true,
      },
      {
        label: "Active Users",
        value: "156",
        icon: Users,
        trend: "+8%",
        trendUp: true,
      },
      {
        label: "Total Tasks",
        value: "847",
        icon: CheckCircle,
        trend: "+15%",
        trendUp: true,
      },
      {
        label: "System Health",
        value: "98%",
        icon: Server,
        trend: "+2%",
        trendUp: true,
      },
    ],
    tasks: [
      {
        id: 1,
        title: "Review system logs",
        project: "Infrastructure",
        status: "pending",
        priority: "high",
        dueDate: "2024-01-15",
        assignee: "Admin",
      },
      {
        id: 2,
        title: "User access audit",
        project: "Security",
        status: "in_progress",
        priority: "high",
        dueDate: "2024-01-16",
        assignee: "Admin",
      },
      {
        id: 3,
        title: "Backup verification",
        project: "Infrastructure",
        status: "pending",
        priority: "medium",
        dueDate: "2024-01-17",
        assignee: "Admin",
      },
    ],
  },
  project_manager: {
    stats: [
      {
        label: "Active Projects",
        value: "8",
        icon: FolderOpen,
        trend: "+2",
        trendUp: true,
      },
      {
        label: "Team Members",
        value: "24",
        icon: Users,
        trend: "+3",
        trendUp: true,
      },
      {
        label: "Open Tasks",
        value: "142",
        icon: CheckCircle,
        trend: "-8",
        trendUp: false,
      },
      {
        label: "Budget Used",
        value: "67%",
        icon: DollarSign,
        trend: "+5%",
        trendUp: false,
      },
    ],
    tasks: [
      {
        id: 1,
        title: "Sprint planning meeting",
        project: "E-Commerce App",
        status: "pending",
        priority: "high",
        dueDate: "2024-01-15",
        assignee: "Manager",
      },
      {
        id: 2,
        title: "Review budget allocation",
        project: "Mobile App",
        status: "in_progress",
        priority: "medium",
        dueDate: "2024-01-16",
        assignee: "Manager",
      },
      {
        id: 3,
        title: "Client presentation prep",
        project: "Web Platform",
        status: "pending",
        priority: "high",
        dueDate: "2024-01-17",
        assignee: "Manager",
      },
    ],
  },
  developer: {
    stats: [
      {
        label: "My Tasks",
        value: "12",
        icon: CheckCircle,
        trend: "-3",
        trendUp: true,
      },
      {
        label: "Completed",
        value: "8",
        icon: Target,
        trend: "+5",
        trendUp: true,
      },
      {
        label: "In Progress",
        value: "4",
        icon: Clock,
        trend: "-2",
        trendUp: true,
      },
      {
        label: "Code Reviews",
        value: "3",
        icon: FileText,
        trend: "+1",
        trendUp: true,
      },
    ],
    tasks: [
      {
        id: 1,
        title: "Implement user authentication",
        project: "E-Commerce App",
        status: "in_progress",
        priority: "high",
        dueDate: "2024-01-15",
        assignee: "John Doe",
      },
      {
        id: 2,
        title: "Fix payment gateway bug",
        project: "E-Commerce App",
        status: "pending",
        priority: "critical",
        dueDate: "2024-01-14",
        assignee: "John Doe",
      },
      {
        id: 3,
        title: "Code review for PR #234",
        project: "Mobile App",
        status: "pending",
        priority: "medium",
        dueDate: "2024-01-16",
        assignee: "Jane Smith",
      },
      {
        id: 4,
        title: "Update API documentation",
        project: "Web Platform",
        status: "in_progress",
        priority: "low",
        dueDate: "2024-01-18",
        assignee: "John Doe",
      },
    ],
  },
  tester: {
    stats: [
      {
        label: "Tests Pending",
        value: "18",
        icon: Activity,
        trend: "+5",
        trendUp: false,
      },
      {
        label: "Tests Passed",
        value: "142",
        icon: CheckCircle,
        trend: "+12",
        trendUp: true,
      },
      {
        label: "Bugs Found",
        value: "23",
        icon: Bug,
        trend: "+7",
        trendUp: false,
      },
      {
        label: "Test Coverage",
        value: "87%",
        icon: Target,
        trend: "+3%",
        trendUp: true,
      },
    ],
    tasks: [
      {
        id: 1,
        title: "Test checkout flow",
        project: "E-Commerce App",
        status: "in_progress",
        priority: "high",
        dueDate: "2024-01-15",
        assignee: "Tester",
      },
      {
        id: 2,
        title: "Regression testing",
        project: "Mobile App",
        status: "pending",
        priority: "high",
        dueDate: "2024-01-16",
        assignee: "Tester",
      },
      {
        id: 3,
        title: "API integration tests",
        project: "Web Platform",
        status: "pending",
        priority: "medium",
        dueDate: "2024-01-17",
        assignee: "Tester",
      },
    ],
  },
};

// TODO: Replace with team workload data from API
const teamWorkload = [
  {
    name: "John Doe",
    tasks: 12,
    hours: 32,
    utilization: 85,
    avatar: "JD",
    role: "Developer",
    efficiency: 92,
    capacity: 15,
  },
  {
    name: "Jane Smith",
    tasks: 15,
    hours: 38,
    utilization: 95,
    avatar: "JS",
    role: "Developer",
    efficiency: 88,
    capacity: 18,
  },
  {
    name: "Bob Johnson",
    tasks: 8,
    hours: 28,
    utilization: 70,
    avatar: "BJ",
    role: "Tester",
    efficiency: 85,
    capacity: 12,
  },
  {
    name: "Alice Williams",
    tasks: 10,
    hours: 30,
    utilization: 75,
    avatar: "AW",
    role: "Designer",
    efficiency: 90,
    capacity: 14,
  },
];

// TODO: Replace with system health data from monitoring API
const systemHealthData = [
  {
    metric: "CPU Usage",
    value: 45,
    status: "healthy",
    component: "Web Server",
    uptime: "99.9%",
    responseTime: "45ms",
  },
  {
    metric: "Memory",
    value: 67,
    status: "warning",
    component: "Database",
    uptime: "99.5%",
    responseTime: "120ms",
  },
  {
    metric: "Disk Space",
    value: 78,
    status: "warning",
    component: "Storage",
    uptime: "100%",
    responseTime: "15ms",
  },
  {
    metric: "Network",
    value: 23,
    status: "healthy",
    component: "API Gateway",
    uptime: "99.8%",
    responseTime: "32ms",
  },
];

// TODO: Replace with recent activities from activity feed API
const recentActivities = [
  {
    id: 1,
    type: "task",
    user: "John Doe",
    action: "completed",
    item: "User Authentication",
    project: "E-Commerce App",
    time: "2 hours ago",
    target: "Login Module",
  },
  {
    id: 2,
    type: "bug",
    user: "Jane Smith",
    action: "reported",
    item: "Payment Gateway Issue",
    project: "E-Commerce App",
    time: "3 hours ago",
    target: "Checkout Process",
  },
  {
    id: 3,
    type: "review",
    user: "Bob Johnson",
    action: "reviewed",
    item: "PR #234",
    project: "Mobile App",
    time: "5 hours ago",
    target: "Feature Branch",
  },
  {
    id: 4,
    type: "deployment",
    user: "Alice Williams",
    action: "deployed",
    item: "v2.1.0",
    project: "Web Platform",
    time: "1 day ago",
    target: "Production",
  },
  {
    id: 5,
    type: "meeting",
    user: "System",
    action: "scheduled",
    item: "Sprint Planning",
    project: "General",
    time: "1 day ago",
    target: "Conference Room",
  },
];

// TODO: Replace with upcoming deadlines from tasks/milestones API
const upcomingDeadlines = [
  {
    task: "Payment Gateway Integration",
    project: "E-Commerce App",
    dueDate: "2024-01-14",
    priority: "critical",
    assignee: "John Doe",
    daysLeft: 1,
  },
  {
    task: "Mobile App UI Redesign",
    project: "Mobile App",
    dueDate: "2024-01-15",
    priority: "high",
    assignee: "Jane Smith",
    daysLeft: 2,
  },
  {
    task: "API Documentation Update",
    project: "Web Platform",
    dueDate: "2024-01-16",
    priority: "medium",
    assignee: "Bob Johnson",
    daysLeft: 3,
  },
  {
    task: "Security Audit",
    project: "Infrastructure",
    dueDate: "2024-01-17",
    priority: "high",
    assignee: "Alice Williams",
    daysLeft: 4,
  },
];

// TODO: Replace with productivity data from time tracking API
const weeklyProductivityData = [
  { day: "Mon", hours: 7.5, tasks: 8 },
  { day: "Tue", hours: 8.2, tasks: 10 },
  { day: "Wed", hours: 6.8, tasks: 7 },
  { day: "Thu", hours: 8.5, tasks: 11 },
  { day: "Fri", hours: 7.0, tasks: 9 },
  { day: "Sat", hours: 2.0, tasks: 3 },
  { day: "Sun", hours: 0, tasks: 0 },
];

// TODO: Replace with budget data from financial API
const budgetUtilizationData = [
  { month: "Jan", budget: 50000, spent: 33500 },
  { month: "Feb", budget: 50000, spent: 42000 },
  { month: "Mar", budget: 50000, spent: 38500 },
  { month: "Apr", budget: 50000, spent: 45000 },
];

// TODO: Replace with project health data from projects API
const projectHealthData = [
  {
    name: "E-Commerce App",
    status: "On Track",
    completion: 78,
    budget: 85000,
    team: 8,
    progress: 78,
    spent: 42500,
  },
  {
    name: "Mobile App",
    status: "At Risk",
    completion: 45,
    budget: 92000,
    team: 6,
    progress: 45,
    spent: 55200,
  },
  {
    name: "Web Platform",
    status: "On Track",
    completion: 92,
    budget: 67000,
    team: 10,
    progress: 92,
    spent: 33500,
  },
  {
    name: "Infrastructure",
    status: "Delayed",
    completion: 34,
    budget: 45000,
    team: 4,
    progress: 34,
    spent: 27000,
  },
];

// TODO: Replace with sprint velocity data from sprint API
const sprintVelocityData = [
  { sprint: "Sprint 1", planned: 45, completed: 42, velocity: 93 },
  { sprint: "Sprint 2", planned: 50, completed: 48, velocity: 96 },
  { sprint: "Sprint 3", planned: 48, completed: 45, velocity: 94 },
  { sprint: "Sprint 4", planned: 52, completed: 50, velocity: 96 },
  { sprint: "Sprint 5", planned: 50, completed: 47, velocity: 94 },
];

// TODO: Replace with sprint progress data from sprint API
const sprintProgressData = [
  { week: "Week 1", planned: 20, actual: 18 },
  { week: "Week 2", planned: 40, actual: 38 },
  { week: "Week 3", planned: 60, actual: 62 },
  { week: "Week 4", planned: 80, actual: 75 },
];

const COLORS = {
  primary: "#28A745",
  secondary: "#007BFF",
  warning: "#FFC107",
  danger: "#DC3545",
  muted: "#6c757d",
  success: "#28A745",
};

interface DashboardProps {
  user?: any;
}

export function Dashboard({ user }: DashboardProps) {
  const userRole = user?.role || "developer";
  const userName = user?.name || "User";
  const data =
    mockData[userRole as keyof typeof mockData] || mockData.developer;

  const [widgets, setWidgets] = useState(
    DEFAULT_WIDGETS[userRole as keyof typeof DEFAULT_WIDGETS] ||
      DEFAULT_WIDGETS.developer
  );
  const [showCustomization, setShowCustomization] = useState(false);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting =
      hour < 12
        ? "Good morning"
        : hour < 18
        ? "Good afternoon"
        : "Good evening";

    switch (userRole) {
      case "admin":
        return `${greeting}, ${userName}! System overview and critical alerts.`;
      case "project_manager":
        return `${greeting}, ${userName}! Your projects and team status.`;
      case "developer":
        return `${greeting}, ${userName}! Your tasks and development progress.`;
      case "tester":
        return `${greeting}, ${userName}! Your testing queue and quality metrics.`;
      default:
        return `${greeting}, ${userName}! Here's your personalized overview.`;
    }
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    );
    toast.success("Dashboard updated successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-[#28A745] text-white";
      case "warning":
        return "bg-[#FFC107] text-white";
      case "critical":
        return "bg-[#DC3545] text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-[#28A745] text-white";
      case "At Risk":
        return "bg-[#FFC107] text-white";
      case "Delayed":
        return "bg-[#DC3545] text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task":
        return CheckCircle;
      case "bug":
        return Bug;
      case "design":
        return FileText;
      case "meeting":
        return Calendar;
      case "deployment":
        return Zap;
      case "review":
        return Activity;
      default:
        return Activity;
    }
  };

  const renderWidget = (widget: any) => {
    if (!widget.enabled) return null;

    const widgetClasses = {
      small: "col-span-1",
      medium: "col-span-1 lg:col-span-1",
      large: "col-span-1 lg:col-span-2",
      full: "col-span-1 lg:col-span-4",
    };

    switch (widget.id) {
      case "stats":
        return (
          <div key={widget.id} className={`${widgetClasses.full}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-2xl font-semibold">{stat.value}</p>
                          <div
                            className={`flex items-center text-xs ${
                              stat.trendUp ? "text-[#28A745]" : "text-[#DC3545]"
                            }`}
                          >
                            {stat.trendUp ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )}
                            <span>{stat.trend}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-full">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case "my_tasks":
      case "all_tasks":
        return (
          <Card key={widget.id} className={widgetClasses.large}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{widget.title}</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge
                          variant={
                            task.priority === "Critical" ||
                            task.priority === "High"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{task.project}</span>
                        <span>•</span>
                        <span>{task.assignee}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-medium ${
                          task.dueDate === "Overdue"
                            ? "text-[#DC3545]"
                            : task.dueDate === "Today"
                            ? "text-[#FFC107]"
                            : task.dueDate === "Completed"
                            ? "text-[#28A745]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {task.dueDate}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case "team_performance":
      case "team_overview":
        return (
          <Card key={widget.id} className={widgetClasses.large}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{widget.title}</h3>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-4">
                {teamWorkload.slice(0, 6).map((member) => (
                  <div key={member.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-[#28A745] text-white">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">
                            {member.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {member.efficiency}% efficiency
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {member.tasks}/{member.capacity}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {member.utilization}% utilized
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(member.utilization, 100)}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case "system_health":
        return (
          <Card key={widget.id} className={widgetClasses.medium}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System Health</h3>
                <Server className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                {systemHealthData.slice(0, 4).map((item) => (
                  <div
                    key={item.component}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {item.component}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {item.uptime} uptime • {item.responseTime}
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case "user_activity":
        return (
          <Card key={widget.id} className={widgetClasses.medium}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {recentActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="p-1.5 bg-muted rounded-full">
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{" "}
                          {activity.action}{" "}
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );

      case "upcoming_deadlines":
        return (
          <Card key={widget.id} className={widgetClasses.medium}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {deadline.task}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {deadline.project}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <Badge
                        className={
                          deadline.priority === "Critical"
                            ? "bg-[#DC3545] text-white"
                            : deadline.priority === "High"
                            ? "bg-[#FFC107] text-white"
                            : "bg-[#007BFF] text-white"
                        }
                      >
                        {deadline.daysLeft}d
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case "sprint_progress_chart":
        return (
          <Card key={widget.id} className={widgetClasses.large}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    Last 5 Sprint Progress
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sprint completion rates and velocity tracking
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={sprintProgressData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} SP`,
                      name === "completed"
                        ? "Completed"
                        : name === "inProgress"
                        ? "In Progress"
                        : name === "todo"
                        ? "Todo"
                        : "Planned",
                    ]}
                  />
                  <Bar
                    dataKey="completed"
                    stackId="a"
                    fill="#28A745"
                    name="Completed"
                  />
                  <Bar
                    dataKey="inProgress"
                    stackId="a"
                    fill="#FFC107"
                    name="In Progress"
                  />
                  <Bar dataKey="todo" stackId="a" fill="#007BFF" name="Todo" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );

      case "productivity_chart":
      case "budget_chart":
        return (
          <Card key={widget.id} className={widgetClasses.large}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    {widget.id === "budget_chart"
                      ? "Budget Utilization"
                      : "Weekly Productivity"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {widget.id === "budget_chart"
                      ? "Monthly budget vs spending"
                      : "Tasks completed and velocity tracking"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                {widget.id === "budget_chart" ? (
                  <AreaChart data={budgetUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        `${(value as number).toLocaleString()}`,
                        name === "budget"
                          ? "Budget"
                          : name === "spent"
                          ? "Spent"
                          : "Remaining",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="budget"
                      stroke="#007BFF"
                      fill="#007BFF"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      stroke="#28A745"
                      fill="#28A745"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={weeklyProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      stroke="#28A745"
                      fill="#28A745"
                      fillOpacity={0.6}
                      name="Tasks"
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#007BFF"
                      fill="#007BFF"
                      fillOpacity={0.3}
                      name="Hours"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        );

      case "project_health":
        return (
          <Card key={widget.id} className={widgetClasses.medium}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Project Health</h3>
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                {projectHealthData.map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.team} team members
                        </p>
                      </div>
                      <Badge className={getProjectStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress: {project.progress}%</span>
                        <span>
                          Budget: ${(project.spent / 1000).toFixed(0)}k / $
                          {(project.budget / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <Progress value={project.progress} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case "sprint_velocity":
        return (
          <Card key={widget.id} className={widgetClasses.medium}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sprint Velocity</h3>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-4">
                {sprintVelocityData.map((sprint, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {sprint.sprint}
                      </span>
                      <div className="text-sm">
                        <span
                          className={
                            sprint.velocity >= 90
                              ? "text-[#28A745]"
                              : sprint.velocity >= 80
                              ? "text-[#FFC107]"
                              : "text-[#DC3545]"
                          }
                        >
                          {sprint.velocity}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>
                        Completed: {sprint.completed}/{sprint.planned}
                      </span>
                      <span>{sprint.completed} story points</span>
                    </div>
                    <Progress value={sprint.velocity} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case "testing_progress":
        return (
          <Card key={widget.id} className={widgetClasses.medium}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Testing Progress</h3>
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Testing</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">UI Testing</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Integration Testing</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance Testing</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {userRole === "admin"
              ? "System Dashboard"
              : userRole === "project_manager"
              ? "Project Dashboard"
              : userRole === "tester"
              ? "Testing Dashboard"
              : "Development Dashboard"}
          </h1>
          <p className="text-muted-foreground">{getWelcomeMessage()}</p>
        </div>

        <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Customize Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dashboard Customization</DialogTitle>
              <DialogDescription>
                Toggle widgets on/off to personalize your dashboard view
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Layout className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{widget.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Size: {widget.size} • Type: {widget.type}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={widget.enabled}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCustomization(false)}
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {widgets.map((widget) => renderWidget(widget))}
      </div>
    </div>
  );
}
