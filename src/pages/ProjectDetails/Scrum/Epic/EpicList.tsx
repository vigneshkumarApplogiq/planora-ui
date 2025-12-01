import React, { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../../components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  epicApiService,
  Epic,
  EpicsResponse,
} from "../../../../services/epicApi";
import {
  projectApiService,
  ProjectMastersResponse,
  ProjectStatusItem,
  ProjectPriorityItem,
} from "../../../../services/projectApi";
import { EpicCreateModal } from "./EpicCreateModal";
import { EpicViewEditModal } from "./EpicViewEditModal";
import { toast } from "sonner";

interface EpicListProps {
  projectId: string;
  user: any;
  teamMembers?: any[];
}

export function EpicList({ projectId, user, teamMembers = [] }: EpicListProps) {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [showViewEditModal, setShowViewEditModal] = useState(false);

  // Project Master Data
  const [projectMasters, setProjectMasters] =
    useState<ProjectMastersResponse | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<
    ProjectStatusItem[]
  >([]);
  const [availablePriorities, setAvailablePriorities] = useState<
    ProjectPriorityItem[]
  >([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Filters and Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [itemsPerPage] = useState(10);

  const loadProjectMasters = async () => {
    try {
      setLoadingMasters(true);
      const masters = await projectApiService.getProjectMasters();
      console.log("masters: ", masters);
      setProjectMasters(masters);

      // Filter active statuses and priorities, sorted by sort_order
      const activeStatuses = masters.statuses
        ?.filter((status) => status.is_active)
        ?.sort((a, b) => a.sort_order - b.sort_order);

      const activePriorities = masters.priorities
        ?.filter((priority) => priority.is_active)
        ?.sort((a, b) => a.sort_order - b.sort_order);

      setAvailableStatuses(activeStatuses);
      setAvailablePriorities(activePriorities);
    } catch (error) {
      console.error("Error loading project masters:", error);
      // Fallback to default values
      setAvailableStatuses([
        {
          id: "1",
          name: "Not Started",
          description: "",
          is_active: true,
          sort_order: 1,
          created_at: "",
          updated_at: "",
          color: "#gray",
        },
        {
          id: "2",
          name: "In Progress",
          description: "",
          is_active: true,
          sort_order: 2,
          created_at: "",
          updated_at: "",
          color: "#blue",
        },
        {
          id: "3",
          name: "Completed",
          description: "",
          is_active: true,
          sort_order: 3,
          created_at: "",
          updated_at: "",
          color: "#green",
        },
        {
          id: "4",
          name: "On Hold",
          description: "",
          is_active: true,
          sort_order: 4,
          created_at: "",
          updated_at: "",
          color: "#yellow",
        },
        {
          id: "5",
          name: "Cancelled",
          description: "",
          is_active: true,
          sort_order: 5,
          created_at: "",
          updated_at: "",
          color: "#red",
        },
      ]);
      setAvailablePriorities([
        {
          id: "1",
          name: "Low",
          description: "",
          is_active: true,
          sort_order: 1,
          created_at: "",
          updated_at: "",
          color: "#green",
          level: 1,
        },
        {
          id: "2",
          name: "Medium",
          description: "",
          is_active: true,
          sort_order: 2,
          created_at: "",
          updated_at: "",
          color: "#yellow",
          level: 2,
        },
        {
          id: "3",
          name: "High",
          description: "",
          is_active: true,
          sort_order: 3,
          created_at: "",
          updated_at: "",
          color: "#orange",
          level: 3,
        },
        {
          id: "4",
          name: "Critical",
          description: "",
          is_active: true,
          sort_order: 4,
          created_at: "",
          updated_at: "",
          color: "#red",
          level: 4,
        },
      ]);
      toast.error("Failed to load project settings, using defaults");
    } finally {
      setLoadingMasters(false);
    }
  };

  const loadEpics = async (page = 1) => {
    try {
      setLoading(true);
      const response: EpicsResponse = await epicApiService.getEpics(
        page,
        itemsPerPage,
        projectId,
        statusFilter === "all" ? undefined : statusFilter,
        priorityFilter === "all" ? undefined : priorityFilter,
        undefined,
        searchTerm
      );
      console.log(response, "responseadasdsad");
      setEpics(response.items);
      setTotalItems(response.total);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Error loading epics:", error);
      toast.error("Failed to load epics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectMasters();
  }, []);

  useEffect(() => {
    loadEpics();
  }, [projectId, searchTerm, statusFilter, priorityFilter]);

  const handleCreateEpic = () => {
    setShowCreateModal(true);
  };

  const handleViewEpic = (epic: Epic) => {
    setSelectedEpic(epic);
    setShowViewEditModal(true);
  };

  const handleDeleteEpic = async (epicId: string) => {
    try {
      await epicApiService.deleteEpic(epicId);
      toast.success("Epic deleted successfully");
      loadEpics(currentPage);
    } catch (error) {
      console.error("Error deleting epic:", error);
      toast.error("Failed to delete epic");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "on hold":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "high":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header - Title and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Epic Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage project epics and track their progress
          </p>
        </div>
        <Button
          onClick={handleCreateEpic}
          className="bg-[#28A745] hover:bg-[#218838] text-white px-6 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Epic
        </Button>
      </div>

      {/* Filters and Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search epics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80 h-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {loadingMasters ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : (
                availableStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: status.color || "#gray" }}
                      />
                      <span>{status.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {loadingMasters ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : (
                availablePriorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.name}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: priority.color || "#gray" }}
                      />
                      <span>{priority.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({priority.level})
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
            <Button
              variant={"ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="h-8 px-3 bg-muted-foreground"
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={"ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3 bg-muted-foreground"
            >
              <List className="w-4 h-4 mr-1" />
              Table
            </Button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted">
            Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
            epics
          </div>
        </div>
      </div>

      {/* Epic Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-[#007BFF] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#007BFF]">
              {epics?.filter((epic) => epic.status === "In Progress").length}
            </div>
            <div className="text-xs text-muted-foreground">Active Epics</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-[#28A745] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#28A745]">
              {epics?.filter((epic) => epic.status === "Completed").length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-[#FFC107] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#FFC107]">
              {Math.round(
                epics?.reduce(
                  (sum, epic) => sum + (epic.completion_percentage || 0),
                  0
                ) / Math.max(epics?.length, 1)
              )}
              %
            </div>
            <div className="text-xs text-muted-foreground">Avg Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-[#DC3545] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#DC3545]">
              {
                epics?.filter(
                  (epic) =>
                    epic.priority === "High" || epic.priority === "Critical"
                )?.length
              }
            </div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#28A745] mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading epics...</p>
          </div>
        ) : epics?.length > 0 ? (
          viewMode === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700 bg-muted">
                    <TableHead className="font-semibold text-foreground px-6 py-4">
                      Title
                    </TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">
                      Priority
                    </TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">
                      Assignee
                    </TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">
                      Progress
                    </TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">
                      Due Date
                    </TableHead>
                    <TableHead className="font-semibold text-foreground px-6 py-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epics.map((epic) => (
                    <TableRow
                      key={epic.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer"
                      onClick={() => handleViewEpic(epic)}
                    >
                      <TableCell className="px-4 py-4">
                        <div className="space-y-1 max-w-xs">
                          <div className="font-medium text-foreground line-clamp-1">
                            {epic.title}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {epic.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(
                            epic.status
                          )} font-medium px-3 py-1 rounded-full`}
                        >
                          {epic.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="secondary"
                          className={`${getPriorityColor(
                            epic.priority
                          )} font-medium px-3 py-1 rounded-full`}
                        >
                          {epic.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8 ring-2 ring-green-100 dark:ring-green-900">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                                epic.assignee_name || "unassigned"
                              }`}
                              alt={epic.assignee_name}
                            />
                            <AvatarFallback className="bg-[#28A745] text-white text-sm font-medium">
                              {epic.assignee_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {epic.assignee_name || "Unassigned"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="space-y-2 min-w-[120px]">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-muted">
                              {epic.completion_percentage}%
                            </span>
                            <span className="text-muted text-xs">
                              {epic.completed_story_points}/
                              {epic.total_story_points} SP
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-[#28A745] h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${epic.completion_percentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center space-x-2 text-sm text-muted">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(epic.due_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleViewEpic(epic);
                            }}
                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e: React.MouseEvent) =>
                                  e.stopPropagation()
                                }
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Epic</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{epic.title}
                                  "? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEpic(epic.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2">
              {epics?.map((epic) => (
                <Card
                  key={epic.id}
                  className="group relative overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-[1.02] border  cursor-pointer"
                  onClick={() => handleViewEpic(epic)}
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      epic.status === "Completed"
                        ? "bg-gradient-to-r from-green-400 to-green-600"
                        : epic.status === "In Progress"
                        ? "bg-gradient-to-r from-blue-400 to-blue-600"
                        : epic.status === "Planning"
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                        : "bg-gradient-to-r from-gray-400 to-gray-600"
                    }`}
                  />

                  <CardContent className="p-4">
                    <div className="space-y-5">
                      {/* Header with Action Buttons */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-bold text-muted text-lg leading-tight">
                              {epic.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {epic.description}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleViewEpic(epic);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 rounded-full"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleViewEpic(epic);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Status and Priority Badges */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant="outline"
                            className={`px-3 py-1 font-semibold text-xs rounded-full  ${
                              epic.status === "Completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : epic.status === "In Progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : epic.status === "Planning"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {epic.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`px-3 py-1 font-semibold text-xs rounded-full  ${
                              epic.priority === "Critical"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : epic.priority === "High"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : epic.priority === "Medium"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {epic.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="bg-muted rounded-lg p-4  space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Progress
                            </span>
                          </div>
                          <span className="text-xl font-bold text-foreground">
                            {epic.completion_percentage}%
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              epic.completion_percentage >= 80
                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                : epic.completion_percentage >= 50
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                : "bg-gradient-to-r from-blue-400 to-blue-600"
                            }`}
                            style={{ width: `${epic.completion_percentage}%` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </div>
                      </div>

                      {/* Bottom Info */}
                      <div className="flex items-center justify-between pt-4 ">
                        {/* Assignee */}
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10 ring-2 ring-blue-100 dark:ring-blue-900">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                                  epic.assignee_name || "unassigned"
                                }`}
                                alt={epic.assignee_name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                                {epic.assignee_name
                                  ? epic.assignee_name
                                      .substring(0, 2)
                                      .toUpperCase()
                                  : "UN"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {epic.assignee_name || "Unassigned"}
                            </span>
                            <p className="text-xs text-gray-500">Assignee</p>
                          </div>
                        </div>

                        {/* Due Date */}
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {epic.due_date
                                ? formatDate(epic.due_date)
                                : "No due date"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Due date</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Hover overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Card>
              ))}
            </div>
          )
        ) : null}

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
                onClick={() => loadEpics(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadEpics(currentPage - 1)}
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
                    onClick={() => loadEpics(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadEpics(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadEpics(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <EpicCreateModal
          projectId={projectId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadEpics();
            setShowCreateModal(false);
          }}
          user={user}
          teamMembers={teamMembers}
          availableStatuses={projectMasters?.statuses}
          availablePriorities={projectMasters?.priorities}
        />
      )}

      {showViewEditModal && selectedEpic && (
        <EpicViewEditModal
          epic={selectedEpic}
          isOpen={showViewEditModal}
          onClose={() => {
            setShowViewEditModal(false);
            setSelectedEpic(null);
          }}
          onSuccess={() => {
            loadEpics();
            setShowViewEditModal(false);
            setSelectedEpic(null);
          }}
          user={user}
          teamMembers={teamMembers}
          availableStatuses={projectMasters?.statuses}
          availablePriorities={projectMasters?.priorities}
        />
      )}
    </div>
  );
}
