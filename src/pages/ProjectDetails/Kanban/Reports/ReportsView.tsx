import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Progress } from '../../../../components/ui/progress'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Calendar } from '../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  Activity,
  Clock,
  Target,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  GitBranch,
  Layers,
  AlertCircle
} from 'lucide-react'
import { storiesApiService } from '../../../../services/storiesApi'
import { kanbanReportsApiService, OverviewResponse, FlowMetrics, CycleTimeMetrics, WIPAnalysis, TeamPerformanceMetrics } from '../../../../services/kanbanReportsApi'
import { toast } from 'sonner'

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
  project: any
  user: any
}

export function ReportsView({ project, user }: ReportsViewProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date()
  })
  const [reportType, setReportType] = useState('all')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // API-based state
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null)
  const [flowData, setFlowData] = useState<FlowMetrics | null>(null)
  const [cycleTimeData, setCycleTimeData] = useState<CycleTimeMetrics | null>(null)
  const [wipData, setWipData] = useState<WIPAnalysis | null>(null)
  const [teamData, setTeamData] = useState<TeamPerformanceMetrics | null>(null)
  const [apiLoading, setApiLoading] = useState(false)

  // Load tasks (fallback for local calculations)
  useEffect(() => {
    const loadTasks = async () => {
      if (!project?.id) return

      try {
        setLoading(true)
        const response = await storiesApiService.getStories(project.id, 1, 1000)
        setTasks(response.items || [])
      } catch (error) {
        console.error('Failed to load tasks:', error)
        toast.error('Failed to load tasks for reports')
        setTasks([])
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [project?.id])

  // Load data from API based on selected tab and date range
  useEffect(() => {
    const loadReportData = async () => {
      if (!project?.id) return

      const dateParams = {
        from_date: dateRange.from?.toISOString(),
        to_date: dateRange.to?.toISOString()
      }

      try {
        setApiLoading(true)

        switch (selectedTab) {
          case 'overview':
            const overview = await kanbanReportsApiService.getOverviewMetrics(project.id, dateParams)
            setOverviewData(overview)
            break

          case 'flow':
            const flow = await kanbanReportsApiService.getFlowMetrics(project.id, dateParams)
            setFlowData(flow)
            break

          case 'cycle':
            const cycleTime = await kanbanReportsApiService.getCycleTimeMetrics(project.id, dateParams)
            setCycleTimeData(cycleTime)
            break

          case 'wip':
            const wip = await kanbanReportsApiService.getWIPAnalysis(project.id, { ...dateParams, aging_threshold_days: 7 })
            setWipData(wip)
            break

          case 'team':
            const team = await kanbanReportsApiService.getTeamPerformance(project.id, dateParams)
            setTeamData(team)
            break
        }
      } catch (error) {
        console.error(`Failed to load ${selectedTab} data:`, error)
        toast.error(`Failed to load ${selectedTab} report data`)
      } finally {
        setApiLoading(false)
      }
    }

    loadReportData()
  }, [project?.id, selectedTab, dateRange])

  // Calculate Kanban metrics
  const metrics = {
    // Flow Efficiency
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('completed')).length,
    inProgressTasks: tasks.filter(t => t.status?.toLowerCase().includes('progress')).length,
    todoTasks: tasks.filter(t => t.status?.toLowerCase().includes('todo') || t.status?.toLowerCase() === 'to-do').length,
    blockedTasks: tasks.filter(t => t.status?.toLowerCase().includes('blocked')).length,

    // Cycle Time (average time from start to completion)
    averageCycleTime: calculateAverageCycleTime(tasks),

    // Lead Time (average time from creation to completion)
    averageLeadTime: calculateAverageLeadTime(tasks),

    // Throughput (tasks completed per week)
    throughput: calculateThroughput(tasks),

    // WIP (Work in Progress)
    wipCount: tasks.filter(t =>
      t.status?.toLowerCase().includes('progress') ||
      t.status?.toLowerCase().includes('review')
    ).length,

    // Flow Efficiency = (Active Time / Total Time) * 100
    flowEfficiency: calculateFlowEfficiency(tasks),

    // Task Distribution by Type
    tasksByType: getTaskDistribution(tasks),

    // Task Distribution by Priority
    tasksByPriority: getPriorityDistribution(tasks),

    // Team Performance
    teamPerformance: getTeamPerformance(tasks, project),

    // Aging WIP (tasks in progress for too long)
    agingWIP: getAgingWIP(tasks),

    // Completion Rate
    completionRate: tasks.length > 0
      ? Math.round((tasks.filter(t => t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('completed')).length / tasks.length) * 100)
      : 0
  }

  function calculateAverageCycleTime(tasks: any[]): number {
    const completedTasks = tasks.filter(t =>
      (t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('completed')) &&
      t.start_date && t.end_date
    )

    if (completedTasks.length === 0) return 0

    const totalDays = completedTasks.reduce((sum, task) => {
      const start = new Date(task.start_date)
      const end = new Date(task.end_date)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    return Math.round(totalDays / completedTasks.length)
  }

  function calculateAverageLeadTime(tasks: any[]): number {
    const completedTasks = tasks.filter(t =>
      (t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('completed')) &&
      t.created_at && t.end_date
    )

    if (completedTasks.length === 0) return 0

    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_at)
      const completed = new Date(task.end_date)
      const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    return Math.round(totalDays / completedTasks.length)
  }

  function calculateThroughput(tasks: any[]): number {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const completedLastWeek = tasks.filter(t => {
      if (!t.end_date) return false
      const completedDate = new Date(t.end_date)
      return (t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('completed')) &&
             completedDate >= lastWeek
    })

    return completedLastWeek.length
  }

  function calculateFlowEfficiency(tasks: any[]): number {
    // Simplified calculation: percentage of tasks completed vs total tasks
    if (tasks.length === 0) return 0
    const completed = tasks.filter(t => t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('completed')).length
    return Math.round((completed / tasks.length) * 100)
  }

  function getTaskDistribution(tasks: any[]) {
    const distribution: { [key: string]: number } = {}
    tasks.forEach(task => {
      const type = task.story_type || 'Other'
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  }

  function getPriorityDistribution(tasks: any[]) {
    const distribution: { [key: string]: number } = {}
    tasks.forEach(task => {
      const priority = task.priority || 'None'
      distribution[priority] = (distribution[priority] || 0) + 1
    })
    return distribution
  }

  function getTeamPerformance(tasks: any[], project: any) {
    const teamMembers = project?.team_members_detail || []
    return teamMembers.map((member: any) => {
      const memberTasks = tasks.filter(t => t.assignee_id === member.id)
      const completedTasks = memberTasks.filter(t => t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('completed'))

      return {
        name: member.name,
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        completionRate: memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0,
        role: member.role_name
      }
    })
  }

  function getAgingWIP(tasks: any[]) {
    const wipTasks = tasks.filter(t =>
      t.status?.toLowerCase().includes('progress') ||
      t.status?.toLowerCase().includes('review')
    )

    return wipTasks.map(task => {
      const startDate = new Date(task.start_date || task.created_at)
      const today = new Date()
      const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...task,
        daysInProgress,
        isAging: daysInProgress > 7 // Consider aging if > 7 days
      }
    }).sort((a, b) => b.daysInProgress - a.daysInProgress)
  }

  // Export report handler
  const handleExportReport = async () => {
    if (!project?.id) return

    try {
      const reportTypeMap: { [key: string]: 'overview' | 'flow' | 'cycle' | 'wip' | 'team' } = {
        overview: 'overview',
        flow: 'flow',
        cycle: 'cycle',
        wip: 'wip',
        team: 'team'
      }

      const currentReportType = reportTypeMap[selectedTab] || 'overview'

      const dateParams = {
        from_date: dateRange.from?.toISOString(),
        to_date: dateRange.to?.toISOString()
      }

      const blob = await kanbanReportsApiService.exportReport(
        project.id,
        currentReportType,
        'csv',
        dateParams
      )

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `kanban-${currentReportType}-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Failed to export report:', error)
      toast.error('Failed to export report')
    }
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
    icon: Icon,
    description
  }: {
    title: string
    value: number | string
    unit?: string
    trend?: string
    trendValue?: number
    icon: any
    description?: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-2xl font-semibold">
              {value}{unit}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && trendValue !== undefined && (
              <div className={`flex items-center space-x-1 text-sm mt-1 ${getTrendColor(trend)}`}>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading reports...</span>
      </div>
    )
  }

  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">Loading {selectedTab} data...</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Kanban Reports & Analytics</h2>
          <p className="text-muted-foreground">Flow metrics and team performance insights</p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="flow">Flow Metrics</SelectItem>
              <SelectItem value="cycle">Cycle Time</SelectItem>
              <SelectItem value="wip">WIP Analysis</SelectItem>
              <SelectItem value="team">Team Performance</SelectItem>
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
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button
            className="bg-[#28A745] hover:bg-[#218838]"
            onClick={handleExportReport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flow">Flow Metrics</TabsTrigger>
          <TabsTrigger value="cycle">Cycle/Lead Time</TabsTrigger>
          <TabsTrigger value="wip">WIP Analysis</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {apiLoading ? renderLoadingState() : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Tasks"
                  value={overviewData?.metrics.total_tasks ?? metrics.totalTasks}
                  icon={Layers}
                  description="All tasks in the board"
                />
                <MetricCard
                  title="Completion Rate"
                  value={overviewData?.metrics.completion_rate ?? metrics.completionRate}
                  unit="%"
                  icon={CheckCircle}
                  description={`${overviewData?.metrics.completed_tasks ?? metrics.completedTasks} of ${overviewData?.metrics.total_tasks ?? metrics.totalTasks} completed`}
                />
                <MetricCard
                  title="Throughput"
                  value={overviewData?.metrics.throughput ?? metrics.throughput}
                  unit=" tasks/week"
                  icon={Zap}
                  description="Tasks completed last week"
                />
                <MetricCard
                  title="WIP Count"
                  value={overviewData?.metrics.wip_count ?? metrics.wipCount}
                  icon={Activity}
                  description="Currently in progress"
                />
              </div>

              {/* Task Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Distribution by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-sm">To Do</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{overviewData?.task_distribution_by_status.todo ?? metrics.todoTasks}</span>
                          <Badge variant="outline" className="text-xs">
                            {(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? Math.round(((overviewData?.task_distribution_by_status.todo ?? metrics.todoTasks) / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100) : 0}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? ((overviewData?.task_distribution_by_status.todo ?? metrics.todoTasks) / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100 : 0} className="h-2" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">In Progress</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{overviewData?.task_distribution_by_status.in_progress ?? metrics.inProgressTasks}</span>
                          <Badge variant="outline" className="text-xs">
                            {(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? Math.round(((overviewData?.task_distribution_by_status.in_progress ?? metrics.inProgressTasks) / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100) : 0}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? ((overviewData?.task_distribution_by_status.in_progress ?? metrics.inProgressTasks) / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100 : 0} className="h-2" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Done</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{overviewData?.task_distribution_by_status.done ?? metrics.completedTasks}</span>
                          <Badge variant="outline" className="text-xs">
                            {overviewData?.metrics.completion_rate ?? metrics.completionRate}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={overviewData?.metrics.completion_rate ?? metrics.completionRate} className="h-2" />

                      {(overviewData?.task_distribution_by_status.blocked ?? metrics.blockedTasks) > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span className="text-sm">Blocked</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{overviewData?.task_distribution_by_status.blocked ?? metrics.blockedTasks}</span>
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                                {(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? Math.round(((overviewData?.task_distribution_by_status.blocked ?? metrics.blockedTasks) / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100) : 0}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? ((overviewData?.task_distribution_by_status.blocked ?? metrics.blockedTasks) / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100 : 0} className="h-2" />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Distribution by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(overviewData?.task_distribution_by_type ?? metrics.tasksByType).map(([type, count]) => (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm capitalize">{type}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{count}</span>
                              <Badge variant="outline" className="text-xs">
                                {(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? Math.round((count as number / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100) : 0}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={(overviewData?.metrics.total_tasks ?? metrics.totalTasks) > 0 ? (count as number / (overviewData?.metrics.total_tasks ?? metrics.totalTasks)) * 100 : 0} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(overviewData?.task_distribution_by_priority ?? metrics.tasksByPriority).map(([priority, count]) => (
                      <div key={priority} className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-semibold">{count as number}</div>
                        <div className="text-sm text-muted-foreground capitalize">{priority}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* FLOW METRICS TAB */}
        <TabsContent value="flow" className="space-y-6">
          {apiLoading ? renderLoadingState() : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Flow Efficiency"
                  value={flowData?.flow_efficiency ?? metrics.flowEfficiency}
                  unit="%"
                  icon={TrendingUp}
                  description="Completion rate across board"
                />
                <MetricCard
                  title="Throughput"
                  value={flowData?.throughput ?? metrics.throughput}
                  unit=" tasks/week"
                  icon={Zap}
                  description="Tasks completed per week"
                />
                <MetricCard
                  title="WIP Count"
                  value={flowData?.wip_count ?? metrics.wipCount}
                  icon={Activity}
                  description="Work in progress"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flow Efficiency Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 80 ? 'bg-green-50 dark:bg-green-950' :
                      (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 60 ? 'bg-yellow-50 dark:bg-yellow-950' :
                      'bg-red-50 dark:bg-red-950'
                    }`}>
                      <h4 className={`font-medium mb-2 ${
                        (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 80 ? 'text-green-800 dark:text-green-200' :
                        (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 60 ? 'text-yellow-800 dark:text-yellow-200' :
                        'text-red-800 dark:text-red-200'
                      }`}>
                        {flowData?.insights?.completion_status === 'excellent' ? 'Excellent Flow' :
                         flowData?.insights?.completion_status === 'good' ? 'Good Flow' :
                         flowData?.insights?.completion_status === 'needs_improvement' ? 'Flow Needs Improvement' :
                         (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 80 ? 'Excellent Flow' :
                         (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 60 ? 'Good Flow' :
                         'Flow Needs Improvement'}
                      </h4>
                      <p className={`text-sm ${
                        (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 80 ? 'text-green-700 dark:text-green-300' :
                        (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 60 ? 'text-yellow-700 dark:text-yellow-300' :
                        'text-red-700 dark:text-red-300'
                      }`}>
                        {flowData?.insights?.message ?? (
                          (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 80
                            ? 'Your team is maintaining excellent flow with high completion rates.'
                            : (flowData?.flow_efficiency ?? metrics.flowEfficiency) >= 60
                            ? 'Flow is good but there is room for improvement in completion rates.'
                            : 'Consider reviewing bottlenecks and reducing WIP to improve flow.'
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium mb-2">Key Insights</h5>
                        <ul className="space-y-1 text-muted-foreground">
                          {flowData?.insights?.key_points ? (
                            flowData.insights.key_points.map((point, idx) => (
                              <li key={idx}>• {point}</li>
                            ))
                          ) : (
                            <>
                              <li>• {flowData?.completed_tasks ?? metrics.completedTasks} tasks completed</li>
                              <li>• {flowData?.throughput ?? metrics.throughput} tasks finished last week</li>
                              <li>• {flowData?.wip_count ?? metrics.wipCount} tasks currently in progress</li>
                              <li>• {flowData?.flow_efficiency ?? metrics.flowEfficiency}% overall flow efficiency</li>
                            </>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Recommendations</h5>
                        <ul className="space-y-1 text-muted-foreground">
                          {flowData?.recommendations ? (
                            flowData.recommendations.map((rec, idx) => (
                              <li key={idx}>• {rec}</li>
                            ))
                          ) : (
                            <>
                              <li>• {(flowData?.wip_count ?? metrics.wipCount) > 10 ? 'Reduce WIP to improve flow' : 'WIP is at a healthy level'}</li>
                              <li>• {(flowData?.blocked_tasks ?? metrics.blockedTasks) > 0 ? `Address ${flowData?.blocked_tasks ?? metrics.blockedTasks} blocked tasks` : 'No blocked tasks'}</li>
                              <li>• Focus on completing in-progress tasks</li>
                              <li>• Monitor and optimize cycle times</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* CYCLE/LEAD TIME TAB */}
        <TabsContent value="cycle" className="space-y-6">
          {apiLoading ? renderLoadingState() : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Average Cycle Time"
                  value={cycleTimeData?.average_cycle_time ?? metrics.averageCycleTime}
                  unit=" days"
                  icon={Clock}
                  description="Start to completion"
                />
                <MetricCard
                  title="Average Lead Time"
                  value={cycleTimeData?.average_lead_time ?? metrics.averageLeadTime}
                  unit=" days"
                  icon={Target}
                  description="Creation to completion"
                />
                <MetricCard
                  title="Time Efficiency"
                  value={cycleTimeData?.time_efficiency ?? (
                    metrics.averageLeadTime > 0
                      ? Math.round((metrics.averageCycleTime / metrics.averageLeadTime) * 100)
                      : 0
                  )}
                  unit="%"
                  icon={TrendingUp}
                  description="Cycle vs Lead time"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cycle Time vs Lead Time Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Cycle Time</span>
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Time from when work starts until completion
                        </p>
                        <div className="text-3xl font-bold text-[#007BFF] mb-2">{cycleTimeData?.average_cycle_time ?? metrics.averageCycleTime} days</div>
                        <p className="text-xs text-muted-foreground">
                          {cycleTimeData?.cycle_time_status === 'excellent' ? 'Excellent' :
                           cycleTimeData?.cycle_time_status === 'good' ? 'Good' :
                           cycleTimeData?.cycle_time_status === 'needs_improvement' ? 'Needs improvement' :
                           (cycleTimeData?.average_cycle_time ?? metrics.averageCycleTime) <= 3 ? 'Excellent' :
                           (cycleTimeData?.average_cycle_time ?? metrics.averageCycleTime) <= 7 ? 'Good' :
                           'Needs improvement'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>Lead Time</span>
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Total time from task creation to completion
                        </p>
                        <div className="text-3xl font-bold text-[#28A745] mb-2">{cycleTimeData?.average_lead_time ?? metrics.averageLeadTime} days</div>
                        <p className="text-xs text-muted-foreground">
                          {cycleTimeData?.lead_time_status === 'excellent' ? 'Excellent' :
                           cycleTimeData?.lead_time_status === 'good' ? 'Good' :
                           cycleTimeData?.lead_time_status === 'needs_improvement' ? 'Needs improvement' :
                           (cycleTimeData?.average_lead_time ?? metrics.averageLeadTime) <= 5 ? 'Excellent' :
                           (cycleTimeData?.average_lead_time ?? metrics.averageLeadTime) <= 14 ? 'Good' :
                           'Needs improvement'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h5 className="font-medium mb-2">Understanding the Metrics</h5>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• <strong>Cycle Time:</strong> Measures active work time. Lower is better.</p>
                        <p>• <strong>Lead Time:</strong> Measures total time including wait time. Should be close to cycle time.</p>
                        <p>• <strong>Gap Analysis:</strong> Large gap indicates tasks waiting before work starts.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* WIP ANALYSIS TAB */}
        <TabsContent value="wip" className="space-y-6">
          {apiLoading ? renderLoadingState() : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Current WIP"
                  value={wipData?.current_wip ?? metrics.wipCount}
                  icon={Activity}
                  description="Tasks in progress"
                />
                <MetricCard
                  title="Aging WIP"
                  value={wipData?.aging_wip_count ?? metrics.agingWIP.filter(t => t.isAging).length}
                  icon={AlertCircle}
                  description="Tasks over 7 days"
                />
                <MetricCard
                  title="WIP Health"
                  value={wipData?.wip_health ?? (
                    metrics.wipCount === 0 ? 0 :
                    Math.round(((metrics.wipCount - metrics.agingWIP.filter(t => t.isAging).length) / metrics.wipCount) * 100)
                  )}
                  unit="%"
                  icon={CheckCircle}
                  description="Non-aging WIP"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Work in Progress Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {(wipData?.wip_tasks ?? metrics.agingWIP).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No work in progress</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(wipData?.wip_tasks ?? metrics.agingWIP).slice(0, 10).map((task: any) => (
                        <div
                          key={task.id}
                          className={`p-4 border rounded-lg ${task.is_aging || task.isAging ? 'border-red-300 bg-red-50 dark:bg-red-950' : 'border-gray-200'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-semibold text-blue-600">{task.task_id}</span>
                                {(task.is_aging || task.isAging) && (
                                  <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-300">
                                    Aging
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-sm">{task.title}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <span>Status: {task.status}</span>
                                {task.assignee && <span>Assigned to: {task.assignee.name}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${task.is_aging || task.isAging ? 'text-red-600' : 'text-gray-900'}`}>
                                {task.days_in_progress ?? task.daysInProgress}
                              </div>
                              <div className="text-xs text-muted-foreground">days</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">WIP Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {(wipData?.aging_wip_count ?? metrics.agingWIP.filter(t => t.isAging).length) > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          ⚠️ {wipData?.aging_wip_count ?? metrics.agingWIP.filter(t => t.isAging).length} tasks have been in progress for over 7 days
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                          Review these tasks for blockers or consider breaking them down into smaller items.
                        </p>
                      </div>
                    )}
                    <ul className="space-y-1 text-muted-foreground">
                      {wipData?.recommendations ? (
                        wipData.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))
                      ) : (
                        <>
                          <li>• {(wipData?.current_wip ?? metrics.wipCount) > 10 ? 'Consider limiting WIP to improve focus' : 'WIP is at a healthy level'}</li>
                          <li>• Focus on completing tasks before starting new ones</li>
                          <li>• Review aging tasks weekly to identify blockers</li>
                          <li>• Maintain a balanced distribution across team members</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TEAM PERFORMANCE TAB */}
        <TabsContent value="team" className="space-y-6">
          {apiLoading ? renderLoadingState() : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Team Members"
                  value={teamData?.team_size ?? metrics.teamPerformance.length}
                  icon={Users}
                />
                <MetricCard
                  title="Total Tasks"
                  value={teamData?.total_tasks ?? metrics.totalTasks}
                  icon={Layers}
                />
                <MetricCard
                  title="Completed"
                  value={teamData?.completed_tasks ?? metrics.completedTasks}
                  icon={CheckCircle}
                />
                <MetricCard
                  title="Avg Completion"
                  value={teamData?.average_completion_rate ?? (
                    metrics.teamPerformance.length > 0
                      ? Math.round(metrics.teamPerformance.reduce((sum, m) => sum + m.completionRate, 0) / metrics.teamPerformance.length)
                      : 0
                  )}
                  unit="%"
                  icon={TrendingUp}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Individual Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {(teamData?.team_members ?? metrics.teamPerformance).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No team members assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(teamData?.team_members ?? metrics.teamPerformance).map((member: any, index: number) => (
                        <div key={member.member_id || index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-[#28A745] text-white">
                                  {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{member.completion_rate ?? member.completionRate}%</div>
                              <div className="text-xs text-muted-foreground">Completion Rate</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Tasks</span>
                              <span className="font-medium">{member.total_tasks ?? member.totalTasks}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Completed</span>
                              <span className="font-medium text-green-600">{member.completed_tasks ?? member.completedTasks}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">In Progress</span>
                              <span className="font-medium text-blue-600">{(member.in_progress_tasks ?? ((member.total_tasks ?? member.totalTasks) - (member.completed_tasks ?? member.completedTasks)))}</span>
                            </div>
                            {member.average_cycle_time && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Avg Cycle Time</span>
                                <span className="font-medium">{member.average_cycle_time} days</span>
                              </div>
                            )}
                            <Progress value={member.completion_rate ?? member.completionRate} className="h-2 mt-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
