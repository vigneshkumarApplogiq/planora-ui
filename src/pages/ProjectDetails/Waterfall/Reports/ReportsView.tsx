import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Calendar } from '../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { Progress } from '../../../../components/ui/progress'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Activity,
  Clock,
  Target,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Layers,
  Flag,
  Package,
  CheckSquare,
  XCircle,
  Circle
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

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

// TODO: All report data should be fetched from API - no mock data needed
// Waterfall-specific mock report data (empty for API integration)
const mockWaterfallData = {
  projectHealth: {
    overallProgress: 68,
    phasesCompleted: 3,
    totalPhases: 5,
    milestonesAchieved: 8,
    totalMilestones: 12,
    deliverablesCompleted: 15,
    totalDeliverables: 22,
    tasksCompleted: 145,
    totalTasks: 198,
    onSchedule: true,
    budgetStatus: 'on-track' // 'on-track', 'over-budget', 'under-budget'
  },
  phases: [
    {
      id: '1',
      name: 'Requirements Analysis',
      status: 'completed',
      progress: 100,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      plannedEndDate: '2024-01-31',
      tasksCompleted: 28,
      totalTasks: 28,
      milestonesAchieved: 2,
      totalMilestones: 2,
      budget: 50000,
      spent: 48000
    },
    {
      id: '2',
      name: 'System Design',
      status: 'completed',
      progress: 100,
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      plannedEndDate: '2024-02-28',
      tasksCompleted: 35,
      totalTasks: 35,
      milestonesAchieved: 3,
      totalMilestones: 3,
      budget: 75000,
      spent: 73500
    },
    {
      id: '3',
      name: 'Implementation',
      status: 'in-progress',
      progress: 72,
      startDate: '2024-03-01',
      endDate: null,
      plannedEndDate: '2024-05-31',
      tasksCompleted: 58,
      totalTasks: 85,
      milestonesAchieved: 2,
      totalMilestones: 4,
      budget: 150000,
      spent: 98000
    },
    {
      id: '4',
      name: 'Testing',
      status: 'not-started',
      progress: 0,
      startDate: null,
      endDate: null,
      plannedEndDate: '2024-06-30',
      tasksCompleted: 0,
      totalTasks: 32,
      milestonesAchieved: 0,
      totalMilestones: 2,
      budget: 60000,
      spent: 0
    },
    {
      id: '5',
      name: 'Deployment',
      status: 'not-started',
      progress: 0,
      startDate: null,
      endDate: null,
      plannedEndDate: '2024-07-15',
      tasksCompleted: 0,
      totalTasks: 18,
      milestonesAchieved: 0,
      totalMilestones: 1,
      budget: 40000,
      spent: 0
    }
  ],
  milestones: [
    {
      id: '1',
      name: 'Requirements Document Approved',
      phase: 'Requirements Analysis',
      status: 'completed',
      dueDate: '2024-01-15',
      completedDate: '2024-01-14',
      deliverables: 3,
      deliverablesCompleted: 3
    },
    {
      id: '2',
      name: 'Stakeholder Sign-off',
      phase: 'Requirements Analysis',
      status: 'completed',
      dueDate: '2024-01-30',
      completedDate: '2024-01-29',
      deliverables: 2,
      deliverablesCompleted: 2
    },
    {
      id: '3',
      name: 'Architecture Design Complete',
      phase: 'System Design',
      status: 'completed',
      dueDate: '2024-02-10',
      completedDate: '2024-02-12',
      deliverables: 4,
      deliverablesCompleted: 4
    },
    {
      id: '4',
      name: 'Database Schema Finalized',
      phase: 'System Design',
      status: 'completed',
      dueDate: '2024-02-20',
      completedDate: '2024-02-19',
      deliverables: 2,
      deliverablesCompleted: 2
    },
    {
      id: '5',
      name: 'UI/UX Design Approved',
      phase: 'System Design',
      status: 'completed',
      dueDate: '2024-02-28',
      completedDate: '2024-02-27',
      deliverables: 3,
      deliverablesCompleted: 3
    },
    {
      id: '6',
      name: 'Core Features Implemented',
      phase: 'Implementation',
      status: 'completed',
      dueDate: '2024-03-31',
      completedDate: '2024-03-30',
      deliverables: 5,
      deliverablesCompleted: 5
    },
    {
      id: '7',
      name: 'API Integration Complete',
      phase: 'Implementation',
      status: 'completed',
      dueDate: '2024-04-15',
      completedDate: '2024-04-16',
      deliverables: 3,
      deliverablesCompleted: 3
    },
    {
      id: '8',
      name: 'Frontend Development 80%',
      phase: 'Implementation',
      status: 'at-risk',
      dueDate: '2024-05-01',
      completedDate: null,
      deliverables: 4,
      deliverablesCompleted: 2
    },
    {
      id: '9',
      name: 'Backend Development Complete',
      phase: 'Implementation',
      status: 'in-progress',
      dueDate: '2024-05-20',
      completedDate: null,
      deliverables: 3,
      deliverablesCompleted: 1
    },
    {
      id: '10',
      name: 'Unit Testing Complete',
      phase: 'Testing',
      status: 'not-started',
      dueDate: '2024-06-10',
      completedDate: null,
      deliverables: 2,
      deliverablesCompleted: 0
    },
    {
      id: '11',
      name: 'Integration Testing Done',
      phase: 'Testing',
      status: 'not-started',
      dueDate: '2024-06-25',
      completedDate: null,
      deliverables: 2,
      deliverablesCompleted: 0
    },
    {
      id: '12',
      name: 'Production Deployment',
      phase: 'Deployment',
      status: 'not-started',
      dueDate: '2024-07-15',
      completedDate: null,
      deliverables: 1,
      deliverablesCompleted: 0
    }
  ],
  deliverables: {
    completed: 15,
    inProgress: 5,
    notStarted: 2,
    onTime: 12,
    delayed: 3,
    byPhase: [
      { phase: 'Requirements Analysis', total: 5, completed: 5, progress: 100 },
      { phase: 'System Design', total: 9, completed: 9, progress: 100 },
      { phase: 'Implementation', total: 12, completed: 10, progress: 83 },
      { phase: 'Testing', total: 4, completed: 0, progress: 0 },
      { phase: 'Deployment', total: 1, completed: 0, progress: 0 }
    ]
  },
  timeline: {
    projectStart: '2024-01-01',
    plannedEnd: '2024-07-15',
    currentDate: '2024-05-01',
    projectedEnd: '2024-07-20',
    daysElapsed: 121,
    totalPlannedDays: 197,
    daysRemaining: 76,
    scheduleVariance: 5 // days behind schedule
  },
  teamPerformance: [
    {
      name: 'Alice Johnson',
      role: 'Lead Developer',
      tasksCompleted: 32,
      tasksInProgress: 3,
      hoursLogged: 156,
      efficiency: 94,
      currentPhase: 'Implementation'
    },
    {
      name: 'Bob Chen',
      role: 'Backend Developer',
      tasksCompleted: 28,
      tasksInProgress: 2,
      hoursLogged: 148,
      efficiency: 91,
      currentPhase: 'Implementation'
    },
    {
      name: 'Carol Davis',
      role: 'Frontend Developer',
      tasksCompleted: 25,
      tasksInProgress: 4,
      hoursLogged: 142,
      efficiency: 88,
      currentPhase: 'Implementation'
    },
    {
      name: 'David Wilson',
      role: 'QA Engineer',
      tasksCompleted: 18,
      tasksInProgress: 1,
      hoursLogged: 98,
      efficiency: 92,
      currentPhase: 'Implementation'
    },
    {
      name: 'Emma Rodriguez',
      role: 'UI/UX Designer',
      tasksCompleted: 22,
      tasksInProgress: 2,
      hoursLogged: 124,
      efficiency: 89,
      currentPhase: 'Implementation'
    }
  ],
  riskMetrics: {
    totalRisks: 8,
    highRisks: 2,
    mediumRisks: 4,
    lowRisks: 2,
    mitigatedRisks: 5,
    openRisks: 3
  },
  qualityMetrics: {
    bugsFound: 23,
    bugsFixed: 20,
    bugResolutionTime: 2.4,
    criticalBugs: 1,
    codeReviews: 56,
    testCoverage: 87,
    documentationComplete: 78
  }
}

export function ReportsView({ project, user }: ReportsViewProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: new Date(2024, 0, 1), // January 1, 2024
    to: new Date(2024, 6, 15)   // July 15, 2024
  })
  const [reportType, setReportType] = useState('all')
  const [selectedTab, setSelectedTab] = useState('overview')

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">In Progress</Badge>
      case 'at-risk':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">At Risk</Badge>
      case 'delayed':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Delayed</Badge>
      case 'not-started':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Not Started</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const MetricCard = ({
    title,
    value,
    unit = '',
    subtitle,
    trend,
    trendValue,
    icon: Icon,
    className = ''
  }: {
    title: string
    value: number | string
    unit?: string
    subtitle?: string
    trend?: string
    trendValue?: number
    icon: any
    className?: string
  }) => (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold">
              {value}{unit}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && trendValue !== undefined && (
              <div className={`flex items-center space-x-1 text-sm mt-2 ${getTrendColor(trend)}`}>
                {getTrendIcon(trend)}
                <span>{Math.abs(trendValue)}{unit} {trend === 'down' ? 'behind' : 'ahead'}</span>
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

  // Chart color palette
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6']

  // 1. Phase Progress Timeline (Gantt-style Bar Chart)
  const PhaseProgressTimeline = () => {
    const data = mockWaterfallData.phases.map(phase => ({
      name: phase.name.split(' ').map(w => w[0]).join(''), // Abbreviate for display
      fullName: phase.name,
      progress: phase.progress,
      tasksCompleted: phase.tasksCompleted,
      totalTasks: phase.totalTasks
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase Progress Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={60} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
                      <p className="font-semibold">{payload[0].payload.fullName}</p>
                      <p className="text-sm">Progress: {payload[0].value}%</p>
                      <p className="text-sm">Tasks: {payload[0].payload.tasksCompleted}/{payload[0].payload.totalTasks}</p>
                    </div>
                  )
                }
                return null
              }} />
              <Bar dataKey="progress" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 2. Deliverables by Phase (Stacked Bar Chart)
  const DeliverablesByPhase = () => {
    const data = mockWaterfallData.deliverables.byPhase.map(phase => ({
      name: phase.phase.split(' ').slice(0, 2).join(' '),
      completed: phase.completed,
      remaining: phase.total - phase.completed
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deliverables by Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
              <Bar dataKey="remaining" stackId="a" fill="#E5E7EB" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 3. Milestone Achievement Trend (Line Chart)
  const MilestoneAchievementTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
    const data = months.map((month, index) => ({
      month,
      achieved: mockWaterfallData.milestones.filter(m => m.status === 'completed').slice(0, (index + 1) * 2).length,
      planned: (index + 1) * 2
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestone Achievement Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="achieved" stroke="#10B981" strokeWidth={2} name="Achieved" />
              <Line type="monotone" dataKey="planned" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" name="Planned" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 4. Task Distribution by Phase (Pie Chart)
  const TaskDistributionByPhase = () => {
    const data = mockWaterfallData.phases.map(phase => ({
      name: phase.name,
      value: phase.totalTasks
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Distribution by Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 5. Phase Timeline Gantt Chart (simplified as horizontal bars)
  const PhaseTimelineGantt = () => {
    const data = mockWaterfallData.phases.map((phase, index) => {
      const start = new Date(phase.startDate || phase.plannedEndDate)
      const end = new Date(phase.endDate || phase.plannedEndDate)
      return {
        name: phase.name,
        startDay: index * 30,
        duration: 30,
        status: phase.status
      }
    })

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase Timeline Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="duration" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 6. Milestone Achievement Timeline
  const MilestoneAchievementTimeline = () => {
    const data = mockWaterfallData.milestones.slice(0, 8).map((milestone, index) => ({
      name: `M${index + 1}`,
      fullName: milestone.name,
      planned: 100,
      actual: milestone.status === 'completed' ? 100 : milestone.status === 'in-progress' ? 50 : 0
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestone Achievement Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
                      <p className="font-semibold text-sm">{payload[0].payload.fullName}</p>
                      <p className="text-sm">Status: {payload[0].payload.actual}%</p>
                    </div>
                  )
                }
                return null
              }} />
              <Legend />
              <Bar dataKey="planned" fill="#E5E7EB" name="Planned" />
              <Bar dataKey="actual" fill="#10B981" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 7. Deliverables Status Distribution (Donut Chart)
  const DeliverablesStatusDistribution = () => {
    const data = [
      { name: 'Completed', value: mockWaterfallData.deliverables.completed },
      { name: 'In Progress', value: mockWaterfallData.deliverables.inProgress },
      { name: 'Not Started', value: mockWaterfallData.deliverables.notStarted }
    ]

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deliverables Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 8. Delivery Timeline vs Planned (Bar Chart)
  const DeliveryTimelineVsPlanned = () => {
    const data = mockWaterfallData.deliverables.byPhase.map(phase => ({
      phase: phase.phase.split(' ').slice(0, 2).join(' '),
      planned: phase.total,
      delivered: phase.completed
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Timeline vs Planned</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="phase" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" fill="#3B82F6" name="Planned" />
              <Bar dataKey="delivered" fill="#10B981" name="Delivered" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 9. Task Completion by Team Member (Bar Chart)
  const TaskCompletionByTeamMember = () => {
    const data = mockWaterfallData.teamPerformance.map(member => ({
      name: member.name.split(' ')[0],
      completed: member.tasksCompleted,
      inProgress: member.tasksInProgress
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Completion by Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  // 10. Hours Distribution (Pie Chart)
  const HoursDistribution = () => {
    const data = mockWaterfallData.teamPerformance.map(member => ({
      name: member.name.split(' ')[0],
      hours: member.hoursLogged
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hours Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="hours"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reports</h2>
          <p className="text-muted-foreground">Waterfall project analytics and performance metrics</p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="phases">Phases</SelectItem>
              <SelectItem value="milestones">Milestones</SelectItem>
              <SelectItem value="deliverables">Deliverables</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
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

          <Button className="bg-[#28A745] hover:bg-[#218838]">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Project Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Overall Progress"
              value={mockWaterfallData.projectHealth.overallProgress}
              unit="%"
              subtitle={`${mockWaterfallData.projectHealth.tasksCompleted}/${mockWaterfallData.projectHealth.totalTasks} tasks completed`}
              icon={Target}
              className="border-l-4 border-l-blue-500"
            />
            <MetricCard
              title="Phases Completed"
              value={mockWaterfallData.projectHealth.phasesCompleted}
              unit={`/${mockWaterfallData.projectHealth.totalPhases}`}
              subtitle="3 of 5 phases done"
              icon={Layers}
              className="border-l-4 border-l-green-500"
            />
            <MetricCard
              title="Milestones Achieved"
              value={mockWaterfallData.projectHealth.milestonesAchieved}
              unit={`/${mockWaterfallData.projectHealth.totalMilestones}`}
              subtitle="67% milestone completion"
              icon={Flag}
              className="border-l-4 border-l-purple-500"
            />
            <MetricCard
              title="Deliverables"
              value={mockWaterfallData.projectHealth.deliverablesCompleted}
              unit={`/${mockWaterfallData.projectHealth.totalDeliverables}`}
              subtitle="68% deliverables done"
              icon={Package}
              className="border-l-4 border-l-orange-500"
            />
          </div>

          {/* Schedule and Budget Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Schedule Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Project Timeline</p>
                    <p className="text-lg font-semibold">
                      {formatDate(new Date(mockWaterfallData.timeline.projectStart), 'MMM d, yyyy')} - {formatDate(new Date(mockWaterfallData.timeline.plannedEnd), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {mockWaterfallData.timeline.scheduleVariance > 0 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {mockWaterfallData.timeline.scheduleVariance} days behind
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      On Schedule
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Elapsed</span>
                    <span className="font-medium">{mockWaterfallData.timeline.daysElapsed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Remaining</span>
                    <span className="font-medium">{mockWaterfallData.timeline.daysRemaining}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projected End Date</span>
                    <span className="font-medium">{formatDate(new Date(mockWaterfallData.timeline.projectedEnd), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Timeline Progress</span>
                    <span className="font-medium">{Math.round((mockWaterfallData.timeline.daysElapsed / mockWaterfallData.timeline.totalPlannedDays) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((mockWaterfallData.timeline.daysElapsed / mockWaterfallData.timeline.totalPlannedDays) * 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Risk & Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-xs text-red-700 dark:text-red-300 mb-1">High Risks</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{mockWaterfallData.riskMetrics.highRisks}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">Medium Risks</p>
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{mockWaterfallData.riskMetrics.mediumRisks}</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-1">Open Bugs</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{mockWaterfallData.qualityMetrics.bugsFound - mockWaterfallData.qualityMetrics.bugsFixed}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-300 mb-1">Test Coverage</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{mockWaterfallData.qualityMetrics.testCoverage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PhaseProgressTimeline />
            <DeliverablesByPhase />
            <MilestoneAchievementTrend />
            <TaskDistributionByPhase />
          </div>
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Completed Phases"
              value={mockWaterfallData.projectHealth.phasesCompleted}
              unit={`/${mockWaterfallData.projectHealth.totalPhases}`}
              icon={CheckCircle}
            />
            <MetricCard
              title="Current Phase"
              value="Implementation"
              icon={Activity}
            />
            <MetricCard
              title="Average Phase Progress"
              value={Math.round(mockWaterfallData.phases.reduce((acc, p) => acc + p.progress, 0) / mockWaterfallData.phases.length)}
              unit="%"
              icon={TrendingUp}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phase Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWaterfallData.phases.map((phase, index) => (
                  <div key={phase.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{phase.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {phase.startDate ? formatDate(new Date(phase.startDate), 'MMM d, yyyy') : 'Not started'} - {phase.plannedEndDate ? formatDate(new Date(phase.plannedEndDate), 'MMM d, yyyy') : 'TBD'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(phase.status)}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tasks</p>
                        <p className="font-semibold">{phase.tasksCompleted}/{phase.totalTasks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Milestones</p>
                        <p className="font-semibold">{phase.milestonesAchieved}/{phase.totalMilestones}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-semibold">${(phase.spent / 1000).toFixed(0)}k/${(phase.budget / 1000).toFixed(0)}k</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <PhaseTimelineGantt />
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Achieved"
              value={mockWaterfallData.milestones.filter(m => m.status === 'completed').length}
              icon={CheckCircle}
              className="border-l-4 border-l-green-500"
            />
            <MetricCard
              title="In Progress"
              value={mockWaterfallData.milestones.filter(m => m.status === 'in-progress').length}
              icon={Activity}
              className="border-l-4 border-l-blue-500"
            />
            <MetricCard
              title="At Risk"
              value={mockWaterfallData.milestones.filter(m => m.status === 'at-risk').length}
              icon={AlertTriangle}
              className="border-l-4 border-l-yellow-500"
            />
            <MetricCard
              title="Not Started"
              value={mockWaterfallData.milestones.filter(m => m.status === 'not-started').length}
              icon={Circle}
              className="border-l-4 border-l-gray-500"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Milestone Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockWaterfallData.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Flag className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold">{milestone.name}</h4>
                        {getStatusBadge(milestone.status)}
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Phase:</span> {milestone.phase}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Due:</span> {formatDate(new Date(milestone.dueDate), 'MMM d, yyyy')}
                          {milestone.completedDate && (
                            <span className="ml-2">
                              | <span className="font-medium">Completed:</span> {formatDate(new Date(milestone.completedDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Deliverables:</span> {milestone.deliverablesCompleted}/{milestone.deliverables}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <MilestoneAchievementTimeline />
        </TabsContent>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Completed"
              value={mockWaterfallData.deliverables.completed}
              subtitle={`${Math.round((mockWaterfallData.deliverables.completed / (mockWaterfallData.deliverables.completed + mockWaterfallData.deliverables.inProgress + mockWaterfallData.deliverables.notStarted)) * 100)}% completion rate`}
              icon={CheckCircle}
            />
            <MetricCard
              title="In Progress"
              value={mockWaterfallData.deliverables.inProgress}
              icon={Activity}
            />
            <MetricCard
              title="On Time Delivery"
              value={mockWaterfallData.deliverables.onTime}
              unit={`/${mockWaterfallData.deliverables.completed}`}
              subtitle={`${mockWaterfallData.deliverables.delayed} delayed`}
              icon={Clock}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deliverables by Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWaterfallData.deliverables.byPhase.map((phaseData, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{phaseData.phase}</h4>
                      <Badge variant="outline">{phaseData.completed}/{phaseData.total}</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium">{phaseData.progress}%</span>
                      </div>
                      <Progress value={phaseData.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeliverablesStatusDistribution />
            <DeliveryTimelineVsPlanned />
          </div>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Team Members"
              value={mockWaterfallData.teamPerformance.length}
              icon={Users}
            />
            <MetricCard
              title="Total Hours"
              value={mockWaterfallData.teamPerformance.reduce((acc, m) => acc + m.hoursLogged, 0)}
              unit="h"
              icon={Clock}
            />
            <MetricCard
              title="Tasks Completed"
              value={mockWaterfallData.teamPerformance.reduce((acc, m) => acc + m.tasksCompleted, 0)}
              icon={CheckSquare}
            />
            <MetricCard
              title="Avg Efficiency"
              value={Math.round(mockWaterfallData.teamPerformance.reduce((acc, m) => acc + m.efficiency, 0) / mockWaterfallData.teamPerformance.length)}
              unit="%"
              icon={TrendingUp}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Member Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWaterfallData.teamPerformance.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="ml-13 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tasks Done</p>
                          <p className="font-semibold">{member.tasksCompleted}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">In Progress</p>
                          <p className="font-semibold">{member.tasksInProgress}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hours Logged</p>
                          <p className="font-semibold">{member.hoursLogged}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Efficiency</p>
                          <p className="font-semibold">{member.efficiency}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaskCompletionByTeamMember />
            <HoursDistribution />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
