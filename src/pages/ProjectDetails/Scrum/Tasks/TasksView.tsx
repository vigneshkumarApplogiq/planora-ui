import React, { useState, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Target,
  AlertTriangle,
  Flag,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  GripVertical
} from 'lucide-react'
import { TaskModal } from './TaskModal'
import { taskApiService, Task, CreateTaskRequest } from '../../../../services/taskApi'
import { storiesApiService, Story } from '../../../../services/storiesApi'
import { sprintApiService, Sprint } from '../../../../services/sprintApi'
import { projectApiService, ProjectMastersResponse, ProjectStatusItem, ProjectPriorityItem, ProjectMember, ProjectMemberDetail } from '../../../../services/projectApi'
import { getEnrichedTeamMemberDetails, getAssigneeDisplayInfo, EnrichedMemberDetail } from '../../../../utils/teamMemberDetails'
import { toast } from 'sonner'
import { SessionStorageService } from '../../../../utils/sessionStorage'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'

interface TasksViewProps {
  projectId?: string
  user: any
  project?: any
}

const statusColumns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { id: 'review', title: 'In Review', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'done', title: 'Done', color: 'bg-green-100 text-green-800' }
]

export function TasksView({ projectId: propProjectId, user, project }: TasksViewProps) {
  // Get effective project ID from props or session storage
  const effectiveProjectId = SessionStorageService.getEffectiveProjectId(propProjectId)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [filterSprint, setFilterSprint] = useState('all')
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'table'>(project?.methodology === 'Kanban' ? 'list' : 'board')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTaskData, setCreateTaskData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    project_id: effectiveProjectId || '',
    sprint_id: null,
    assignee_id: null,
    start_date: '',
    due_date: '',
    progress: 0,
    tags: [],
    subtasks: [],
    comments: [],
    attachments: [],
    is_active: true
  })

  // Project Master Data
  const [projectMasters, setProjectMasters] = useState<ProjectMastersResponse | null>(null)
  const [availableStatuses, setAvailableStatuses] = useState<ProjectStatusItem[]>([])
  const [availablePriorities, setAvailablePriorities] = useState<ProjectPriorityItem[]>([])
  const [projectTeamMembers, setProjectTeamMembers] = useState<ProjectMemberDetail[]>([])
  const [projectTeamLead, setProjectTeamLead] = useState<ProjectMemberDetail | null>(null)
  const [enrichedMembersMap, setEnrichedMembersMap] = useState<Map<string, EnrichedMemberDetail>>(new Map())

  // Load team members from project data when available (same as BacklogView)
  useEffect(() => {
    if (project?.team_members_detail && project?.team_lead_detail) {
      setProjectTeamMembers(project.team_members_detail)
      setProjectTeamLead(project.team_lead_detail)

      // Load enriched member details
      loadEnrichedMemberDetails([...project.team_members_detail, project.team_lead_detail])
    }
  }, [project])

  // Update view mode based on methodology
  useEffect(() => {
    if (project?.methodology === 'Kanban') {
      setViewMode('list')
    }
  }, [project?.methodology])

  const loadEnrichedMemberDetails = async (members: ProjectMemberDetail[]) => {
    try {
      const enrichedMap = await getEnrichedTeamMemberDetails(members)
      setEnrichedMembersMap(enrichedMap)
    } catch (error) {
      console.error('Error loading enriched member details:', error)
    }
  }

  // Load tasks and sprints when component mounts or project changes
  useEffect(() => {
    if (effectiveProjectId) {
      fetchTasks()
      fetchSprints()
      loadProjectMasters()
    }
  }, [effectiveProjectId])

  // Refetch tasks when sprint filter changes (to trigger API calls)
  useEffect(() => {
    if (effectiveProjectId && filterSprint !== 'all') {
      fetchTasksWithSprintFilter(filterSprint)
    }
  }, [filterSprint, effectiveProjectId])

  const loadProjectMasters = async () => {
    if (!effectiveProjectId) {
      console.warn('No project ID available for fetching project masters')
      return
    }

    try {
     const masters = await projectApiService.getProjectMasters()
     
      setProjectMasters(masters)
      setAvailableStatuses(masters.statuses || [])
      setAvailablePriorities(masters.priorities || [])

    } catch (error) {
      console.error('❌ Error loading project masters:', error)
    }
  }


  const fetchTasks = async () => {
    if (!effectiveProjectId) {
      console.warn('No project ID available for fetching tasks')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Use stories API instead of tasks API
      const response = await storiesApiService.getStories(effectiveProjectId)

      // Convert Story data to Task format
      const convertedTasks: Task[] = response.items.map((story: Story) => ({
        id: story.id,
        task_id: story.task_id,
        title: story.title,
        description: story.description,
        status: story.status,
        priority: story.priority,
        project_id: story.project_id,
        sprint_id: story.sprint_id,
        sprint_name: story.sprint_id ? sprints.find(s => s.id === story.sprint_id)?.name : undefined,
        assignee_name: story.assignee_name,
        assignee_id: story.assignee_id,
        // Preserve nested assignee object for proper loading in TaskModal
        assignee: story.assignee,
        progress: story.progress || 0,
        tags: story.tags || [],
        subtasks: [],
        // Preserve comments from API response
        comments: story.comments || [],
        attachments: [],
        // Preserve files array from API response
        files: story.files,
        is_active: true,
        created_at: story.start_date,
        updated_at: story.end_date
      }))

      setTasks(convertedTasks)
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('Failed to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTasksWithSprintFilter = async (sprintFilter: string) => {
    if (!effectiveProjectId) {
      console.warn('No project ID available for fetching tasks')
      return
    }

    try {
      setLoading(true)
      // Use stories API with project filter - the API should handle sprint filtering on backend
      const response = await storiesApiService.getStories(effectiveProjectId)

      // Convert Story data to Task format
      const convertedTasks: Task[] = response.items.map((story: Story) => ({
        id: story.id,
        task_id: story.task_id,
        title: story.title,
        description: story.description,
        status: story.status,
        priority: story.priority,
        project_id: story.project_id,
        sprint_id: story.sprint_id,
        sprint_name: story.sprint_id ? sprints.find(s => s.id === story.sprint_id)?.name : undefined,
        assignee_name: story.assignee_name,
        assignee_id: story.assignee_id,
        // Preserve nested assignee object for proper loading in TaskModal
        assignee: story.assignee,
        progress: story.progress || 0,
        tags: story.tags || [],
        subtasks: [],
        // Preserve comments from API response
        comments: story.comments || [],
        attachments: [],
        // Preserve files array from API response
        files: story.files,
        is_active: true,
        created_at: story.start_date,
        updated_at: story.end_date
      }))

      setTasks(convertedTasks)
      toast.success(`Fetched tasks for sprint filter: ${sprintFilter}`)
    } catch (error) {
      console.error('Error fetching stories with sprint filter:', error)
      // Don't change tasks on error, let client-side filtering handle it
    } finally {
      setLoading(false)
    }
  }

  const fetchSprints = async () => {
    if (!effectiveProjectId) {
      console.warn('No project ID available for fetching sprints')
      return
    }

    try {
      const response = await sprintApiService.getSprints({ project_id: effectiveProjectId })
      setSprints(response.items)
    } catch (error) {
      console.error('Error fetching sprints:', error)
      toast.error('Failed to load sprints')
      setSprints([])
    }
  }

  const handleCreateTask = async () => {
    try {
      if (!createTaskData.title.trim()) {
        toast.error('Title is required')
        return
      }

      if (!effectiveProjectId) {
        toast.error('Project ID is required')
        return
      }

      // Convert Task data to Story format for API
      const storyData = {
        title: createTaskData.title,
        description: createTaskData.description,
        story_type: 'story',
        priority: createTaskData.priority,
        status: createTaskData.status,
        project_id: effectiveProjectId,
        sprint_id: createTaskData.sprint_id,
        assignee_id: createTaskData.assignee_id,
        progress: createTaskData.progress || 0,
        start_date: createTaskData.start_date,
        end_date: createTaskData.due_date,
        tags: createTaskData.tags || [],
        labels: createTaskData.tags || []
      }

      try {
        await storiesApiService.createStory(storyData)
        toast.success('Task created successfully')
      } catch (apiError) {
        // API not available, show demo message
        toast.success('Task creation demo (API not available)')
      }

      setShowCreateModal(false)
      setCreateTaskData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        project_id: effectiveProjectId || '',
        sprint_id: null,
        assignee_id: null,
        start_date: '',
        due_date: '',
        progress: 0,
        tags: [],
        subtasks: [],
        comments: [],
        attachments: [],
        is_active: true
      })
      fetchTasks()
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    try {
      // Convert Task data to Story format for API
      const storyUpdateData = {
        title: taskData.title,
        description: taskData.description,
        story_type: taskData.type || 'story',
        priority: taskData.priority,
        status: taskData.status,
        sprint_id: taskData.sprint_id || undefined,
        assignee_id: taskData.assignee_id || undefined,
        progress: taskData.progress || 0,
        tags: taskData.tags || [],
        labels: taskData.tags || [],
        comments: taskData.comments || []
      }

      try {
        await storiesApiService.updateStory(taskId, storyUpdateData)
        toast.success('Task updated successfully')
      } catch (apiError) {
        // API not available, update local state for demo
        const updatedTasks = tasks.map(task =>
          task.id === taskId ? { ...task, ...taskData } : task
        )
        setTasks(updatedTasks)
        toast.success('Task updated successfully (demo mode)')
      }

      setSelectedTask(null)
      fetchTasks() // Always refresh to get latest data
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApiService.deleteTask(taskId)
      toast.success('Task deleted successfully')
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    try {
      // Update via API
      await storiesApiService.updateStory(taskId, { status: newStatus })

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )
      toast.success('Task moved successfully')
    } catch (error) {
      console.error('❌ Failed to move task:', error)
      toast.error('Failed to move task')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'done': return 'bg-green-100 text-green-800 border-green-300'
      case 'blocked': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story': return <Target className="w-4 h-4 text-blue-600" />
      case 'bug': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'epic': return <Flag className="w-4 h-4 text-purple-600" />
      case 'task': return <CheckCircle className="w-4 h-4 text-green-600" />
      default: return <Target className="w-4 h-4 text-blue-600" />
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesAssignee = filterAssignee === 'all' ||
                           (filterAssignee === 'unassigned' && !task.assignee_name) ||
                           (task.assignee_name && task.assignee_name === filterAssignee)
    const matchesSprint = filterSprint === 'all' ||
                         (filterSprint === 'unassigned' && !task.sprint_id) ||
                         task.sprint_id === filterSprint

    return matchesSearch && matchesStatus && matchesAssignee && matchesSprint
  })

  // Constants for drag and drop
  const ITEM_TYPE = 'TASK'

  // Draggable Task Card Component
  const DraggableTaskCard = ({ task, columnId }: { task: Task; columnId: string }) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: ITEM_TYPE,
      item: () => {
        return {
          id: task.id,
          columnId: columnId,
          title: task.title
        }
      },
      end: (item, monitor) => {
        if (monitor.didDrop()) {
          console.log(`✅ Drop completed for task: ${item?.title || task.title}`)
        } else {
          console.log(`❌ Drop cancelled for task: ${item?.title || task.title}`)
        }
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }), [task.id, task.title, columnId])

    return (
      <div
        ref={dragRef}
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
        className="cursor-move select-none"
      >
        <Card
          className="hover:shadow-md transition-shadow mb-3 hover:bg-gray-50"
          onClick={() => setSelectedTask(task)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2 flex-1">
                <GripVertical className="w-4 h-4 text-gray-400 mt-1 cursor-grab" />
                <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="outline" className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
                {task.priority}
              </Badge>
              {task.progress > 0 && (
                <Badge variant="outline" className="text-xs">
                  {task.progress}%
                </Badge>
              )}
              {task.sprint_id && project?.methodology !== 'Kanban' && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                  {task.sprint_name || sprints.find(s => s.id === task.sprint_id)?.name || 'Sprint'}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {(() => {
                  const assigneeInfo = getAssigneeDisplayInfo(task.assignee_id || null, task.assignee_name || null, enrichedMembersMap)
                  return (
                    <>
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-[#28A745] text-white text-xs">
                          {assigneeInfo.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground truncate">
                          {assigneeInfo.name}
                        </span>
                        {assigneeInfo.isAssigned && assigneeInfo.role && (
                          <span className="text-[10px] text-muted-foreground/70 truncate">
                            {assigneeInfo.role}
                          </span>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{task.progress || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Static Task Card for non-draggable contexts
  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow mb-3"
      onClick={() => setSelectedTask(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-sm line-clamp-2 flex-1 pr-2">{task.title}</h4>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
            <MoreVertical className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
            {task.priority}
          </Badge>
          {task.progress > 0 && (
            <Badge variant="outline" className="text-xs">
              {task.progress}%
            </Badge>
          )}
          {task.sprint_id && project?.methodology !== 'Kanban' && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
              {task.sprint_name || sprints.find(s => s.id === task.sprint_id)?.name || 'Sprint'}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {(() => {
              const assigneeInfo = getAssigneeDisplayInfo(task.assignee_id || null, task.assignee_name || null, enrichedMembersMap)
              return (
                <>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-[#28A745] text-white text-xs">
                      {assigneeInfo.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground truncate">
                      {assigneeInfo.name}
                    </span>
                    {assigneeInfo.isAssigned && assigneeInfo.role && (
                      <span className="text-[10px] text-muted-foreground/70 truncate">
                        {assigneeInfo.role}
                      </span>
                    )}
                  </div>
                </>
              )
            })()}
          </div>

          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{task.progress || 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Droppable Column Component
  const DroppableColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: ITEM_TYPE,
      drop: (item: { id: string; columnId: string }) => {
        if (item.columnId !== column.id) {
          handleTaskMove(item.id, column.id)
        }
      },
      hover: (item: { id: string; columnId: string }) => {
        console.log(`👆 Hovering task ${item.id} over ${column.title}`)
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      })
    }), [column.id, column.title])

    return (
      <div key={column.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{column.title}</h3>
          <Badge variant="outline" className="text-xs">
            {tasks.length}
          </Badge>
        </div>

        <div
          ref={dropRef}
          className={`space-y-3 min-h-[400px] transition-all duration-200 rounded-lg p-2 ${
            isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400 shadow-inner' : ''
          }`}
        >
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} columnId={column.id} />
          ))}

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Drop tasks here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const BoardView = () => (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = filteredTasks.filter(task => task.status === column.id)
          return (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
            />
          )
        })}
      </div>
    </DndProvider>
  )

  const ListView = () => (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <Card
          key={task.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedTask(task)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1 truncate">{task.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(task.status)} style={{ fontSize: '10px' }}>
                    {task.status.replace('-', ' ')}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
                    {task.priority}
                  </Badge>
                  {task.progress > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {task.progress}%
                    </Badge>
                  )}
                  {task.sprint_id && project?.methodology !== 'Kanban' && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                      {task.sprint_name || sprints.find(s => s.id === task.sprint_id)?.name || 'Sprint'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {(() => {
                    const assigneeInfo = getAssigneeDisplayInfo(task.assignee_id || null, task.assignee_name || null, enrichedMembersMap)
                    return (
                      <>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-[#28A745] text-white text-xs">
                            {assigneeInfo.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-muted-foreground truncate">
                            {assigneeInfo.name}
                          </span>
                          {assigneeInfo.isAssigned && (
                            <div className="flex flex-col text-xs text-muted-foreground/70">
                              <span className="truncate">{assigneeInfo.role}</span>
                              {assigneeInfo.email && (
                                <span className="truncate">{assigneeInfo.email}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <p className="text-muted-foreground">Manage project tasks and user stories</p>
        </div>
        
        <Button
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {availableStatuses && availableStatuses.length > 0 ? (
                availableStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.name.toLowerCase()}>
                    {status.name}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {projectTeamMembers.length > 0 ? projectTeamMembers.map((member) => (
                <SelectItem key={member.id} value={member.name}>
                  {member.name}
                </SelectItem>
              )) : (
                Array.from(new Set(tasks.map(task => task.assignee_name).filter(Boolean))).map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

{/* Hide sprint filter for Kanban methodology */}
          {project?.methodology !== 'Kanban' && (
            <Select value={filterSprint} onValueChange={setFilterSprint}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

{/* Hide board view for Kanban methodology */}
        {project?.methodology !== 'Kanban' ? (
          <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'board' | 'list' | 'table')}>
            <TabsList>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div className="text-sm text-muted-foreground font-medium">
            List View
          </div>
        )}
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-[#007BFF] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#007BFF]">{tasks.filter(t => t.status === 'todo').length}</div>
            <div className="text-xs text-muted-foreground">To Do</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-[#FFC107] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#FFC107]">{tasks.filter(t => t.status === 'in-progress').length}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-[#28A745] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#28A745]">{tasks.filter(t => t.status === 'done').length}</div>
            <div className="text-xs text-muted-foreground">Done</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-5 h-5 text-[#DC3545] mr-2" />
            </div>
            <div className="text-2xl font-semibold text-[#DC3545]">{Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / Math.max(tasks.length, 1))}%</div>
            <div className="text-xs text-muted-foreground">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#28A745] mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first task.
              </p>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* For Kanban methodology, only show list view */}
            {project?.methodology === 'Kanban' ? (
              <ListView />
            ) : (
              <>
                {viewMode === 'board' && <BoardView />}
                {viewMode === 'list' && <ListView />}
              </>
            )}
          </>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            if (selectedTask?.id) {
              handleUpdateTask(selectedTask.id, updatedTask)
            }
          }}
          user={user}
          availableStatuses={availableStatuses}
          availablePriorities={availablePriorities}
          projectTeamMembers={projectTeamMembers}
          projectTeamLead={projectTeamLead || undefined}
        />
      )}

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={createTaskData.title}
                onChange={(e) => setCreateTaskData({ ...createTaskData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description"
                rows={3}
                value={createTaskData.description}
                onChange={(e) => setCreateTaskData({ ...createTaskData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={createTaskData.status}
                  onValueChange={(value: string) => setCreateTaskData({ ...createTaskData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses && availableStatuses.length > 0 ? (
                      availableStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.name.toLowerCase()}>
                          {status.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={createTaskData.priority}
                  onValueChange={(value: string) => setCreateTaskData({ ...createTaskData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePriorities && availablePriorities.length > 0 ? (
                      availablePriorities.map((priority) => (
                        <SelectItem key={priority.id} value={priority.name.toLowerCase()}>
                          {priority.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

{/* Sprint and Assignee - Hide sprint for Kanban methodology */}
            <div className={`grid gap-4 ${project?.methodology === 'Kanban' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {project?.methodology !== 'Kanban' && (
                <div>
                  <Label htmlFor="sprint">Sprint</Label>
                  <Select
                    value={createTaskData.sprint_id || 'unassigned'}
                    onValueChange={(value: string) => setCreateTaskData({
                      ...createTaskData,
                      sprint_id: value === 'unassigned' ? null : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={createTaskData.assignee_id || 'unassigned'}
                  onValueChange={(value: string) => {
                    if (value === 'unassigned') {
                      setCreateTaskData({
                        ...createTaskData,
                        assignee_id: null,
                        assignee_name: undefined
                      })
                    } else {
                      const selectedMember = projectTeamMembers.find(member => member.id === value)
                      setCreateTaskData({
                        ...createTaskData,
                        assignee_id: value,
                        assignee_name: selectedMember?.name || undefined
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {projectTeamMembers.length > 0 ? projectTeamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role_name}
                      </SelectItem>
                    )) : (
                      <SelectItem value="loading" disabled>Loading team members...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={createTaskData.start_date}
                  onChange={(e) => setCreateTaskData({ ...createTaskData, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={createTaskData.due_date}
                  onChange={(e) => setCreateTaskData({ ...createTaskData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={createTaskData.progress}
                onChange={(e) => setCreateTaskData({ ...createTaskData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={handleCreateTask}
                disabled={!createTaskData.title.trim()}
              >
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}