import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Progress } from '../../../../components/ui/progress'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Activity,
  Download,
  AlertTriangle,
  CheckCircle,
  Timer,
  Target,
  Zap,
  Award,
  FileText,
  Calendar,
  GitCommit,
  Filter,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { kanbanReportsApiService } from '../../../../services/kanbanReportsApi'
import type {
  OverviewResponse,
  FlowMetrics,
  CycleTimeMetrics,
  WIPAnalysis,
  TeamPerformanceMetrics
} from '../../../../services/kanbanReportsApi'

interface KanbanReportsViewProps {
  project: any
  user: any
}

export function KanbanReportsView({ project, user }: KanbanReportsViewProps) {
  const [loading, setLoading] = useState(true)
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null)
  const [flowMetrics, setFlowMetrics] = useState<FlowMetrics | null>(null)
  const [cycleTimeMetrics, setCycleTimeMetrics] = useState<CycleTimeMetrics | null>(null)
  const [wipAnalysis, setWipAnalysis] = useState<WIPAnalysis | null>(null)
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceMetrics | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({ from_date: '', to_date: '' })

  const COLORS = ['#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#17A2B8', '#FD7E14', '#20C997']

  useEffect(() => {
    loadReports()
  }, [project?.id])

  const loadReports = async () => {
    if (!project?.id) return

    try {
      setLoading(true)
      const [overview, flow, cycle, wip, team] = await Promise.all([
        kanbanReportsApiService.getOverviewMetrics(project.id, dateRange),
        kanbanReportsApiService.getFlowMetrics(project.id, dateRange),
        kanbanReportsApiService.getCycleTimeMetrics(project.id, dateRange),
        kanbanReportsApiService.getWIPAnalysis(project.id, dateRange),
        kanbanReportsApiService.getTeamPerformance(project.id, dateRange)
      ])

      setOverviewData(overview)
      setFlowMetrics(flow)
      setCycleTimeMetrics(cycle)
      setWipAnalysis(wip)
      setTeamPerformance(team)
      console.log('✅ [Kanban Reports] All reports loaded successfully')
      console.log('📊 [Overview]', overview)
      console.log('⚡ [Flow Metrics]', flow)
      console.log('⏱️ [Cycle Time]', cycle)
      console.log('🔄 [WIP Analysis]', wip)
      console.log('👥 [Team Performance]', team)
    } catch (error) {
      console.error('❌ [Kanban Reports] Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (reportType: 'overview' | 'flow' | 'cycle' | 'wip' | 'team', format: 'csv' | 'pdf' | 'excel') => {
    try {
      const blob = await kanbanReportsApiService.exportReport(project.id, reportType, format, dateRange)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kanban-${reportType}-report.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('❌ [Kanban Reports] Error exporting report:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'excellent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'good': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'needs_improvement': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[status as keyof typeof colors] || colors.good
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading reports...</span>
      </div>
    )
  }

  // Prepare chart data
  const statusDistributionData = overviewData?.task_distribution_by_status || []

  const priorityDistributionData = overviewData?.priority_distribution
    ? [
        { name: 'Low', value: overviewData.priority_distribution.low_count, percentage: overviewData.priority_distribution.low_percentage },
        { name: 'Medium', value: overviewData.priority_distribution.medium_count, percentage: overviewData.priority_distribution.medium_percentage },
        { name: 'High', value: overviewData.priority_distribution.high_count, percentage: overviewData.priority_distribution.high_percentage },
        { name: 'Critical', value: overviewData.priority_distribution.critical_count, percentage: overviewData.priority_distribution.critical_percentage }
      ]
    : []

  const typeDistributionData = overviewData?.task_distribution_by_type
    ? [
        { name: 'Story', value: overviewData.task_distribution_by_type.story_count, percentage: overviewData.task_distribution_by_type.story_percentage },
        { name: 'Bug', value: overviewData.task_distribution_by_type.bug_count, percentage: overviewData.task_distribution_by_type.bug_percentage },
        { name: 'Task', value: overviewData.task_distribution_by_type.task_count, percentage: overviewData.task_distribution_by_type.task_percentage }
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <span>Kanban Reports & Analytics</span>
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive project insights and metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadReports}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs for Different Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flow">Flow Metrics</TabsTrigger>
          <TabsTrigger value="cycle">Cycle Time</TabsTrigger>
          <TabsTrigger value="wip">WIP Analysis</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        {/* Overview Report */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Total Tasks</span>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold">{overviewData?.metrics.total_tasks || 0}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  All tasks in the system
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold">{overviewData?.metrics.completion_rate?.toFixed(1) || 0}%</div>
                <div className="mt-2">
                  <Progress value={overviewData?.metrics.completion_rate || 0} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    Overall completion
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Work in Progress</span>
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold">{overviewData?.metrics.wip_count || 0}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Current WIP count
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Throughput</span>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold">{overviewData?.metrics.throughput || 0}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Tasks per period
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Task Distribution by Status</span>
                </CardTitle>
                <CardDescription>Visual breakdown of tasks across all statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage?.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span>Task Distribution by Priority</span>
                </CardTitle>
                <CardDescription>Priority levels across all tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#FD7E14" name="Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitCommit className="w-5 h-5 text-purple-600" />
                <span>Task Distribution by Type</span>
              </CardTitle>
              <CardDescription>Breakdown of different task types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeDistributionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#6F42C1" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-green-600" />
                <span>Export Overview Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleExport('overview', 'csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('overview', 'excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('overview', 'pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flow Metrics Report */}
        <TabsContent value="flow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-t-4 border-t-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Flow Efficiency</span>
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {flowMetrics?.metrics.flow_efficiency?.toFixed(1) || 0}%
                </div>
                <Progress value={flowMetrics?.metrics.flow_efficiency || 0} className="h-3 mb-2" />
                <Badge className={getStatusColor(flowMetrics?.efficiency_analysis.status || 'good')}>
                  {flowMetrics?.efficiency_analysis.status || 'N/A'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Throughput</span>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {flowMetrics?.metrics.throughput || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tasks completed
                </div>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {flowMetrics?.key_insights.tasks_completed || 0} done
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Current WIP</span>
                  <Activity className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {flowMetrics?.metrics.wip_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Work in Progress
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {flowMetrics?.key_insights.tasks_currently_in_progress || 0} in progress
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flow Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span>Flow Insights & Analysis</span>
              </CardTitle>
              <CardDescription>{flowMetrics?.efficiency_analysis.message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Efficiency Analysis */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Efficiency Status</span>
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {flowMetrics?.efficiency_analysis.recommendation}
                </p>
                <Badge className={getStatusColor(flowMetrics?.efficiency_analysis.status || 'good')}>
                  {flowMetrics?.efficiency_analysis.status?.toUpperCase() || 'N/A'}
                </Badge>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>Key Insights</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs text-muted-foreground">Tasks Completed</div>
                    <div className="text-2xl font-bold text-green-600">{flowMetrics?.key_insights.tasks_completed || 0}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs text-muted-foreground">Finished Last Week</div>
                    <div className="text-2xl font-bold text-blue-600">{flowMetrics?.key_insights.tasks_finished_last_week || 0}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs text-muted-foreground">Currently In Progress</div>
                    <div className="text-2xl font-bold text-yellow-600">{flowMetrics?.key_insights.tasks_currently_in_progress || 0}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs text-muted-foreground">Overall Flow Efficiency</div>
                    <div className="text-2xl font-bold text-purple-600">{flowMetrics?.key_insights.overall_flow_efficiency?.toFixed(1) || 0}%</div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {flowMetrics?.recommendations && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span>Recommendations</span>
                  </h4>
                  {typeof flowMetrics.recommendations === 'object' && !Array.isArray(flowMetrics.recommendations) && (
                    <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      {flowMetrics.recommendations.wip_status && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-semibold">WIP Status:</span>
                          <Badge variant="outline">{flowMetrics.recommendations.wip_status}</Badge>
                        </div>
                      )}
                      {flowMetrics.recommendations.blocked_tasks_status && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">Blocked Tasks:</span>
                          <Badge variant="outline">{flowMetrics.recommendations.blocked_tasks_status}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  {(() => {
                    // Handle both array and object formats
                    const suggestions = Array.isArray(flowMetrics.recommendations)
                      ? flowMetrics.recommendations
                      : flowMetrics.recommendations?.suggestions || []

                    return suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {suggestions.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-green-600" />
                <span>Export Flow Metrics Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleExport('flow', 'csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('flow', 'excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('flow', 'pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cycle Time Report */}
        <TabsContent value="cycle" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-t-4 border-t-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Avg Cycle Time</span>
                  <Timer className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {cycleTimeMetrics?.metrics.average_cycle_time?.toFixed(1) || 0}
                </div>
                <div className="text-sm text-muted-foreground">days</div>
                <Badge className={`mt-2 ${getStatusColor(cycleTimeMetrics?.time_analysis.cycle_time_status || 'good')}`}>
                  {cycleTimeMetrics?.time_analysis.cycle_time_status || 'N/A'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-indigo-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Avg Lead Time</span>
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {cycleTimeMetrics?.metrics.average_lead_time?.toFixed(1) || 0}
                </div>
                <div className="text-sm text-muted-foreground">days</div>
                <Badge className={`mt-2 ${getStatusColor(cycleTimeMetrics?.time_analysis.lead_time_status || 'good')}`}>
                  {cycleTimeMetrics?.time_analysis.lead_time_status || 'N/A'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-cyan-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Time Efficiency</span>
                  <Zap className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {cycleTimeMetrics?.metrics.time_efficiency?.toFixed(1) || 0}%
                </div>
                <Progress value={cycleTimeMetrics?.metrics.time_efficiency || 0} className="h-3 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Cycle Time Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-purple-600" />
                <span>Cycle Time Analysis</span>
              </CardTitle>
              <CardDescription>Understanding time metrics in your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Timer className="w-4 h-4" />
                    <span>Cycle Time Analysis</span>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {cycleTimeMetrics?.time_analysis.cycle_time_description}
                  </p>
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {cycleTimeMetrics?.time_analysis.cycle_time_days?.toFixed(1) || 0} days
                    </div>
                    <div className="text-xs text-muted-foreground">Average Cycle Time</div>
                  </div>
                  <Badge className={`mt-2 ${getStatusColor(cycleTimeMetrics?.time_analysis.cycle_time_status || 'good')}`}>
                    {cycleTimeMetrics?.time_analysis.cycle_time_status?.toUpperCase() || 'N/A'}
                  </Badge>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Lead Time Analysis</span>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {cycleTimeMetrics?.time_analysis.lead_time_description}
                  </p>
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-indigo-600">
                      {cycleTimeMetrics?.time_analysis.lead_time_days?.toFixed(1) || 0} days
                    </div>
                    <div className="text-xs text-muted-foreground">Average Lead Time</div>
                  </div>
                  <Badge className={`mt-2 ${getStatusColor(cycleTimeMetrics?.time_analysis.lead_time_status || 'good')}`}>
                    {cycleTimeMetrics?.time_analysis.lead_time_status?.toUpperCase() || 'N/A'}
                  </Badge>
                </div>
              </div>

              {/* Insights */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Time Insights</span>
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded">
                    <div className="font-medium text-sm mb-1">Cycle Time Explanation</div>
                    <p className="text-sm text-muted-foreground">{cycleTimeMetrics?.insights.cycle_time_explanation}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded">
                    <div className="font-medium text-sm mb-1">Lead Time Explanation</div>
                    <p className="text-sm text-muted-foreground">{cycleTimeMetrics?.insights.lead_time_explanation}</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <div className="font-medium text-sm mb-1">Gap Analysis</div>
                    <p className="text-sm text-muted-foreground">{cycleTimeMetrics?.insights.gap_analysis}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-green-600" />
                <span>Export Cycle Time Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleExport('cycle', 'csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('cycle', 'excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('cycle', 'pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WIP Analysis Report */}
        <TabsContent value="wip" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-t-4 border-t-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Current WIP</span>
                  <Activity className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {wipAnalysis?.metrics.current_wip || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tasks in progress
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Aging WIP</span>
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {wipAnalysis?.metrics.aging_wip || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tasks need attention
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">WIP Health</span>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {wipAnalysis?.metrics.wip_health?.toFixed(0) || 0}%
                </div>
                <Progress value={wipAnalysis?.metrics.wip_health || 0} className="h-3 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* WIP Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Work in Progress Tasks</span>
              </CardTitle>
              <CardDescription>
                Tasks currently being worked on ({wipAnalysis?.work_in_progress_details?.length || 0} tasks)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wipAnalysis?.work_in_progress_details && wipAnalysis.work_in_progress_details.length > 0 ? (
                <div className="space-y-3">
                  {wipAnalysis.work_in_progress_details.map((task, index) => (
                    <div
                      key={task.task_id || index}
                      className={`p-4 rounded-lg border-2 ${
                        task.days_in_progress > 7
                          ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{task.task_title}</h4>
                            {task.days_in_progress > 7 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Aging
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <GitCommit className="w-3 h-3" />
                              <span>{task.task_id}</span>
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {task.status}
                            </Badge>
                            {task.assignee_name && (
                              <span className="flex items-center space-x-1">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs">
                                    {task.assignee_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{task.assignee_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {task.days_in_progress}
                          </div>
                          <div className="text-xs text-muted-foreground">days in progress</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No work in progress</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {wipAnalysis?.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span>WIP Management Recommendations</span>
                </CardTitle>
                <CardDescription>
                  {typeof wipAnalysis.recommendations === 'object' && !Array.isArray(wipAnalysis.recommendations)
                    ? wipAnalysis.recommendations.wip_status_message
                    : 'Recommendations for managing work in progress'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Handle both array and object formats
                  const suggestions = Array.isArray(wipAnalysis.recommendations)
                    ? wipAnalysis.recommendations
                    : wipAnalysis.recommendations?.suggestions || []

                  return suggestions.length > 0 ? (
                    <div className="space-y-2">
                      {suggestions.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-green-600" />
                <span>Export WIP Analysis Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleExport('wip', 'csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('wip', 'excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('wip', 'pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance Report */}
        <TabsContent value="team" className="space-y-6">
          {/* Team Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-t-4 border-t-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Team Size</span>
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold">
                  {teamPerformance?.team_metrics.team_members_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active members</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Tasks</span>
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold">
                  {teamPerformance?.team_metrics.total_tasks || 0}
                </div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Completed</span>
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-4xl font-bold">
                  {teamPerformance?.team_metrics.completed_tasks || 0}
                </div>
                <div className="text-sm text-muted-foreground">Tasks done</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Avg Completion</span>
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-4xl font-bold">
                  {teamPerformance?.team_metrics.average_completion_rate?.toFixed(1) || 0}%
                </div>
                <Progress value={teamPerformance?.team_metrics.average_completion_rate || 0} className="h-3 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Top Performer */}
          {teamPerformance?.top_performer && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-2 border-yellow-400">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-6 h-6 text-yellow-600" />
                  <span>Top Performer</span>
                </CardTitle>
                <CardDescription>Highest completion rate in the team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    {teamPerformance.top_performer.avatar ? (
                      <img src={teamPerformance.top_performer.avatar} alt={teamPerformance.top_performer.member_name} />
                    ) : (
                      <AvatarFallback className="bg-yellow-600 text-white text-xl">
                        {teamPerformance.top_performer.member_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'TP'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{teamPerformance.top_performer.member_name}</h3>
                    <Badge variant="outline" className="mb-2">{teamPerformance.top_performer.role}</Badge>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{teamPerformance.top_performer.total_tasks}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{teamPerformance.top_performer.completed_tasks}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-yellow-600">{teamPerformance.top_performer.in_progress_tasks}</div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">{teamPerformance.top_performer.completion_rate?.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Completion</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Team Member Performance Comparison</span>
              </CardTitle>
              <CardDescription>Visual breakdown of individual performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamPerformance?.individual_performance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="member_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed_tasks" fill="#28A745" name="Completed" />
                  <Bar dataKey="in_progress_tasks" fill="#FFC107" name="In Progress" />
                  <Bar dataKey="total_tasks" fill="#007BFF" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Members Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Individual Team Member Details</span>
              </CardTitle>
              <CardDescription>Detailed performance metrics for each team member</CardDescription>
            </CardHeader>
            <CardContent>
              {teamPerformance?.individual_performance && teamPerformance.individual_performance.length > 0 ? (
                <div className="space-y-4">
                  {teamPerformance.individual_performance.map((member) => (
                    <div key={member.member_id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.member_name} />
                            ) : (
                              <AvatarFallback className="bg-purple-600 text-white">
                                {member.member_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-lg">{member.member_name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{member.role}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded text-center">
                          <div className="text-2xl font-bold text-blue-600">{member.total_tasks}</div>
                          <div className="text-xs text-muted-foreground">Total Tasks</div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded text-center">
                          <div className="text-2xl font-bold text-green-600">{member.completed_tasks}</div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded text-center">
                          <div className="text-2xl font-bold text-yellow-600">{member.in_progress_tasks}</div>
                          <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded text-center">
                          <div className="text-2xl font-bold text-purple-600">{member.completion_rate?.toFixed(1) || 0}%</div>
                          <div className="text-xs text-muted-foreground">Completion Rate</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Progress value={member.completion_rate || 0} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No team members data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-green-600" />
                <span>Export Team Performance Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleExport('team', 'csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('team', 'excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('team', 'pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
