import { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Separator } from "../../components/ui/separator";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchProjectById,
  deleteProject,
  clearSelectedProject,
  clearError,
} from "../../store/slices/projectSlice";
import { toast } from "sonner@2.0.3";
import {
  ArrowLeft,
  Edit,
  Share2,
  MoreHorizontal,
  Calendar,
  Users,
  Target,
  Clock,
  DollarSign,
  GitBranch,
  Flag,
  CheckCircle,
  PlayCircle,
  Zap,
  BarChart3,
  AlertTriangle,
  Settings,
  FileText,
  MessageSquare,
  Activity,
  TrendingUp,
  PieChart,
  Plus,
  Search,
  Filter,
  SortAsc,
  List,
  Kanban,
  CalendarDays,
  Upload,
  Download,
  Eye,
  Timer,
  BookOpen,
  Star,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Hash,
  User,
  Trash2,
} from "lucide-react";
import { ProjectDashboard } from "./ProjectDashboard";
import { TasksView } from "../ProjectDetails/Tasks/TasksView";
import { FilesView } from "./FilesView";
// TimeTrackingView removed - module no longer available
import { ActivityView } from "./ActivityView";
import { TaskModal } from "../ProjectDetails/Tasks/TaskModal";
import { ProjectEditModal } from "./ProjectEditModal";
import { ProjectSettings } from "./ProjectSettings";
import { MethodologyViewRouter } from "./MethodologyViews/MethodologyViewRouter";
import { useTasks } from "../../hooks/useTasks";
import { useProjectMasters } from "../../hooks/useProjectMasters";
import { CreateTaskRequest } from "../../services/taskApi";
import { getAssetUrl } from "../../config/api";

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
  user?: any;
}

export function ProjectDetails({
  projectId,
  onBack,
  user,
}: ProjectDetailsProps) {
  const dispatch = useAppDispatch();
  const {
    selectedProject: project,
    selectedProjectLoading: loading,
    error,
  } = useAppSelector((state) => state.projects);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<
    "create" | "edit" | "view"
  >("view");
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // API hooks for tasks and team members
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask: deleteTaskApi,
    error: tasksError,
  } = useTasks({ projectId });

  // Use team members from project data instead of separate API call
  const teamMembers =
    (project as any)?.team_members_detail ||
    (project as any)?.team_members ||
    (project as any)?.team ||
    [];

  // Get master project data for status and priority options
  const { data: mastersData, loading: mastersLoading } = useProjectMasters();
  const projectStatuses = mastersData?.statuses || [];
  const projectPriorities = mastersData?.priorities || [];

  // Fetch project details on component mount
  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
    return () => {
      dispatch(clearSelectedProject());
    };
  }, [projectId, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Use project from Redux state only and add computed properties for display
  const displayProject = project
    ? {
        ...project,
        // Use real tasks data from API
        tasks: tasks || [],
        tasksCompleted: tasks.filter((task) => task.status === "Completed")
          .length,
        totalTasks: tasks.length,
        // Add computed properties for UI display if not already present (using any type for extension)
        team: teamMembers,
        milestones: (project as any).milestones || [],
        recentActivity: (project as any).recentActivity || [],
        files: (project as any).files || [],
        timeEntries: (project as any).timeEntries || [],
        epics: (project as any).epics || 0,
        stories: (project as any).stories || 0,
        currentSprint: (project as any).currentSprint || "No active sprint",
        nextMilestone:
          (project as any).nextMilestone || "No upcoming milestones",
        milestoneDue:
          (project as any).milestoneDue ||
          (project as any).end_date ||
          project.endDate,
        version: (project as any).version || "v1.0.0",
        dependencies: (project as any).dependencies || [],
        // Map API fields to display fields for backward compatibility
        type: (project as any).project_type || project.projectType,
        owner:
          typeof (project as any).team_lead === "object"
            ? (project as any).team_lead?.name
            : (project as any).team_lead ||
              (typeof project.teamLead === "object"
                ? (project.teamLead as any)?.name
                : project.teamLead),
        dueDate: (project as any).end_date || project.endDate,
        // Ensure API response fields are preserved for ProjectEditModal
        start_date: (project as any).start_date,
        end_date: (project as any).end_date,
        project_type: (project as any).project_type,
        team_lead: (project as any).team_lead,
        team_members: (project as any).team_members,
      }
    : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-[#28A745]";
      case "In Progress":
        return "text-[#FFC107]";
      case "Completed":
        return "text-[#007BFF]";
      case "On Hold":
        return "text-[#DC3545]";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-[#DC3545] text-white";
      case "Medium":
        return "bg-[#FFC107] text-white";
      case "Low":
        return "bg-[#28A745] text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const handleTaskCreate = () => {
    setSelectedTask(null);
    setTaskModalMode("create");
    setShowTaskModal(true);
  };

  const handleTaskEdit = (task: any) => {
    setSelectedTask(task);
    setTaskModalMode("edit");
    setShowTaskModal(true);
  };

  const handleTaskView = (task: any) => {
    setSelectedTask(task);
    setTaskModalMode("view");
    setShowTaskModal(true);
  };

  const handleTaskSave = async (taskData: any) => {
    try {
      // Convert TaskModal data format to API format
      const apiTaskData: CreateTaskRequest = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        project_id: projectId,
        assignee_id: taskData.assignee_id || null,
        start_date: taskData.startDate
          ? taskData.startDate.toISOString()
          : undefined,
        due_date: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
        progress: taskData.progress || 0,
        tags: taskData.tags || [],
        subtasks:
          taskData.subtasks?.map((subtask: any) => ({
            id: subtask.id?.toString(),
            title: subtask.title,
            description: subtask.description || "",
            assignee: subtask.assignee || "",
            priority: subtask.priority || "Medium",
            dueDate: subtask.dueDate || "",
            completed: subtask.completed || false,
          })) || [],
        comments:
          taskData.comments?.map((comment: any) => ({
            id: comment.id?.toString(),
            user_id: comment.user_id || "current-user",
            user_name: comment.user || comment.user_name || "Current User",
            text: comment.text,
            created_at: comment.timestamp || new Date().toISOString(),
          })) || [],
        attachments:
          taskData.attachmentFiles?.map((attachment: any) => ({
            id: attachment.id?.toString(),
            filename: attachment.name,
            url: attachment.url,
            size: attachment.file?.size || 0,
            uploaded_at: attachment.uploadedAt || new Date().toISOString(),
          })) || [],
      };

      // Add activity logging for task creation
      if (taskModalMode === "create") {
        apiTaskData.comments = [
          ...(apiTaskData.comments || []),
          {
            id: `activity-${Date.now()}`,
            user_id: "system",
            user_name: "System",
            text: `Task created by ${user?.name || "Current User"}`,
            created_at: new Date().toISOString(),
          },
        ];
      }

      if (taskModalMode === "create") {
        await createTask(apiTaskData);
        toast.success("Task created successfully");
      } else if (taskModalMode === "edit" && selectedTask) {
        await updateTask(selectedTask.id, apiTaskData);
        toast.success("Task updated successfully");
      }

      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (error) {
      toast.error(
        `Failed to ${
          taskModalMode === "create" ? "create" : "update"
        } task: ${error}`
      );
    }
  };

  const handleProjectEdit = () => {
    setShowProjectEditModal(true);
  };

  const handleProjectSave = (updatedProjectData: any) => {
    setShowProjectEditModal(false);
    // The ProjectEditModal will handle the API call via Redux
  };

  const handleDeleteProject = async () => {
    if (!displayProject?.id) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteProject(displayProject.id)).unwrap();
      toast.success("Project deleted successfully");
      onBack(); // Navigate back to projects list
    } catch (error) {
      toast.error(`Failed to delete project: ${error}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading project details...</div>
      </div>
    );
  }

  // Show error state if project not found
  if (!displayProject) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-muted-foreground">Project not found</div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {displayProject.name}
              </h1>
              <Badge className={getPriorityColor(displayProject.priority)}>
                {displayProject.priority}
              </Badge>
              <Badge variant="outline">{displayProject.id}</Badge>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4" />
                <span>{displayProject.methodology}</span>
              </div>
              <span>•</span>
              <span>{displayProject.projectType || displayProject.type}</span>
              <span>•</span>
              <span>
                Owner:{" "}
                {typeof (displayProject.teamLead || displayProject.owner) ===
                "object"
                  ? (displayProject.teamLead || displayProject.owner)?.name ||
                    "Unknown"
                  : displayProject.teamLead || displayProject.owner}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleProjectEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Progress
              </p>
              <p className="text-2xl font-semibold">
                {displayProject.progress}%
              </p>
            </div>
            <div className="p-3 bg-[#007BFF]/10 rounded-full">
              <TrendingUp className="w-6 h-6 text-[#007BFF]" />
            </div>
          </div>
          <Progress value={displayProject.progress} className="h-2 mt-4" />
          <p className="text-xs text-muted-foreground mt-2">
            {displayProject.tasksCompleted || 0} of{" "}
            {displayProject.totalTasks || 0} tasks completed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Budget
              </p>
              <p className="text-2xl font-semibold">
                ${((displayProject.spent || 0) / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="p-3 bg-[#28A745]/10 rounded-full">
              <DollarSign className="w-6 h-6 text-[#28A745]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                of ${((displayProject.budget || 0) / 1000).toFixed(0)}k
              </span>
              <span className="text-[#28A745] font-medium">On Track</span>
            </div>
            <Progress
              value={
                displayProject.budget
                  ? ((displayProject.spent || 0) / displayProject.budget) * 100
                  : 0
              }
              className="h-2 mt-1"
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Team Size
              </p>
              <p className="text-2xl font-semibold">
                {(displayProject.team?.length ||
                  displayProject.teamMembers?.length ||
                  0) + 1}
              </p>
            </div>
            <div className="p-3 bg-[#FFC107]/10 rounded-full">
              <Users className="w-6 h-6 text-[#FFC107]" />
            </div>
          </div>
          <div className="flex -space-x-1 mt-3">
            {(displayProject.team || [])
              .slice(0, 4)
              .map((member: any, index: number) => (
                <Avatar
                  key={index}
                  className="w-6 h-6 border-2 border-background"
                >
                  {member.user_profile &&
                  member.user_profile !== "/public/user-profile/default.png" ? (
                    <img
                      src={getAssetUrl(member.user_profile)}
                      alt={member.name || "User"}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling!.style.display =
                          "flex";
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="text-xs bg-[#007BFF] text-white">
                    {member.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              ))}
            {(displayProject.team?.length || 0) > 4 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs">
                  +{(displayProject.team?.length || 0) - 4}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Days Left
              </p>
              <p className="text-2xl font-semibold">
                {displayProject.endDate || displayProject.dueDate
                  ? Math.ceil(
                      (new Date(
                        displayProject.endDate || displayProject.dueDate
                      ).getTime() -
                        new Date().getTime()) /
                        (1000 * 3600 * 24)
                    )
                  : 0}
              </p>
            </div>
            <div className="p-3 bg-[#DC3545]/10 rounded-full">
              <Clock className="w-6 h-6 text-[#DC3545]" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Due:{" "}
            {displayProject.endDate || displayProject.dueDate
              ? new Date(
                  displayProject.endDate || displayProject.dueDate
                ).toLocaleDateString()
              : "Not set"}
          </p>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger
            value="dashboard"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger
            value="methodology"
            className="flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Methodology</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Files</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center space-x-2">
            <Timer className="w-4 h-4" />
            <span>Time Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ProjectDashboard
            project={displayProject}
            onTaskView={handleTaskView}
          />
        </TabsContent>

        <TabsContent value="methodology">
          <MethodologyViewRouter
            methodology={displayProject.methodology}
            project={displayProject}
            onTaskView={handleTaskView}
            onTaskCreate={handleTaskCreate}
            currentUser={user}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksView
            project={displayProject}
            onTaskCreate={handleTaskCreate}
            onTaskEdit={handleTaskEdit}
            onTaskView={handleTaskView}
          />
        </TabsContent>

        <TabsContent value="files">
          <FilesView project={displayProject} />
        </TabsContent>

        <TabsContent value="time">
          {/* TimeTrackingView removed - module no longer available */}
          <div className="p-4 text-center text-muted-foreground">
            Time tracking module has been removed
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityView project={displayProject} />
        </TabsContent>

        <TabsContent value="settings">
          <ProjectSettings
            project={displayProject}
            onUpdate={handleProjectSave}
            user={user}
          />
        </TabsContent>
      </Tabs>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          task={selectedTask}
          mode={taskModalMode}
          project={displayProject}
          teamMembers={teamMembers}
          projectStatuses={projectStatuses}
          projectPriorities={projectPriorities}
          onSave={handleTaskSave}
        />
      )}

      {/* Project Edit Modal */}
      {showProjectEditModal && (
        <ProjectEditModal
          isOpen={showProjectEditModal}
          onClose={() => setShowProjectEditModal(false)}
          project={displayProject}
          onSave={handleProjectSave}
          user={user}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Project</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{displayProject?.name}"? This
              action cannot be undone and will permanently remove all project
              data, tasks, and files.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
