import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import {
  Layers,
  Flag,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Package,
  Target,
  DollarSign,
  Activity,
  CheckSquare,
  BarChart3,
  TrendingDown,
  Minus,
  ArrowRight
} from 'lucide-react'

interface WaterfallProjectDashboardProps {
  project: any
  user: any
}

// Enhanced mock Waterfall-specific data with comprehensive metrics
const mockWaterfallData = {
  summary: {
    overallProgress: 56,
    phasesCompleted: 2,
    totalPhases: 5,
    milestonesAchieved: 7,
    totalMilestones: 12,
    deliverablesCompleted: 14,
    totalDeliverables: 25,
    tasksCompleted: 142,
    totalTasks: 265,
    teamMembers: 8,
    daysElapsed: 98,
    totalDays: 180,
    daysRemaining: 82,
    budgetUsed: 245000,
    totalBudget: 500000,
    scheduleStatus: 'on-track', // 'on-track', 'at-risk', 'delayed'
    budgetStatus: 'on-track'
  },
  phases: [
    {
      id: 'requirements',
      name: 'Requirements Analysis',
      status: 'completed',
      progress: 100,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      duration: 31,
      tasksCompleted: 28,
      totalTasks: 28,
      deliverables: ['Requirements Document', 'Use Cases', 'Acceptance Criteria'],
      budget: 50000,
      spent: 48000,
      team: 5
    },
    {
      id: 'design',
      name: 'System Design',
      status: 'completed',
      progress: 100,
      startDate: '2024-02-16',
      endDate: '2024-03-15',
      duration: 28,
      tasksCompleted: 35,
      totalTasks: 35,
      deliverables: ['System Architecture', 'Database Design', 'UI Mockups', 'API Specification'],
      budget: 75000,
      spent: 72000,
      team: 6
    },
    {
      id: 'implementation',
      name: 'Implementation',
      status: 'in-progress',
      progress: 65,
      startDate: '2024-03-16',
      endDate: '2024-05-15',
      duration: 60,
      tasksCompleted: 58,
      totalTasks: 120,
      deliverables: ['Core Features', 'API Implementation', 'Frontend Development', 'Backend Services', 'Integration'],
      budget: 200000,
      spent: 125000,
      team: 8
    },
    {
      id: 'testing',
      name: 'Testing & QA',
      status: 'planned',
      progress: 0,
      startDate: '2024-05-16',
      endDate: '2024-06-15',
      duration: 30,
      tasksCompleted: 0,
      totalTasks: 52,
      deliverables: ['Test Cases', 'Bug Reports', 'Test Results', 'Performance Testing'],
      budget: 100000,
      spent: 0,
      team: 6
    },
    {
      id: 'deployment',
      name: 'Deployment & Go-Live',
      status: 'planned',
      progress: 0,
      startDate: '2024-06-16',
      endDate: '2024-06-30',
      duration: 14,
      tasksCompleted: 0,
      totalTasks: 30,
      deliverables: ['Production Deployment', 'User Training', 'Documentation', 'Go-Live'],
      budget: 75000,
      spent: 0,
      team: 5
    }
  ],
  milestones: [
    { id: 1, name: 'Requirements Sign-off', date: '2024-02-15', status: 'completed', critical: true, phase: 'Requirements Analysis' },
    { id: 2, name: 'Stakeholder Approval', date: '2024-02-20', status: 'completed', critical: true, phase: 'Requirements Analysis' },
    { id: 3, name: 'Design Approval', date: '2024-03-15', status: 'completed', critical: true, phase: 'System Design' },
    { id: 4, name: 'Architecture Review', date: '2024-03-25', status: 'completed', critical: false, phase: 'System Design' },
    { id: 5, name: 'Alpha Release', date: '2024-04-15', status: 'completed', critical: false, phase: 'Implementation' },
    { id: 6, name: 'Core Features Complete', date: '2024-04-30', status: 'completed', critical: true, phase: 'Implementation' },
    { id: 7, name: 'API Integration Done', date: '2024-05-10', status: 'completed', critical: true, phase: 'Implementation' },
    { id: 8, name: 'Beta Release', date: '2024-05-31', status: 'at-risk', critical: true, phase: 'Implementation' },
    { id: 9, name: 'Testing Phase Start', date: '2024-05-16', status: 'planned', critical: true, phase: 'Testing & QA' },
    { id: 10, name: 'UAT Complete', date: '2024-06-10', status: 'planned', critical: true, phase: 'Testing & QA' },
    { id: 11, name: 'Production Deployment', date: '2024-06-25', status: 'planned', critical: true, phase: 'Deployment & Go-Live' },
    { id: 12, name: 'Project Go-Live', date: '2024-06-30', status: 'planned', critical: true, phase: 'Deployment & Go-Live' }
  ],
  deliverables: {
    completed: 14,
    inProgress: 8,
    pending: 3,
    byPhase: [
      { phase: 'Requirements', completed: 3, total: 3, percentage: 100 },
      { phase: 'Design', completed: 4, total: 4, percentage: 100 },
      { phase: 'Implementation', completed: 7, total: 12, percentage: 58 },
      { phase: 'Testing', completed: 0, total: 4, percentage: 0 },
      { phase: 'Deployment', completed: 0, total: 2, percentage: 0 }
    ]
  },
  team: [
    { id: 1, name: 'Sarah Chen', role: 'Project Manager', tasksCompleted: 25, tasksInProgress: 3, efficiency: 95 },
    { id: 2, name: 'Mike Johnson', role: 'Lead Developer', tasksCompleted: 32, tasksInProgress: 5, efficiency: 92 },
    { id: 3, name: 'Emily Davis', role: 'Senior Developer', tasksCompleted: 28, tasksInProgress: 4, efficiency: 90 },
    { id: 4, name: 'James Wilson', role: 'Frontend Developer', tasksCompleted: 24, tasksInProgress: 3, efficiency: 88 },
    { id: 5, name: 'Lisa Anderson', role: 'Backend Developer', tasksCompleted: 19, tasksInProgress: 2, efficiency: 87 },
    { id: 6, name: 'Tom Brown', role: 'QA Engineer', tasksCompleted: 14, tasksInProgress: 2, efficiency: 91 },
    { id: 7, name: 'Anna Martinez', role: 'UI/UX Designer', tasksCompleted: 18, tasksInProgress: 1, efficiency: 89 },
    { id: 8, name: 'David Lee', role: 'DevOps Engineer', tasksCompleted: 12, tasksInProgress: 2, efficiency: 93 }
  ],
  risks: [
    { id: 1, title: 'Beta Release Delay', severity: 'high', impact: 'Schedule delay by 1 week', mitigation: 'Added 2 developers', status: 'active' },
    { id: 2, title: 'Third-party API Integration', severity: 'medium', impact: 'Potential functionality gap', mitigation: 'Alternative API identified', status: 'monitoring' },
    { id: 3, title: 'Resource Availability', severity: 'low', impact: 'Minor capacity issue', mitigation: 'Backup resources allocated', status: 'resolved' }
  ],
  recentActivity: [
    { id: 1, type: 'milestone', title: 'API Integration Done milestone achieved', time: '2 hours ago', user: 'Mike Johnson' },
    { id: 2, type: 'task', title: 'Core Features implementation completed', time: '5 hours ago', user: 'Emily Davis' },
    { id: 3, type: 'deliverable', title: 'Frontend Development deliverable submitted', time: '1 day ago', user: 'James Wilson' },
    { id: 4, type: 'phase', title: 'System Design phase completed', time: '2 days ago', user: 'Sarah Chen' }
  ]
}

export function WaterfallProjectDashboard({ project, user }: WaterfallProjectDashboardProps) {
  const currentPhase = mockWaterfallData.phases.find(phase => phase.status === 'in-progress')
  const completedPhases = mockWaterfallData.phases.filter(phase => phase.status === 'completed').length
  const totalPhases = mockWaterfallData.phases.length
  const summary = mockWaterfallData.summary

  const getStatusBadge = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'at-risk': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'planned': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'on-track': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'delayed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[status as keyof typeof colors] || colors.planned
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (status: string) => {
    if (status === 'on-track') return <TrendingUp className="w-4 h-4 text-green-600" />
    if (status === 'at-risk') return <Minus className="w-4 h-4 text-yellow-600" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  return (
    <div className="space-y-6">
      {/* Project Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{project?.name || 'Waterfall Project'}</h2>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{project?.description || 'Project dashboard overview'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusBadge(summary.scheduleStatus)}>
              {summary.scheduleStatus.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{summary.overallProgress}%</div>
            <div className="mt-2">
              <Progress value={summary.overallProgress} className="h-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Days Progress</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{summary.daysElapsed}</div>
            <div className="text-xs text-muted-foreground mt-1">of {summary.totalDays} days • {summary.daysRemaining} remaining</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Budget Used</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{Math.round((summary.budgetUsed / summary.totalBudget) * 100)}%</div>
            <div className="text-xs text-muted-foreground mt-1">${(summary.budgetUsed / 1000).toFixed(0)}k of ${(summary.totalBudget / 1000).toFixed(0)}k</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Team Efficiency</span>
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {Math.round(mockWaterfallData.team.reduce((acc, m) => acc + m.efficiency, 0) / mockWaterfallData.team.length)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">{summary.teamMembers} team members</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Phases Complete</div>
              <Layers className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold">{summary.phasesCompleted}/{summary.totalPhases}</div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              {getTrendIcon('on-track')}
              <span className="ml-1">{Math.round((summary.phasesCompleted / summary.totalPhases) * 100)}% completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Milestones</div>
              <Flag className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold">{summary.milestonesAchieved}/{summary.totalMilestones}</div>
            <div className="mt-2 flex items-center text-sm text-purple-600">
              <CheckCircle className="w-4 h-4" />
              <span className="ml-1">{Math.round((summary.milestonesAchieved / summary.totalMilestones) * 100)}% achieved</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Deliverables</div>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold">{summary.deliverablesCompleted}/{summary.totalDeliverables}</div>
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <Activity className="w-4 h-4" />
              <span className="ml-1">{mockWaterfallData.deliverables.inProgress} in progress</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Tasks</div>
              <CheckSquare className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold">{summary.tasksCompleted}/{summary.totalTasks}</div>
            <div className="mt-2 flex items-center text-sm text-orange-600">
              <TrendingUp className="w-4 h-4" />
              <span className="ml-1">{Math.round((summary.tasksCompleted / summary.totalTasks) * 100)}% completed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Progress & Current Phase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phases Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Project Phases</span>
              </div>
              <Badge variant="outline">{completedPhases} of {totalPhases} Complete</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockWaterfallData.phases.map((phase, index) => (
                <div key={phase.id} className="relative">
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    phase.status === 'in-progress' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' :
                    phase.status === 'completed' ? 'border-green-300 bg-green-50 dark:bg-green-950' :
                    'border-gray-200 bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          phase.status === 'completed' ? 'bg-green-500 text-white' :
                          phase.status === 'in-progress' ? 'bg-blue-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {phase.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </div>

                        <div>
                          <h4 className="font-semibold text-lg">{phase.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`text-xs ${getStatusBadge(phase.status)}`}>
                              {phase.status.replace('-', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{phase.duration} days</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold">{phase.progress}%</div>
                        <div className="text-xs text-muted-foreground">{phase.tasksCompleted}/{phase.totalTasks} tasks</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <Progress value={phase.progress} className={`h-3 ${getProgressColor(phase.progress)}`} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                        <div className="font-semibold">${(phase.spent / 1000).toFixed(0)}k</div>
                        <div className="text-muted-foreground">of ${(phase.budget / 1000).toFixed(0)}k</div>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                        <div className="font-semibold">{phase.team}</div>
                        <div className="text-muted-foreground">Team Size</div>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                        <div className="font-semibold">{phase.deliverables.length}</div>
                        <div className="text-muted-foreground">Deliverables</div>
                      </div>
                    </div>
                  </div>

                  {index < mockWaterfallData.phases.length - 1 && (
                    <div className="absolute left-5 top-full w-0.5 h-4 bg-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Phase Detail & Risks */}
        <div className="space-y-6">
          {/* Current Phase */}
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Current Phase</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPhase ? (
                <>
                  <div>
                    <h4 className="font-bold text-xl mb-2">{currentPhase.name}</h4>
                    <Badge className={getStatusBadge(currentPhase.status)}>
                      {currentPhase.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="font-bold text-blue-600">{currentPhase.progress}%</span>
                    </div>
                    <Progress value={currentPhase.progress} className="h-3" />
                  </div>

                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {Math.ceil((new Date(currentPhase.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-xs text-muted-foreground">Days Remaining</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Key Deliverables:</div>
                    <ul className="space-y-2">
                      {currentPhase.deliverables.map((deliverable, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span>{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active phase</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risks */}
          <Card className="border-t-4 border-t-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span>Active Risks</span>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {mockWaterfallData.risks.filter(r => r.status === 'active').length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockWaterfallData.risks.map((risk) => (
                  <div key={risk.id} className={`p-3 rounded-lg border ${
                    risk.severity === 'high' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
                    risk.severity === 'medium' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' :
                    'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                  }`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm">{risk.title}</div>
                      <Badge className={`text-xs ${
                        risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                        risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {risk.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{risk.mitigation}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Milestones & Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flag className="w-5 h-5 text-purple-600" />
                <span>Project Milestones</span>
              </div>
              <div className="flex space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  {mockWaterfallData.milestones.filter(m => m.status === 'completed').length} Done
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {mockWaterfallData.milestones.filter(m => m.status === 'at-risk').length} At Risk
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {mockWaterfallData.milestones.map((milestone) => (
                <div key={milestone.id} className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                  milestone.status === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' :
                  milestone.status === 'at-risk' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' :
                  'bg-gray-50 border-gray-200 dark:bg-gray-900'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {milestone.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : milestone.status === 'at-risk' ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Flag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{milestone.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{milestone.phase}</div>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs font-medium">{milestone.date}</div>
                      {milestone.critical && (
                        <Badge className="text-xs bg-red-100 text-red-800 mt-1">Critical</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Deliverables by Phase</span>
              </div>
              <Badge variant="outline">{mockWaterfallData.deliverables.completed}/{summary.totalDeliverables}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockWaterfallData.deliverables.byPhase.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.phase}</span>
                    <span className="text-sm text-muted-foreground">{item.completed}/{item.total} ({item.percentage}%)</span>
                  </div>
                  <div className="relative">
                    <Progress value={item.percentage} className="h-3" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow">{item.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{mockWaterfallData.deliverables.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{mockWaterfallData.deliverables.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{mockWaterfallData.deliverables.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
