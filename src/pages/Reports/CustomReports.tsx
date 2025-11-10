import React, { useState } from "react";
import { Card } from "../../components/ui/card";
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
} from "../../components/ui/dialog";
import {
  BarChart3,
  Plus,
  Filter,
  Download,
  Target,
  Users,
  CheckCircle,
  TrendingUp,
  Clock,
  FileText,
  Activity,
  Edit,
  Eye,
  Bell,
  Send,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";

interface CustomReportsProps {
  userRole: string;
}

export function CustomReports({ userRole }: CustomReportsProps) {
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportFilters, setReportFilters] = useState({
    dateRange: "30d",
    projects: [] as string[],
    users: [] as string[],
    status: "all",
    priority: "all",
    tags: [] as string[],
  });

  const [customReports, setCustomReports] = useState([
    {
      id: "rpt_001",
      name: "Project Performance Dashboard",
      description:
        "Comprehensive project metrics with KPIs and progress tracking",
      type: "dashboard",
      category: "Performance",
      author: "Rajesh Kumar",
      created: "2025-01-10",
      lastRun: "2025-01-13",
      status: "active",
      schedule: "Weekly",
      recipients: ["team@company.com"],
      metrics: ["completion_rate", "budget_variance", "timeline_adherence"],
      charts: ["bar", "line", "pie"],
      filters: ["project", "date_range", "status"],
    },
    {
      id: "rpt_002",
      name: "Team Productivity Analysis",
      description:
        "Individual and team performance metrics with efficiency tracking",
      type: "analytical",
      category: "Team",
      author: "Sarah Wilson",
      created: "2025-01-08",
      lastRun: "2025-01-13",
      status: "active",
      schedule: "Daily",
      recipients: ["managers@company.com"],
      metrics: ["tasks_completed", "hours_logged", "efficiency_score"],
      charts: ["radar", "bar", "heatmap"],
      filters: ["user", "department", "date_range"],
    },
    {
      id: "rpt_003",
      name: "Bug Tracking Summary",
      description: "Bug discovery, resolution rates, and quality metrics",
      type: "summary",
      category: "Quality",
      author: "Praveen Kumar",
      created: "2025-01-05",
      lastRun: "2025-01-12",
      status: "active",
      schedule: "Bi-weekly",
      recipients: ["qa@company.com", "dev@company.com"],
      metrics: ["bugs_found", "bugs_fixed", "resolution_time"],
      charts: ["line", "bar", "gauge"],
      filters: ["severity", "project", "assignee"],
    },
    {
      id: "rpt_004",
      name: "Time Allocation Report",
      description:
        "Detailed breakdown of time spent across projects and activities",
      type: "detailed",
      category: "Time Tracking",
      author: "Mike Johnson",
      created: "2025-01-03",
      lastRun: "2025-01-13",
      status: "draft",
      schedule: "Monthly",
      recipients: ["pm@company.com"],
      metrics: ["billable_hours", "non_billable_hours", "utilization_rate"],
      charts: ["pie", "stacked_bar", "timeline"],
      filters: ["project", "user", "activity_type"],
    },
    {
      id: "rpt_005",
      name: "Client Satisfaction Dashboard",
      description: "Client feedback, SLA compliance, and satisfaction metrics",
      type: "dashboard",
      category: "Client",
      author: "Alex Chen",
      created: "2024-12-28",
      lastRun: "2025-01-11",
      status: "active",
      schedule: "Weekly",
      recipients: ["client@company.com", "management@company.com"],
      metrics: ["satisfaction_score", "sla_compliance", "response_time"],
      charts: ["gauge", "line", "radar"],
      filters: ["client", "project", "service_type"],
    },
  ]);

  const reportTemplates = [
    {
      id: "tpl_001",
      name: "Project Status Report",
      description: "Standard project progress and milestone tracking",
      category: "Project Management",
      metrics: ["progress", "milestones", "budget", "timeline"],
      icon: Target,
      color: "#007BFF",
    },
    {
      id: "tpl_002",
      name: "Team Performance Report",
      description: "Individual and team productivity analysis",
      category: "HR & Performance",
      metrics: ["productivity", "efficiency", "utilization", "satisfaction"],
      icon: Users,
      color: "#28A745",
    },
    {
      id: "tpl_003",
      name: "Quality Assurance Report",
      description: "Bug tracking and quality metrics dashboard",
      category: "Quality Assurance",
      metrics: [
        "bug_rate",
        "test_coverage",
        "defect_density",
        "resolution_time",
      ],
      icon: CheckCircle,
      color: "#FFC107",
    },
    {
      id: "tpl_004",
      name: "Financial Summary Report",
      description: "Budget tracking and financial performance",
      category: "Finance",
      metrics: ["budget_variance", "cost_per_hour", "revenue", "profitability"],
      icon: TrendingUp,
      color: "#DC3545",
    },
    {
      id: "tpl_005",
      name: "Time Tracking Report",
      description: "Detailed time allocation and billing analysis",
      category: "Time Management",
      metrics: [
        "billable_hours",
        "time_distribution",
        "efficiency",
        "overtime",
      ],
      icon: Clock,
      color: "#6C757D",
    },
    {
      id: "tpl_006",
      name: "Client Dashboard",
      description: "Client-facing project status and deliverables",
      category: "Client Relations",
      metrics: ["deliverables", "milestones", "satisfaction", "communication"],
      icon: Users,
      color: "#17A2B8",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#28A745] text-white";
      case "draft":
        return "bg-[#FFC107] text-white";
      case "archived":
        return "bg-[#6C757D] text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const runReport = (reportId: string) => {
    setCustomReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? { ...report, lastRun: new Date().toISOString().split("T")[0] }
          : report
      )
    );
    toast.success("Report executed successfully");
  };

  const duplicateReport = (report: any) => {
    const newReport = {
      ...report,
      id: `rpt_${Date.now()}`,
      name: `${report.name} (Copy)`,
      created: new Date().toISOString().split("T")[0],
      status: "draft",
    };
    setCustomReports((prev) => [newReport, ...prev]);
    toast.success("Report duplicated successfully");
  };

  const createReport = () => {
    const newReport = {
      id: `rpt_${Date.now()}`,
      name: "New Custom Report",
      description: "Custom report created from builder",
      type: "custom",
      category: "Custom",
      author: "Current User",
      created: new Date().toISOString().split("T")[0],
      lastRun: "Never",
      status: "draft",
      schedule: "Manual",
      recipients: [],
      metrics: ["completion_rate"],
      charts: ["bar"],
      filters: ["date_range"],
    };
    setCustomReports((prev) => [newReport, ...prev]);
    setShowReportBuilder(false);
    setSelectedReport(null);
    toast.success("Custom report created successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Custom Reports</h2>
          <p className="text-muted-foreground">
            Create, manage, and schedule custom reports for your team
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            size="sm"
            className="bg-[#28A745] hover:bg-[#218838] text-white"
            onClick={() => setShowReportBuilder(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#007BFF]/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-[#007BFF]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-xl font-semibold">{customReports.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#28A745]/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#28A745]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Reports</p>
              <p className="text-xl font-semibold">
                {customReports.filter((r) => r.status === "active").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FFC107]/10 rounded-lg">
              <Clock className="w-5 h-5 text-[#FFC107]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-xl font-semibold">
                {customReports.filter((r) => r.schedule !== "Manual").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#DC3545]/10 rounded-lg">
              <FileText className="w-5 h-5 text-[#DC3545]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Templates</p>
              <p className="text-xl font-semibold">{reportTemplates.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        {/* My Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {customReports.map((report) => (
              <Card
                key={report.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{report.name}</h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>By {report.author}</span>
                      <span>•</span>
                      <span>Created {report.created}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last run:</span>
                    <span>{report.lastRun}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span>{report.schedule}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recipients:</span>
                    <span>{report.recipients.length} users</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {report.metrics.slice(0, 3).map((metric) => (
                    <Badge key={metric} variant="outline" className="text-xs">
                      {metric.replace("_", " ")}
                    </Badge>
                  ))}
                  {report.metrics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{report.metrics.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#28A745] hover:bg-[#218838] text-white"
                    onClick={() => runReport(report.id)}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Run Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateReport(report)}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {reportTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card
                  key={template.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <IconComponent
                        className="w-6 h-6"
                        style={{ color: template.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Included Metrics:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.metrics.map((metric) => (
                        <Badge
                          key={metric}
                          variant="outline"
                          className="text-xs"
                        >
                          {metric.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setSelectedReport(template);
                      setShowReportBuilder(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Scheduled Reports</h3>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Report
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Report Name</th>
                    <th className="text-left py-3 px-4">Schedule</th>
                    <th className="text-left py-3 px-4">Next Run</th>
                    <th className="text-left py-3 px-4">Recipients</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customReports
                    .filter((r) => r.schedule !== "Manual")
                    .map((report, index) => (
                      <tr
                        key={report.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-4 font-medium">{report.name}</td>
                        <td className="py-3 px-4">{report.schedule}</td>
                        <td className="py-3 px-4">
                          {report.schedule === "Daily"
                            ? "Tomorrow 9:00 AM"
                            : report.schedule === "Weekly"
                            ? "Next Monday 9:00 AM"
                            : report.schedule === "Bi-weekly"
                            ? "Jan 27, 2025 9:00 AM"
                            : "Feb 1, 2025 9:00 AM"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{report.recipients.length} recipients</span>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Bell className="w-4 h-4" />
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

        {/* Shared Reports Tab */}
        <TabsContent value="shared" className="space-y-6">
          <Card className="p-6">
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Shared Reports</h3>
              <p className="text-muted-foreground mb-4">
                Reports shared with you by other team members will appear here
              </p>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Share a Report
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Builder Dialog */}
      <Dialog open={showReportBuilder} onOpenChange={setShowReportBuilder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReport
                ? `Create Report from ${selectedReport.name}`
                : "Custom Report Builder"}
            </DialogTitle>
            <DialogDescription>
              Build a custom report with your preferred metrics, visualizations,
              and filters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  placeholder="Enter report name"
                  defaultValue={
                    selectedReport ? `${selectedReport.name} Custom` : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportCategory">Category</Label>
                <Select
                  defaultValue={selectedReport?.category || "performance"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="time">Time Tracking</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDescription">Description</Label>
              <Textarea
                id="reportDescription"
                placeholder="Describe what this report will show..."
                defaultValue={selectedReport?.description || ""}
              />
            </div>

            {/* Metrics Selection */}
            <div className="space-y-4">
              <h4 className="font-medium">Select Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "completion_rate",
                  "budget_variance",
                  "timeline_adherence",
                  "tasks_completed",
                  "hours_logged",
                  "efficiency_score",
                  "bugs_found",
                  "bugs_fixed",
                  "resolution_time",
                  "billable_hours",
                  "utilization_rate",
                  "overtime_hours",
                ].map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Switch
                      id={metric}
                      defaultChecked={selectedReport?.metrics?.includes(metric)}
                    />
                    <Label htmlFor={metric} className="text-sm">
                      {metric
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Types */}
            <div className="space-y-4">
              <h4 className="font-medium">Visualization Types</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { type: "bar", label: "Bar Chart", icon: BarChart3 },
                  { type: "line", label: "Line Chart", icon: TrendingUp },
                  { type: "pie", label: "Pie Chart", icon: PieChart },
                  { type: "gauge", label: "Gauge", icon: Target },
                ].map((chart) => {
                  const IconComponent = chart.icon;
                  return (
                    <div
                      key={chart.type}
                      className="flex items-center space-x-2"
                    >
                      <Switch
                        id={chart.type}
                        defaultChecked={selectedReport?.charts?.includes(
                          chart.type
                        )}
                      />
                      <Label
                        htmlFor={chart.type}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{chart.label}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <h4 className="font-medium">Available Filters</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "project",
                  "user",
                  "date_range",
                  "status",
                  "priority",
                  "department",
                ].map((filter) => (
                  <div key={filter} className="flex items-center space-x-2">
                    <Switch
                      id={filter}
                      defaultChecked={selectedReport?.filters?.includes(filter)}
                    />
                    <Label htmlFor={filter} className="text-sm">
                      {filter
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h4 className="font-medium">Schedule & Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select defaultValue="manual">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients</Label>
                  <Input
                    id="recipients"
                    placeholder="Enter email addresses (comma separated)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowReportBuilder(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#28A745] hover:bg-[#218838] text-white"
              onClick={createReport}
            >
              Create Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Apply filters to refine your reports and focus on specific data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select
                value={reportFilters.dateRange}
                onValueChange={(value: any) =>
                  setReportFilters((prev) => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects */}
            <div className="space-y-2">
              <Label>Projects</Label>
              <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                {[
                  "E-commerce Platform",
                  "Mobile Application",
                  "API Integration",
                  "Dashboard Redesign",
                  "Security Audit",
                  "Data Migration",
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

            {/* Users */}
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                {[
                  "Rajesh Kumar",
                  "Praveen Kumar",
                  "Sarah Wilson",
                  "Mike Johnson",
                  "Jane Smith",
                  "Alex Chen",
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

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={reportFilters.status}
                  onValueChange={(value: any) =>
                    setReportFilters((prev) => ({ ...prev, status: value }))
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
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={reportFilters.priority}
                  onValueChange={(value: any) =>
                    setReportFilters((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowFilterDialog(false)}
            >
              Clear Filters
            </Button>
            <Button
              className="bg-[#28A745] hover:bg-[#218838] text-white"
              onClick={() => {
                setShowFilterDialog(false);
                toast.success("Filters applied successfully");
              }}
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
