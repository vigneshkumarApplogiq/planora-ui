import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Clock,
  GitCommit,
  MessageSquare,
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  Flag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { activityApiService, Activity } from "../../services/activityApi";
import { toast } from "sonner";

interface ActivityViewProps {
  project: any;
  user: any;
}

export function ActivityView({ project, user }: ActivityViewProps) {
  const projectId = project?.id;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (projectId) {
      loadActivities();
    }
  }, [projectId, currentPage, perPage, activityTypeFilter, entityTypeFilter]);

  const loadActivities = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
      };

      if (activityTypeFilter !== "all") {
        params.activity_type = activityTypeFilter;
      }

      if (entityTypeFilter !== "all") {
        params.entity_type = entityTypeFilter;
      }

      const response = await activityApiService.getActivities(
        projectId,
        params
      );
      setActivities(response.activities);
      setTotalCount(response.total_count);
      setHasMore(response.has_more);
    } catch (error) {
      console.error("Failed to load activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadActivities();
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "task_assigned":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "task_blocked":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "comment_added":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "file_uploaded":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "sprint_started":
        return <Calendar className="w-4 h-4 text-green-600" />;
      case "milestone_reached":
        return <Flag className="w-4 h-4 text-orange-600" />;
      case "code_commit":
        return <GitCommit className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task_completed":
        return "border-l-green-500";
      case "task_assigned":
        return "border-l-blue-500";
      case "task_blocked":
        return "border-l-red-500";
      case "comment_added":
        return "border-l-blue-500";
      case "file_uploaded":
        return "border-l-purple-500";
      case "sprint_started":
        return "border-l-green-500";
      case "milestone_reached":
        return "border-l-orange-500";
      case "code_commit":
        return "border-l-gray-500";
      default:
        return "border-l-gray-300";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderActivityDetails = (activity: Activity) => {
    const metadata = activity.activity_metadata || {};

    if (activity.story_points) {
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          Story points: {activity.story_points} • Entity ID:{" "}
          {activity.entity_id}
        </div>
      );
    }

    if (activity.file_size) {
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          File size: {(activity.file_size / 1024 / 1024).toFixed(2)} MB
        </div>
      );
    }

    if (activity.planned_points) {
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          Duration: {activity.duration_weeks} weeks • Planned points:{" "}
          {activity.planned_points}
        </div>
      );
    }

    if (metadata.comment) {
      return (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm italic">
          "{metadata.comment}"
        </div>
      );
    }

    if (activity.description) {
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          {activity.description}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Project Activity</h2>
          <p className="text-muted-foreground">
            Real-time updates and project timeline
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select
          value={activityTypeFilter}
          onValueChange={setActivityTypeFilter}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="task_completed">Task Completed</SelectItem>
            <SelectItem value="task_created">Task Created</SelectItem>
            <SelectItem value="task_updated">Task Updated</SelectItem>
            <SelectItem value="file_uploaded">File Uploaded</SelectItem>
            <SelectItem value="comment_added">Comment Added</SelectItem>
            <SelectItem value="sprint_started">Sprint Started</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="sprint">Sprint</SelectItem>
            <SelectItem value="file">File</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground">
          Total: {totalCount} activities
        </div>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading activities...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No activities found</h3>
              <p className="text-muted-foreground">
                There are no activities matching your filters
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start space-x-4 p-4 border-l-4 ${getActivityColor(
                      activity.activity_type
                    )} bg-gray-50 dark:bg-gray-800/50 rounded-r-lg`}
                  >
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-[#28A745] text-white text-xs">
                        {activity.user_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getActivityIcon(activity.activity_type)}
                        <span className="text-sm">
                          <span className="font-medium">
                            {activity.user_name}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            {activity.action}{" "}
                          </span>
                          <span className="font-medium">
                            {activity.entity_title}
                          </span>
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground mb-1">
                        {formatTimestamp(activity.created_at)}
                      </div>

                      {renderActivityDetails(activity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} • Showing {activities.length} of{" "}
                  {totalCount} activities
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMore}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
