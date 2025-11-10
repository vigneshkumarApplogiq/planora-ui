import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Target,
  Users,
  Calendar,
  MoreHorizontal,
  Trash2,
  Check,
} from "lucide-react";
import { notificationApiService } from "../../services/notificationApi";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const notifications = [
  {
    id: "NOTIF-001",
    type: "mention",
    title: "John Doe mentioned you in a comment",
    message:
      "Can you review the API documentation for the user authentication flow?",
    timestamp: "5 minutes ago",
    read: false,
    icon: MessageSquare,
    color: "text-[#007BFF]",
    bgColor: "bg-[#007BFF]/10",
    task: "TASK-001",
    user: "John Doe",
  },
  {
    id: "NOTIF-002",
    type: "deadline",
    title: "Task deadline approaching",
    message: "Design system implementation is due in 2 hours",
    timestamp: "30 minutes ago",
    read: false,
    icon: Clock,
    color: "text-[#FFC107]",
    bgColor: "bg-[#FFC107]/10",
    task: "TASK-001",
    user: null,
  },
  {
    id: "NOTIF-003",
    type: "sla",
    title: "SLA breach alert",
    message: "Customer response time exceeded for Acme Corporation project",
    timestamp: "1 hour ago",
    read: false,
    icon: AlertTriangle,
    color: "text-[#DC3545]",
    bgColor: "bg-[#DC3545]/10",
    task: null,
    user: null,
  },
  {
    id: "NOTIF-004",
    type: "completion",
    title: "Task completed",
    message: 'Jane Smith completed "API endpoint optimization"',
    timestamp: "2 hours ago",
    read: true,
    icon: CheckCircle,
    color: "text-[#28A745]",
    bgColor: "bg-[#28A745]/10",
    task: "TASK-002",
    user: "Jane Smith",
  },
  {
    id: "NOTIF-005",
    type: "assignment",
    title: "New task assigned",
    message: 'You have been assigned to "Mobile UI components"',
    timestamp: "3 hours ago",
    read: true,
    icon: Target,
    color: "text-[#007BFF]",
    bgColor: "bg-[#007BFF]/10",
    task: "TASK-005",
    user: null,
  },
];

const activityFeed = [
  {
    id: "ACT-001",
    user: "Mike Johnson",
    action: "updated task status",
    target: "User testing preparation",
    timestamp: "10 minutes ago",
  },
  {
    id: "ACT-002",
    user: "Sarah Wilson",
    action: "added comment to",
    target: "Web App Redesign",
    timestamp: "25 minutes ago",
  },
  {
    id: "ACT-003",
    user: "Alex Chen",
    action: "completed task",
    target: "Database migration script",
    timestamp: "45 minutes ago",
  },
  {
    id: "ACT-004",
    user: "John Doe",
    action: "created new project",
    target: "API Integration Phase 2",
    timestamp: "1 hour ago",
  },
];

export function NotificationCenter({
  isOpen,
  onClose,
  user,
}: NotificationCenterProps) {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await notificationApiService.getNotifications({
          unread_only: false,
        });

        console.log(data, "asdasasdadasdasd");
        // setNotifications(data);
      } catch (err: any) {
        // setError(err.message);
      } finally {
        // setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (notificationId: string) => {
    // In a real app, this would update the notification status
  };

  const handleMarkAllAsRead = () => {
    // In a real app, this would mark all notifications as read
  };

  const handleDeleteNotification = (notificationId: string) => {
    // In a real app, this would delete the notification
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[920px] max-w-[920px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DialogTitle>Notifications</DialogTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mr-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            </div>
          </div>
          <DialogDescription>
            Stay updated with your latest notifications and team activity
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              Notifications ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-0">
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        !notification.read
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-full ${notification.bgColor} shrink-0`}
                        >
                          <Icon className={`w-4 h-4 ${notification.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4
                              className={`text-sm font-medium ${
                                !notification.read
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2 shrink-0">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{notification.timestamp}</span>
                              {notification.task && (
                                <>
                                  <span>•</span>
                                  <span>{notification.task}</span>
                                </>
                              )}
                            </div>

                            {notification.user && (
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="bg-[#007BFF] text-white text-xs">
                                    {notification.user
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {notification.user}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-0">
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {activityFeed.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No recent activity
                  </h3>
                  <p className="text-muted-foreground">
                    Team activity will appear here
                  </p>
                </div>
              ) : (
                activityFeed.map((activity) => (
                  <div key={activity.id} className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#007BFF] text-white text-xs">
                          {activity.user
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{" "}
                          <span className="text-muted-foreground">
                            {activity.action}
                          </span>{" "}
                          <span className="font-medium">{activity.target}</span>
                        </p>

                        <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
