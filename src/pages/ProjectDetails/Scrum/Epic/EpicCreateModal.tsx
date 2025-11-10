import { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Badge } from "../../../../components/ui/badge";
import { CalendarIcon, X, Plus } from "lucide-react";
import {
  epicApiService,
  CreateEpicRequest,
} from "../../../../services/epicApi";
import {
  ProjectStatusItem,
  ProjectPriorityItem,
} from "../../../../services/projectApi";
import { toast } from "sonner";

interface EpicCreateModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
  teamMembers?: any[];
  availableStatuses?: ProjectStatusItem[];
  availablePriorities?: ProjectPriorityItem[];
}

export function EpicCreateModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  user,
  teamMembers = [],
  availableStatuses,
  availablePriorities,
}: EpicCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEpicRequest>({
    title: "",
    description: "",
    priority: "Medium",
    status: "Not Started",
    project_id: projectId,
    assignee_id: "",
    due_date: "",
    total_story_points: 0,
    completed_story_points: 0,
    total_tasks: 0,
    completed_tasks: 0,
    labels: [],
    business_value: "",
  });

  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        status: "Not Started",
        project_id: projectId,
        assignee_id: "",
        due_date: "",
        total_story_points: 0,
        completed_story_points: 0,
        total_tasks: 0,
        completed_tasks: 0,
        labels: [],
        business_value: "",
      });
      setNewLabel("");
    }
  }, [isOpen, projectId]);

  const handleInputChange = (field: keyof CreateEpicRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData((prev) => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()],
      }));
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.filter((label) => label !== labelToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Epic title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Epic description is required");
      return;
    }

    if (!formData.due_date) {
      toast.error("Due date is required");
      return;
    }

    try {
      setLoading(true);
      await epicApiService.createEpic(formData);
      toast.success("Epic created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating epic:", error);
      toast.error("Failed to create epic. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const isoDate = new Date(dateValue).toISOString();
      handleInputChange("due_date", isoDate);
    } else {
      handleInputChange("due_date", "");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Epic</DialogTitle>
          <DialogDescription>
            Create a new epic to organize and track related user stories and
            tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">Epic Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter epic title"
                className="mt-1"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe the epic and its goals"
                className="mt-1 min-h-[100px]"
                required
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  handleInputChange("priority", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {availablePriorities && availablePriorities.length > 0 ? (
                    availablePriorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.name}>
                        {priority.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses && availableStatuses.length > 0 ? (
                    availableStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assignee_id || "unassigned"}
                onValueChange={(value: any) =>
                  handleInputChange(
                    "assignee_id",
                    value === "unassigned" ? "" : value
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-[#28A745] flex items-center justify-center text-white text-xs font-medium">
                          {member.name?.charAt(0) || "U"}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="due_date">Due Date *</Label>
              <div className="mt-1 relative">
                <Input
                  id="due_date"
                  type="date"
                  value={formatDateForInput(formData.due_date)}
                  onChange={handleDateChange}
                  className="pr-10"
                  required
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Story Points */}
            <div>
              <Label htmlFor="total_story_points">Total Story Points</Label>
              <Input
                id="total_story_points"
                type="number"
                min="0"
                value={formData.total_story_points}
                onChange={(e) =>
                  handleInputChange(
                    "total_story_points",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
                className="mt-1"
              />
            </div>

            {/* Business Value */}
            <div className="md:col-span-2">
              <Label htmlFor="business_value">Business Value</Label>
              <Textarea
                id="business_value"
                value={formData.business_value}
                onChange={(e) =>
                  handleInputChange("business_value", e.target.value)
                }
                placeholder="Describe the business value this epic provides"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Labels */}
            <div className="md:col-span-2">
              <Label htmlFor="labels">Labels</Label>
              <div className="mt-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Add a label"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLabel();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLabel}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.labels.map((label, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {label}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                          onClick={() => handleRemoveLabel(label)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#28A745] hover:bg-[#218838]"
            >
              {loading ? "Creating..." : "Create Epic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
