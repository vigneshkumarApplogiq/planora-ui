import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  Search,
  Target,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  Filter
} from 'lucide-react'
import { Task } from '../../../services/taskApi'
import { storiesApiService, Story } from '../../../services/storiesApi'
import { projectApiService, ProjectMemberDetail } from '../../../services/projectApi'
import { phaseApiService, Phase } from '../../../services/phaseApi'
import { milestoneApiService, Milestone } from '../../../services/milestoneApi'
import { deliverableApiService, Deliverable } from '../../../services/deliverableApi'
import { getEnrichedTeamMemberDetails, EnrichedMemberDetail } from '../../../utils/teamMemberDetails'
import { toast } from 'sonner'
import { SessionStorageService } from '../../../utils/sessionStorage'
import { TaskModal } from './Tasks/TaskModal'

interface BoardViewProps {
  projectId?: string
  user: any
  project?: any
}

interface TaskCardProps {
  task: Story
  columnId: string
  onEdit: (task: Story) => void
  phases: Phase[]
  milestones: Milestone[]
  deliverables: Deliverable[]
}

const TaskCard: React.FC<TaskCardProps> = ({ task, columnId, onEdit, phases, milestones, deliverables }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      taskId: task.id,
      sourceColumn: columnId,
      taskTitle: task.title
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    console.log(`Drag ended for task: ${task.title}`)
  }

  // Check if task is in done column
  const isDone = columnId === 'done' || task.status?.toLowerCase().includes('done') || task.status?.toLowerCase().includes('completed')

  // Check if task is overdue
  const isOverdue = () => {
    if (!task.end_date) return false
    const dueDate = new Date(task.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today && !isDone
  }

  // Format due date - only date, no time
  const formatDueDate = () => {
    if (!task.end_date) return null
    const dueDate = new Date(task.end_date)
    return dueDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    })
  }

  // Calculate days since creation (from start_date)
  const getDaysSinceCreation = () => {
    if (!task.start_date) return null
    const startDate = new Date(task.start_date)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Calculate days until due or days overdue
  const getDaysUntilDue = () => {
    if (!task.end_date) return null
    const dueDate = new Date(task.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Truncate description to 100 characters
  const truncateDescription = (text: string | null | undefined, maxLength: number = 100) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // Get priority color and badge style
  const getPriorityBadge = () => {
    switch (task.priority?.toLowerCase()) {
      case 'critical':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' }
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' }
      case 'low':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
    }
  }

  // Get story type icon and color
  const getStoryTypeIcon = () => {
    switch (task.story_type?.toLowerCase()) {
      case 'story':
        return { icon: Target, color: 'text-blue-600' }
      case 'bug':
        return { icon: AlertTriangle, color: 'text-red-600' }
      case 'task':
        return { icon: CheckCircle, color: 'text-green-600' }
      case 'epic':
        return { icon: Layers, color: 'text-purple-600' }
      default:
        return { icon: Target, color: 'text-gray-600' }
    }
  }

  const priorityBadge = getPriorityBadge()
  const storyTypeInfo = getStoryTypeIcon()
  const StoryIcon = storyTypeInfo.icon

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="cursor-move select-none"
    >
      <Card
        className="mb-3 hover:shadow-lg transition-all duration-200 bg-white cursor-pointer border border-gray-200 rounded-xl hover:border-blue-300 group"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          onEdit(task)
        }}
      >
        <CardContent className="p-3 space-y-2.5">
          {/* Header: Task ID and Days Since Creation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <StoryIcon className={`w-3.5 h-3.5 ${storyTypeInfo.color}`} />
              <span className="text-xs font-bold text-blue-600">
                {task.task_id || `#${task.id?.slice(0, 8)}` || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getDaysSinceCreation() !== null && (
                <span className="text-[10px] text-gray-500 font-medium">
                  {getDaysSinceCreation()}d ago
                </span>
              )}
              {/* Priority Badge */}
              {task.priority && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-5 ${priorityBadge.bg} ${priorityBadge.text} border ${priorityBadge.border} capitalize font-medium`}
                >
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Task Title */}
          <h4 className={`font-semibold text-sm leading-tight line-clamp-2 ${isDone ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {truncateDescription(task.description, 80)}
            </p>
          )}

          {/* Waterfall-specific badges */}
          <div className="flex flex-wrap gap-1">
            {task.phase_id && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] px-1.5 py-0">
                {phases.find(p => p.id === task.phase_id)?.name || 'Phase'}
              </Badge>
            )}
            {task.milestone_id && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] px-1.5 py-0">
                {milestones.find(m => m.id === task.milestone_id)?.name || 'Milestone'}
              </Badge>
            )}
            {task.deliverable_id && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-[10px] px-1.5 py-0">
                {deliverables.find(d => d.id === task.deliverable_id)?.name || 'Deliverable'}
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          {task.progress !== undefined && task.progress !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">Progress</span>
                <span className="text-[10px] font-semibold text-gray-700">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    task.progress === 100 ? 'bg-green-500' : task.progress >= 70 ? 'bg-blue-500' : task.progress >= 40 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 pt-2"></div>

          {/* Footer: Due Date + Assignee */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Due Date with Days Left/Overdue */}
              {task.end_date && (
                <div className="flex items-center gap-1">
                  {isOverdue() ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-semibold ${isOverdue() ? 'text-red-600' : 'text-gray-700'}`}>
                      {formatDueDate()}
                    </span>
                    {getDaysUntilDue() !== null && !isDone && (
                      <span className={`text-[9px] ${isOverdue() ? 'text-red-500' : 'text-gray-500'}`}>
                        {getDaysUntilDue()! < 0 ? `${Math.abs(getDaysUntilDue()!)}d overdue` : `${getDaysUntilDue()}d left`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Assignee with Name */}
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <Avatar className="w-6 h-6 border border-gray-200 shadow-sm">
                  {task.assignee.user_profile && (
                    <AvatarImage
                      src={task.assignee.user_profile}
                      alt={task.assignee.name}
                    />
                  )}
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                    {task.assignee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-gray-700 font-medium max-w-[70px] truncate">
                  {task.assignee.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ColumnProps {
  title: string
  status: string
  tasks: Story[]
  onDrop: (taskId: string, newStatus: string) => void
  onEdit: (task: Story) => void
  phases: Phase[]
  milestones: Milestone[]
  deliverables: Deliverable[]
}

const Column: React.FC<ColumnProps> = ({ title, status, tasks, onDrop, onEdit, phases, milestones, deliverables }) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!isDragOver) {
      setIsDragOver(true)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.sourceColumn !== status) {
        onDrop(data.taskId, status)
      }
    } catch (error) {
      console.error('Error parsing drop data:', error)
    }
  }

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-500'
      case 'in-progress': return 'bg-blue-500'
      case 'review': return 'bg-yellow-500'
      case 'done': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex-1 min-w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getColumnColor(status)}`} />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`min-h-96 transition-all duration-200 ${
            isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400 shadow-inner' : ''
          }`}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={status}
              onEdit={onEdit}
              phases={phases}
              milestones={milestones}
              deliverables={deliverables}
            />
          ))}

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Drop tasks here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function BoardView({ projectId: propProjectId, user, project }: BoardViewProps) {
  const effectiveProjectId = SessionStorageService.getEffectiveProjectId(propProjectId)

  const [tasks, setTasks] = useState<Story[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState<Story | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([])
  const [availablePriorities, setAvailablePriorities] = useState<any[]>([])
  const [projectTeamMembers, setProjectTeamMembers] = useState<ProjectMemberDetail[]>([])
  const [projectTeamLead, setProjectTeamLead] = useState<ProjectMemberDetail | null>(null)

  // Filters
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterMilestone, setFilterMilestone] = useState<string>('all')
  const [filterDeliverable, setFilterDeliverable] = useState<string>('all')

  // Columns configuration
  const columns = React.useMemo(() => [
    { id: 'todo', title: 'To Do', status: 'todo', color: '#6B7280' },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress', color: '#3B82F6' },
    { id: 'review', title: 'Review', status: 'review', color: '#EAB308' },
    { id: 'done', title: 'Done', status: 'done', color: '#22C55E' }
  ], [])

  useEffect(() => {
    if (effectiveProjectId) {
      loadTasks()
      loadPhases()
      loadMilestones()
      loadDeliverables()
      loadProjectMasters()
    }
  }, [effectiveProjectId])

  useEffect(() => {
    if (project?.team_members_detail && project?.team_lead_detail) {
      setProjectTeamMembers(project.team_members_detail)
      setProjectTeamLead(project.team_lead_detail)
    }
  }, [project])

  const loadProjectMasters = async () => {
    if (!effectiveProjectId) return

    try {
      const masters = await projectApiService.getProjectMasters()
      setAvailableStatuses(masters.statuses || [])
      setAvailablePriorities(masters.priorities || [])
    } catch (error) {
      console.error('Error fetching project masters:', error)
    }
  }

  const loadTasks = async () => {
    if (!effectiveProjectId) return

    try {
      setLoading(true)
      const response = await storiesApiService.getStories(effectiveProjectId, 1, 100)
      setTasks(response.items)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const loadPhases = async () => {
    if (!effectiveProjectId) return

    try {
      const response = await phaseApiService.getPhases(effectiveProjectId)
      setPhases(response.items)
    } catch (error) {
      console.error('Error fetching phases:', error)
    }
  }

  const loadMilestones = async () => {
    if (!effectiveProjectId) return

    try {
      const response = await milestoneApiService.getMilestones(effectiveProjectId)
      setMilestones(response.items)
    } catch (error) {
      console.error('Error fetching milestones:', error)
    }
  }

  const loadDeliverables = async () => {
    if (!effectiveProjectId) return

    try {
      const response = await deliverableApiService.getDeliverables(effectiveProjectId)
      setDeliverables(response.items)
    } catch (error) {
      console.error('Error fetching deliverables:', error)
    }
  }

  const handleTaskEdit = (task: Story) => {
    setSelectedTask(task)
    setShowTaskDialog(true)
  }

  const handleTaskUpdate = async (updatedTask: any) => {
    try {
      const storyUpdateData = {
        title: updatedTask.title,
        description: updatedTask.description,
        story_type: updatedTask.story_type,
        priority: updatedTask.priority,
        status: updatedTask.status,
        phase_id: updatedTask.phase_id || undefined,
        milestone_id: updatedTask.milestone_id || undefined,
        deliverable_id: updatedTask.deliverable_id || undefined,
        assignee_id: updatedTask.assignee_id || undefined,
        progress: updatedTask.progress || 0,
        start_date: updatedTask.start_date,
        end_date: updatedTask.end_date || updatedTask.due_date,
        tags: updatedTask.tags || [],
        labels: updatedTask.tags || [],
        acceptance_criteria: updatedTask.acceptance_criteria?.filter((c: string) => c.trim() !== '') || [],
        comments: updatedTask.comments || []
      }

      await storiesApiService.updateStory(updatedTask.id, storyUpdateData)
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        )
      )
      setShowTaskDialog(false)
      toast.success('Task updated successfully')
      loadTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    try {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )

      await storiesApiService.updateStory(taskId, { status: newStatus })
      toast.success('Task moved successfully')
    } catch (error) {
      console.error('Failed to move task:', error)
      toast.error('Failed to move task')
      loadTasks()
    }
  }

  const getTasksForColumn = (status: string) => {
    return tasks.filter(task => {
      const taskStatus = task.status?.toLowerCase().replace(/\s+/g, '-') || 'todo'
      const matchesStatus = taskStatus === status
      const matchesSearch = !searchTerm ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPriority = filterPriority === 'all' ||
        task.priority?.toLowerCase() === filterPriority.toLowerCase()

      const matchesType = filterType === 'all' ||
        task.story_type?.toLowerCase() === filterType.toLowerCase()

      const matchesAssignee = filterAssignee === 'all' ||
        (filterAssignee === 'unassigned' ? !task.assignee_id : task.assignee_id === filterAssignee)

      const matchesPhase = filterPhase === 'all' ||
        (filterPhase === 'unassigned' && !task.phase_id) ||
        task.phase_id === filterPhase

      const matchesMilestone = filterMilestone === 'all' ||
        (filterMilestone === 'unassigned' && !task.milestone_id) ||
        task.milestone_id === filterMilestone

      const matchesDeliverable = filterDeliverable === 'all' ||
        (filterDeliverable === 'unassigned' && !task.deliverable_id) ||
        task.deliverable_id === filterDeliverable

      return matchesStatus && matchesSearch && matchesPriority && matchesType && matchesAssignee && matchesPhase && matchesMilestone && matchesDeliverable
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading board...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Waterfall Board</h2>
            <p className="text-muted-foreground">Drag and drop tasks to update their status</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="epic">Epic</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPhase} onValueChange={setFilterPhase}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id || ''}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMilestone} onValueChange={setFilterMilestone}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Milestone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Milestones</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {milestones.map((milestone) => (
                  <SelectItem key={milestone.id} value={milestone.id || ''}>
                    {milestone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDeliverable} onValueChange={setFilterDeliverable}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Deliverable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deliverables</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {deliverables.map((deliverable) => (
                  <SelectItem key={deliverable.id} value={deliverable.id || ''}>
                    {deliverable.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {projectTeamMembers && projectTeamMembers.length > 0 ? (
                  projectTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>Loading members...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Board Statistics */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column.status)
          return (
            <Card key={column.id}>
              <CardContent className="p-4 text-center">
                <div className={`w-3 h-3 rounded-full ${column.status === 'todo' ? 'bg-gray-500' : column.status === 'in-progress' ? 'bg-blue-500' : column.status === 'review' ? 'bg-yellow-500' : 'bg-green-500'} mx-auto mb-2`} />
                <div className="text-2xl font-semibold">{columnTasks.length}</div>
                <div className="text-xs text-muted-foreground">{column.title}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Waterfall Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <Column
            key={column.id}
            title={column.title}
            status={column.status}
            tasks={getTasksForColumn(column.status)}
            onDrop={handleTaskMove}
            onEdit={handleTaskEdit}
            phases={phases}
            milestones={milestones}
            deliverables={deliverables}
          />
        ))}
      </div>

      {/* Task Edit Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          onUpdate={handleTaskUpdate}
          user={user}
          availableStatuses={availableStatuses}
          availablePriorities={availablePriorities}
          projectTeamMembers={projectTeamMembers}
          projectTeamLead={projectTeamLead || undefined}
          phases={phases}
          milestones={milestones}
          deliverables={deliverables}
          project={project}
        />
      )}
    </div>
  )
}
