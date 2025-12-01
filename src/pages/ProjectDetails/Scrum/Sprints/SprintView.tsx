import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  BarChart3,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { sprintsApiService, Sprint } from "../../../../services/sprintsApi";
import {
  ProjectMemberDetail,
  projectApiService,
  ProjectMastersResponse,
  ProjectStatusItem,
} from "../../../../services/projectApi";
import { SprintFormModal } from "./SprintFormModal";
import { SessionStorageService } from "../../../../utils/sessionStorage";
import { toast } from "sonner";

interface SprintViewProps {
  projectId?: string;
  user: any;
  project?: any;
}

export function SprintView({
  projectId: propProjectId,
  user,
  project,
}: SprintViewProps) {
  const effectiveProjectId =
    SessionStorageService.getEffectiveProjectId(propProjectId);

  if (!effectiveProjectId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Sprint Management</h2>
            <p className="text-muted-foreground">
              Manage project sprints and track progress
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Project Not Available</h3>
            <p className="text-muted-foreground">
              Unable to load project information. Please navigate back to
              projects and select a project.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectTeamLead, setProjectTeamLead] =
    useState<ProjectMemberDetail | null>(null);

  // Project Master Data
  const [projectMasters, setProjectMasters] =
    useState<ProjectMastersResponse | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<
    ProjectStatusItem[]
  >([]);

  useEffect(() => {
    if (effectiveProjectId) {
      fetchSprints();
      loadProjectMasters();
    }
  }, [effectiveProjectId]);

  useEffect(() => {
    if (project?.team_lead_detail) {
      setProjectTeamLead(project.team_lead_detail);
    }
  }, [project]);

  const loadProjectMasters = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching project masters");
      return;
    }

    try {
      const masters = await projectApiService.getProjectMasters();
      setProjectMasters(masters);
      setAvailableStatuses(masters.statuses || []);
    } catch (error) {
      console.error("Error loading project masters:", error);
      // Continue with default options if API fails
      setAvailableStatuses([]);
    }
  };

  const fetchSprints = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching sprints");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await sprintsApiService.getSprints(effectiveProjectId);
      setSprints(response.items);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      toast.error("Failed to fetch sprints");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      await sprintsApiService.deleteSprint(sprintId);
      toast.success("Sprint deleted successfully");
      fetchSprints();
    } catch (error) {
      console.error("Error deleting sprint:", error);
      toast.error("Failed to delete sprint");
    }
  };

  const handleUpdateSprintStatus = async (sprintId: string, status: string) => {
    try {
      await sprintsApiService.updateSprintStatus(sprintId, status);
      toast.success("Sprint status updated successfully");
      fetchSprints();
    } catch (error) {
      console.error("Error updating sprint status:", error);
      toast.error("Failed to update sprint status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getBurndownTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "on track":
        return <Minus className="w-4 h-4 text-green-600" />;
      case "ahead":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "behind":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusActionButton = (sprint: Sprint) => {
    switch (sprint.status.toLowerCase()) {
      case "planning":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUpdateSprintStatus(sprint.id, "active")}
            className="text-green-600 hover:text-green-700"
          >
            <Play className="w-3 h-3 mr-1" />
            Start
          </Button>
        );
      case "active":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUpdateSprintStatus(sprint.id, "completed")}
            className="text-blue-600 hover:text-blue-700"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Complete
          </Button>
        );
      default:
        return null;
    }
  };

  const filteredSprints = sprints.filter((sprint) => {
    const matchesSearch =
      sprint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sprint.goal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      sprint.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredSprints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSprints = filteredSprints.slice(startIndex, endIndex);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const SprintTable = ({ sprints }: { sprints: Sprint[] }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sprint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Velocity
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sprints.map((sprint) => {
              const completionPercentage =
                sprint.total_points > 0
                  ? Math.round(
                      (sprint.completed_points / sprint.total_points) * 100
                    )
                  : 0;

              return (
                <tr
                  key={sprint.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {sprint.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {sprint.goal}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={getStatusColor(sprint.status)}
                    >
                      {sprint.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div>
                          {new Date(sprint.start_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          to {new Date(sprint.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600 min-w-[3rem]">
                        {sprint.completed_points}/{sprint.total_points}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {sprint.team_size} members
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getBurndownTrendIcon(sprint.burndown_trend)}
                      <span className="ml-2 text-sm font-medium">
                        {sprint.velocity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {getStatusActionButton(sprint)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedSprint(sprint);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-50"
                        onClick={() => handleDeleteSprint(sprint.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const SprintCard = ({ sprint }: { sprint: Sprint }) => {
    const completionPercentage =
      sprint.total_points > 0
        ? Math.round((sprint.completed_points / sprint.total_points) * 100)
        : 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold">{sprint.name}</h3>
                <Badge
                  variant="outline"
                  className={getStatusColor(sprint.status)}
                >
                  {sprint.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {sprint.goal}
              </p>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                    {new Date(sprint.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{sprint.team_size} members</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {getStatusActionButton(sprint)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setShowEditModal(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteSprint(sprint.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Story Points Progress</span>
                <span>
                  {sprint.completed_points}/{sprint.total_points} (
                  {completionPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tasks Progress</span>
                <span>
                  {sprint.completed_tasks}/{sprint.total_tasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      sprint.total_tasks > 0
                        ? Math.round(
                            (sprint.completed_tasks / sprint.total_tasks) * 100
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Sprint Metrics */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {sprint.velocity}
              </div>
              <div className="text-xs text-muted-foreground">Velocity</div>
            </div>
            <div className="flex items-center justify-center space-x-1">
              {getBurndownTrendIcon(sprint.burndown_trend)}
              <span className="text-sm">{sprint.burndown_trend}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - Title and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Sprint Management
          </h1>
          <p className="text-muted-foreground  mt-1">
            Manage project sprints and track progress
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#28A745] hover:bg-[#218838] text-white px-6 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Sprint
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sprints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80 h-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {availableStatuses && availableStatuses.length > 0 ? (
                availableStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.name.toLowerCase()}>
                    {status.name}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="h-8 px-3"
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3"
            >
              <List className="w-4 h-4 mr-1" />
              Table
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold">
              {startIndex + 1}-{Math.min(endIndex, totalItems)}
            </span>{" "}
            of <span className="font-semibold">{totalItems}</span> sprints
          </div>
        </div>
      </div>

      {/* Sprint Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#007BFF]">
              {
                sprints.filter((s) => s.status.toLowerCase() === "active")
                  .length
              }
            </div>
            <div className="text-xs text-muted-foreground">Active Sprints</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#28A745]">
              {
                sprints.filter((s) => s.status.toLowerCase() === "completed")
                  .length
              }
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#FFC107]">
              {sprints.reduce((sum, s) => sum + s.total_points, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#DC3545]">
              {sprints.reduce((sum, s) => sum + s.velocity, 0) /
                Math.max(sprints.length, 1)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Velocity</div>
          </CardContent>
        </Card>
      </div>

      {/* Sprints List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28A745] mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading sprints...</p>
          </div>
        ) : filteredSprints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No sprints found</h3>
              <p className="text-muted-foreground mb-4">
                {sprints.length === 0
                  ? "Get started by creating your first sprint."
                  : "No sprints match your current filters."}
              </p>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Sprint
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <SprintTable sprints={paginatedSprints} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedSprints.map((sprint) => (
              <SprintCard key={sprint.id} sprint={sprint} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Sprint Modal */}
      <SprintFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchSprints();
        }}
        projectId={effectiveProjectId || ""}
        projectTeamLead={projectTeamLead}
        mode="create"
        availableStatuses={availableStatuses}
      />

      {/* Edit Sprint Modal */}
      <SprintFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSprint(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedSprint(null);
          fetchSprints();
        }}
        projectId={effectiveProjectId || ""}
        projectTeamLead={projectTeamLead}
        mode="edit"
        sprint={selectedSprint}
        availableStatuses={availableStatuses}
      />
    </div>
  );
}
