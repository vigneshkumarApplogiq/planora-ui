import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import {
  Zap,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  GitBranch,
  ArrowRight,
  PlayCircle,
  Timer,
} from "lucide-react";

interface ScrumProjectDashboardProps {
  project: any;
  user: any;
}

// TODO: Replace with Scrum data from project API
const mockScrumData = {
  currentSprint: {
    name: "",
    number: 0,
    startDate: "",
    endDate: "",
    goal: "",
    progress: 0,
    totalStoryPoints: 0,
    completedStoryPoints: 0,
    burndownTrend: "on-track",
    daysRemaining: 0,
  },
  backlog: {
    totalItems: 0,
    readyItems: 0,
    inProgressItems: 0,
    doneItems: 0,
    totalStoryPoints: 0,
    averageVelocity: 0,
  },
  team: {
    velocity: [],
    currentCapacity: 0,
    utilization: 0,
  },
  sprintMetrics: {
    sprintsCompleted: 0,
    averageVelocity: 0,
    predictability: 0,
    teamSatisfaction: 0,
  },
  upcomingEvents: [],
};

export function ScrumProjectDashboard({
  project,
  user,
}: ScrumProjectDashboardProps) {
  const velocityTrend = mockScrumData.team.velocity;
  const currentVelocity = velocityTrend[velocityTrend.length - 1];
  const previousVelocity = velocityTrend[velocityTrend.length - 2];
  const velocityChange = currentVelocity - previousVelocity;

  const sprintCompletionRate = Math.round(
    (mockScrumData.currentSprint.completedStoryPoints /
      mockScrumData.currentSprint.totalStoryPoints) *
      100
  );

  return (
    <div className="space-y-6">
      {/* Top Row - Sprint Overview Card */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <div className="text-2xl font-bold">
                  {mockScrumData.currentSprint.name || "Sprint 1"}
                </div>
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-[#007BFF]/10 text-[#007BFF] border-[#007BFF]/30 px-3 py-1 rounded-full"
              >
                Active Sprint
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {mockScrumData.currentSprint.goal}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#007BFF]/5 rounded-lg">
                <div className="text-2xl font-bold text-[#007BFF]">6</div>
                <div className="text-sm text-muted-foreground">Days Left</div>
              </div>
              <div className="text-center p-4 bg-[#28A745]/5 rounded-lg">
                <div className="text-2xl font-bold text-[#28A745]">27</div>
                <div className="text-sm text-muted-foreground">Points Done</div>
              </div>
              <div className="text-center p-4 bg-[#FFC107]/5 rounded-lg">
                <div className="text-2xl font-bold text-[#FFC107]">15</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
              <div className="text-center p-4 bg-[#6F42C1]/5 rounded-lg">
                <div className="text-2xl font-bold text-[#6F42C1]">64%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Sprint Progress</span>
                <span className="text-sm text-[#28A745] font-medium">
                  ON TRACK
                </span>
              </div>
              <Progress value={64} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Backlog & Sprint Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Product Backlog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-[#FFC107]">87</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-[#28A745]/5 rounded-lg">
                <div className="text-lg font-semibold text-[#28A745]">23</div>
                <div className="text-xs text-muted-foreground">Ready</div>
              </div>
              <div className="text-center p-3 bg-[#007BFF]/5 rounded-lg">
                <div className="text-lg font-semibold text-[#007BFF]">8</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <div className="text-lg font-semibold text-[#28A745]">92%</div>
              <div className="text-xs text-muted-foreground">
                Sprint Completion Rate
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Sprint Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-[#007BFF]">4</div>
              <div className="text-sm text-muted-foreground">
                Sprints Completed
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>Team Velocity</span>
                <span className="font-medium">37 pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Predictability</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Capacity Utilization</span>
                <span className="font-medium">85%</span>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <div className="text-lg font-semibold text-[#6F42C1]">4.2</div>
              <div className="text-xs text-muted-foreground">
                Team Satisfaction
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Scrum Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#DC3545]" />
            <span>Upcoming Scrum Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockScrumData.upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#DC3545]/10 rounded-lg">
                    {event.type.includes("Daily") ? (
                      <Timer className="w-4 h-4 text-[#DC3545]" />
                    ) : event.type.includes("Planning") ? (
                      <Target className="w-4 h-4 text-[#DC3545]" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-[#DC3545]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.today ? "Today" : event.date} at {event.time}
                    </div>
                    {event.today && (
                      <Badge
                        variant="outline"
                        className="mt-1 text-xs bg-[#28A745]/10 text-[#28A745] border-[#28A745]/30"
                      >
                        Today
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#6F42C1]" />
            <span>Scrum Team Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project?.team?.length > 0 ? (
              project.team.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-[#28A745] text-white">
                        {member.avatar || member.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-center">
                    <div>
                      <div className="text-sm font-semibold">
                        {Math.floor(Math.random() * 15) + 8}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Story Points
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {Math.floor(Math.random() * 6) + 3}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tasks Done
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {Math.floor(Math.random() * 20) + 30}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        This Sprint
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No team members assigned to this project yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
