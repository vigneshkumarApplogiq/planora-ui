import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
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
import { Textarea } from "../../../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../components/ui/dialog";
import { Label } from "../../../../components/ui/label";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  GripVertical,
  Edit,
  Trash2,
  Archive,
  FileText,
  MessageSquare,
  Paperclip,
  X,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import {
  storiesApiService,
  Story,
  CreateStoryRequest,
  SubTask,
} from "../../../../services/storiesApi";
import { epicApiService, Epic } from "../../../../services/epicApi";
import { sprintsApiService, Sprint } from "../../../../services/sprintsApi";
import {
  ProjectMemberDetail,
  projectApiService,
  ProjectMastersResponse,
  ProjectPriorityItem,
} from "../../../../services/projectApi";
import {
  getEnrichedTeamMemberDetails,
  getAssigneeDisplayInfo,
  EnrichedMemberDetail,
} from "../../../../utils/teamMemberDetails";
import { StoryDetailModal } from "./StoryDetailModal";
import { SessionStorageService } from "../../../../utils/sessionStorage";
import { toast } from "sonner";

interface BacklogViewProps {
  projectId?: string;
  user: any;
  project?: any;
}

export function BacklogView({
  projectId: propProjectId,
  user,
  project,
}: BacklogViewProps) {
  // Get effective project ID from props or session storage
  const effectiveProjectId =
    SessionStorageService.getEffectiveProjectId(propProjectId);

  // Early return if no project ID is available
  if (!effectiveProjectId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Product Backlog</h2>
            <p className="text-muted-foreground">
              Manage and prioritize product backlog items
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
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Story | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectTeamMembers, setProjectTeamMembers] = useState<
    ProjectMemberDetail[]
  >([]);
  const [projectTeamLead, setProjectTeamLead] =
    useState<ProjectMemberDetail | null>(null);
  const [enrichedMembersMap, setEnrichedMembersMap] = useState<
    Map<string, EnrichedMemberDetail>
  >(new Map());
  const [epics, setEpics] = useState<Epic[]>([]);
  const [epicsLoading, setEpicsLoading] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [showMoveToSprintModal, setShowMoveToSprintModal] = useState(false);
  const [selectedStoryForMove, setSelectedStoryForMove] =
    useState<Story | null>(null);

  // Project Master Data
  const [projectMasters, setProjectMasters] =
    useState<ProjectMastersResponse | null>(null);
  const [availablePriorities, setAvailablePriorities] = useState<
    ProjectPriorityItem[]
  >([]);
  const [createStoryData, setCreateStoryData] = useState<CreateStoryRequest>({
    title: "",
    description: "",
    story_type: "story",
    priority: "medium",
    status: "todo",
    project_id: effectiveProjectId || "",
    acceptance_criteria: [""],
    assignee_id: "",
    reporter_id: "",
    start_date: "",
    end_date: "",
    subtasks: [],
  });

  useEffect(() => {
    if (effectiveProjectId) {
      fetchStories();
      fetchEpics();
      fetchSprints();
      loadProjectMasters();
    }
  }, [effectiveProjectId]);

  // Load team members from project data when available
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

  const loadEnrichedMemberDetails = async (members: ProjectMemberDetail[]) => {
    try {
      const enrichedMap = await getEnrichedTeamMemberDetails(members);
      setEnrichedMembersMap(enrichedMap);
    } catch (error) {
      console.error("Error loading enriched member details:", error);
    }
  };

  // Update createStoryData when effectiveProjectId changes
  useEffect(() => {
    if (effectiveProjectId) {
      setCreateStoryData((prev) => ({
        ...prev,
        project_id: effectiveProjectId,
      }));
    }
  }, [effectiveProjectId]);

  const loadProjectMasters = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching project masters");
      return;
    }

    try {
      const masters = await projectApiService.getProjectMasters();
      setProjectMasters(masters);
      setAvailablePriorities(masters.priorities || []);
    } catch (error) {
      console.error("Error loading project masters:", error);
      // Continue with default options if API fails
      setAvailablePriorities([]);
    }
  };

  const fetchStories = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching stories");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await storiesApiService.getStories(effectiveProjectId);
      setStories(response.items);
    } catch (error) {
      console.error("Error fetching stories:", error);
      toast.error("Failed to fetch stories");
    } finally {
      setLoading(false);
    }
  };

  const fetchEpics = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching epics");
      return;
    }

    try {
      setEpicsLoading(true);
      const response = await epicApiService.getEpics(1, 50, effectiveProjectId);
      setEpics(response.items);
    } catch (error) {
      console.error("Error fetching epics:", error);
      toast.error("Failed to fetch epics");
    } finally {
      setEpicsLoading(false);
    }
  };

  const fetchSprints = async () => {
    if (!effectiveProjectId) {
      console.warn("No project ID available for fetching sprints");
      return;
    }

    try {
      setSprintsLoading(true);
      const response = await sprintsApiService.getSprints(effectiveProjectId);
      setSprints(response.items);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      toast.error("Failed to fetch sprints");
    } finally {
      setSprintsLoading(false);
    }
  };

  const handleCreateStory = async () => {
    try {
      if (!createStoryData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      // Clean data before sending to API
      const cleanedStoryData = {
        ...createStoryData,
        acceptance_criteria:
          createStoryData.acceptance_criteria?.filter((criteria) =>
            criteria.trim()
          ) || [],
        // Remove empty assignee and reporter fields or ensure they're properly set
        assignee_id: createStoryData.assignee_id?.trim() || undefined,
        assignee_name: createStoryData.assignee_name?.trim() || undefined,
        reporter_id: createStoryData.reporter_id?.trim() || undefined,
        reporter_name: createStoryData.reporter_name?.trim() || undefined,
        // Clean other optional fields
        epic_id: createStoryData.epic_id?.trim() || undefined,
        epic_title: createStoryData.epic_title?.trim() || undefined,
        business_value: createStoryData.business_value?.trim() || undefined,
        // Clean labels array
        labels: createStoryData.labels?.filter((label) => label.trim()) || [],
        // Clean subtasks array
        subtasks:
          createStoryData.subtasks?.filter(
            (subtask) =>
              subtask.task_name?.trim() || subtask.description?.trim()
          ) || [],
      };

      await storiesApiService.createStory(cleanedStoryData);
      toast.success("Story created successfully");
      setShowCreateModal(false);
      setCreateStoryData({
        title: "",
        description: "",
        story_type: "story",
        priority: "medium",
        status: "todo",
        project_id: effectiveProjectId || "",
        acceptance_criteria: [""],
        assignee_id: "",
        reporter_id: "",
        start_date: "",
        end_date: "",
        subtasks: [],
      });
      fetchStories();
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Failed to create story");
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await storiesApiService.deleteStory(storyId);
      toast.success("Story deleted successfully");
      fetchStories();
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Failed to delete story");
    }
  };

  const handleMoveToSprint = (story: Story) => {
    setSelectedStoryForMove(story);
    setShowMoveToSprintModal(true);
  };

  const handleConfirmMoveToSprint = async (sprintId: string) => {
    if (!selectedStoryForMove) return;

    try {
      const updateData =
        sprintId === "remove-from-sprint"
          ? { sprint_id: "" }
          : { sprint_id: sprintId };

      await storiesApiService.updateStory(selectedStoryForMove.id, updateData);

      const successMessage =
        sprintId === "remove-from-sprint"
          ? "Story removed from sprint successfully"
          : "Story moved to sprint successfully";

      toast.success(successMessage);
      setShowMoveToSprintModal(false);
      setSelectedStoryForMove(null);
      fetchStories();
    } catch (error) {
      console.error("Error updating story sprint:", error);
      toast.error("Failed to update story sprint");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "story":
        return <Target className="w-5 h-5 text-blue-600" />;
      case "bug":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "task":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Target className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "story":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-medium px-2 py-1">
            <Target className="w-3 h-3 mr-1" />
            Story
          </Badge>
        );
      case "bug":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 text-xs font-medium px-2 py-1">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Bug
          </Badge>
        );
      case "task":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs font-medium px-2 py-1">
            <CheckCircle className="w-3 h-3 mr-1" />
            Task
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-medium px-2 py-1">
            <Target className="w-3 h-3 mr-1" />
            Story
          </Badge>
        );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "done":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const filteredItems = stories.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.story_type === filterType;
    const matchesPriority =
      filterPriority === "all" || item.priority === filterPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  // Pagination calculations
  const totalItems = filteredItems?.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterPriority]);

  const BacklogTable = ({ items }: { items: Story[] }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Story
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Epic
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-1 cursor-grab" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getTypeIcon(item.story_type)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">
                      {item.story_type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(item.priority)}
                  >
                    {item.priority.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={getStatusColor(item.status)}
                  >
                    {item.status.replace("-", " ").toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {(() => {
                      const assigneeInfo = getAssigneeDisplayInfo(
                        item.assignee_id || null,
                        item.assignee_name || null,
                        enrichedMembersMap
                      );
                      return (
                        <>
                          <Avatar className="w-6 h-6 ring-1 ring-blue-100 dark:ring-blue-900">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                              {assigneeInfo.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-2 flex flex-col">
                            <span className="text-sm text-gray-900">
                              {assigneeInfo.name}
                            </span>
                            {assigneeInfo.isAssigned && assigneeInfo.role && (
                              <span className="text-xs text-muted-foreground">
                                {assigneeInfo.role}
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.story_points || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {item.epic_title || "No Epic"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-50"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                        setShowDetailModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-green-50"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleMoveToSprint(item);
                      }}
                      title="Move to Sprint"
                    >
                      <ArrowRight className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-red-50"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteStory(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const BacklogItemCard = ({ item }: { item: Story }) => (
    <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 border border-gray-200 dark:border-gray-700 border-l-4 border-l-gray-300 hover:border-l-blue-500 dark:border-l-gray-600 dark:hover:border-l-blue-400 bg-background  ">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab hover:text-gray-600" />
            {getTypeIcon(item.story_type)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header with Type Badge and Epic */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getTypeBadge(item.story_type)}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground bg-gray-100 px-2 py-1 rounded-md">
                    {item.epic_title || "No Epic"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${getPriorityColor(item.priority)} font-medium`}
                  >
                    {item.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                    setShowDetailModal(true);
                  }}
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-green-50"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleMoveToSprint(item);
                  }}
                  title="Move to Sprint"
                >
                  <ArrowRight className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleDeleteStory(item.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Title and Description */}
            <h4 className="font-semibold text-foreground mb-2 text-base leading-tight">
              {item.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            {/* Assignee and Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {(() => {
                  const assigneeInfo = getAssigneeDisplayInfo(
                    item.assignee_id || null,
                    item.assignee_name || null,
                    enrichedMembersMap
                  );
                  return (
                    <>
                      <Avatar className="w-7 h-7 ring-2 ring-blue-100 dark:ring-blue-900">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-foreground text-xs font-medium">
                          {assigneeInfo.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {assigneeInfo.name}
                        </span>
                        {assigneeInfo.isAssigned && assigneeInfo.role && (
                          <span className="text-xs text-muted-foreground">
                            {assigneeInfo.role}
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center space-x-2">
                {item.story_points && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 font-medium"
                  >
                    {item.story_points} pts
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`${getStatusColor(item.status)} font-medium`}
                >
                  {item.status.replace("-", " ").toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Additional info and metrics */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {item.comments && item.comments?.length > 0 && (
                  <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded">
                    <MessageSquare className="w-3 h-3" />
                    <span className="font-medium">{item.comments?.length}</span>
                  </div>
                )}
                {item.attached_files && item.attached_files?.length > 0 && (
                  <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded">
                    <Paperclip className="w-3 h-3" />
                    <span className="font-medium">
                      {item.attached_files?.length}
                    </span>
                  </div>
                )}
                {item.subtasks && item.subtasks?.length > 0 && (
                  <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded">
                    <FileText className="w-3 h-3" />
                    <span className="font-medium">
                      {item.subtasks?.length} subtasks
                    </span>
                  </div>
                )}
              </div>

              {item.business_value && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-medium"
                >
                  Value: {item.business_value}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header - Title and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Product Backlog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and prioritize product backlog items
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#28A745] hover:bg-[#218838] text-white px-6 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Story
        </Button>
      </div>

      {/* Filters and Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search stories, tasks, and bugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80 h-10"
            />
          </div>

          {/* Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="story">Stories</SelectItem>
              <SelectItem value="bug">Bugs</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {availablePriorities && availablePriorities?.length > 0 ? (
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
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
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

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
            {totalItems} items
          </div>
        </div>
      </div>

      {/* Backlog Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-[#007BFF] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#007BFF]">
              {stories.filter((i) => i.story_type === "story")?.length}
            </div>
            <div className="text-xs text-muted-foreground">Stories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-[#DC3545] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#DC3545]">
              {stories.filter((i) => i.story_type === "bug")?.length}
            </div>
            <div className="text-xs text-muted-foreground">Bugs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-[#28A745] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#28A745]">
              {stories.filter((i) => i.story_type === "task")?.length}
            </div>
            <div className="text-xs text-muted-foreground">Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-[#6F42C1] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#6F42C1]">
              {stories.reduce((sum, i) => sum + (i.story_points || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">Story Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Backlog Items */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28A745] mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading stories...</p>
          </div>
        ) : filteredItems?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No stories found</h3>
              <p className="text-muted-foreground mb-4">
                {stories?.length === 0
                  ? "Get started by creating your first story."
                  : "No stories match your current filters."}
              </p>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Story
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <BacklogTable items={paginatedItems} />
        ) : (
          <div className="space-y-4">
            {paginatedItems?.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}
              >
                <BacklogItemCard item={item} />
              </div>
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

      {/* Story Detail Modal */}
      <StoryDetailModal
        story={selectedItem}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedItem(null);
        }}
        onUpdate={fetchStories}
        projectId={effectiveProjectId || ""}
        project={project}
        availablePriorities={availablePriorities}
      />

      {/* Move to Sprint Modal */}
      <Dialog
        open={showMoveToSprintModal}
        onOpenChange={setShowMoveToSprintModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move Story to Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move "{selectedStoryForMove?.title}" to a sprint:
            </p>
            <div>
              <Label htmlFor="sprint-select">Select Sprint</Label>
              <Select onValueChange={handleConfirmMoveToSprint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remove-from-sprint">
                    Remove from Sprint
                  </SelectItem>
                  {sprintsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading sprints...
                    </SelectItem>
                  ) : sprints?.length > 0 ? (
                    sprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.name} ({sprint.status})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-sprints" disabled>
                      No sprints available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveToSprintModal(false);
                  setSelectedStoryForMove(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Item Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Story Type</Label>
                <Select
                  value={createStoryData.story_type}
                  onValueChange={(value) =>
                    setCreateStoryData({
                      ...createStoryData,
                      story_type: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={createStoryData.priority}
                  onValueChange={(value) =>
                    setCreateStoryData({ ...createStoryData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePriorities && availablePriorities?.length > 0 ? (
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
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                placeholder="Enter story title"
                value={createStoryData.title}
                onChange={(e) =>
                  setCreateStoryData({
                    ...createStoryData,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                placeholder="Enter story description"
                rows={3}
                value={createStoryData.description}
                onChange={(e) =>
                  setCreateStoryData({
                    ...createStoryData,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storyPoints">Story Points</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={createStoryData.story_points || ""}
                    onChange={(e) =>
                      setCreateStoryData({
                        ...createStoryData,
                        story_points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={createStoryData.status}
                    onValueChange={(value) =>
                      setCreateStoryData({ ...createStoryData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="epic">Epic</Label>
                <Select
                  value={createStoryData.epic_id || "no-epic"}
                  onValueChange={(value) => {
                    if (value === "no-epic") {
                      setCreateStoryData({
                        ...createStoryData,
                        epic_id: "",
                        epic_title: "",
                      });
                    } else {
                      const selectedEpic = epics.find(
                        (epic) => epic.id === value
                      );
                      setCreateStoryData({
                        ...createStoryData,
                        epic_id: value,
                        epic_title: selectedEpic?.title || "",
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select epic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-epic">No Epic</SelectItem>
                    {epicsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading epics...
                      </SelectItem>
                    ) : epics?.length > 0 ? (
                      epics.map((epic) => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.title} ({epic.status})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-epics" disabled>
                        No epics available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={createStoryData.assignee_id || "unassigned"}
                  onValueChange={(value) => {
                    if (value === "unassigned") {
                      setCreateStoryData({
                        ...createStoryData,
                        assignee_id: "",
                        assignee_name: "",
                      });
                    } else {
                      const selectedMember = projectTeamMembers.find(
                        (member) => member.id === value
                      );
                      setCreateStoryData({
                        ...createStoryData,
                        assignee_id: value,
                        assignee_name: selectedMember?.name || "",
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {projectTeamMembers?.length > 0 ? (
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
              <div>
                <Label htmlFor="reporter">Reporter</Label>
                <Select
                  value={createStoryData.reporter_id || "no-reporter"}
                  onValueChange={(value) => {
                    if (value === "no-reporter") {
                      setCreateStoryData({
                        ...createStoryData,
                        reporter_id: "",
                        reporter_name: "",
                      });
                    } else if (value === projectTeamLead?.id) {
                      setCreateStoryData({
                        ...createStoryData,
                        reporter_id: value,
                        reporter_name: projectTeamLead?.name || "",
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reporter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-reporter">No reporter</SelectItem>
                    {projectTeamLead ? (
                      <SelectItem value={projectTeamLead.id}>
                        {projectTeamLead.name} - {projectTeamLead.role_name}
                      </SelectItem>
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading team lead...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  value={createStoryData.start_date || ""}
                  onChange={(e) =>
                    setCreateStoryData({
                      ...createStoryData,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  value={createStoryData.end_date || ""}
                  onChange={(e) =>
                    setCreateStoryData({
                      ...createStoryData,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessValue">Business Value</Label>
              <Textarea
                placeholder="Describe the business value and rationale for this story..."
                rows={3}
                value={createStoryData.business_value || ""}
                onChange={(e) =>
                  setCreateStoryData({
                    ...createStoryData,
                    business_value: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
              <div className="space-y-2">
                {Array.isArray(createStoryData.acceptance_criteria) ? (
                  createStoryData.acceptance_criteria.map((criteria, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Enter acceptance criteria"
                        value={criteria}
                        onChange={(e) => {
                          const newCriteria = [
                            ...(createStoryData.acceptance_criteria || []),
                          ];
                          newCriteria[index] = e.target.value;
                          setCreateStoryData({
                            ...createStoryData,
                            acceptance_criteria: newCriteria,
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newCriteria =
                            createStoryData.acceptance_criteria?.filter(
                              (_, i) => i !== index
                            ) || [];
                          setCreateStoryData({
                            ...createStoryData,
                            acceptance_criteria: newCriteria,
                          });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter acceptance criteria"
                      value=""
                      onChange={(e) => {
                        setCreateStoryData({
                          ...createStoryData,
                          acceptance_criteria: [e.target.value],
                        });
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreateStoryData({
                          ...createStoryData,
                          acceptance_criteria: [],
                        });
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCriteria = [
                      ...(createStoryData.acceptance_criteria || []),
                      "",
                    ];
                    setCreateStoryData({
                      ...createStoryData,
                      acceptance_criteria: newCriteria,
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Acceptance Criteria
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="labels">Labels (comma-separated)</Label>
              <Input
                placeholder="frontend, ui, enhancement"
                value={createStoryData.labels?.join(", ") || ""}
                onChange={(e) =>
                  setCreateStoryData({
                    ...createStoryData,
                    labels: e.target.value
                      .split(",")
                      .map((label) => label.trim())
                      .filter((label) => label),
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="subtasks">Subtasks</Label>
              <div className="space-y-2">
                {(createStoryData.subtasks || []).map((subtask, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-4">
                      <Input
                        placeholder="Task name"
                        value={subtask.task_name}
                        onChange={(e) => {
                          const newSubtasks = [
                            ...(createStoryData.subtasks || []),
                          ];
                          newSubtasks[index] = {
                            ...newSubtasks[index],
                            task_name: e.target.value,
                          };
                          setCreateStoryData({
                            ...createStoryData,
                            subtasks: newSubtasks,
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Description"
                        value={subtask.description}
                        onChange={(e) => {
                          const newSubtasks = [
                            ...(createStoryData.subtasks || []),
                          ];
                          newSubtasks[index] = {
                            ...newSubtasks[index],
                            description: e.target.value,
                          };
                          setCreateStoryData({
                            ...createStoryData,
                            subtasks: newSubtasks,
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Assignee"
                        value={subtask.assignee}
                        onChange={(e) => {
                          const newSubtasks = [
                            ...(createStoryData.subtasks || []),
                          ];
                          newSubtasks[index] = {
                            ...newSubtasks[index],
                            assignee: e.target.value,
                          };
                          setCreateStoryData({
                            ...createStoryData,
                            subtasks: newSubtasks,
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="date"
                        value={subtask.due_date}
                        onChange={(e) => {
                          const newSubtasks = [
                            ...(createStoryData.subtasks || []),
                          ];
                          newSubtasks[index] = {
                            ...newSubtasks[index],
                            due_date: e.target.value,
                          };
                          setCreateStoryData({
                            ...createStoryData,
                            subtasks: newSubtasks,
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSubtasks =
                            createStoryData.subtasks?.filter(
                              (_, i) => i !== index
                            ) || [];
                          setCreateStoryData({
                            ...createStoryData,
                            subtasks: newSubtasks,
                          });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSubtask: SubTask = {
                      task_name: "",
                      description: "",
                      assignee: "",
                      priority: "medium",
                      due_date: "",
                    };
                    const newSubtasks = [
                      ...(createStoryData.subtasks || []),
                      newSubtask,
                    ];
                    setCreateStoryData({
                      ...createStoryData,
                      subtasks: newSubtasks,
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subtask
                </Button>
              </div>
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
                onClick={handleCreateStory}
                disabled={!createStoryData.title.trim()}
              >
                Create Story
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
