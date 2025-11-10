import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Target,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Mail,
  FileText,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  ArrowRight,
  GitBranch,
  Activity,
  Bell,
  Code,
  Timer,
  Send,
  BookOpen,
  Award,
  Star,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Brain,
  Coffee,
  ChevronRight,
  Eye,
  Heart,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { CustomReports } from "./CustomReports";

// Extended Time Tracking Data
const detailedTimeTrackingData = [
  {
    date: "2025-01-08",
    project: "E-commerce Platform",
    task: "User Authentication Testing",
    duration: "6.5h",
    category: "Testing",
    efficiency: 92,
    billableHours: 6.5,
    overtime: false,
    breaks: "0.5h",
    productivity: "High",
  },
  {
    date: "2025-01-08",
    project: "Mobile App",
    task: "Bug Validation & Reporting",
    duration: "2h",
    category: "Testing",
    efficiency: 88,
    billableHours: 2,
    overtime: false,
    breaks: "0h",
    productivity: "Medium",
  },
  {
    date: "2025-01-09",
    project: "E-commerce Platform",
    task: "Payment Integration Testing",
    duration: "7h",
    category: "Testing",
    efficiency: 95,
    billableHours: 7,
    overtime: false,
    breaks: "1h",
    productivity: "High",
  },
  {
    date: "2025-01-09",
    project: "Internal Tools",
    task: "Test Case Review",
    duration: "1.5h",
    category: "Review",
    efficiency: 85,
    billableHours: 1.5,
    overtime: false,
    breaks: "0h",
    productivity: "Medium",
  },
  {
    date: "2025-01-10",
    project: "Mobile App",
    task: "UI Component Testing",
    duration: "5h",
    category: "Testing",
    efficiency: 90,
    billableHours: 5,
    overtime: false,
    breaks: "0.5h",
    productivity: "High",
  },
  {
    date: "2025-01-10",
    project: "E-commerce Platform",
    task: "Performance Testing",
    duration: "3h",
    category: "Performance",
    efficiency: 87,
    billableHours: 3,
    overtime: false,
    breaks: "0.5h",
    productivity: "Medium",
  },
  {
    date: "2025-01-11",
    project: "Client Website",
    task: "Cross-browser Testing",
    duration: "4h",
    category: "Testing",
    efficiency: 89,
    billableHours: 4,
    overtime: false,
    breaks: "0.5h",
    productivity: "High",
  },
  {
    date: "2025-01-11",
    project: "Mobile App",
    task: "Automated Test Setup",
    duration: "3.5h",
    category: "Automation",
    efficiency: 91,
    billableHours: 3.5,
    overtime: false,
    breaks: "0.5h",
    productivity: "High",
  },
  {
    date: "2025-01-12",
    project: "E-commerce Platform",
    task: "Security Testing",
    duration: "8h",
    category: "Security",
    efficiency: 93,
    billableHours: 8,
    overtime: true,
    breaks: "1h",
    productivity: "High",
  },
  {
    date: "2025-01-13",
    project: "Documentation",
    task: "Test Documentation",
    duration: "2.5h",
    category: "Documentation",
    efficiency: 86,
    billableHours: 2.5,
    overtime: false,
    breaks: "0.5h",
    productivity: "Medium",
  },
];

const weeklyTimeBreakdown = [
  {
    week: "Week 1",
    testing: 32,
    automation: 6,
    meetings: 4,
    research: 2,
    documentation: 2,
    total: 46,
  },
  {
    week: "Week 2",
    testing: 35,
    automation: 8,
    meetings: 6,
    research: 3,
    documentation: 1,
    total: 53,
  },
  {
    week: "Week 3",
    testing: 30,
    automation: 5,
    meetings: 5,
    research: 4,
    documentation: 3,
    total: 47,
  },
  {
    week: "Week 4",
    testing: 38,
    automation: 7,
    meetings: 3,
    research: 2,
    documentation: 2,
    total: 52,
  },
  {
    week: "Week 5",
    testing: 33,
    automation: 6,
    meetings: 4,
    research: 3,
    documentation: 3,
    total: 49,
  },
  {
    week: "Week 6",
    testing: 36,
    automation: 8,
    meetings: 5,
    research: 1,
    documentation: 2,
    total: 52,
  },
];

const productivityMetrics = [
  {
    date: "2025-01-08",
    focusTime: 6.2,
    distractions: 3,
    efficiency: 92,
    tasksCompleted: 4,
    deepWork: 4.5,
  },
  {
    date: "2025-01-09",
    focusTime: 7.1,
    distractions: 2,
    efficiency: 95,
    tasksCompleted: 5,
    deepWork: 5.2,
  },
  {
    date: "2025-01-10",
    focusTime: 5.8,
    distractions: 4,
    efficiency: 88,
    tasksCompleted: 3,
    deepWork: 3.8,
  },
  {
    date: "2025-01-11",
    focusTime: 6.5,
    distractions: 3,
    efficiency: 90,
    tasksCompleted: 4,
    deepWork: 4.2,
  },
  {
    date: "2025-01-12",
    focusTime: 7.3,
    distractions: 1,
    efficiency: 97,
    tasksCompleted: 6,
    deepWork: 6.1,
  },
  {
    date: "2025-01-13",
    focusTime: 6.8,
    distractions: 2,
    efficiency: 93,
    tasksCompleted: 5,
    deepWork: 4.9,
  },
];

const timeAllocationData = [
  { category: "Manual Testing", hours: 186, percentage: 68, color: "#28A745" },
  { category: "Automation", hours: 40, percentage: 15, color: "#007BFF" },
  { category: "Meetings", hours: 27, percentage: 10, color: "#FFC107" },
  { category: "Research", hours: 15, percentage: 5, color: "#DC3545" },
  { category: "Documentation", hours: 13, percentage: 5, color: "#6C757D" },
];

// Comprehensive Skill Development Data for Testers
const skillsProgressData = [
  {
    skill: "Manual Testing",
    category: "Testing",
    currentLevel: 85,
    targetLevel: 95,
    monthlyProgress: 8,
    tasksCompleted: 15,
    coursesCompleted: 2,
    certificationsEarned: 1,
    mentoringSessions: 3,
    practiceHours: 24,
    lastAssessment: "2025-01-10",
    nextMilestone: "Advanced Test Design",
    skillTrend: "upward",
    endorsements: 12,
    projectsUsed: 8,
  },
  {
    skill: "Test Automation",
    category: "Automation",
    currentLevel: 78,
    targetLevel: 90,
    monthlyProgress: 12,
    tasksCompleted: 12,
    coursesCompleted: 1,
    certificationsEarned: 0,
    mentoringSessions: 2,
    practiceHours: 18,
    lastAssessment: "2025-01-08",
    nextMilestone: "Selenium Advanced",
    skillTrend: "upward",
    endorsements: 8,
    projectsUsed: 5,
  },
  {
    skill: "API Testing",
    category: "Technical",
    currentLevel: 72,
    targetLevel: 85,
    monthlyProgress: 15,
    tasksCompleted: 8,
    coursesCompleted: 3,
    certificationsEarned: 1,
    mentoringSessions: 1,
    practiceHours: 20,
    lastAssessment: "2025-01-12",
    nextMilestone: "REST API Security Testing",
    skillTrend: "upward",
    endorsements: 6,
    projectsUsed: 6,
  },
  {
    skill: "Performance Testing",
    category: "Performance",
    currentLevel: 65,
    targetLevel: 80,
    monthlyProgress: 10,
    tasksCompleted: 5,
    coursesCompleted: 1,
    certificationsEarned: 0,
    mentoringSessions: 4,
    practiceHours: 16,
    lastAssessment: "2025-01-05",
    nextMilestone: "Load Testing with JMeter",
    skillTrend: "steady",
    endorsements: 4,
    projectsUsed: 3,
  },
  {
    skill: "Security Testing",
    category: "Security",
    currentLevel: 70,
    targetLevel: 85,
    monthlyProgress: 6,
    tasksCompleted: 6,
    coursesCompleted: 0,
    certificationsEarned: 0,
    mentoringSessions: 2,
    practiceHours: 12,
    lastAssessment: "2025-01-03",
    nextMilestone: "OWASP Testing Guide",
    skillTrend: "steady",
    endorsements: 7,
    projectsUsed: 4,
  },
  {
    skill: "Mobile Testing",
    category: "Mobile",
    currentLevel: 58,
    targetLevel: 75,
    monthlyProgress: 12,
    tasksCompleted: 4,
    coursesCompleted: 2,
    certificationsEarned: 0,
    mentoringSessions: 3,
    practiceHours: 15,
    lastAssessment: "2025-01-11",
    nextMilestone: "Cross-Platform Testing",
    skillTrend: "upward",
    endorsements: 3,
    projectsUsed: 2,
  },
];

const learningActivities = [
  {
    id: 1,
    title: "Advanced Test Automation with Selenium",
    type: "Online Course",
    provider: "Testing Academy",
    progress: 85,
    timeInvested: "32h",
    startDate: "2024-12-15",
    targetDate: "2025-01-30",
    skills: ["Selenium", "Automation", "Test Scripts"],
    status: "In Progress",
    rating: 4.8,
    certificate: true,
    priority: "High",
  },
  {
    id: 2,
    title: "API Testing Fundamentals",
    type: "Workshop",
    provider: "QA Conference",
    progress: 100,
    timeInvested: "8h",
    startDate: "2025-01-05",
    targetDate: "2025-01-05",
    skills: ["API Testing", "Postman", "REST"],
    status: "Completed",
    rating: 4.9,
    certificate: true,
    priority: "Medium",
  },
  {
    id: 3,
    title: "Mentoring Session - Performance Testing",
    type: "Mentoring",
    provider: "Internal Mentor",
    progress: 75,
    timeInvested: "6h",
    startDate: "2025-01-01",
    targetDate: "2025-01-31",
    skills: ["Performance Testing", "JMeter"],
    status: "In Progress",
    rating: 5.0,
    certificate: false,
    priority: "High",
  },
  {
    id: 4,
    title: "Mobile Testing Best Practices",
    type: "Hands-on Project",
    provider: "Self-learning",
    progress: 60,
    timeInvested: "16h",
    startDate: "2024-12-20",
    targetDate: "2025-02-15",
    skills: ["Mobile Testing", "Appium", "Cross-Platform"],
    status: "In Progress",
    rating: 4.5,
    certificate: false,
    priority: "Medium",
  },
  {
    id: 5,
    title: "Security Testing Essentials",
    type: "Online Course",
    provider: "Security Institute",
    progress: 40,
    timeInvested: "12h",
    startDate: "2025-01-10",
    targetDate: "2025-02-28",
    skills: ["Security Testing", "OWASP", "Vulnerability Assessment"],
    status: "In Progress",
    rating: 4.6,
    certificate: true,
    priority: "Medium",
  },
  {
    id: 6,
    title: "ISTQB Advanced Level Certification",
    type: "Certification",
    provider: "ISTQB",
    progress: 25,
    timeInvested: "20h",
    startDate: "2025-01-01",
    targetDate: "2025-03-15",
    skills: ["Testing Methodology", "Test Management", "Advanced Testing"],
    status: "In Progress",
    rating: 4.7,
    certificate: true,
    priority: "High",
  },
];

const skillAssessments = [
  {
    date: "2025-01-12",
    skill: "Manual Testing",
    assessor: "Senior QA Lead - Sarah Wilson",
    score: 85,
    previousScore: 78,
    improvement: 7,
    strengths: ["Test Case Design", "Bug Reporting", "Exploratory Testing"],
    areasToImprove: [
      "Test Automation",
      "Performance Testing",
      "Security Testing",
    ],
    feedback:
      "Excellent manual testing skills. Focus on automation for next quarter.",
    nextAssessment: "2025-04-12",
    type: "Technical Review",
  },
  {
    date: "2025-01-08",
    skill: "Test Automation",
    assessor: "Automation Lead - Mike Johnson",
    score: 78,
    previousScore: 72,
    improvement: 6,
    strengths: [
      "Selenium WebDriver",
      "Test Framework Design",
      "CI/CD Integration",
    ],
    areasToImprove: ["Mobile Automation", "API Testing", "Performance Scripts"],
    feedback: "Good progress in automation. Work on mobile testing skills.",
    nextAssessment: "2025-04-08",
    type: "Peer Review",
  },
  {
    date: "2025-01-05",
    skill: "API Testing",
    assessor: "Technical Lead - Alex Chen",
    score: 72,
    previousScore: 65,
    improvement: 7,
    strengths: ["REST API Testing", "Postman", "JSON Validation"],
    areasToImprove: ["GraphQL Testing", "Security Testing", "Load Testing"],
    feedback: "Solid foundation in API testing. Ready for advanced concepts.",
    nextAssessment: "2025-04-05",
    type: "Self Assessment",
  },
];

const teamSkillComparison = [
  {
    skill: "Manual Testing",
    myLevel: 85,
    teamAverage: 78,
    industryBenchmark: 80,
  },
  { skill: "Automation", myLevel: 78, teamAverage: 82, industryBenchmark: 79 },
  { skill: "API Testing", myLevel: 72, teamAverage: 75, industryBenchmark: 77 },
  { skill: "Performance", myLevel: 65, teamAverage: 68, industryBenchmark: 72 },
  { skill: "Security", myLevel: 70, teamAverage: 71, industryBenchmark: 74 },
  { skill: "Mobile", myLevel: 58, teamAverage: 62, industryBenchmark: 65 },
];

const skillCategories = [
  {
    category: "Manual Testing",
    skills: 6,
    averageLevel: 74,
    growth: "+12%",
    color: "#28A745",
    icon: CheckCircle,
  },
  {
    category: "Automation",
    skills: 4,
    averageLevel: 82,
    growth: "+8%",
    color: "#007BFF",
    icon: Settings,
  },
  {
    category: "Performance",
    skills: 3,
    averageLevel: 68,
    growth: "+15%",
    color: "#FFC107",
    icon: TrendingUp,
  },
  {
    category: "Security",
    skills: 5,
    averageLevel: 76,
    growth: "+10%",
    color: "#DC3545",
    icon: AlertTriangle,
  },
];

const learningGoals = [
  {
    id: 1,
    title: "Master Test Automation Framework",
    targetDate: "2025-03-15",
    progress: 65,
    priority: "High",
    skills: ["Selenium", "TestNG", "Maven"],
    timeRequired: "40h",
    status: "On Track",
  },
  {
    id: 2,
    title: "ISTQB Advanced Certification",
    targetDate: "2025-04-30",
    progress: 30,
    priority: "High",
    skills: ["Testing Theory", "Test Management"],
    timeRequired: "80h",
    status: "Behind",
  },
  {
    id: 3,
    title: "Performance Testing Skills",
    targetDate: "2025-02-28",
    progress: 80,
    priority: "Medium",
    skills: ["JMeter", "Load Testing"],
    timeRequired: "20h",
    status: "Ahead",
  },
];

interface ReportsProps {
  user?: any;
}

export function Reports({ user }: ReportsProps) {
  const userRole = user?.role || "developer";
  const isAdmin = userRole === "admin";
  const isProjectManager = userRole === "project_manager";
  const isDeveloperOrTester = userRole === "developer" || userRole === "tester";

  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedSkillCategory, setSelectedSkillCategory] = useState("all");
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const [globalFilters, setGlobalFilters] = useState({
    projects: [] as string[],
    users: [] as string[],
    departments: [] as string[],
    status: "all",
    priority: "all",
  });

  const getProductivityStatusColor = (productivity: string) => {
    switch (productivity) {
      case "High":
        return "text-[#28A745]";
      case "Medium":
        return "text-[#FFC107]";
      case "Low":
        return "text-[#DC3545]";
      default:
        return "text-muted-foreground";
    }
  };

  const getSkillTrendIcon = (trend: string) => {
    switch (trend) {
      case "upward":
        return <TrendingUp className="w-4 h-4 text-[#28A745]" />;
      case "downward":
        return <TrendingDown className="w-4 h-4 text-[#DC3545]" />;
      default:
        return <ArrowRight className="w-4 h-4 text-[#FFC107]" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-[#28A745] text-white";
      case "In Progress":
        return "bg-[#007BFF] text-white";
      case "On Track":
        return "bg-[#28A745] text-white";
      case "Behind":
        return "bg-[#DC3545] text-white";
      case "Ahead":
        return "bg-[#007BFF] text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isAdmin
              ? "System Reports & Analytics"
              : isProjectManager
              ? "Project Reports & Analytics"
              : "My Reports & Analytics"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Comprehensive system-wide insights across all projects and resources"
              : isProjectManager
              ? "Project performance insights and team analytics"
              : "Your personal performance insights and project contributions"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGlobalFilters(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
          <Button
            size="sm"
            className="bg-[#28A745] hover:bg-[#218838] text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue={isDeveloperOrTester ? "time-tracking" : "overview"}
        className="space-y-6"
      >
        <TabsList>
          {!isDeveloperOrTester && (
            <>
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="projects">Project Analytics</TabsTrigger>
              <TabsTrigger value="team-performance">
                Team Performance
              </TabsTrigger>
              <TabsTrigger value="financial">Financial Reports</TabsTrigger>
              <TabsTrigger value="system-health">System Health</TabsTrigger>
            </>
          )}
          {isDeveloperOrTester && (
            <>
              <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
              <TabsTrigger value="skills">Skill Development</TabsTrigger>
              <TabsTrigger value="learning">Learning Activities</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
            </>
          )}
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        {/* Admin Overview Tab */}
        {!isDeveloperOrTester && (
          <TabsContent value="overview" className="space-y-6">
            {/* System-wide Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Projects
                    </p>
                    <p className="text-2xl font-semibold">24</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      3 new this month
                    </p>
                  </div>
                  <div className="p-3 bg-[#007BFF]/10 rounded-full">
                    <Target className="w-6 h-6 text-[#007BFF]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Active Users
                    </p>
                    <p className="text-2xl font-semibold">156</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      12 online now
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <Users className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      System Health
                    </p>
                    <p className="text-2xl font-semibold">98.5%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uptime this month
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <Activity className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Critical Issues
                    </p>
                    <p className="text-2xl font-semibold">3</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Need immediate attention
                    </p>
                  </div>
                  <div className="p-3 bg-[#DC3545]/10 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-[#DC3545]" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Performance Overview */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Project Performance</h3>
                  <Button variant="outline" size="sm">
                    View All Projects
                  </Button>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "E-commerce Platform",
                      progress: 85,
                      budget: 78,
                      health: "good",
                      team: 8,
                    },
                    {
                      name: "Mobile Application",
                      progress: 80,
                      budget: 90,
                      health: "warning",
                      team: 6,
                    },
                    {
                      name: "API Integration",
                      progress: 45,
                      budget: 95,
                      health: "critical",
                      team: 4,
                    },
                    {
                      name: "Dashboard Redesign",
                      progress: 92,
                      budget: 68,
                      health: "good",
                      team: 5,
                    },
                  ].map((project, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge
                          className={
                            project.health === "good"
                              ? "bg-[#28A745] text-white"
                              : project.health === "warning"
                              ? "bg-[#FFC107] text-white"
                              : "bg-[#DC3545] text-white"
                          }
                        >
                          {project.health}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Budget: {project.budget}%</span>
                          <span>Team: {project.team} members</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* System Resource Usage */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">System Resources</h3>
                  <Badge variant="outline">Live Data</Badge>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      resource: "CPU Usage",
                      current: 45,
                      limit: 80,
                      status: "normal",
                      icon: "🖥️",
                    },
                    {
                      resource: "Memory Usage",
                      current: 68,
                      limit: 85,
                      status: "normal",
                      icon: "💾",
                    },
                    {
                      resource: "Disk Storage",
                      current: 82,
                      limit: 90,
                      status: "warning",
                      icon: "💿",
                    },
                    {
                      resource: "Network I/O",
                      current: 34,
                      limit: 70,
                      status: "normal",
                      icon: "🌐",
                    },
                    {
                      resource: "Database Load",
                      current: 56,
                      limit: 75,
                      status: "normal",
                      icon: "🗄️",
                    },
                    {
                      resource: "API Requests",
                      current: 89,
                      limit: 95,
                      status: "warning",
                      icon: "🔗",
                    },
                  ].map((resource, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{resource.icon}</span>
                          <span className="text-sm font-medium">
                            {resource.resource}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{resource.current}%</span>
                          <Badge
                            variant="outline"
                            className={
                              resource.status === "normal"
                                ? "text-[#28A745]"
                                : resource.status === "warning"
                                ? "text-[#FFC107]"
                                : "text-[#DC3545]"
                            }
                          >
                            {resource.status}
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={resource.current}
                        className={`h-2 ${
                          resource.current > resource.limit
                            ? "[&>div]:bg-[#DC3545]"
                            : resource.current > resource.limit * 0.8
                            ? "[&>div]:bg-[#FFC107]"
                            : "[&>div]:bg-[#28A745]"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Comprehensive Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Activity Trends */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">
                      User Activity Trends
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Daily active users and session duration
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        {
                          date: "Jan 8",
                          users: 145,
                          sessions: 320,
                          avgDuration: 45,
                        },
                        {
                          date: "Jan 9",
                          users: 156,
                          sessions: 345,
                          avgDuration: 48,
                        },
                        {
                          date: "Jan 10",
                          users: 134,
                          sessions: 298,
                          avgDuration: 42,
                        },
                        {
                          date: "Jan 11",
                          users: 167,
                          sessions: 378,
                          avgDuration: 52,
                        },
                        {
                          date: "Jan 12",
                          users: 189,
                          sessions: 412,
                          avgDuration: 55,
                        },
                        {
                          date: "Jan 13",
                          users: 201,
                          sessions: 445,
                          avgDuration: 58,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stackId="1"
                        stroke="#28A745"
                        fill="#28A745"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="sessions"
                        stackId="2"
                        stroke="#007BFF"
                        fill="#007BFF"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Revenue & Budget Analysis */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Financial Overview
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Revenue vs expenses across projects
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          month: "Jan",
                          revenue: 45000,
                          expenses: 38000,
                          profit: 7000,
                        },
                        {
                          month: "Feb",
                          revenue: 52000,
                          expenses: 45000,
                          profit: 7000,
                        },
                        {
                          month: "Mar",
                          revenue: 48000,
                          expenses: 42000,
                          profit: 6000,
                        },
                        {
                          month: "Apr",
                          revenue: 58000,
                          expenses: 48000,
                          profit: 10000,
                        },
                        {
                          month: "May",
                          revenue: 62000,
                          expenses: 51000,
                          profit: 11000,
                        },
                        {
                          month: "Jun",
                          revenue: 67000,
                          expenses: 54000,
                          profit: 13000,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value.toLocaleString()}`, ""]}
                      />
                      <Bar dataKey="revenue" fill="#28A745" name="Revenue" />
                      <Bar dataKey="expenses" fill="#DC3545" name="Expenses" />
                      <Bar dataKey="profit" fill="#007BFF" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Project Analytics Tab */}
        {!isDeveloperOrTester && (
          <TabsContent value="projects" className="space-y-6">
            {/* Project Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Active Projects
                    </p>
                    <p className="text-2xl font-semibold">18</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      75% completion rate
                    </p>
                  </div>
                  <div className="p-3 bg-[#007BFF]/10 rounded-full">
                    <Target className="w-6 h-6 text-[#007BFF]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      On Schedule
                    </p>
                    <p className="text-2xl font-semibold">14</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      78% of projects
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <CheckCircle className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Behind Schedule
                    </p>
                    <p className="text-2xl font-semibold">4</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      22% need attention
                    </p>
                  </div>
                  <div className="p-3 bg-[#FFC107]/10 rounded-full">
                    <Clock className="w-6 h-6 text-[#FFC107]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Budget Variance
                    </p>
                    <p className="text-2xl font-semibold">-$15k</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      3% under budget
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <TrendingUp className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Project Performance Table */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    Project Performance Matrix
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed analysis of all active projects
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

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Project Name</th>
                      <th className="text-left py-3 px-4">Manager</th>
                      <th className="text-left py-3 px-4">Progress</th>
                      <th className="text-left py-3 px-4">Budget</th>
                      <th className="text-left py-3 px-4">Team Size</th>
                      <th className="text-left py-3 px-4">Timeline</th>
                      <th className="text-left py-3 px-4">Health</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "E-commerce Platform",
                        manager: "Sarah Wilson",
                        progress: 85,
                        budget: "$125k / $160k",
                        team: 8,
                        timeline: "On Track",
                        health: "Good",
                      },
                      {
                        name: "Mobile Application",
                        manager: "Mike Johnson",
                        progress: 60,
                        budget: "$95k / $105k",
                        team: 6,
                        timeline: "Delayed",
                        health: "Warning",
                      },
                      {
                        name: "API Integration",
                        manager: "Alex Chen",
                        progress: 45,
                        budget: "$78k / $82k",
                        team: 4,
                        timeline: "Critical",
                        health: "Critical",
                      },
                      {
                        name: "Dashboard Redesign",
                        manager: "Jane Smith",
                        progress: 92,
                        budget: "$45k / $66k",
                        team: 5,
                        timeline: "Ahead",
                        health: "Excellent",
                      },
                      {
                        name: "Security Audit",
                        manager: "David Lee",
                        progress: 30,
                        budget: "$25k / $35k",
                        team: 3,
                        timeline: "On Track",
                        health: "Good",
                      },
                      {
                        name: "Data Migration",
                        manager: "Lisa Wang",
                        progress: 78,
                        budget: "$65k / $70k",
                        team: 4,
                        timeline: "On Track",
                        health: "Good",
                      },
                    ].map((project, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">
                          {project.name}
                        </td>
                        <td className="py-3 px-4">{project.manager}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                {project.progress}%
                              </span>
                            </div>
                            <Progress
                              value={project.progress}
                              className="h-2"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{project.budget}</td>
                        <td className="py-3 px-4">{project.team}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              project.timeline === "On Track" ||
                              project.timeline === "Ahead"
                                ? "bg-[#28A745] text-white"
                                : project.timeline === "Delayed"
                                ? "bg-[#FFC107] text-white"
                                : "bg-[#DC3545] text-white"
                            }
                          >
                            {project.timeline}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              project.health === "Excellent" ||
                              project.health === "Good"
                                ? "bg-[#28A745] text-white"
                                : project.health === "Warning"
                                ? "bg-[#FFC107] text-white"
                                : "bg-[#DC3545] text-white"
                            }
                          >
                            {project.health}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Team Performance Tab */}
        {!isDeveloperOrTester && (
          <TabsContent value="team-performance" className="space-y-6">
            {/* Team Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Team Members
                    </p>
                    <p className="text-2xl font-semibold">32</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      28 active today
                    </p>
                  </div>
                  <div className="p-3 bg-[#007BFF]/10 rounded-full">
                    <Users className="w-6 h-6 text-[#007BFF]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg Productivity
                    </p>
                    <p className="text-2xl font-semibold">87%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +5% from last month
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <TrendingUp className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Hours
                    </p>
                    <p className="text-2xl font-semibold">1,248h</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This week
                    </p>
                  </div>
                  <div className="p-3 bg-[#FFC107]/10 rounded-full">
                    <Clock className="w-6 h-6 text-[#FFC107]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Team Satisfaction
                    </p>
                    <p className="text-2xl font-semibold">4.7</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Out of 5.0
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <Heart className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Team Performance Matrix */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    Individual Performance Matrix
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive team member analytics
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter by Role
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Team Member</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Tasks Completed</th>
                      <th className="text-left py-3 px-4">Hours Logged</th>
                      <th className="text-left py-3 px-4">Efficiency</th>
                      <th className="text-left py-3 px-4">Quality Score</th>
                      <th className="text-left py-3 px-4">Utilization</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "Rajesh Kumar",
                        role: "Senior Developer",
                        tasks: 28,
                        hours: 160,
                        efficiency: 94,
                        quality: 4.8,
                        utilization: 85,
                        status: "active",
                      },
                      {
                        name: "Praveen Kumar",
                        role: "QA Engineer",
                        tasks: 22,
                        hours: 155,
                        efficiency: 91,
                        quality: 4.9,
                        utilization: 78,
                        status: "active",
                      },
                      {
                        name: "Sarah Wilson",
                        role: "Project Manager",
                        tasks: 15,
                        hours: 140,
                        efficiency: 88,
                        quality: 4.7,
                        utilization: 95,
                        status: "active",
                      },
                      {
                        name: "Mike Johnson",
                        role: "DevOps Engineer",
                        tasks: 18,
                        hours: 165,
                        efficiency: 92,
                        quality: 4.6,
                        utilization: 88,
                        status: "active",
                      },
                      {
                        name: "Jane Smith",
                        role: "UI/UX Designer",
                        tasks: 12,
                        hours: 145,
                        efficiency: 96,
                        quality: 4.9,
                        utilization: 82,
                        status: "active",
                      },
                      {
                        name: "Alex Chen",
                        role: "Backend Developer",
                        tasks: 25,
                        hours: 158,
                        efficiency: 89,
                        quality: 4.5,
                        utilization: 90,
                        status: "leave",
                      },
                    ].map((member, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#007BFF] rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{member.role}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {member.tasks}
                        </td>
                        <td className="py-3 px-4">{member.hours}h</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{member.efficiency}%</span>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                member.efficiency >= 90
                                  ? "bg-[#28A745]"
                                  : member.efficiency >= 80
                                  ? "bg-[#FFC107]"
                                  : "bg-[#DC3545]"
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-[#FFC107]" />
                            <span>{member.quality}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{member.utilization}%</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              member.status === "active"
                                ? "bg-[#28A745] text-white"
                                : member.status === "leave"
                                ? "bg-[#FFC107] text-white"
                                : "bg-[#DC3545] text-white"
                            }
                          >
                            {member.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Financial Reports Tab */}
        {!isDeveloperOrTester && (
          <TabsContent value="financial" className="space-y-6">
            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-semibold">$324k</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +15% from last quarter
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <TrendingUp className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-semibold">$278k</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      86% of revenue
                    </p>
                  </div>
                  <div className="p-3 bg-[#DC3545]/10 rounded-full">
                    <ArrowDown className="w-6 h-6 text-[#DC3545]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Net Profit
                    </p>
                    <p className="text-2xl font-semibold">$46k</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      14% profit margin
                    </p>
                  </div>
                  <div className="p-3 bg-[#007BFF]/10 rounded-full">
                    <Target className="w-6 h-6 text-[#007BFF]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Budget Variance
                    </p>
                    <p className="text-2xl font-semibold">-3.2%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Under budget
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <CheckCircle className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Revenue vs Expenses Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    Revenue vs Expenses Trend
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Monthly financial performance analysis
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Financial Report
                </Button>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        month: "Jan",
                        revenue: 45000,
                        expenses: 38000,
                        profit: 7000,
                      },
                      {
                        month: "Feb",
                        revenue: 52000,
                        expenses: 45000,
                        profit: 7000,
                      },
                      {
                        month: "Mar",
                        revenue: 48000,
                        expenses: 42000,
                        profit: 6000,
                      },
                      {
                        month: "Apr",
                        revenue: 58000,
                        expenses: 48000,
                        profit: 10000,
                      },
                      {
                        month: "May",
                        revenue: 62000,
                        expenses: 51000,
                        profit: 11000,
                      },
                      {
                        month: "Jun",
                        revenue: 67000,
                        expenses: 54000,
                        profit: 13000,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString()}`, ""]}
                    />
                    <Bar dataKey="revenue" fill="#28A745" name="Revenue" />
                    <Bar dataKey="expenses" fill="#DC3545" name="Expenses" />
                    <Bar dataKey="profit" fill="#007BFF" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* System Health Tab */}
        {!isDeveloperOrTester && (
          <TabsContent value="system-health" className="space-y-6">
            {/* System Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      System Uptime
                    </p>
                    <p className="text-2xl font-semibold">99.8%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 30 days
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <Activity className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Response Time
                    </p>
                    <p className="text-2xl font-semibold">142ms</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average API response
                    </p>
                  </div>
                  <div className="p-3 bg-[#007BFF]/10 rounded-full">
                    <Zap className="w-6 h-6 text-[#007BFF]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Error Rate
                    </p>
                    <p className="text-2xl font-semibold">0.02%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Very low error rate
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <CheckCircle className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Active Alerts
                    </p>
                    <p className="text-2xl font-semibold">2</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Low priority
                    </p>
                  </div>
                  <div className="p-3 bg-[#FFC107]/10 rounded-full">
                    <Bell className="w-6 h-6 text-[#FFC107]" />
                  </div>
                </div>
              </Card>
            </div>

            {/* System Components Health */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    System Components Health
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time monitoring of all system components
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Live Monitor
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    component: "Web Server",
                    status: "healthy",
                    uptime: "99.9%",
                    responseTime: "120ms",
                    load: "45%",
                  },
                  {
                    component: "Database",
                    status: "healthy",
                    uptime: "99.8%",
                    responseTime: "45ms",
                    load: "68%",
                  },
                  {
                    component: "API Gateway",
                    status: "warning",
                    uptime: "98.5%",
                    responseTime: "250ms",
                    load: "82%",
                  },
                  {
                    component: "File Storage",
                    status: "critical",
                    uptime: "95.2%",
                    responseTime: "500ms",
                    load: "95%",
                  },
                  {
                    component: "Cache Server",
                    status: "healthy",
                    uptime: "99.9%",
                    responseTime: "15ms",
                    load: "34%",
                  },
                  {
                    component: "Load Balancer",
                    status: "healthy",
                    uptime: "100%",
                    responseTime: "10ms",
                    load: "28%",
                  },
                ].map((component, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{component.component}</h4>
                      <Badge
                        className={
                          component.status === "healthy"
                            ? "bg-[#28A745] text-white"
                            : component.status === "warning"
                            ? "bg-[#FFC107] text-white"
                            : "bg-[#DC3545] text-white"
                        }
                      >
                        {component.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span>{component.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Response:</span>
                        <span>{component.responseTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Load:</span>
                        <span>{component.load}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Time Tracking Tab - For Developers and Testers */}
        {isDeveloperOrTester && (
          <TabsContent value="time-tracking" className="space-y-6">
            {/* Time Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Hours
                    </p>
                    <p className="text-2xl font-semibold">299h</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This month
                    </p>
                  </div>
                  <div className="p-3 bg-[#28A745]/10 rounded-full">
                    <Clock className="w-6 h-6 text-[#28A745]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Billable Hours
                    </p>
                    <p className="text-2xl font-semibold">267h</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      89.3% efficiency
                    </p>
                  </div>
                  <div className="p-3 bg-[#007BFF]/10 rounded-full">
                    <Target className="w-6 h-6 text-[#007BFF]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Productivity
                    </p>
                    <p className="text-2xl font-semibold">91%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +5% from last month
                    </p>
                  </div>
                  <div className="p-3 bg-[#FFC107]/10 rounded-full">
                    <TrendingUp className="w-6 h-6 text-[#FFC107]" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Focus Time
                    </p>
                    <p className="text-2xl font-semibold">6.6h</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Daily average
                    </p>
                  </div>
                  <div className="p-3 bg-[#DC3545]/10 rounded-full">
                    <Brain className="w-6 h-6 text-[#DC3545]" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Time Breakdown */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">
                    Weekly Time Breakdown
                  </h3>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTimeBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="testing"
                        stackId="1"
                        stroke="#28A745"
                        fill="#28A745"
                      />
                      <Area
                        type="monotone"
                        dataKey="automation"
                        stackId="1"
                        stroke="#007BFF"
                        fill="#007BFF"
                      />
                      <Area
                        type="monotone"
                        dataKey="meetings"
                        stackId="1"
                        stroke="#FFC107"
                        fill="#FFC107"
                      />
                      <Area
                        type="monotone"
                        dataKey="research"
                        stackId="1"
                        stroke="#DC3545"
                        fill="#DC3545"
                      />
                      <Area
                        type="monotone"
                        dataKey="documentation"
                        stackId="1"
                        stroke="#6C757D"
                        fill="#6C757D"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { name: "Testing", color: "#28A745" },
                    { name: "Automation", color: "#007BFF" },
                    { name: "Meetings", color: "#FFC107" },
                    { name: "Research", color: "#DC3545" },
                    { name: "Documentation", color: "#6C757D" },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center space-x-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Time Allocation */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Time Allocation</h3>
                  <Badge variant="outline">Current Month</Badge>
                </div>

                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="hours"
                      >
                        {timeAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {timeAllocationData.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {item.hours}h
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Productivity Metrics */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Daily Productivity Metrics
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    This Week
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productivityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#28A745"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                    <Line
                      type="monotone"
                      dataKey="focusTime"
                      stroke="#007BFF"
                      strokeWidth={2}
                      name="Focus Time (h)"
                    />
                    <Line
                      type="monotone"
                      dataKey="tasksCompleted"
                      stroke="#FFC107"
                      strokeWidth={2}
                      name="Tasks Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Detailed Time Entries */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Time Entries</h3>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Project</th>
                      <th className="text-left py-3 px-4">Task</th>
                      <th className="text-left py-3 px-4">Duration</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Efficiency</th>
                      <th className="text-left py-3 px-4">Productivity</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedTimeTrackingData
                      .slice(0, 8)
                      .map((entry, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{entry.date}</td>
                          <td className="py-3 px-4 font-medium">
                            {entry.project}
                          </td>
                          <td className="py-3 px-4">{entry.task}</td>
                          <td className="py-3 px-4">{entry.duration}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{entry.category}</Badge>
                          </td>
                          <td className="py-3 px-4">{entry.efficiency}%</td>
                          <td className="py-3 px-4">
                            <span
                              className={getProductivityStatusColor(
                                entry.productivity
                              )}
                            >
                              {entry.productivity}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Skills Development Tab - For Developers and Testers */}
        {isDeveloperOrTester && (
          <TabsContent value="skills" className="space-y-6">
            {/* Skill Category Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {skillCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Card key={category.category} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {category.category}
                        </p>
                        <p className="text-2xl font-semibold">
                          {category.averageLevel}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {category.growth} growth
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-full"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent
                          className="w-6 h-6"
                          style={{ color: category.color }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Progress Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">
                    Skills Progress Overview
                  </h3>
                  <Select
                    value={selectedSkillCategory}
                    onValueChange={setSelectedSkillCategory}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Skills</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={teamSkillComparison}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="My Level"
                        dataKey="myLevel"
                        stroke="#28A745"
                        fill="#28A745"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Team Average"
                        dataKey="teamAverage"
                        stroke="#007BFF"
                        fill="#007BFF"
                        fillOpacity={0.1}
                      />
                      <Radar
                        name="Industry Benchmark"
                        dataKey="industryBenchmark"
                        stroke="#FFC107"
                        fill="none"
                        strokeDasharray="5 5"
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Individual Skills Detail */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Skill Details</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Skill
                  </Button>
                </div>

                <div className="space-y-4">
                  {skillsProgressData.slice(0, 4).map((skill) => (
                    <div
                      key={skill.skill}
                      className="space-y-3 p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">{skill.skill}</h4>
                            <p className="text-sm text-muted-foreground">
                              {skill.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getSkillTrendIcon(skill.skillTrend)}
                          <span className="text-sm font-medium">
                            {skill.currentLevel}%
                          </span>
                        </div>
                      </div>
                      <Progress value={skill.currentLevel} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Target: {skill.targetLevel}%</span>
                        <span>+{skill.monthlyProgress}% this month</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Skills Matrix */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Complete Skills Matrix
                </h3>
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

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Skill</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Current Level</th>
                      <th className="text-left py-3 px-4">Target</th>
                      <th className="text-left py-3 px-4">Progress</th>
                      <th className="text-left py-3 px-4">Practice Hours</th>
                      <th className="text-left py-3 px-4">Projects Used</th>
                      <th className="text-left py-3 px-4">Endorsements</th>
                      <th className="text-left py-3 px-4">Next Milestone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillsProgressData.map((skill, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{skill.skill}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{skill.category}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{skill.currentLevel}%</span>
                            {getSkillTrendIcon(skill.skillTrend)}
                          </div>
                        </td>
                        <td className="py-3 px-4">{skill.targetLevel}%</td>
                        <td className="py-3 px-4">
                          <span className="text-[#28A745]">
                            +{skill.monthlyProgress}%
                          </span>
                        </td>
                        <td className="py-3 px-4">{skill.practiceHours}h</td>
                        <td className="py-3 px-4">{skill.projectsUsed}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-[#FFC107]" />
                            <span>{skill.endorsements}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {skill.nextMilestone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Learning Activities Tab - For Developers and Testers */}
        {isDeveloperOrTester && (
          <TabsContent value="learning" className="space-y-6">
            {/* Learning Goals */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Learning Goals</h3>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {learningGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{goal.title}</h4>
                      <Badge className={getStatusBadgeColor(goal.status)}>
                        {goal.status}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="h-2 mb-3" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Progress:</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Date:</span>
                        <span>{goal.targetDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Required:</span>
                        <span>{goal.timeRequired}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {goal.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Learning Activities */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Learning Activities</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {learningActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{activity.title}</h4>
                          <Badge variant="outline">{activity.type}</Badge>
                          <Badge
                            className={getStatusBadgeColor(activity.status)}
                          >
                            {activity.status}
                          </Badge>
                          {activity.certificate && (
                            <Badge className="bg-[#FFC107] text-white">
                              <Award className="w-3 h-3 mr-1" />
                              Certificate
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {activity.provider}
                        </p>
                        <Progress
                          value={activity.progress}
                          className="h-2 mb-3"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Progress:
                            </span>
                            <span className="ml-2 font-medium">
                              {activity.progress}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Time Invested:
                            </span>
                            <span className="ml-2 font-medium">
                              {activity.timeInvested}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Rating:
                            </span>
                            <div className="flex items-center ml-2">
                              <Star className="w-4 h-4 text-[#FFC107]" />
                              <span className="ml-1 font-medium">
                                {activity.rating}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Target:
                            </span>
                            <span className="ml-2 font-medium">
                              {activity.targetDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {activity.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Assessments Tab - For Developers and Testers */}
        {isDeveloperOrTester && (
          <TabsContent value="assessments" className="space-y-6">
            {/* Recent Assessments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Recent Skill Assessments
                </h3>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Request Assessment
                </Button>
              </div>

              <div className="space-y-6">
                {skillAssessments.map((assessment, index) => (
                  <div
                    key={index}
                    className="p-6 border border-border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {assessment.skill}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {assessment.assessor}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">{assessment.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {assessment.date}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-[#28A745]">
                          {assessment.score}/100
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assessment.improvement > 0 ? "+" : ""}
                          {assessment.improvement} from previous
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-2 text-[#28A745]">
                          Strengths
                        </h5>
                        <ul className="space-y-1">
                          {assessment.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm flex items-center">
                              <CheckCircle className="w-4 h-4 text-[#28A745] mr-2" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-[#FFC107]">
                          Areas to Improve
                        </h5>
                        <ul className="space-y-1">
                          {assessment.areasToImprove.map((area, idx) => (
                            <li key={idx} className="text-sm flex items-center">
                              <Lightbulb className="w-4 h-4 text-[#FFC107] mr-2" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h5 className="font-medium mb-2">Assessor Feedback</h5>
                      <p className="text-sm">{assessment.feedback}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        Next Assessment: {assessment.nextAssessment}
                      </span>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View Full Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Assessment Schedule */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Upcoming Assessments</h3>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Assessment
                </Button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    skill: "Manual Testing",
                    date: "2025-04-12",
                    assessor: "Sarah Wilson",
                    type: "Technical Review",
                  },
                  {
                    skill: "Test Automation",
                    date: "2025-04-08",
                    assessor: "Mike Johnson",
                    type: "Peer Review",
                  },
                  {
                    skill: "API Testing",
                    date: "2025-04-05",
                    assessor: "Alex Chen",
                    type: "Self Assessment",
                  },
                ].map((upcoming, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-[#007BFF]/10 rounded-full">
                        <Calendar className="w-5 h-5 text-[#007BFF]" />
                      </div>
                      <div>
                        <h4 className="font-medium">{upcoming.skill}</h4>
                        <p className="text-sm text-muted-foreground">
                          {upcoming.assessor} • {upcoming.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{upcoming.date}</div>
                      <div className="text-sm text-muted-foreground">
                        Scheduled
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Custom Reports Tab */}
        <TabsContent value="custom" className="space-y-6">
          <CustomReports userRole={userRole} />
        </TabsContent>
      </Tabs>

      {/* Global Advanced Filters Dialog */}
      <Dialog open={showGlobalFilters} onOpenChange={setShowGlobalFilters}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Report Filters</DialogTitle>
            <DialogDescription>
              Apply advanced filtering across all reports to focus on specific
              data segments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Range & Time Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select
                  value={selectedTimeRange}
                  onValueChange={setSelectedTimeRange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 3 months</SelectItem>
                    <SelectItem value="6m">Last 6 months</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                    <SelectItem value="ytd">Year to date</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Compare With</Label>
                <Select defaultValue="none">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No comparison</SelectItem>
                    <SelectItem value="previous">Previous period</SelectItem>
                    <SelectItem value="last_year">
                      Same period last year
                    </SelectItem>
                    <SelectItem value="baseline">Baseline/Target</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Projects</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                {[
                  "E-commerce Platform",
                  "Mobile Application",
                  "API Integration",
                  "Dashboard Redesign",
                  "Security Audit",
                  "Data Migration",
                  "Client Website",
                  "Backend Upgrade",
                  "Performance Optimization",
                  "Cloud Migration",
                  "Analytics Dashboard",
                  "User Portal",
                ].map((project) => (
                  <div key={project} className="flex items-center space-x-2">
                    <Switch id={project} />
                    <Label htmlFor={project} className="text-sm">
                      {project}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Members Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Team Members</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                {[
                  "Rajesh Kumar",
                  "Praveen Kumar",
                  "Sarah Wilson",
                  "Mike Johnson",
                  "Jane Smith",
                  "Alex Chen",
                  "David Lee",
                  "Lisa Wang",
                  "Tom Brown",
                  "Anna Garcia",
                  "Chris Martin",
                  "Emma Davis",
                ].map((user) => (
                  <div key={user} className="flex items-center space-x-2">
                    <Switch id={user} />
                    <Label htmlFor={user} className="text-sm">
                      {user}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Departments & Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Departments</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {[
                    "Development",
                    "Quality Assurance",
                    "Project Management",
                    "Design",
                    "DevOps",
                    "Security",
                    "Analytics",
                  ].map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Switch id={dept} />
                      <Label htmlFor={dept} className="text-sm">
                        {dept}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Roles</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {[
                    "Senior Developer",
                    "Junior Developer",
                    "QA Engineer",
                    "Project Manager",
                    "Team Lead",
                    "DevOps Engineer",
                    "UI/UX Designer",
                    "Product Manager",
                  ].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Switch id={role} />
                      <Label htmlFor={role} className="text-sm">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status and Priority Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Project Status</Label>
                <Select
                  value={globalFilters.status}
                  onValueChange={(value) =>
                    setGlobalFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select
                  value={globalFilters.priority}
                  onValueChange={(value) =>
                    setGlobalFilters((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Health Status</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Health</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metrics & KPI Filters */}
            <div className="space-y-3">
              <Label>Focus Metrics</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "Performance",
                  "Budget",
                  "Timeline",
                  "Quality",
                  "Productivity",
                  "Efficiency",
                  "Satisfaction",
                  "Risk",
                ].map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Switch id={metric} defaultChecked />
                    <Label htmlFor={metric} className="text-sm">
                      {metric}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Granularity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Granularity</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aggregation Method</Label>
                <Select defaultValue="average">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="median">Median</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label>Export Preferences</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { format: "PDF", desc: "Formatted report" },
                  { format: "Excel", desc: "Raw data export" },
                  { format: "CSV", desc: "Data only" },
                  { format: "JSON", desc: "API format" },
                ].map((option) => (
                  <div
                    key={option.format}
                    className="p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Switch id={option.format} />
                      <Label
                        htmlFor={option.format}
                        className="text-sm font-medium"
                      >
                        {option.format}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Save Filter Set
              </Button>
              <Button variant="ghost" size="sm">
                Load Preset
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowGlobalFilters(false)}
              >
                Cancel
              </Button>
              <Button variant="outline">Reset to Default</Button>
              <Button
                className="bg-[#28A745] hover:bg-[#218838] text-white"
                onClick={() => {
                  setShowGlobalFilters(false);
                  toast.success("Advanced filters applied successfully");
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
