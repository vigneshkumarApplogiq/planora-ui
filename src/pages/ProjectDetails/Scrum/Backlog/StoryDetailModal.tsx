import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
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
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  MessageSquare,
  Paperclip,
  FileText,
  Calendar,
  User as UserIcon,
  Edit,
  Save,
  X,
  Plus,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react";
import {
  Story,
  storiesApiService,
  SubTask,
} from "../../../../services/storiesApi";
import { epicApiService, Epic } from "../../../../services/epicApi";
import {
  ProjectMemberDetail,
  ProjectPriorityItem,
} from "../../../../services/projectApi";
import { SessionStorageService } from "../../../../utils/sessionStorage";
import { toast } from "sonner";

interface StoryDetailModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  projectId?: string;
  project?: any;
  availablePriorities?: ProjectPriorityItem[];
}

export function StoryDetailModal({
  story,
  isOpen,
  onClose,
  onUpdate,
  projectId: propProjectId,
  project,
  availablePriorities,
}: StoryDetailModalProps) {
  // Get effective project ID from props or session storage
  const effectiveProjectId =
    SessionStorageService.getEffectiveProjectId(propProjectId);

  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState<Partial<Story>>({});
  const [newComment, setNewComment] = useState("");
  const [projectTeamMembers, setProjectTeamMembers] = useState<
    ProjectMemberDetail[]
  >([]);
  const [projectTeamLead, setProjectTeamLead] =
    useState<ProjectMemberDetail | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [epicsLoading, setEpicsLoading] = useState(false);

  useEffect(() => {
    if (story) {
      setEditedStory(story);
    }
  }, [story]);

  // Load team members from project data when available
  useEffect(() => {
    if (project?.team_members_detail && project?.team_lead_detail) {
      setProjectTeamMembers(project.team_members_detail);
      setProjectTeamLead(project.team_lead_detail);
    }
  }, [project]);

  // Load epics when modal opens
  useEffect(() => {
    if (isOpen && effectiveProjectId) {
      fetchEpics();
    }
  }, [isOpen, effectiveProjectId]);

  const fetchEpics = async () => {
    if (!effectiveProjectId) return;

    try {
      setEpicsLoading(true);
      const response = await epicApiService.getEpics(1, 50, effectiveProjectId);
      setEpics(response.items);
    } catch (error) {
      console.error("Error fetching epics:", error);
    } finally {
      setEpicsLoading(false);
    }
  };

  if (!story) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "story":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "bug":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "task":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Target className="w-4 h-4 text-blue-600" />;
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

  const handleSave = async () => {
    try {
      if (editedStory.id) {
        await storiesApiService.updateStory(editedStory.id, editedStory);
        toast.success("Story updated successfully");
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating story:", error);
      toast.error("Failed to update story");
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real implementation, you would call an API to add the comment
      toast.success("Comment added successfully");
      setNewComment("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getTypeIcon(story.story_type)}
              <DialogTitle className="text-xl">{story.title}</DialogTitle>
            </div>
            <div className="flex items-center space-x-2 mr-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-[#28A745] hover:bg-[#218838]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks{" "}
              {story.subtasks?.length ? `(${story.subtasks.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments{" "}
              {story.comments?.length ? `(${story.comments.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity{" "}
              {story.activity?.length ? `(${story.activity.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Story Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Story Type</Label>
                        <Select
                          value={editedStory.story_type || ""}
                          onValueChange={(value: string) =>
                            setEditedStory({
                              ...editedStory,
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
                        <Label>Priority</Label>
                        <Select
                          value={editedStory.priority || ""}
                          onValueChange={(value: string) =>
                            setEditedStory({ ...editedStory, priority: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePriorities &&
                            availablePriorities.length > 0 ? (
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
                      <Label>Title</Label>
                      <Input
                        value={editedStory.title || ""}
                        onChange={(e) =>
                          setEditedStory({
                            ...editedStory,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editedStory.description || ""}
                        onChange={(e) =>
                          setEditedStory({
                            ...editedStory,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Story Points</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={editedStory.story_points || ""}
                          onChange={(e) =>
                            setEditedStory({
                              ...editedStory,
                              story_points: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={editedStory.status || ""}
                          onValueChange={(value: string) =>
                            setEditedStory({ ...editedStory, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Epic</Label>
                      <Select
                        value={editedStory.epic_id || "no-epic"}
                        onValueChange={(value: string) => {
                          if (value === "no-epic") {
                            setEditedStory({
                              ...editedStory,
                              epic_id: "",
                              epic_title: "",
                            });
                          } else {
                            const selectedEpic = epics.find(
                              (epic) => epic.id === value
                            );
                            setEditedStory({
                              ...editedStory,
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
                          ) : epics.length > 0 ? (
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
                      <Label>Business Value</Label>
                      <Textarea
                        placeholder="Describe the business value and rationale for this story..."
                        rows={3}
                        value={editedStory.business_value || ""}
                        onChange={(e) =>
                          setEditedStory({
                            ...editedStory,
                            business_value: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Acceptance Criteria</Label>
                      <div className="space-y-2">
                        {Array.isArray(editedStory.acceptance_criteria) ? (
                          editedStory.acceptance_criteria.map(
                            (criteria, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <Input
                                  placeholder="Enter acceptance criteria"
                                  value={criteria}
                                  onChange={(e) => {
                                    const newCriteria = [
                                      ...(editedStory.acceptance_criteria ||
                                        []),
                                    ];
                                    newCriteria[index] = e.target.value;
                                    setEditedStory({
                                      ...editedStory,
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
                                      editedStory.acceptance_criteria?.filter(
                                        (_, i) => i !== index
                                      ) || [];
                                    setEditedStory({
                                      ...editedStory,
                                      acceptance_criteria: newCriteria,
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )
                          )
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Enter acceptance criteria"
                              value=""
                              onChange={(e) => {
                                setEditedStory({
                                  ...editedStory,
                                  acceptance_criteria: [e.target.value],
                                });
                              }}
                            />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCriteria = [
                              ...(editedStory.acceptance_criteria || []),
                              "",
                            ];
                            setEditedStory({
                              ...editedStory,
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
                      <Label>Labels (comma-separated)</Label>
                      <Input
                        placeholder="frontend, ui, enhancement"
                        value={editedStory.labels?.join(", ") || ""}
                        onChange={(e) =>
                          setEditedStory({
                            ...editedStory,
                            labels: e.target.value
                              .split(",")
                              .map((label) => label.trim())
                              .filter((label) => label),
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{story.description}</p>
                  </div>
                )}
              </div>

              <div className="ml-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(story.priority)}
                  >
                    {story.priority}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getStatusColor(story.status)}
                  >
                    {story.status.replace("-", " ")}
                  </Badge>
                </div>
                {story.story_points && (
                  <Badge variant="outline">{story.story_points} pts</Badge>
                )}
              </div>
            </div>

            {/* Story Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground">Assignee</p>
                      {isEditing ? (
                        <Select
                          value={editedStory.assignee_id || "unassigned"}
                          onValueChange={(value: string) => {
                            if (value === "unassigned") {
                              setEditedStory({
                                ...editedStory,
                                assignee_id: "",
                                assignee_name: "",
                              });
                            } else {
                              const selectedMember = projectTeamMembers.find(
                                (member) => member.id === value
                              );
                              setEditedStory({
                                ...editedStory,
                                assignee_id: value,
                                assignee_name: selectedMember?.name || "",
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              Unassigned
                            </SelectItem>
                            {projectTeamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">
                          {story.assignee_name || "Unassigned"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground">Reporter</p>
                      {isEditing ? (
                        <Select
                          value={editedStory.reporter_id || "no-reporter"}
                          onValueChange={(value: string) => {
                            if (value === "no-reporter") {
                              setEditedStory({
                                ...editedStory,
                                reporter_id: "",
                                reporter_name: "",
                              });
                            } else if (value === projectTeamLead?.id) {
                              setEditedStory({
                                ...editedStory,
                                reporter_id: value,
                                reporter_name: projectTeamLead?.name || "",
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-reporter">
                              No reporter
                            </SelectItem>
                            {projectTeamLead && (
                              <SelectItem value={projectTeamLead.id}>
                                {projectTeamLead.name}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">
                          {story.reporter_name || "Unknown"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground">
                        Start Date
                      </p>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedStory.start_date || ""}
                          onChange={(e) =>
                            setEditedStory({
                              ...editedStory,
                              start_date: e.target.value,
                            })
                          }
                          className="h-6 text-xs"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {story.start_date || "Not set"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground">End Date</p>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedStory.end_date || ""}
                          onChange={(e) =>
                            setEditedStory({
                              ...editedStory,
                              end_date: e.target.value,
                            })
                          }
                          className="h-6 text-xs"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {story.end_date || "Not set"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Value */}
            {story.business_value && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Business Value (Log Description)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {story.business_value}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Acceptance Criteria */}
            {story.acceptance_criteria &&
              story.acceptance_criteria.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Acceptance Criteria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {story.acceptance_criteria.map((criteria, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            {/* Labels */}
            {story.labels && story.labels.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Labels</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {story.labels.map((label, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-4">
            {isEditing && (
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
                    ...(editedStory.subtasks || []),
                    newSubtask,
                  ];
                  setEditedStory({ ...editedStory, subtasks: newSubtasks });
                }}
                className="mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subtask
              </Button>
            )}

            {story.subtasks && story.subtasks.length > 0 ? (
              (isEditing ? editedStory.subtasks : story.subtasks)?.map(
                (subtask, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">
                              <Label className="text-xs">Task Name</Label>
                              <Input
                                value={subtask.task_name}
                                onChange={(e) => {
                                  const newSubtasks = [
                                    ...(editedStory.subtasks || []),
                                  ];
                                  newSubtasks[index] = {
                                    ...newSubtasks[index],
                                    task_name: e.target.value,
                                  };
                                  setEditedStory({
                                    ...editedStory,
                                    subtasks: newSubtasks,
                                  });
                                }}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-4">
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={subtask.description}
                                onChange={(e) => {
                                  const newSubtasks = [
                                    ...(editedStory.subtasks || []),
                                  ];
                                  newSubtasks[index] = {
                                    ...newSubtasks[index],
                                    description: e.target.value,
                                  };
                                  setEditedStory({
                                    ...editedStory,
                                    subtasks: newSubtasks,
                                  });
                                }}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Due Date</Label>
                              <Input
                                type="date"
                                value={subtask.due_date}
                                onChange={(e) => {
                                  const newSubtasks = [
                                    ...(editedStory.subtasks || []),
                                  ];
                                  newSubtasks[index] = {
                                    ...newSubtasks[index],
                                    due_date: e.target.value,
                                  };
                                  setEditedStory({
                                    ...editedStory,
                                    subtasks: newSubtasks,
                                  });
                                }}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-1 flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newSubtasks =
                                    editedStory.subtasks?.filter(
                                      (_, i) => i !== index
                                    ) || [];
                                  setEditedStory({
                                    ...editedStory,
                                    subtasks: newSubtasks,
                                  });
                                }}
                                className="h-8 text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Assignee</Label>
                              <Input
                                value={subtask.assignee}
                                onChange={(e) => {
                                  const newSubtasks = [
                                    ...(editedStory.subtasks || []),
                                  ];
                                  newSubtasks[index] = {
                                    ...newSubtasks[index],
                                    assignee: e.target.value,
                                  };
                                  setEditedStory({
                                    ...editedStory,
                                    subtasks: newSubtasks,
                                  });
                                }}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Priority</Label>
                              <Select
                                value={subtask.priority}
                                onValueChange={(value) => {
                                  const newSubtasks = [
                                    ...(editedStory.subtasks || []),
                                  ];
                                  newSubtasks[index] = {
                                    ...newSubtasks[index],
                                    priority: value,
                                  };
                                  setEditedStory({
                                    ...editedStory,
                                    subtasks: newSubtasks,
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{subtask.task_name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {subtask.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Assignee: {subtask.assignee}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {subtask.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Due: {subtask.due_date}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              )
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No subtasks found</p>
                {isEditing && (
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
                      setEditedStory({
                        ...editedStory,
                        subtasks: [newSubtask],
                      });
                    }}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Subtask
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {/* Add Comment */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-[#28A745] hover:bg-[#218838]"
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            {story.comments && story.comments.length > 0 ? (
              story.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#28A745] text-white text-xs">
                          {comment.author_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No comments yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {story.activity && story.activity.length > 0 ? (
              story.activity.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">
                            {activity.user_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.action}:
                          </span>{" "}
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activity recorded</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
