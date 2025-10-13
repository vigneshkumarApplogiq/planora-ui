import React, { useState, useCallback, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Slider } from '../../../components/ui/slider'
import { Switch } from '../../../components/ui/switch'
import {
  Plus,
  Search,
  Settings,
  MoreVertical,
  Target,
  AlertTriangle,
  Flag,
  CheckCircle,
  Clock,
  Users,
  AlertCircle,
  TrendingUp,
  Edit,
  Trash2,
  GripVertical,
  Calendar,
  Layers,
  Timer
} from 'lucide-react'
import { storiesApiService, Story } from '../../../services/storiesApi'
import { toast } from 'sonner'
import { projectApiService } from '../../../services/projectApi'
import { TaskModal } from './Tasks/TaskModal'
import { Textarea } from '../../../components/ui/textarea'
import { timesheetApiService } from '../../../services/timesheetApi'

interface KanbanBoardViewProps {
  project: any
  user: any
  boardType?: 'sprint' | 'kanban' | 'wip'
  masterData?: any
  masterLoading?: boolean
}

interface KanbanTask extends Story {}

interface KanbanColumn {
  id: string
  title: string
  status: string
  color: string
  wipLimit?: number
  tasks: KanbanTask[]
}

const ItemTypes = {
  TASK: 'task'
}

interface DragItem {
  id: string
  type: string
  columnId: string
}

const TaskCard: React.FC<{
  task: KanbanTask
  columnId: string
  onEdit: (task: KanbanTask) => void
  onDelete: (taskId: string) => void
  onLogTime: (task: KanbanTask) => void
}> = ({ task, columnId, onEdit, onDelete, onLogTime }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: () => ({
      id: task.id,
      type: ItemTypes.TASK,
      columnId,
      title: task.title
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [task.id, task.title, columnId])

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
      ref={drag}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <Card
        className="mb-3 hover:shadow-md transition-shadow bg-white cursor-pointer border border-gray-200 rounded-lg"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          console.log('Card clicked:', task.task_id || task.id)
          onEdit(task)
        }}
      >
        <CardContent className="p-3 space-y-2.5">
          {/* Header: Task ID and Created Days Ago */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-blue-600">
              {task.task_id || `#${task.id?.slice(0, 8)}` || 'N/A'}
            </div>
            {getDaysSinceCreation() !== null && (
              <div className="text-xs text-gray-500">
                {getDaysSinceCreation()}d ago
              </div>
            )}
          </div>

          {/* Task Title */}
          <h4 className={`font-medium text-sm leading-tight ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {truncateDescription(task.description, 150)}
            </p>
          )}

          {/* Story Type and Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <StoryIcon className={`w-3.5 h-3.5 ${storyTypeInfo.color}`} />
              <span className={`text-xs ${storyTypeInfo.color} capitalize font-medium`}>
                {task.story_type || 'Task'}
              </span>
            </div>
            {task.priority && (
              <Badge
                variant="outline"
                className={`text-xs px-1.5 py-0 h-5 ${priorityBadge.bg} ${priorityBadge.text} border ${priorityBadge.border} capitalize`}
              >
                {task.priority}
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          {task.progress !== undefined && task.progress !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Progress</span>
                <span className="text-xs font-medium text-gray-700">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    task.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer: Due Date + Assignee */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {task.end_date && (
                <div className="flex items-center gap-1">
                  {isOverdue() ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span className={`text-xs ${isOverdue() ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {formatDueDate()}
                    {getDaysUntilDue() !== null && !isDone && (
                      <span className={`ml-1 ${isOverdue() ? 'text-red-500' : 'text-gray-500'}`}>
                        ({getDaysUntilDue() < 0 ? `${Math.abs(getDaysUntilDue()!)}d overdue` : `${getDaysUntilDue()}d left`})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {task.assignee && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-6 h-6 border border-gray-200">
                    {task.assignee.user_profile && (
                      <AvatarImage
                        src={task.assignee.user_profile}
                        alt={task.assignee.name}
                      />
                    )}
                    <AvatarFallback className="text-xs bg-blue-500 text-white font-medium">
                      {task.assignee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-700 font-medium max-w-[80px] truncate">
                    {task.assignee.name.split(' ')[0]}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-green-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onLogTime(task)
                }}
                title="Log time"
              >
                <Timer className="w-3.5 h-3.5 text-green-600" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const KanbanColumn: React.FC<{
  column: KanbanColumn
  onTaskMove: (taskId: string, targetColumnId: string) => void
  onTaskEdit: (task: KanbanTask) => void
  onTaskDelete: (taskId: string) => void
  onLogTime: (task: KanbanTask) => void
}> = ({ column, onTaskMove, onTaskEdit, onTaskDelete, onLogTime }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: DragItem) => {
      if (item.columnId !== column.id) {
        onTaskMove(item.id, column.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [column.id, onTaskMove])

  const isWipLimitExceeded = column.wipLimit && column.tasks.length >= column.wipLimit

  return (
    <div className="flex-1 min-w-80 h-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <CardTitle className="text-sm font-medium">
                {column.title}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {column.tasks.length}
              </Badge>
              {column.wipLimit && (
                <Badge
                  variant="outline"
                  className={`text-xs ${isWipLimitExceeded ? 'bg-red-100 text-red-800' : ''}`}
                >
                  WIP: {column.wipLimit}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <div
          ref={drop}
          className={`flex-1 overflow-y-auto transition-colors duration-200 relative ${
            isOver && canDrop ? 'bg-blue-50' : ''
          } ${isWipLimitExceeded ? 'bg-red-50/50' : ''}`}
        >
          <CardContent className={`min-h-full pb-20 ${isOver && canDrop ? 'border-2 border-dashed border-blue-300' : ''}`}>
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
                onLogTime={onLogTime}
              />
            ))}

            {column.tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Drop tasks here</p>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

export function KanbanBoardView({ project, user, boardType = 'kanban', masterData: propMasterData, masterLoading: propMasterLoading }: KanbanBoardViewProps) {
  const projectId = project?.id
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showWipSettings, setShowWipSettings] = useState(false)
  const [wipLimitsEnabled, setWipLimitsEnabled] = useState(true)
  const [tasks, setTasks] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogTimeDialog, setShowLogTimeDialog] = useState(false)
  const [selectedTaskForTimeLog, setSelectedTaskForTimeLog] = useState<KanbanTask | null>(null)
  const [logTimeData, setLogTimeData] = useState({
    hours: '',
    description: '',
    activityType: 'development' as 'development' | 'testing' | 'design' | 'review' | 'meeting' | 'documentation' | 'bug_fixing' | 'other'
  })

  // Use master data from props (passed from parent)
  const masterData = propMasterData
  const masterLoading = propMasterLoading || false
  const [projectTeamMembers, setProjectTeamMembers] = useState<any[]>([])
  const [projectTeamLead, setProjectTeamLead] = useState<any>(null)

  // Log master data usage
  useEffect(() => {
  }, [masterData])

  // Load project team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!projectId) return

      try {
        const teamData = await projectApiService.getProjectTeamMembers(projectId)
        setProjectTeamMembers(teamData.team_members_detail || [])
        setProjectTeamLead(teamData.team_lead_detail || null)
      } catch (error) {
        console.error('❌ [Kanban] Failed to load team members:', error)
      }
    }

    loadTeamMembers()
  }, [projectId])

  // Load tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        const response = await storiesApiService.getStories(projectId, 1, 100)
        console.log('📋 [Kanban] Loaded tasks:', response.items)
        console.log('📋 [Kanban] Sample task data:', response.items[0])
        setTasks(response.items)
      } catch (error) {
        console.error('Failed to load tasks:', error)
        toast.error('Failed to load tasks')
        setTasks([])
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [projectId])

  // Initialize columns with tasks
  useEffect(() => {
    // Only create columns if master data is loaded
    if (!masterData || !masterData.task_status || masterData.task_status.length === 0) {
      console.warn('⚠️ [Kanban] Master data not available yet, skipping column initialization')
      return
    }
    // Create columns from master task_status
    const defaultColumns: KanbanColumn[] = masterData.task_status
      .filter((status: any) => status.is_active)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((status: any) => {
        const statusId = status.name.toLowerCase().replace(/\s+/g, '-')
        return {
          id: statusId,
          title: status.name,
          status: statusId,
          color: status.color ? `bg-[${status.color}]` : 'bg-gray-500',
          wipLimit: wipLimitsEnabled ? (status.name.toLowerCase().includes('done') || status.name.toLowerCase().includes('completed') ? undefined : 5) : undefined,
          tasks: []
        }
      })

    // Distribute tasks into columns based on status
    const columnsWithTasks = defaultColumns.map(column => ({
      ...column,
      tasks: tasks.filter(task => {
        const taskStatus = task.status?.toLowerCase().replace(/\s+/g, '-') || 'todo'
        return taskStatus === column.status
      })
    }))

   setColumns(columnsWithTasks)
  }, [tasks, wipLimitsEnabled, masterData])

  const handleTaskMove = useCallback(async (taskId: string, targetColumnId: string) => {
    try {
      // Update local state optimistically first
      setColumns(prevColumns => {
        // Find target column to get the status
        const targetColumn = prevColumns.find(col => col.id === targetColumnId)
        if (!targetColumn) return prevColumns

        // Check WIP limits
        if (targetColumn.wipLimit && targetColumn.tasks.length >= targetColumn.wipLimit) {
          toast.error(`Cannot move task: WIP limit (${targetColumn.wipLimit}) exceeded for ${targetColumn.title}`)
          return prevColumns
        }

        // Find the task to move from all columns
        const taskToMove = prevColumns
          .flatMap(col => col.tasks)
          .find(task => task.id === taskId)

        if (!taskToMove) return prevColumns

        // Create new columns array with task moved
        return prevColumns.map(column => {
          if (column.id === targetColumnId) {
            // Add task to target column if not already there
            if (!column.tasks.find(t => t.id === taskId)) {
              return {
                ...column,
                tasks: [...column.tasks, { ...taskToMove, status: targetColumn.status }]
              }
            }
            return column
          } else {
            // Remove task from other columns
            return {
              ...column,
              tasks: column.tasks.filter(task => task.id !== taskId)
            }
          }
        })
      })

      // Update task status via API
      const targetColumn = columns.find(col => col.id === targetColumnId)
      if (targetColumn) {
        await storiesApiService.updateStory(taskId, {
          status: targetColumn.status
        })
      }

      toast.success('Task moved successfully')
    } catch (error) {
      console.error('Failed to move task:', error)
      toast.error('Failed to move task')
      // Reload tasks on error to restore state
      const response = await storiesApiService.getStories(projectId, 1, 100)
      setTasks(response.items)
    }
  }, [columns, projectId])

  const handleTaskEdit = (task: KanbanTask) => {
    setSelectedTask(task)
    setShowTaskDialog(true)
  }

  const handleTaskUpdate = async (updatedTask: any) => {
    try {
      // Convert Task data to Story format for API (similar to TasksView)
      const storyUpdateData = {
        title: updatedTask.title,
        description: updatedTask.description,
        story_type: updatedTask.story_type,
        priority: updatedTask.priority,
        status: updatedTask.status,
        sprint_id: updatedTask.sprint_id || undefined,
        assignee_id: updatedTask.assignee_id || undefined,
        progress: updatedTask.progress || 0,
        start_date: updatedTask.start_date,
        end_date: updatedTask.end_date || updatedTask.due_date,
        tags: updatedTask.tags || [],
        labels: updatedTask.tags || [],
        acceptance_criteria: updatedTask.acceptance_criteria?.filter((c: string) => c.trim() !== '') || [],
        comments: updatedTask.comments || [],
        attached_files: updatedTask.attachments || []  // API expects 'attached_files', not 'attachments'
      }

      // Update task via API
      await storiesApiService.updateStory(updatedTask.id, storyUpdateData)

      // Update local state
      setColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.map(task =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          )
        }))
      )

      // Update tasks state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        )
      )

      setShowTaskDialog(false)
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      await storiesApiService.deleteStory(taskId)

      // Update local state
      setColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.filter(task => task.id !== taskId)
        }))
      )

      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleLogTime = (task: KanbanTask) => {
    setSelectedTaskForTimeLog(task)
    setLogTimeData({
      hours: '',
      description: '',
      activityType: 'development'
    })
    setShowLogTimeDialog(true)
  }

  const handleSubmitLogTime = async () => {
    if (!selectedTaskForTimeLog || !logTimeData.hours) {
      toast.error('Please enter hours')
      return
    }

    const hours = parseFloat(logTimeData.hours)
    if (isNaN(hours) || hours <= 0) {
      toast.error('Please enter valid hours')
      return
    }

    try {
      await timesheetApiService.logTimeForTask(
        selectedTaskForTimeLog.id,
        hours,
        logTimeData.description,
        logTimeData.activityType
      )

      toast.success('Time logged successfully')
      setShowLogTimeDialog(false)
      setSelectedTaskForTimeLog(null)
      setLogTimeData({
        hours: '',
        description: '',
        activityType: 'development'
      })
    } catch (error) {
      console.error('Failed to log time:', error)
      toast.error('Failed to log time')
    }
  }

  const filteredColumns = columns.map(column => ({
    ...column,
    tasks: column.tasks.filter(task =>
      !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }))

  if (loading || masterLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading kanban board...</span>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Kanban Board</h2>
            <p className="text-muted-foreground">Drag and drop tasks to update their status</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowWipSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Board Statistics */}
        <div className="grid grid-cols-4 gap-4">
          {columns.map((column) => (
            <Card key={column.id}>
              <CardContent className="p-4 text-center">
                <div className={`w-3 h-3 rounded-full ${column.color} mx-auto mb-2`} />
                <div className="text-2xl font-semibold">{column.tasks.length}</div>
                <div className="text-xs text-muted-foreground">{column.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-350px)] min-h-[600px]">
          {filteredColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onTaskMove={handleTaskMove}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onLogTime={handleLogTime}
            />
          ))}
        </div>

        {/* WIP Settings Dialog */}
        <Dialog open={showWipSettings} onOpenChange={setShowWipSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Board Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable WIP Limits</Label>
                <Switch
                  checked={wipLimitsEnabled}
                  onCheckedChange={setWipLimitsEnabled}
                />
              </div>
              {wipLimitsEnabled && (
                <div className="space-y-4">
                  <Label>Column WIP Limits</Label>
                  {columns.map((column) => (
                    <div key={column.id} className="flex items-center justify-between">
                      <span className="text-sm">{column.title}</span>
                      <Input
                        type="number"
                        value={column.wipLimit || 0}
                        onChange={(e) => {
                          const newLimit = parseInt(e.target.value) || 0
                          setColumns(prevColumns =>
                            prevColumns.map(col =>
                              col.id === column.id ? { ...col, wipLimit: newLimit } : col
                            )
                          )
                        }}
                        className="w-20"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Task Edit Modal */}
        {selectedTask && (
          <TaskModal
            task={selectedTask}
            isOpen={showTaskDialog}
            onClose={() => setShowTaskDialog(false)}
            onUpdate={handleTaskUpdate}
            user={user}
            availableStatuses={masterData?.task_status}
            availablePriorities={masterData?.priorities}
            projectTeamMembers={projectTeamMembers}
            projectTeamLead={projectTeamLead}
            project={project}
          />
        )}

        {/* Log Time Dialog */}
        <Dialog open={showLogTimeDialog} onOpenChange={setShowLogTimeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Time</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Task</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTaskForTimeLog?.task_id || selectedTaskForTimeLog?.id}: {selectedTaskForTimeLog?.title}
                </p>
              </div>

              <div>
                <Label htmlFor="hours">Hours *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="Enter hours (e.g., 2.5)"
                  value={logTimeData.hours}
                  onChange={(e) => setLogTimeData({ ...logTimeData, hours: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="activityType">Activity Type *</Label>
                <Select
                  value={logTimeData.activityType}
                  onValueChange={(value) => setLogTimeData({ ...logTimeData, activityType: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="bug_fixing">Bug Fixing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description of work done..."
                  value={logTimeData.description}
                  onChange={(e) => setLogTimeData({ ...logTimeData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowLogTimeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitLogTime}>
                  Log Time
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  )
}