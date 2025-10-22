import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import {
  Kanban,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Activity,
  Target,
  AlertTriangle,
  Bug,
  Zap,
  Timer,
  TrendingDown,
  Award,
  GitCommit
} from 'lucide-react'
import { projectApiService } from '../../../services/projectApi'
import { storiesApiService } from '../../../services/storiesApi'
import { kanbanReportsApiService } from '../../../services/kanbanReportsApi'
import { customerApiService, KanbanDashboardResponse, KanbanTaskDashboard, KanbanBugDashboard, KanbanTeamPerformance } from '../../../services/customerApi'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'

interface KanbanProjectDashboardProps {
  project: any
  user: any
  masterData?: any
  masterLoading?: boolean
}

export function KanbanProjectDashboard({ project, user, masterData: propMasterData, masterLoading: propMasterLoading }: KanbanProjectDashboardProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<any[]>([])
  const [kanbanMetrics, setKanbanMetrics] = useState<any>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)

  // New API-based state
  const [dashboardData, setDashboardData] = useState<KanbanDashboardResponse | null>(null)
  const [taskDashboard, setTaskDashboard] = useState<KanbanTaskDashboard | null>(null)
  const [bugDashboard, setBugDashboard] = useState<KanbanBugDashboard | null>(null)
  const [teamPerformance, setTeamPerformance] = useState<KanbanTeamPerformance | null>(null)

  // Use master data from props or local state (for backwards compatibility)
  const masterData = propMasterData
  const masterLoading = propMasterLoading || false

  // Load tasks and Kanban metrics
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Load tasks if project ID is available
        if (project?.id) {
          // Load comprehensive dashboard data from new API
          try {
            setMetricsLoading(true)
            const dashboard = await customerApiService.getKanbanDashboard(project.id)
            setDashboardData(dashboard)
            setTaskDashboard(dashboard.task_dashboard)
            setBugDashboard(dashboard.bug_dashboard)
            setTeamPerformance(dashboard.team_performance)

            // Set columns from API data
            if (dashboard.task_dashboard.board_overview.columns) {
              setColumns(dashboard.task_dashboard.board_overview.columns.map(col => ({
                name: col.label,
                count: col.count,
                limit: col.limit > 0 ? col.limit : null,
                status: col.status,
                status_indicator: col.status_indicator
              })))
            }

          } catch (apiError) {
            // Fallback to old logic if new API fails
            const tasksResponse = await storiesApiService.getStories(project.id, 1, 100)
            setTasks(tasksResponse.items || [])

            // Create columns from master task_status with task counts
            if (masterData?.task_status) {
              const columnsData = masterData.task_status
                .filter((status: any) => status.is_active)
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((status: any) => {
                  const statusId = status.name.toLowerCase().replace(/\s+/g, '-')
                  const count = tasksResponse.items.filter((task: any) =>
                    task.status?.toLowerCase().replace(/\s+/g, '-') === statusId
                  ).length

                  return {
                    name: status.name,
                    count: count,
                    limit: status.name.toLowerCase().includes('done') ? null : 10
                  }
                })
              setColumns(columnsData)
            }

            // Load Kanban metrics (old API)
            try {
              const metrics = await kanbanReportsApiService.getComprehensiveReport(project.id)
              setKanbanMetrics(metrics)
            } catch (metricsError) {
              console.warn('⚠️ [Kanban Dashboard] Could not load metrics:', metricsError)
            }
          } finally {
            setMetricsLoading(false)
          }
        }
      } catch (error) {
        console.error('❌ [Kanban Dashboard] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only load data when masterData is available (for fallback mode)
    if (project?.id) {
      loadData()
    }
  }, [project?.id, masterData])

  // Use API data if available, otherwise calculate from columns/tasks
  const totalTasks = taskDashboard?.metrics.total_tasks ?? columns.reduce((sum, col) => sum + col.count, 0)
  const completedTasks = taskDashboard?.metrics.completed_tasks ?? (columns.find(col => col.name.toLowerCase().includes('done'))?.count || 0)
  const completionRate = taskDashboard?.metrics.completion_rate ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)

  // Use bug dashboard data if available
  const bugMetrics = bugDashboard ? {
    total: bugDashboard.metrics.total_bugs,
    open: bugDashboard.metrics.open_bugs,
    resolved: bugDashboard.metrics.resolved_bugs,
    critical: bugDashboard.metrics.critical_bugs
  } : {
    // Fallback: Calculate bug metrics from tasks
    total: tasks.filter((task: any) =>
      task.task_type?.toLowerCase().includes('bug') || task.title?.toLowerCase().includes('bug')
    ).length,
    open: tasks.filter((task: any) =>
      (task.task_type?.toLowerCase().includes('bug') || task.title?.toLowerCase().includes('bug')) &&
      !task.status?.toLowerCase().includes('done')
    ).length,
    resolved: tasks.filter((task: any) =>
      (task.task_type?.toLowerCase().includes('bug') || task.title?.toLowerCase().includes('bug')) &&
      task.status?.toLowerCase().includes('done')
    ).length,
    critical: tasks.filter((task: any) =>
      (task.task_type?.toLowerCase().includes('bug') || task.title?.toLowerCase().includes('bug')) &&
      (task.priority?.toLowerCase().includes('high') || task.priority?.toLowerCase().includes('critical'))
    ).length
  }

  // Chart colors
  const COLORS = ['#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#17A2B8']

  if (loading || masterLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  // Prepare chart data - use API status distribution if available
  const statusChartData = taskDashboard?.status_distribution ? [
    { name: 'To Do', value: taskDashboard.status_distribution.todo_count },
    { name: 'In Progress', value: taskDashboard.status_distribution.in_progress_count },
    { name: 'Review', value: taskDashboard.status_distribution.review_count },
    { name: 'Done', value: taskDashboard.status_distribution.done_count },
    { name: 'On Hold', value: taskDashboard.status_distribution.on_hold_count }
  ].filter(item => item.value > 0) : columns.map(col => ({
    name: col.name,
    value: col.count
  }))

  const priorityData = kanbanMetrics?.overview?.task_distribution_by_priority
    ? Object.entries(kanbanMetrics.overview.task_distribution_by_priority).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number
      }))
    : []

  const typeData = kanbanMetrics?.overview?.task_distribution_by_type
    ? Object.entries(kanbanMetrics.overview.task_distribution_by_type).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number
      }))
    : []

  return (
    <div className="space-y-6">
      {/* Header Section with Key Metrics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center space-x-2">
              <Kanban className="w-7 h-7" />
              <span>Kanban Analytics Dashboard</span>
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Real-time metrics and performance insights</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <Target className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{completionRate}%</div>
            <Progress value={completionRate} className="h-2 mt-2" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Tasks</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">{completedTasks} completed</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Flow Efficiency</span>
              <Zap className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
              {taskDashboard?.metrics.flow_efficiency?.toFixed(1) ?? (kanbanMetrics?.flow?.flow_efficiency?.toFixed(1) || 'N/A')}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Throughput: {taskDashboard?.metrics.throughput ?? (kanbanMetrics?.flow?.throughput || 0)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Cycle Time</span>
              <Timer className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {taskDashboard?.metrics.cycle_time?.toFixed(1) ?? (kanbanMetrics?.cycle_time?.average_cycle_time?.toFixed(1) || 'N/A')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">days average</div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kanban Board Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Kanban className="w-5 h-5 text-[#007BFF]" />
              <span>Kanban Board Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${columns.length <= 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
              {columns.map((column) => (
                <div key={column.name} className="text-center">
                  <div className="mb-2">
                    <h4 className="text-sm font-medium">{column.name}</h4>
                    {column.limit && (
                      <div className="text-xs text-muted-foreground">
                        Limit: {column.limit}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold">{column.count}</span>
                    </div>

                    {column.limit && column.count >= column.limit && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">!</span>
                      </div>
                    )}
                  </div>

                  {column.limit && (
                    <div className="mt-2">
                      <Progress
                        value={(column.count / column.limit) * 100}
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Under Limit</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>At Limit</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Over Limit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Distribution by Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#6F42C1]" />
              <span>Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bug Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Bugs</div>
                <div className="text-2xl font-bold">{bugMetrics.total}</div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-950 rounded-lg">
                <Bug className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Open Bugs</div>
                <div className="text-2xl font-bold">{bugMetrics.open}</div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Resolved</div>
                <div className="text-2xl font-bold">{bugMetrics.resolved}</div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Critical</div>
                <div className="text-2xl font-bold">{bugMetrics.critical}</div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution Chart */}
        {priorityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#FFC107]" />
                <span>Task Priority Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#FFC107" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Task Type Distribution Chart */}
        {typeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitCommit className="w-5 h-5 text-[#17A2B8]" />
                <span>Task Type Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#17A2B8" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* WIP Limits Status & Flow Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#DC3545]" />
              <span>WIP Limits Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {taskDashboard?.wip_limits.under_limit ?? columns.filter(col => col.limit && col.count < col.limit).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Columns Under Limit</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {taskDashboard?.wip_limits.at_limit ?? columns.filter(col => col.limit && col.count === col.limit).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Columns At Limit</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {taskDashboard?.wip_limits.over_limit ?? columns.filter(col => col.limit && col.count > col.limit).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Columns Over Limit</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#28A745]" />
              <span>Flow Metrics Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskDashboard?.metrics ? (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Flow Efficiency</span>
                    <Badge variant="outline" className={`${
                      (taskDashboard.metrics.flow_efficiency ?? 0) >= 75 ? 'bg-green-100 text-green-800' :
                      (taskDashboard.metrics.flow_efficiency ?? 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {taskDashboard.flow_insights?.data?.completion_status ||
                       (taskDashboard.metrics.flow_efficiency ?? 0) >= 75 ? 'Excellent' :
                       (taskDashboard.metrics.flow_efficiency ?? 0) >= 50 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{taskDashboard.metrics.flow_efficiency?.toFixed(1) ?? '0'}%</div>
                  <Progress value={taskDashboard.metrics.flow_efficiency ?? 0} className="h-2 mt-2" />
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm font-medium mb-2">Throughput</div>
                  <div className="text-2xl font-bold">{taskDashboard.metrics.throughput ?? 0}</div>
                  <div className="text-xs text-muted-foreground">tasks completed</div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-sm font-medium mb-2">Cycle Time</div>
                  <div className="text-2xl font-bold">{taskDashboard.metrics.cycle_time?.toFixed(1) ?? '0'}</div>
                  <div className="text-xs text-muted-foreground">days average</div>
                </div>

                {taskDashboard.flow_insights?.data && Object.keys(taskDashboard.flow_insights.data).length > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-sm font-medium mb-2 flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Flow Insights</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {Object.entries(taskDashboard.flow_insights.data).map(([key, value], index) => (
                        <div key={index} className="flex items-start justify-between">
                          <span className="text-muted-foreground">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {taskDashboard.flow_insights?.message && taskDashboard.flow_insights.message !== "Flow metrics not available" && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                    <div className="text-sm font-medium mb-2 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Insight</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{taskDashboard.flow_insights.message}</p>
                  </div>
                )}
              </>
            ) : kanbanMetrics?.flow ? (
              <>
                {/* Fallback: Old API data */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Flow Efficiency</span>
                    <Badge variant="outline" className={`${
                      kanbanMetrics.flow.flow_efficiency >= 75 ? 'bg-green-100 text-green-800' :
                      kanbanMetrics.flow.flow_efficiency >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {kanbanMetrics.flow.insights.completion_status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{kanbanMetrics.flow.flow_efficiency.toFixed(1)}%</div>
                  <Progress value={kanbanMetrics.flow.flow_efficiency} className="h-2 mt-2" />
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm font-medium mb-2">Throughput</div>
                  <div className="text-2xl font-bold">{kanbanMetrics.flow.throughput}</div>
                  <div className="text-xs text-muted-foreground">tasks completed</div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-sm font-medium mb-2">Current WIP</div>
                  <div className="text-2xl font-bold">{kanbanMetrics.flow.wip_count}</div>
                  <div className="text-xs text-muted-foreground">tasks in progress</div>
                </div>

                {kanbanMetrics.flow.recommendations && kanbanMetrics.flow.recommendations.length > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-sm font-medium mb-2 flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Recommendations</span>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {kanbanMetrics.flow.recommendations.slice(0, 3).map((rec: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-purple-600">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{taskDashboard?.flow_insights?.message || "Flow metrics not available"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#6F42C1]" />
            <span>Team Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformance?.team_members && teamPerformance.team_members.length > 0 ? (
              <>
                {/* Team Performance Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Team Size</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{teamPerformance.total_team_size}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Average Completion Rate</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">{teamPerformance.average_completion_rate.toFixed(0)}%</div>
                  </div>
                </div>

                {/* Top Performer Highlight */}
                {teamPerformance.top_performer && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg p-4 border-2 border-yellow-300 dark:border-yellow-700 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Award className="w-8 h-8 text-yellow-600" />
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Top Performer</div>
                          <div className="font-bold text-lg">{teamPerformance.top_performer.member_name}</div>
                          <div className="text-xs text-muted-foreground">{teamPerformance.top_performer.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-600">{teamPerformance.top_performer.completion_rate.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">{teamPerformance.top_performer.done_tasks} / {teamPerformance.top_performer.total_tasks} tasks</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Performance Chart */}
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={teamPerformance.team_members.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="member_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="done_tasks" fill="#28A745" name="Completed" />
                    <Bar dataKey="total_tasks" fill="#FFC107" name="Total" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Team Members List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {teamPerformance.team_members.slice(0, 6).map((member: any) => (
                    <div key={member.member_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#6F42C1] text-white text-sm">
                            {member.member_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.member_name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-600">{member.total_tasks}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">{member.done_tasks}</div>
                          <div className="text-xs text-muted-foreground">Done</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-600">{member.completion_rate?.toFixed(0) || 0}%</div>
                          <div className="text-xs text-muted-foreground">Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : kanbanMetrics?.team?.team_members && kanbanMetrics.team.team_members.length > 0 ? (
              <>
                {/* Fallback: Old API data */}
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={kanbanMetrics.team.team_members.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed_tasks" fill="#28A745" name="Completed" />
                    <Bar dataKey="in_progress_tasks" fill="#FFC107" name="In Progress" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {kanbanMetrics.team.team_members.slice(0, 6).map((member: any) => (
                    <div key={member.member_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#6F42C1] text-white text-sm">
                            {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-600">{member.total_tasks}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">{member.completed_tasks}</div>
                          <div className="text-xs text-muted-foreground">Done</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-600">{member.completion_rate?.toFixed(0) || 0}%</div>
                          <div className="text-xs text-muted-foreground">Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : project?.team_members_detail && project.team_members_detail.length > 0 ? (
              <div className="space-y-4">
                {project.team_members_detail.slice(0, 6).map((member: any) => {
                  const memberTasks = tasks.filter((task: any) => task.assignee_id === member.id)
                  const memberCompleted = memberTasks.filter((t: any) => t.status?.toLowerCase().includes('done')).length
                  const memberRate = memberTasks.length > 0 ? ((memberCompleted / memberTasks.length) * 100).toFixed(0) : 0

                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#6F42C1] text-white text-sm">
                            {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role_name}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-600">{memberTasks.length}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">{memberCompleted}</div>
                          <div className="text-xs text-muted-foreground">Done</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-600">{memberRate}%</div>
                          <div className="text-xs text-muted-foreground">Rate</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No team members assigned</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}