import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Input } from '../../components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { toast } from 'sonner@2.0.3'
import { TaskManagement } from '../Project/TaskManagement'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchMyProjects, clearError } from '../../store/slices/myProjectsSlice'
import { MyProject } from '../../services/projectApi'
import {
  Search,
  Filter,
  Users,
  Target,
  Folder,
  AlertTriangle,
  GitBranch,
  Zap,
  BarChart3,
  PlayCircle,
  PauseCircle,
  Grid3X3,
  List,
  MoreHorizontal,
  CheckSquare
} from 'lucide-react'

// Add computed properties for UI display
const addComputedProperties = (project: MyProject) => ({
  ...project,
  teamSize: (project.team_members?.length || 0) + 1, // +1 for team lead
  tasksTotal: 25, // Default value, could be calculated from tasks
  tasksCompleted: Math.floor((project.progress / 100) * 25),
  issuesOpen: Math.floor(Math.random() * 5) + 1,
  upcomingMilestones: 2,
  epics: Math.floor(Math.random() * 5) + 1,
  stories: Math.floor(Math.random() * 20) + 10,
  version: 'v1.0.0',
});

interface MyProjectsProps {
  onProjectSelect?: (projectId: string) => void
  user?: any
}

export function MyProjects({ onProjectSelect, user }: MyProjectsProps) {
  const dispatch = useAppDispatch()
  const {
    projects: myProjects,
    loading,
    error
  } = useAppSelector((state) => state.myProjects)

  const projects = myProjects.map(addComputedProperties)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showTaskManagement, setShowTaskManagement] = useState(false)
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState({
    status: 'all',
    priority: 'all',
    methodology: 'all',
    type: 'all'
  })

  // Fetch my projects on component mount
  useEffect(() => {
    dispatch(fetchMyProjects())
  }, [dispatch])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-[#28A745]'
      case 'In Progress': return 'text-[#FFC107]'
      case 'Completed': return 'text-[#007BFF]'
      case 'On Hold': return 'text-[#DC3545]'
      default: return 'text-muted-foreground'
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.customer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterBy.status === 'all' || project.status === filterBy.status
    const matchesPriority = filterBy.priority === 'all' || project.priority === filterBy.priority
    const matchesMethodology = filterBy.methodology === 'all' || project.methodology === filterBy.methodology
    const matchesType = filterBy.type === 'all' || project.project_type === filterBy.type

    return matchesSearch && matchesStatus && matchesPriority && matchesMethodology && matchesType
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-[#DC3545] text-white'
      case 'Medium': return 'bg-[#FFC107] text-white'
      case 'Low': return 'bg-[#28A745] text-white'
      default: return 'bg-muted text-foreground'
    }
  }

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100
    if (percentage > 90) return { color: 'text-[#DC3545]', status: 'Over Budget' }
    if (percentage > 75) return { color: 'text-[#FFC107]', status: 'At Risk' }
    return { color: 'text-[#28A745]', status: 'On Track' }
  }

  const getMethodologyIcon = (methodology: string) => {
    switch (methodology) {
      case 'Scrum': return <Zap className="w-4 h-4" />
      case 'Kanban': return <BarChart3 className="w-4 h-4" />
      case 'Waterfall': return <GitBranch className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  // Show error if there's one
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your projects...</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
          <p className="text-muted-foreground">
            Projects you're assigned to and your contributions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Filter Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Filter Projects</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select value={filterBy.status} onValueChange={(value) => setFilterBy({...filterBy, status: value})}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <Select value={filterBy.priority} onValueChange={(value) => setFilterBy({...filterBy, priority: value})}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Methodology</label>
                    <Select value={filterBy.methodology} onValueChange={(value) => setFilterBy({...filterBy, methodology: value})}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="Scrum">Scrum</SelectItem>
                        <SelectItem value="Kanban">Kanban</SelectItem>
                        <SelectItem value="Waterfall">Waterfall</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={filterBy.type} onValueChange={(value) => setFilterBy({...filterBy, type: value})}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Software Development">Software Dev</SelectItem>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Analytics">Analytics</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilterBy({status: 'all', priority: 'all', methodology: 'all', type: 'all'})}
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Project Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="text-3xl font-bold">{projects.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Projects assigned to you
              </p>
            </div>
            <div className="p-3 bg-[#007BFF]/10 rounded-full">
              <Folder className="w-6 h-6 text-[#007BFF]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-3xl font-bold">{projects.filter(p => p.status === 'Active').length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Currently in progress
              </p>
            </div>
            <div className="p-3 bg-[#28A745]/10 rounded-full">
              <PlayCircle className="w-6 h-6 text-[#28A745]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">At Risk</p>
              <p className="text-3xl font-bold">{projects.filter(p => {
                const budgetUsage = (p.spent / p.budget) * 100;
                return budgetUsage > 90 || p.progress < 50;
              }).length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </div>
            <div className="p-3 bg-[#FFC107]/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-[#FFC107]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">On Hold</p>
              <p className="text-3xl font-bold">{projects.filter(p => p.status === 'On Hold').length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Temporarily paused
              </p>
            </div>
            <div className="p-3 bg-[#DC3545]/10 rounded-full">
              <PauseCircle className="w-6 h-6 text-[#DC3545]" />
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle and Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">Projects ({filteredProjects.length})</h3>
            <Badge variant="outline" className="ml-2">
              {viewMode === 'grid' ? 'Card View' : 'Table View'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#007BFF] hover:bg-[#0056b3]' : ''}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#007BFF] hover:bg-[#0056b3]' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Card View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredProjects.map((project) => {
              const budgetStatus = getBudgetStatus(project.spent, project.budget)

              return (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onProjectSelect?.(project.id)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-[#007BFF] transition-colors">{project.name}</h3>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {project.description}
                        </p>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            {getMethodologyIcon(project.methodology)}
                            <span>{project.methodology}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {project.project_type}
                          </Badge>
                          <span className={`text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProjectForTasks(project.id)
                            setShowTaskManagement(true)
                          }}
                          title="Manage Tasks"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Epics</p>
                        <p className="text-lg font-bold">{project.epics}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Stories</p>
                        <p className="text-lg font-bold">{project.stories}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Tasks</p>
                        <p className="text-lg font-bold">{project.tasksCompleted}/{project.tasksTotal}</p>
                      </div>
                    </div>

                    {/* Team and Budget */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{project.teamSize} members</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${budgetStatus.color}`}>
                          ${(project.spent/1000).toFixed(0)}k / ${(project.budget/1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-muted-foreground">{budgetStatus.status}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'list' && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Methodology</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const budgetStatus = getBudgetStatus(project.spent, project.budget)

                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-semibold text-sm">{project.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {project.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {project.customer}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{project.teamSize}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className={`text-sm font-medium ${budgetStatus.color}`}>
                            ${(project.spent/1000).toFixed(0)}k / ${(project.budget/1000).toFixed(0)}k
                          </div>
                          <div className="text-xs text-muted-foreground">{budgetStatus.status}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getMethodologyIcon(project.methodology)}
                          <span className="text-sm">{project.methodology}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{project.end_date}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProjectForTasks(project.id)
                              setShowTaskManagement(true)
                            }}
                            title="Manage Tasks"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Task Management Modal */}
      {selectedProjectForTasks && (
        <TaskManagement
          projectId={selectedProjectForTasks}
          isOpen={showTaskManagement}
          onClose={() => {
            setShowTaskManagement(false)
            setSelectedProjectForTasks(null)
          }}
        />
      )}
    </div>
  )
}
