import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Calendar, 
  BarChart3, 
  Timer,
  User,
  Target,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react'

interface TimeTrackingViewProps {
  projectId: string
  user: any
}

// TODO: Replace with time tracking API integration
const mockTimeEntries: any[] = []

// TODO: Replace with weekly data from time tracking API
const mockWeeklyData: any[] = []

// TODO: Replace with team statistics from time tracking API
const mockTeamStats: any[] = []

export function TimeTrackingView({ projectId, user }: TimeTrackingViewProps) {
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const calculateTotalHours = () => {
    return mockTimeEntries.reduce((total, entry) => total + entry.duration, 0)
  }

  const calculateBillableHours = () => {
    return mockTimeEntries
      .filter(entry => entry.billable)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const startTimer = (taskId: string) => {
    setActiveTimer(taskId)
    setCurrentTime(0)
  }

  const stopTimer = () => {
    setActiveTimer(null)
    setCurrentTime(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Time Tracking</h2>
          <p className="text-muted-foreground">Track time spent on project tasks</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Tracking Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#007BFF]">
              {formatDuration(calculateTotalHours())}
            </div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#28A745]">
              {formatDuration(calculateBillableHours())}
            </div>
            <div className="text-xs text-muted-foreground">Billable Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#FFC107]">
              {mockTimeEntries.filter(e => e.status === 'in-progress').length}
            </div>
            <div className="text-xs text-muted-foreground">Active Timers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#DC3545]">
              {Math.round((calculateBillableHours() / calculateTotalHours()) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Billable Rate</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Session</TabsTrigger>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="team">Team Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Active Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5" />
                <span>Current Timer</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTimer ? (
                <div className="text-center space-y-4">
                  <div className="text-4xl font-mono font-semibold text-[#28A745]">
                    {Math.floor(currentTime / 3600).toString().padStart(2, '0')}:
                    {Math.floor((currentTime % 3600) / 60).toString().padStart(2, '0')}:
                    {(currentTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-muted-foreground">
                    Working on: API Testing
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <Button variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                    <Button variant="outline" size="sm" onClick={stopTimer}>
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-muted-foreground">No active timer</div>
                  <Button onClick={() => startTimer('new')} className="bg-[#28A745] hover:bg-[#218838]">
                    <Play className="w-4 h-4 mr-1" />
                    Start Timer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Start Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTimeEntries.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Target className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">{entry.task}</div>
                        <div className="text-xs text-muted-foreground">#{entry.taskId}</div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => startTimer(entry.taskId)}
                      className="bg-[#28A745] hover:bg-[#218838]"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          {/* Time Entries List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Time Entries</CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTimeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#28A745] text-white text-xs">
                          {entry.user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{entry.task}</span>
                          <Badge variant="outline" className="text-xs">#{entry.taskId}</Badge>
                          {entry.billable && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              Billable
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold">{formatDuration(entry.duration)}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.date} • {entry.startTime}
                        {entry.endTime && ` - ${entry.endTime}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Weekly Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWeeklyData.map((day) => (
                  <div key={day.day} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{day.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                          <div 
                            className="bg-[#28A745] h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.min((day.hours / 10) * 100, 100)}%` }}
                          >
                            {day.hours > 0 && (
                              <span className="text-xs text-white font-medium">
                                {formatDuration(day.hours)}
                              </span>
                            )}
                          </div>
                          {day.target > 0 && (
                            <div 
                              className="absolute top-0 w-1 h-6 bg-red-500 opacity-50"
                              style={{ left: `${(day.target / 10) * 100}%` }}
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground w-16">
                          Target: {formatDuration(day.target)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Team Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTeamStats.map((member) => (
                  <div key={member.user.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-[#28A745] text-white">
                          {member.user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.tasksCompleted} tasks completed
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="font-semibold">{formatDuration(member.totalHours)}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="font-semibold">{formatDuration(member.billableHours)}</div>
                        <div className="text-xs text-muted-foreground">Billable</div>
                      </div>
                      <div>
                        <div className="font-semibold">{member.efficiency}%</div>
                        <div className="text-xs text-muted-foreground">Efficiency</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}