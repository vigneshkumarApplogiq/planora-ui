import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Calendar } from '../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { toast } from 'sonner'
import {
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  FileText,
  PieChart,
  Activity,
  Clock,
  Target,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  scrumReportsApiService,
  type VelocityResponse,
  type BurndownResponse,
  type SprintOverviewResponse,
  type TeamPerformanceResponse,
  type TaskCompletionResponse,
  type QualityMetricsResponse
} from '../../../../services/scrumReportsApi'

// Simple date formatting function
const formatDate = (date: Date, formatType: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  if (formatType === 'MMM d') {
    return `${months[date.getMonth()]} ${date.getDate()}`
  } else if (formatType === 'MMM d, yyyy' || formatType === 'PPP') {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }
  return date.toLocaleDateString()
}

interface ReportsViewProps {
  projectId: string
  user: any
  project?: any
}

const COLORS = ['#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#17A2B8', '#FD7E14', '#20C997']

// Mock data for fallback when APIs are not available
const mockReportData = {
  velocity: {
    current: 42,
    previous: 38,
    average: 40,
    sprints: [
      { name: 'Sprint 1', planned: 45, completed: 42, velocity: 93 },
      { name: 'Sprint 2', planned: 40, completed: 38, velocity: 95 },
      { name: 'Sprint 3', planned: 42, completed: 40, velocity: 95 },
      { name: 'Sprint 4', planned: 48, completed: 45, velocity: 94 },
      { name: 'Sprint 5', planned: 44, completed: 42, velocity: 95 }
    ]
  },
  burndown: {
    totalStoryPoints: 120,
    completedStoryPoints: 85,
    remainingStoryPoints: 35,
    chartData: [
      { day: 'Day 1', ideal: 120, actual: 120 },
      { day: 'Day 2', ideal: 105, actual: 110 },
      { day: 'Day 3', ideal: 90, actual: 95 },
      { day: 'Day 4', ideal: 75, actual: 85 },
      { day: 'Day 5', ideal: 60, actual: 70 },
      { day: 'Day 6', ideal: 45, actual: 55 },
      { day: 'Day 7', ideal: 30, actual: 40 },
      { day: 'Day 8', ideal: 15, actual: 25 },
      { day: 'Day 9', ideal: 0, actual: 10 }
    ]
  },
  taskCompletion: {
    completionRate: 78,
    distribution: [
      { status: 'To Do', count: 12, percentage: 20 },
      { status: 'In Progress', count: 8, percentage: 13 },
      { status: 'In Review', count: 5, percentage: 8 },
      { status: 'Done', count: 35, percentage: 59 }
    ]
  },
  timeTracking: {
    totalHours: 320,
    billableHours: 280,
    avgHoursPerDay: 7.5,
    overtime: 15,
    weeklyData: [
      { week: 'Week 1', hours: 40, billable: 35 },
      { week: 'Week 2', hours: 45, billable: 40 },
      { week: 'Week 3', hours: 42, billable: 38 },
      { week: 'Week 4', hours: 48, billable: 42 }
    ]
  },
  teamPerformance: [
    { name: 'John Doe', tasksCompleted: 12, hoursLogged: 85, completionRate: 92, efficiency: 92 },
    { name: 'Jane Smith', tasksCompleted: 15, hoursLogged: 78, completionRate: 88, efficiency: 88 },
    { name: 'Bob Johnson', tasksCompleted: 10, hoursLogged: 72, completionRate: 85, efficiency: 85 }
  ],
  qualityMetrics: {
    bugsFound: 24,
    bugsFixed: 20,
    bugResolutionTime: 2.5,
    testCoverage: 85,
    bugTrend: [
      { week: 'Week 1', found: 8, fixed: 5 },
      { week: 'Week 2', found: 6, fixed: 7 },
      { week: 'Week 3', found: 5, fixed: 4 },
      { week: 'Week 4', found: 5, fixed: 4 }
    ]
  }
}

export function ReportsView({ projectId, project }: ReportsViewProps) {
  // Loading and Data States
  const [loading, setLoading] = useState(true)
  const [velocityData, setVelocityData] = useState<VelocityResponse | null>(null)
  const [burndownData, setBurndownData] = useState<BurndownResponse | null>(null)
  const [overviewData, setOverviewData] = useState<SprintOverviewResponse | null>(null)
  const [teamData, setTeamData] = useState<TeamPerformanceResponse | null>(null)
  const [taskData, setTaskData] = useState<TaskCompletionResponse | null>(null)
  const [qualityData, setQualityData] = useState<QualityMetricsResponse | null>(null)

  // UI States
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [reportType, setReportType] = useState('all')
  const [selectedTab, setSelectedTab] = useState('overview')

  // Load all reports on mount or when project changes
  useEffect(() => {
    if (projectId || project?.id) {
      loadAllReports()
    }
  }, [projectId, project?.id])

  const loadAllReports = async () => {
    const effectiveProjectId = projectId || project?.id
    if (!effectiveProjectId) {
      console.warn('[Scrum Reports] No project ID available')
      return
    }

    try {
      setLoading(true)
      // Prepare date range params
      const params = {
        from_date: dateRange.from ? dateRange.from.toISOString().split('T')[0] : undefined,
        to_date: dateRange.to ? dateRange.to.toISOString().split('T')[0] : undefined
      }

      // Load all reports in parallel
      const [velocity, burndown, overview, team, tasks, quality] = await Promise.all([
        scrumReportsApiService.getVelocityMetrics(effectiveProjectId, params).catch(e => {
          console.warn('[Scrum Reports] Velocity API not available:', e.message)
          return null
        }),
        scrumReportsApiService.getBurndownMetrics(effectiveProjectId, undefined, params).catch(e => {
          console.warn('[Scrum Reports] Burndown API not available:', e.message)
          return null
        }),
        scrumReportsApiService.getSprintOverview(effectiveProjectId, params).catch(e => {
          console.warn('[Scrum Reports] Overview API not available:', e.message)
          return null
        }),
        scrumReportsApiService.getTeamPerformance(effectiveProjectId, params).catch(e => {
          console.warn('[Scrum Reports] Team Performance API not available:', e.message)
          return null
        }),
        scrumReportsApiService.getTaskCompletionMetrics(effectiveProjectId, params).catch(e => {
          console.warn('[Scrum Reports] Task Completion API not available:', e.message)
          return null
        }),
        scrumReportsApiService.getQualityMetrics(effectiveProjectId, params).catch(e => {
          console.warn('[Scrum Reports] Quality Metrics API not available:', e.message)
          return null
        })
      ])

      setVelocityData(velocity)
      setBurndownData(burndown)
      setOverviewData(overview)
      setTeamData(team)
      setTaskData(tasks)
      setQualityData(quality)
    } catch (error) {
      console.error('❌ [Scrum Reports] Error loading reports:', error)
      toast.error('Failed to load some reports. Backend API may not be available yet.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAllReports()
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading reports...</span>
      </div>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />
      case 'stable': return <Minus className="w-4 h-4 text-gray-600" />
      default: return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const MetricCard = ({ 
    title, 
    value, 
    unit = '', 
    trend, 
    trendValue, 
    icon: Icon 
  }: { 
    title: string
    value: number | string
    unit?: string
    trend?: string
    trendValue?: number
    icon: any 
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-2xl font-semibold">
              {value}{unit}
            </p>
            {trend && trendValue && (
              <div className={`flex items-center space-x-1 text-sm ${getTrendColor(trend)}`}>
                {getTrendIcon(trend)}
                <span>{trendValue}% vs last period</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* API Availability Notice */}
      {(!velocityData && !burndownData && !overviewData && !teamData && !taskData && !qualityData) && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-sm">
                <h4 className="font-semibold mb-2">📊 Backend API Not Available</h4>
                <p className="text-muted-foreground mb-2">
                  The Scrum Reports feature requires backend API endpoints at <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-xs">/api/v1/reports/scrum/</code>.
                </p>
                <p className="text-muted-foreground">
                  Once the backend implements these endpoints, refresh this page to see real data and charts.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Loading Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Scrum Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Sprint velocity, burndown charts, and team performance insights</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="velocity">Velocity</SelectItem>
              <SelectItem value="burndown">Burndown</SelectItem>
              <SelectItem value="time">Time Tracking</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateRange.from ? formatDate(dateRange.from, "MMM d") : "Start date"} - {dateRange.to ? formatDate(dateRange.to, "MMM d") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: { from: Date | undefined, to: Date | undefined } | undefined) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button className="bg-[#28A745] hover:bg-[#218838]">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full overflow-x-auto">
          <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="velocity" className="whitespace-nowrap">Velocity</TabsTrigger>
          <TabsTrigger value="burndown" className="whitespace-nowrap">Burndown</TabsTrigger>
          <TabsTrigger value="team" className="whitespace-nowrap">Team</TabsTrigger>
          <TabsTrigger value="quality" className="whitespace-nowrap">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Current Velocity"
              value={mockReportData.velocity.current}
              unit=" points"
              trend="up"
              trendValue={17}
              icon={TrendingUp}
            />
            <MetricCard
              title="Completion Rate"
              value={mockReportData.taskCompletion.completionRate}
              unit="%"
              trend="up"
              trendValue={5}
              icon={CheckCircle}
            />
            <MetricCard
              title="Team Efficiency"
              value={89}
              unit="%"
              trend="stable"
              trendValue={0}
              icon={Users}
            />
            <MetricCard
              title="Bug Resolution"
              value={2.4}
              unit=" days"
              trend="down"
              trendValue={12}
              icon={AlertTriangle}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sprint Velocity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={mockReportData.velocity.sprints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#28A745" name="Velocity" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={mockReportData.taskCompletion.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {mockReportData.taskCompletion.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Burndown Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={mockReportData.burndown.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="actual" stroke="#007BFF" fill="#007BFF" fillOpacity={0.5} name="Remaining" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={mockReportData.teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasksCompleted" fill="#007BFF" name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="velocity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Current Sprint"
              value={mockReportData.velocity.current}
              unit=" points"
              icon={Target}
            />
            <MetricCard
              title="Previous Sprint"
              value={mockReportData.velocity.previous}
              unit=" points"
              icon={Activity}
            />
            <MetricCard
              title="Average Velocity"
              value={23.3}
              unit=" points"
              icon={TrendingUp}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Velocity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockReportData.velocity.sprints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="planned" stroke="#007BFF" name="Planned" strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke="#28A745" name="Completed" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sprint Velocity Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportData.velocity.sprints.map((sprint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{sprint.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Planned: {sprint.planned} points
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{sprint.velocity || 'In Progress'}</p>
                        {sprint.velocity > 0 && (
                          <p className={`text-sm ${sprint.velocity >= sprint.planned ? 'text-green-600' : 'text-red-600'}`}>
                            {sprint.velocity >= sprint.planned ? '+' : ''}{sprint.velocity - sprint.planned} vs planned
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="burndown" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Story Points"
              value={mockReportData.burndown.totalStoryPoints}
              unit=" points"
              icon={Target}
            />
            <MetricCard
              title="Completed"
              value={mockReportData.burndown.completedStoryPoints}
              unit=" points"
              icon={CheckCircle}
            />
            <MetricCard
              title="Remaining"
              value={mockReportData.burndown.remainingStoryPoints}
              unit=" points"
              icon={Clock}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sprint Burndown Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={mockReportData.burndown.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="ideal" stroke="#6c757d" fill="#6c757d" fillOpacity={0.3} name="Ideal Burndown" />
                  <Area type="monotone" dataKey="actual" stroke="#007BFF" fill="#007BFF" fillOpacity={0.5} name="Actual Burndown" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Burndown Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">On Track</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    The team is performing well and is on track to complete the sprint goals.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Key Insights</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• 71% of sprint completed</li>
                      <li>• Ahead of ideal burndown line</li>
                      <li>• Consistent daily progress</li>
                      <li>• No major blockers identified</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Recommendations</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Continue current pace</li>
                      <li>• Monitor for scope creep</li>
                      <li>• Prepare for next sprint</li>
                      <li>• Document lessons learned</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Hours"
              value={mockReportData.timeTracking.totalHours}
              unit="h"
              icon={Clock}
            />
            <MetricCard
              title="Billable Hours"
              value={mockReportData.timeTracking.billableHours}
              unit="h"
              icon={Target}
            />
            <MetricCard
              title="Avg Hours/Day"
              value={mockReportData.timeTracking.avgHoursPerDay}
              unit="h"
              icon={TrendingUp}
            />
            <MetricCard
              title="Overtime"
              value={mockReportData.timeTracking.overtime}
              unit="h"
              icon={AlertTriangle}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Hours Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockReportData.timeTracking.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#007BFF" name="Total Hours" />
                    <Bar dataKey="billable" fill="#28A745" name="Billable Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportData.teamPerformance.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.tasksCompleted} tasks • {member.hoursLogged}h logged
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{member.efficiency}%</p>
                        <p className="text-sm text-muted-foreground">Efficiency</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Bugs Found"
              value={mockReportData.qualityMetrics.bugsFound}
              icon={AlertTriangle}
            />
            <MetricCard
              title="Bugs Fixed"
              value={mockReportData.qualityMetrics.bugsFixed}
              icon={CheckCircle}
            />
            <MetricCard
              title="Resolution Time"
              value={mockReportData.qualityMetrics.bugResolutionTime}
              unit=" days"
              icon={Clock}
            />
            <MetricCard
              title="Test Coverage"
              value={mockReportData.qualityMetrics.testCoverage}
              unit="%"
              icon={Target}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bug Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockReportData.qualityMetrics.bugTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="found" stroke="#DC3545" name="Bugs Found" strokeWidth={2} />
                    <Line type="monotone" dataKey="fixed" stroke="#28A745" name="Bugs Fixed" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Metrics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { metric: 'Test Coverage', value: mockReportData.qualityMetrics.testCoverage },
                    { metric: 'Bugs Fixed Rate', value: (mockReportData.qualityMetrics.bugsFixed / mockReportData.qualityMetrics.bugsFound) * 100 },
                    { metric: 'Code Quality', value: 78 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#007BFF" name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Code Quality</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Test Coverage</span>
                      <span className="text-sm font-medium">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Code Reviews</span>
                      <span className="text-sm font-medium">56 completed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Technical Debt</span>
                      <span className="text-sm font-medium text-yellow-600">Medium</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Bug Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Open Bugs</span>
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Critical Issues</span>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Resolution</span>
                      <span className="text-sm font-medium">2.4 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}