import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Image as ImageIcon,
  Plus,
  Save,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Calendar } from "../../components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Progress } from "../../components/ui/progress";
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
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../components/ui/utils";
import {
  CreateStoryRequest,
  storiesApiService,
  Story,
} from "../../services/storiesApi";
import { User, userApiService } from "../../services/userApi";
import { Capitalize } from "../../utils/textTransform";

interface TaskManagementProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskManagement({
  projectId,
  isOpen,
  onClose,
}: TaskManagementProps) {
  // Stories/Tasks state
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [storiesError, setStoriesError] = useState<string | null>(null);

  // Team members for assignment
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  // Modal states
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Story | null>(null);

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState<CreateStoryRequest>({
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    assignee_id: null,
    project_id: projectId,
    start_date: "",
    due_date: "",
    progress: 0,
    tags: [],
    story_points: 1,
    acceptance_criteria: "",
  });

  // Load stories and team members when component mounts
  useEffect(() => {
    if (isOpen && projectId) {
      loadStories();
      loadTeamMembers();
    }
  }, [isOpen, projectId]);

  const loadStories = async () => {
    setLoadingStories(true);
    setStoriesError(null);
    try {
      const response = await storiesApiService.getStories(projectId);
      setStories(response.items || []);
    } catch (error) {
      setStoriesError("Failed to load tasks");
      toast.error("Failed to load tasks");
    } finally {
      setLoadingStories(false);
    }
  };

  const loadTeamMembers = async () => {
    setLoadingTeamMembers(true);
    try {
      const response = await userApiService.getTeamMembers({
        per_page: 100,
        is_active: true,
      });
      setTeamMembers(response.items || []);
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setTaskForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddTag = () => {
    const tagToAdd = newTag.trim();
    if (tagToAdd && !taskForm.tags?.includes(tagToAdd)) {
      setTaskForm((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagToAdd],
      }));
      setNewTag("");
    } else if (tagToAdd && taskForm.tags?.includes(tagToAdd)) {
      toast.error("Tag already exists");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTaskForm((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const resetForm = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "To Do",
      priority: "Medium",
      assignee_id: null,
      project_id: projectId,
      start_date: "",
      due_date: "",
      progress: 0,
      tags: [],
      story_points: 1,
      acceptance_criteria: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setNewTag("");
    setActiveTab("overview");
  };

  const handleCreateTask = async () => {
    setIsLoading(true);

    // Validation
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      setIsLoading(false);
      return;
    }

    if (!taskForm.description.trim()) {
      toast.error("Task description is required");
      setIsLoading(false);
      return;
    }

    try {
      await storiesApiService.createStory(taskForm, imageFile || undefined);
      toast.success("Task created successfully!");
      resetForm();
      setShowCreateTask(false);
      await loadStories(); // Reload stories
    } catch (error) {
      toast.error(`Failed to create task: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = (task: Story) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id,
      project_id: task.project_id,
      start_date: task.start_date || "",
      due_date: task.due_date || "",
      progress: task.progress,
      tags: task.tags || [],
      story_points: task.story_points || 1,
      acceptance_criteria: task.acceptance_criteria || "",
    });

    // Set existing image preview if available
    if (task.image_url) {
      setImagePreview(task.image_url);
    }

    setShowEditTask(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    setIsLoading(true);

    // Validation
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      setIsLoading(false);
      return;
    }

    if (!taskForm.description.trim()) {
      toast.error("Task description is required");
      setIsLoading(false);
      return;
    }

    try {
      await storiesApiService.updateStory(
        editingTask.id,
        taskForm,
        imageFile || undefined
      );
      toast.success("Task updated successfully!");
      resetForm();
      setEditingTask(null);
      setShowEditTask(false);
      await loadStories(); // Reload stories
    } catch (error) {
      toast.error(`Failed to update task: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await storiesApiService.deleteStory(taskId);
      toast.success("Task deleted successfully!");
      await loadStories();
    } catch (error) {
      toast.error(`Failed to delete task: ${error}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      case "Low":
        return "bg-green-500 text-white";
      case "Critical":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Todo":
        return "text-gray-600";
      case "In-progress":
        return "text-blue-600";
      case "Review":
        return "text-orange-600";
      case "Done":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  console.log(taskForm, "FormData");

  const statusOptions = ["todo", "in-progress", "review", "done"];
  const priorityOptions = ["low", "medium", "high", "critical"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Task Management</span>
          </DialogTitle>
          <DialogDescription>
            Manage tasks and stories for this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6  overflow-y-auto">
          {/* Header with Create Task Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Tasks ({stories.length})
              </h3>
              <p className="text-sm text-muted-foreground">
                Track project progress with user stories and tasks
              </p>
            </div>
            <Button
              onClick={() => setShowCreateTask(true)}
              className="bg-[#28A745] hover:bg-[#218838] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4">
            {loadingStories ? (
              <div className="col-span-full text-center py-8">
                <div className="text-muted-foreground">Loading tasks...</div>
              </div>
            ) : storiesError ? (
              <div className="col-span-full text-center py-8">
                <div className="text-red-500">{storiesError}</div>
                <Button
                  variant="outline"
                  onClick={loadStories}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : stories.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <div className="text-muted-foreground">No tasks found</div>
              </div>
            ) : (
              stories?.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            className={getPriorityColor(
                              Capitalize(task.priority)
                            )}
                          >
                            {Capitalize(task.priority)}
                          </Badge>
                          <span
                            className={`text-sm font-medium ${getStatusColor(
                              Capitalize(task.status)
                            )}`}
                          >
                            {Capitalize(task.status)?.replace("-", " ")}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-semibold line-clamp-2">
                          {task.title}
                        </CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                          className="p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {task.description}
                    </p>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>

                    {/* Image Preview */}
                    {task.image_url && (
                      <div className="relative">
                        <img
                          src={task.image_url}
                          alt="Task attachment"
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{task.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Assignee and Dates */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        {task.assignee ? (
                          <>
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-xs">
                                {task.assignee.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{task.assignee.name}</span>
                          </>
                        ) : (
                          <span>Unassigned</span>
                        )}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(task.due_date), "MMM dd")}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Create Task Modal */}
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Task</span>
              </DialogTitle>
              <DialogDescription>
                Add a new task or user story to the project
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="overview"
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="flex items-center space-x-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Attachments</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Task Title *</Label>
                      <Input
                        id="title"
                        value={taskForm.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        placeholder="Enter task title"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={taskForm.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        placeholder="Describe the task..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="acceptance_criteria">
                        Acceptance Criteria
                      </Label>
                      <Textarea
                        id="acceptance_criteria"
                        value={taskForm.acceptance_criteria}
                        onChange={(e) =>
                          handleInputChange(
                            "acceptance_criteria",
                            e.target.value
                          )
                        }
                        placeholder="Define what constitutes completion..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={taskForm.status}
                        onValueChange={(value: string) =>
                          handleInputChange("status", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status || ""}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(value: string) =>
                          handleInputChange("priority", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions?.map((priority) => (
                            <SelectItem key={priority} value={priority || ""}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    getPriorityColor(priority).split(" ")[0]
                                  }`}
                                />
                                <span>{Capitalize(priority)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assignee">Assignee</Label>
                      <Select
                        value={taskForm.assignee_id || ""}
                        onValueChange={(value: string) =>
                          handleInputChange("assignee_id", value || null)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs">
                                    {member?.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member?.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="story_points">Story Points</Label>
                      <Input
                        id="story_points"
                        type="number"
                        value={taskForm.story_points}
                        onChange={(e) =>
                          handleInputChange(
                            "story_points",
                            parseInt(e.target.value) || 1
                          )
                        }
                        min="1"
                        max="13"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover
                      open={showStartDatePicker}
                      onOpenChange={setShowStartDatePicker}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !taskForm.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {taskForm.start_date
                            ? format(new Date(taskForm.start_date), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            taskForm.start_date
                              ? new Date(taskForm.start_date)
                              : undefined
                          }
                          onSelect={(date: Date) => {
                            if (date) {
                              handleInputChange(
                                "start_date",
                                date.toISOString().split("T")[0]
                              );
                              setShowStartDatePicker(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Popover
                      open={showDueDatePicker}
                      onOpenChange={setShowDueDatePicker}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !taskForm.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {taskForm.due_date
                            ? format(new Date(taskForm.due_date), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            taskForm.due_date
                              ? new Date(taskForm.due_date)
                              : undefined
                          }
                          onSelect={(date: Date) => {
                            if (date) {
                              handleInputChange(
                                "due_date",
                                date.toISOString().split("T")[0]
                              );
                              setShowDueDatePicker(false);
                            }
                          }}
                          initialFocus
                          disabled={(date: Date) =>
                            taskForm.start_date
                              ? date <= new Date(taskForm.start_date)
                              : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="progress">Progress (%)</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      id="progress"
                      type="range"
                      min="0"
                      max="100"
                      value={taskForm.progress}
                      onChange={(e) =>
                        handleInputChange("progress", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium">{taskForm.progress}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {taskForm.tags?.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddTag}
                      variant="outline"
                      size="sm"
                      disabled={!newTag.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <div>
                  <Label htmlFor="image">Task Image</Label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center space-x-4">
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="image"
                        className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Image</span>
                      </Label>
                      {imageFile && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>{imageFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeImage}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs max-h-48 object-cover rounded-md border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateTask(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={isLoading}
                className="bg-[#28A745] hover:bg-[#218838] text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Task Modal */}
        <Dialog open={showEditTask} onOpenChange={setShowEditTask}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Edit Task</span>
              </DialogTitle>
              <DialogDescription>
                Update task details and attachments
              </DialogDescription>
            </DialogHeader>

            {/* Same tabs structure as create modal but with update logic */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="overview"
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="flex items-center space-x-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Attachments</span>
                </TabsTrigger>
              </TabsList>

              {/* Same content as create modal */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-title">Task Title *</Label>
                      <Input
                        id="edit-title"
                        value={taskForm.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        placeholder="Enter task title"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={taskForm.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        placeholder="Describe the task..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-acceptance_criteria">
                        Acceptance Criteria
                      </Label>
                      <Textarea
                        id="edit-acceptance_criteria"
                        value={taskForm.acceptance_criteria}
                        onChange={(e) =>
                          handleInputChange(
                            "acceptance_criteria",
                            e.target.value
                          )
                        }
                        placeholder="Define what constitutes completion..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={taskForm.status}
                        onValueChange={(value: string) =>
                          handleInputChange("status", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {Capitalize(status)?.replace("-", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(value: string) =>
                          handleInputChange("priority", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    getPriorityColor(priority).split(" ")[0]
                                  }`}
                                />
                                <span>{Capitalize(priority)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-assignee">Assignee</Label>
                      <Select
                        value={taskForm.assignee_id || ""}
                        onValueChange={(value: string) =>
                          handleInputChange("assignee_id", value || null)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem>Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs">
                                    {member.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-story_points">Story Points</Label>
                      <Input
                        id="edit-story_points"
                        type="number"
                        value={taskForm.story_points}
                        onChange={(e) =>
                          handleInputChange(
                            "story_points",
                            parseInt(e.target.value) || 1
                          )
                        }
                        min="1"
                        max="13"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {/* Same details content as create modal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover
                      open={showStartDatePicker}
                      onOpenChange={setShowStartDatePicker}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !taskForm.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {taskForm.start_date
                            ? format(new Date(taskForm.start_date), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            taskForm.start_date
                              ? new Date(taskForm.start_date)
                              : undefined
                          }
                          onSelect={(date: Date) => {
                            if (date) {
                              handleInputChange(
                                "start_date",
                                date.toISOString().split("T")[0]
                              );
                              setShowStartDatePicker(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Popover
                      open={showDueDatePicker}
                      onOpenChange={setShowDueDatePicker}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !taskForm.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {taskForm.due_date
                            ? format(new Date(taskForm.due_date), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            taskForm.due_date
                              ? new Date(taskForm.due_date)
                              : undefined
                          }
                          onSelect={(date: Date) => {
                            if (date) {
                              handleInputChange(
                                "due_date",
                                date.toISOString().split("T")[0]
                              );
                              setShowDueDatePicker(false);
                            }
                          }}
                          initialFocus
                          disabled={(date: Date) =>
                            taskForm.start_date
                              ? date <= new Date(taskForm.start_date)
                              : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      id="edit-progress"
                      type="range"
                      min="0"
                      max="100"
                      value={taskForm.progress}
                      onChange={(e) =>
                        handleInputChange("progress", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium">{taskForm.progress}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {taskForm.tags?.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddTag}
                      variant="outline"
                      size="sm"
                      disabled={!newTag.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <div>
                  <Label htmlFor="edit-image">Task Image</Label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center space-x-4">
                      <input
                        id="edit-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="edit-image"
                        className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload New Image</span>
                      </Label>
                      {imageFile && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>{imageFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeImage}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs max-h-48 object-cover rounded-md border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEditTask(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTask}
                disabled={isLoading}
                className="bg-[#28A745] hover:bg-[#218838]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Task
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
