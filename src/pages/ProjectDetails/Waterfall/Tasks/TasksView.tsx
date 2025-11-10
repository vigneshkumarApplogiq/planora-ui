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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Target,
  AlertTriangle,
  Flag,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Timer,
} from "lucide-react";
import { TaskModal } from "./TaskModal";
import {
  taskApiService,
  Task,
  CreateTaskRequest,
} from "../../../../services/taskApi";
import { storiesApiService, Story } from "../../../../services/storiesApi";
import { sprintApiService, Sprint } from "../../../../services/sprintApi";
import {
  projectApiService,
  ProjectMastersResponse,
  ProjectStatusItem,
  ProjectPriorityItem,
  ProjectMember,
  ProjectMemberDetail,
} from "../../../../services/projectApi";
import { phaseApiService, Phase } from "../../../../services/phaseApi";
import {
  milestoneApiService,
  Milestone,
} from "../../../../services/milestoneApi";
import {
  deliverableApiService,
  Deliverable,
} from "../../../../services/deliverableApi";
import {
  getEnrichedTeamMemberDetails,
  getAssigneeDisplayInfo,
  EnrichedMemberDetail,
} from "../../../../utils/teamMemberDetails";
import { toast } from "sonner";
import { SessionStorageService } from "../../../../utils/sessionStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../../components/ui/dialog";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { timesheetApiService } from "../../../../services/timesheetApi";

interface TasksViewProps {
  projectId?: string;
  user: any;
  project?: any;
}

export function TasksView({
  projectId: propProjectId,
  user,
  project,
}: TasksViewProps) {
  // Get effective project ID from props or session storage
  const effectiveProjectId =
    SessionStorageService.getEffectiveProjectId(propProjectId);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterMilestone, setFilterMilestone] = useState("all");
  const [filterDeliverable, setFilterDeliverable] = useState("all");
  const [viewMode, setViewMode] = useState<"board" | "list" | "table">("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTaskData, setCreateTaskData] = useState<CreateTaskRequest>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    project_id: effectiveProjectId || "",
    phase_id: null,
    milestone_id: null,
    deliverable_id: null,
    assignee_id: null,
    start_date: "",
    due_date: "",
    progress: 0,
    tags: [],
    subtasks: [],
    comments: [],
    attachments: [],
    is_active: true,
  });

  // Project Master Data
  const [projectMasters, setProjectMasters] =
    useState<ProjectMastersResponse | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<
    ProjectStatusItem[]
  >([]);
  const [availablePriorities, setAvailablePriorities] = useState<
    ProjectPriorityItem[]
  >([]);
  const [projectTeamMembers, setProjectTeamMembers] = useState<
    ProjectMemberDetail[]
  >([]);
  const [projectTeamLead, setProjectTeamLead] =
    useState<ProjectMemberDetail | null>(null);
  const [enrichedMembersMap, setEnrichedMembersMap] = useState<
    Map<string, EnrichedMemberDetail>
  >(new Map());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // Time logging state
  const [showLogTimeDialog, setShowLogTimeDialog] = useState(false);
  const [selectedTaskForTimeLog, setSelectedTaskForTimeLog] =
    useState<Task | null>(null);
  const [logTimeData, setLogTimeData] = useState({
    hours: "",
    description: "",
    activityType: "development" as
      | "development"
      | "testing"
      | "design"
      | "review"
      | "meeting"
      | "documentation"
      | "bug_fixing"
      | "other",
  });

  // Load team members from project data when available (same as BacklogView)
  useEffect(() => {
    if (project?.team_members_detail && project?.team_lead_detail) {
      setProjectTeamMembers(project.team_members_detail);
      setProjectTeamLead(project.team_lead_detail);

      // Load enriched member details
      loadEnrichedMemberDetails([
        ...project.team_members_detail,
        project.team_lead_detail,
      ]);
    }
  }, [project]);

  // Update view mode based on methodology
  useEffect(() => {
    if (project?.methodology === "Kanban") {
      setViewMode("list");
    }
  }, [project?.methodology]);

  const loadEnrichedMemberDetails = async (members: ProjectMemberDetail[]) => {
    try {
      const enrichedMap = await getEnrichedTeamMemberDetails(members);
      setEnrichedMembersMap(enrichedMap);
    } catch (error) {
      console.error("Error loading enriched member details:", error);
    }
  };

  // Load tasks, phases, milestones, and deliverables when component mounts or project changes
  useEffect(() => {
    if (effectiveProjectId) {
      fetchTasks();
      fetchPhases();
      fetchMilestones();
      fetchDeliverables();
      loadProjectMasters();
    }
  }, [effectiveProjectId]);

  // Refetch tasks when pagination or filters change
  useEffect(() => {
    if (effectiveProjectId) {
      fetchTasks();
    }
  }, [currentPage, perPage, filterStatus, filterAssignee]);

  // Reset to page 1 when filters change (excluding milestone and deliverable as they are client-side)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [
    filterStatus,
    filterAssignee,
    filterMilestone,
    filterDeliverable,
    searchTerm,
  ]);

  const loadProjectMasters = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching project masters");
      return;
    }

    try {
      const masters = await projectApiService.getProjectMasters();

      setProjectMasters(masters);
      // Use task_status for task-specific statuses, not general project statuses
      setAvailableStatuses(masters.task_status || []);
      setAvailablePriorities(masters.priorities || []);

      console.log("Task Status loaded from masters:", masters.task_status);
    } catch (error) {
      console.error("Error fetching project masters:", error);
    }
  };

  const fetchTasks = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching tasks");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Pass pagination and filter parameters to API
      const response = await storiesApiService.getStories(
        effectiveProjectId,
        currentPage,
        perPage,
        filterStatus !== "all" ? filterStatus : undefined,
        filterAssignee !== "all" && filterAssignee !== "unassigned"
          ? filterAssignee
          : filterAssignee === "unassigned"
          ? ""
          : undefined
      );

      // Update pagination metadata
      setTotalPages(response.total_pages || 1);
      setTotalItems(response.total || 0);

      // Convert Story data to Task format
      const convertedTasks: Task[] = response.items.map((story: Story) => ({
        id: story.id,
        task_id: story.task_id,
        title: story.title,
        description: story.description,
        status: story.status,
        priority: story.priority,
        project_id: story.project_id,
        sprint_id: story.sprint_id,
        sprint_name: story.sprint_id
          ? sprints.find((s) => s.id === story.sprint_id)?.name
          : undefined,
        assignee_name: story.assignee_name,
        assignee_id: story.assignee_id,
        // Preserve nested assignee object for proper loading in TaskModal
        assignee: story.assignee,
        progress: story.progress || 0,
        tags: story.tags || [],
        subtasks: [],
        // Preserve comments from API response
        comments: story.comments || [],
        attachments: [],
        // Preserve files array from API response
        files: story.files,
        // Preserve Waterfall fields
        phase_id: story.phase_id,
        phase_name: story.phase_name,
        milestone_id: story.milestone_id,
        milestone_name: story.milestone_name,
        deliverable_id: story.deliverable_id,
        deliverable_name: story.deliverable_name,
        is_active: true,
        created_at: story.start_date,
        updated_at: story.end_date,
      }));

      setTasks(convertedTasks);
    } catch (error) {
      console.error("Error fetching stories:", error);
      // Convert mock data to match our Task interface
      const mockTasks: Task[] = BOARD_TASKS.map((mockTask) => ({
        id: mockTask.id,
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        priority: mockTask.priority,
        project_id: effectiveProjectId,
        sprint_id:
          mockTask.sprint === "Unassigned"
            ? null
            : mockTask.sprint.toLowerCase().replace(" ", "-"),
        sprint_name:
          mockTask.sprint === "Unassigned" ? undefined : mockTask.sprint,
        assignee_name: mockTask.assignee,
        assignee_id: null,
        progress: Math.floor(Math.random() * 100), // Random progress for demo
        tags: mockTask.labels,
        subtasks: [],
        comments: [],
        attachments: [],
        is_active: true,
        created_at: mockTask.createdAt,
        updated_at: mockTask.updatedAt,
      }));

      setTasks(mockTasks);
      toast.success("Using demo data (API not available)");
    } finally {
      setLoading(false);
    }
  };

  const fetchPhases = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching phases");
      return;
    }

    try {
      const response = await phaseApiService.getPhases(effectiveProjectId);
      setPhases(response.items);
    } catch (error) {
      console.error("Error fetching phases:", error);
    }
  };

  const fetchMilestones = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching milestones");
      return;
    }

    try {
      const response = await milestoneApiService.getMilestones(
        effectiveProjectId
      );
      setMilestones(response.items);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  };

  const fetchDeliverables = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching deliverables");
      return;
    }

    try {
      const response = await deliverableApiService.getDeliverables(
        effectiveProjectId
      );
      setDeliverables(response.items);
    } catch (error) {
      console.error("Error fetching deliverables:", error);
    }
  };

  const handleCreateTask = async () => {
    try {
      if (!createTaskData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (!effectiveProjectId) {
        toast.error("Project ID is required");
        return;
      }

      // Convert Task data to Story format for API
      const storyData = {
        title: createTaskData.title,
        description: createTaskData.description,
        story_type: "story",
        priority: createTaskData.priority,
        status: createTaskData.status,
        project_id: effectiveProjectId,
        phase_id: createTaskData.phase_id || undefined,
        milestone_id: createTaskData.milestone_id || undefined,
        deliverable_id: createTaskData.deliverable_id || undefined,
        assignee_id: createTaskData.assignee_id || undefined,
        progress: createTaskData.progress || 0,
        start_date: createTaskData.start_date,
        end_date: createTaskData.due_date,
        tags: createTaskData.tags || [],
        labels: createTaskData.tags || [],
      };

      try {
        await storiesApiService.createStory(storyData);
        toast.success("Task created successfully");
      } catch (apiError) {
        // API not available, show demo message
        toast.success("Task creation demo (API not available)");
      }

      setShowCreateModal(false);
      setCreateTaskData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        project_id: effectiveProjectId || "",
        phase_id: null,
        milestone_id: null,
        deliverable_id: null,
        assignee_id: null,
        start_date: "",
        due_date: "",
        progress: 0,
        tags: [],
        subtasks: [],
        comments: [],
        attachments: [],
        is_active: true,
      });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    try {
      // Convert Task data to Story format for API
      const storyUpdateData = {
        title: taskData.title,
        description: taskData.description,
        story_type: taskData.type || "story",
        priority: taskData.priority,
        status: taskData.status,
        phase_id: taskData.phase_id || undefined,
        milestone_id: taskData.milestone_id || undefined,
        deliverable_id: taskData.deliverable_id || undefined,
        assignee_id: taskData.assignee_id || undefined,
        progress: taskData.progress || 0,
        tags: taskData.tags || [],
        labels: taskData.tags || [],
        comments: taskData.comments || [],
      };

      try {
        await storiesApiService.updateStory(taskId, storyUpdateData);
        toast.success("Task updated successfully");
      } catch (apiError) {
        // API not available, update local state for demo
        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, ...taskData } : task
        );
        setTasks(updatedTasks);
        toast.success("Task updated successfully (demo mode)");
      }

      setSelectedTask(null);
      fetchTasks(); // Always refresh to get latest data
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      setIsDeleting(true);
      // Use storiesApiService instead of taskApiService
      await storiesApiService.deleteStory(deleteTaskId);
      toast.success("Task deleted successfully");
      setDeleteTaskId(null);
      if (selectedTask?.id === deleteTaskId) {
        setSelectedTask(null);
      }
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogTime = (task: Task) => {
    setSelectedTaskForTimeLog(task);
    setLogTimeData({
      hours: "",
      description: "",
      activityType: "development",
    });
    setShowLogTimeDialog(true);
  };

  const handleSubmitLogTime = async () => {
    if (!selectedTaskForTimeLog || !logTimeData.hours) {
      toast.error("Please enter hours");
      return;
    }

    const hours = parseFloat(logTimeData.hours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Please enter valid hours");
      return;
    }

    try {
      await timesheetApiService.logTimeForTask(
        selectedTaskForTimeLog.id!,
        hours,
        logTimeData.description,
        logTimeData.activityType
      );

      toast.success("Time logged successfully");
      setShowLogTimeDialog(false);
      setSelectedTaskForTimeLog(null);
      setLogTimeData({
        hours: "",
        description: "",
        activityType: "development",
      });
    } catch (error) {
      console.error("Failed to log time:", error);
      toast.error("Failed to log time");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "review":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "done":
        return "bg-green-100 text-green-800 border-green-300";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "story":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "bug":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "epic":
        return <Flag className="w-4 h-4 text-purple-600" />;
      case "task":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Target className="w-4 h-4 text-blue-600" />;
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesAssignee =
      filterAssignee === "all" ||
      (filterAssignee === "unassigned" && !task.assignee_name) ||
      (task.assignee_name && task.assignee_name === filterAssignee);
    const matchesMilestone =
      filterMilestone === "all" ||
      (filterMilestone === "unassigned" && !task.milestone_id) ||
      task.milestone_id === filterMilestone;
    const matchesDeliverable =
      filterDeliverable === "all" ||
      (filterDeliverable === "unassigned" && !task.deliverable_id) ||
      task.deliverable_id === filterDeliverable;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAssignee &&
      matchesMilestone &&
      matchesDeliverable
    );
  });

  const TableView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead className="w-[35%]">Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead>Deliverable</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTask(task)}
              >
                <TableCell className="font-medium text-xs">
                  {task.task_id || task.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{task.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {task.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusColor(task.status)}
                  >
                    {task.status.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getPriorityColor(task.priority)}
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.milestone_id ? (
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800 border-purple-300"
                    >
                      {milestones.find((m) => m.id === task.milestone_id)
                        ?.name || "Milestone"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.deliverable_id ? (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-300"
                    >
                      {deliverables.find((d) => d.id === task.deliverable_id)
                        ?.name || "Deliverable"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const assigneeInfo = getAssigneeDisplayInfo(
                        task.assignee_id || null,
                        task.assignee_name || null,
                        enrichedMembersMap
                      );
                      return (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-[#28A745] text-white text-xs">
                              {assigneeInfo.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">
                            {assigneeInfo.name}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#28A745] h-2 rounded-full"
                        style={{ width: `${task.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {task.progress || 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleLogTime(task);
                        }}
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        Log Time
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setDeleteTaskId(task.id || null);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const ListView = () => (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <Card
          key={task.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedTask(task)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1 truncate">
                    {task.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={getStatusColor(task.status)}
                    style={{ fontSize: "10px" }}
                  >
                    {task.status.replace("-", " ")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getPriorityColor(task.priority)}
                    style={{ fontSize: "10px" }}
                  >
                    {task.priority}
                  </Badge>
                  {task.progress > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {task.progress}%
                    </Badge>
                  )}
                  {task.milestone_id && (
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800 border-purple-300 text-xs"
                    >
                      {milestones.find((m) => m.id === task.milestone_id)
                        ?.name || "Milestone"}
                    </Badge>
                  )}
                  {task.deliverable_id && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-300 text-xs"
                    >
                      {deliverables.find((d) => d.id === task.deliverable_id)
                        ?.name || "Deliverable"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {(() => {
                    const assigneeInfo = getAssigneeDisplayInfo(
                      task.assignee_id || null,
                      task.assignee_name || null,
                      enrichedMembersMap
                    );
                    return (
                      <>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-[#28A745] text-white text-xs">
                            {assigneeInfo.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-muted-foreground truncate">
                            {assigneeInfo.name}
                          </span>
                          {assigneeInfo.isAssigned && (
                            <div className="flex flex-col text-xs text-muted-foreground/70">
                              <span className="truncate">
                                {assigneeInfo.role}
                              </span>
                              {assigneeInfo.email && (
                                <span className="truncate">
                                  {assigneeInfo.email}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleLogTime(task);
                    }}
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Log Time
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setDeleteTaskId(task.id || null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <p className="text-muted-foreground">
            Manage project tasks and user stories
          </p>
        </div>

        <Button
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
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
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {projectTeamMembers.length > 0
                ? projectTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))
                : Array.from(
                    new Set(
                      tasks.map((task) => task.assignee_name).filter(Boolean)
                    )
                  ).map((assignee) => (
                    <SelectItem key={assignee} value={assignee}>
                      {assignee}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          <Select value={filterMilestone} onValueChange={setFilterMilestone}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Milestone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Milestones</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {milestones.map((milestone) => (
                <SelectItem key={milestone.id} value={milestone.id || ""}>
                  {milestone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterDeliverable}
            onValueChange={setFilterDeliverable}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Deliverable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deliverables</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {deliverables.map((deliverable) => (
                <SelectItem key={deliverable.id} value={deliverable.id || ""}>
                  {deliverable.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hide board view for Kanban methodology */}
        {project?.methodology !== "Kanban" ? (
          <Tabs
            value={viewMode}
            onValueChange={(value: string) =>
              setViewMode(value as "board" | "list" | "table")
            }
          >
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div className="text-sm text-muted-foreground font-medium">
            List View
          </div>
        )}
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-[#007BFF] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#007BFF]">
              {tasks.filter((t) => t.status === "todo").length}
            </div>
            <div className="text-xs text-muted-foreground">To Do</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-[#FFC107] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#FFC107]">
              {tasks.filter((t) => t.status === "in-progress").length}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-[#28A745] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#28A745]">
              {tasks.filter((t) => t.status === "done").length}
            </div>
            <div className="text-xs text-muted-foreground">Done</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-5 h-5 text-[#DC3545] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#DC3545]">
              {Math.round(
                tasks.reduce((sum, t) => sum + (t.progress || 0), 0) /
                  Math.max(tasks.length, 1)
              )}
              %
            </div>
            <div className="text-xs text-muted-foreground">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#28A745] mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first task.
              </p>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* For Kanban methodology, only show list view */}
            {project?.methodology === "Kanban" ? (
              <ListView />
            ) : (
              <>
                {viewMode === "table" && <TableView />}
                {viewMode === "list" && <ListView />}
              </>
            )}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && tasks.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * perPage + 1} to{" "}
            {Math.min(currentPage * perPage, totalItems)} of {totalItems} tasks
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={perPage.toString()}
              onValueChange={(value) => {
                setPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            if (selectedTask?.id) {
              handleUpdateTask(selectedTask.id, updatedTask);
            }
          }}
          user={user}
          availableStatuses={availableStatuses}
          availablePriorities={availablePriorities}
          projectTeamMembers={projectTeamMembers}
          projectTeamLead={projectTeamLead || undefined}
          phases={phases}
          milestones={milestones}
          deliverables={deliverables}
        />
      )}

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={createTaskData.title}
                onChange={(e) =>
                  setCreateTaskData({
                    ...createTaskData,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description"
                rows={3}
                value={createTaskData.description}
                onChange={(e) =>
                  setCreateTaskData({
                    ...createTaskData,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={createTaskData.status}
                  onValueChange={(value: string) =>
                    setCreateTaskData({ ...createTaskData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses && availableStatuses.length > 0 ? (
                      availableStatuses.map((status) => (
                        <SelectItem
                          key={status.id}
                          value={status.name.toLowerCase()}
                        >
                          {status.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={createTaskData.priority}
                  onValueChange={(value: string) =>
                    setCreateTaskData({ ...createTaskData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePriorities && availablePriorities.length > 0 ? (
                      availablePriorities.map((priority) => (
                        <SelectItem
                          key={priority.id}
                          value={priority.name.toLowerCase()}
                        >
                          {priority.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phase, Milestone, and Deliverable - Cascading Dropdowns */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phase">Phase</Label>
                <Select
                  value={createTaskData.phase_id || "unassigned"}
                  onValueChange={(value: string) => {
                    // When phase changes, reset milestone and deliverable
                    setCreateTaskData({
                      ...createTaskData,
                      phase_id: value === "unassigned" ? null : value,
                      milestone_id: null,
                      deliverable_id: null,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id || ""}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="milestone">Milestone</Label>
                <Select
                  value={createTaskData.milestone_id || "unassigned"}
                  onValueChange={(value: string) => {
                    // When milestone changes, reset deliverable
                    setCreateTaskData({
                      ...createTaskData,
                      milestone_id: value === "unassigned" ? null : value,
                      deliverable_id: null,
                    });
                  }}
                  disabled={!createTaskData.phase_id}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        createTaskData.phase_id
                          ? "Select milestone"
                          : "Select phase first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {milestones
                      .filter(
                        (milestone) =>
                          milestone.phase_id === createTaskData.phase_id
                      )
                      .map((milestone) => (
                        <SelectItem
                          key={milestone.id}
                          value={milestone.id || ""}
                        >
                          {milestone.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deliverable">Deliverable</Label>
                <Select
                  value={createTaskData.deliverable_id || "unassigned"}
                  onValueChange={(value: string) =>
                    setCreateTaskData({
                      ...createTaskData,
                      deliverable_id: value === "unassigned" ? null : value,
                    })
                  }
                  disabled={!createTaskData.milestone_id}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        createTaskData.milestone_id
                          ? "Select deliverable"
                          : "Select milestone first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {deliverables
                      .filter(
                        (deliverable) =>
                          deliverable.milestone_id ===
                          createTaskData.milestone_id
                      )
                      .map((deliverable) => (
                        <SelectItem
                          key={deliverable.id}
                          value={deliverable.id || ""}
                        >
                          {deliverable.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={createTaskData.assignee_id || "unassigned"}
                onValueChange={(value: string) => {
                  if (value === "unassigned") {
                    setCreateTaskData({
                      ...createTaskData,
                      assignee_id: null,
                      assignee_name: undefined,
                    });
                  } else {
                    const selectedMember = projectTeamMembers.find(
                      (member) => member.id === value
                    );
                    setCreateTaskData({
                      ...createTaskData,
                      assignee_id: value,
                      assignee_name: selectedMember?.name || undefined,
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projectTeamMembers.length > 0 ? (
                    projectTeamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading team members...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={createTaskData.start_date}
                  onChange={(e) =>
                    setCreateTaskData({
                      ...createTaskData,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={createTaskData.due_date}
                  onChange={(e) =>
                    setCreateTaskData({
                      ...createTaskData,
                      due_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={createTaskData.progress}
                onChange={(e) =>
                  setCreateTaskData({
                    ...createTaskData,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={handleCreateTask}
                disabled={!createTaskData.title.trim()}
              >
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTaskId}
        onOpenChange={(open: boolean) => !open && setDeleteTaskId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTaskId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Time Dialog */}
      <Dialog open={showLogTimeDialog} onOpenChange={setShowLogTimeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Task</Label>
              <p className="text-sm text-gray-600 mt-1">
                {selectedTaskForTimeLog?.task_id || selectedTaskForTimeLog?.id}:{" "}
                {selectedTaskForTimeLog?.title}
              </p>
            </div>

            <div>
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                placeholder="Enter hours (e.g., 2.5)"
                value={logTimeData.hours}
                onChange={(e) =>
                  setLogTimeData({ ...logTimeData, hours: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="activityType">Activity Type *</Label>
              <Select
                value={logTimeData.activityType}
                onValueChange={(value) =>
                  setLogTimeData({ ...logTimeData, activityType: value as any })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="bug_fixing">Bug Fixing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter description of work done..."
                value={logTimeData.description}
                onChange={(e) =>
                  setLogTimeData({
                    ...logTimeData,
                    description: e.target.value,
                  })
                }
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowLogTimeDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitLogTime}>Log Time</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
