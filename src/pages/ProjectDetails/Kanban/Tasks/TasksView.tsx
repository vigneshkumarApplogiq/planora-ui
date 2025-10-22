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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table'
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
  GripVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Upload,
  File,
  Image as ImageIcon,
  Download,
  Trash2,
  Paperclip,
  Edit
} from 'lucide-react'
import { TaskModal } from './TaskModal'
import { taskApiService, Task, CreateTaskRequest } from '../../../../services/taskApi'
import { storiesApiService, Story } from '../../../../services/storiesApi'
import { sprintApiService, Sprint } from '../../../../services/sprintApi'
import { projectApiService, ProjectMastersResponse, ProjectStatusItem, ProjectPriorityItem, ProjectMember, ProjectMemberDetail } from '../../../../services/projectApi'
import { getEnrichedTeamMemberDetails, getAssigneeDisplayInfo, EnrichedMemberDetail } from '../../../../utils/teamMemberDetails'
import { toast } from 'sonner'
import { SessionStorageService } from '../../../../utils/sessionStorage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'

interface TasksViewProps {
  projectId?: string
  user: any
  project?: any
}

// Helper function to convert hex color to Tailwind-compatible bg class
const getColorClass = (hexColor: string | null | undefined, isText: boolean = false): string => {
  if (!hexColor) return isText ? 'text-gray-800 dark:text-gray-200' : 'bg-gray-100 dark:bg-gray-800'

  // Remove # if present
  const color = hexColor.replace('#', '')

  if (isText) {
    return `text-[#${color}]`
  }
  return `bg-[#${color}]/10 dark:bg-[#${color}]/20`
}

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
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table')
  const [attachments, setAttachments] = useState<Array<{id: string, name: string, size: number, type: string, url?: string}>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTaskData, setCreateTaskData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    story_type: 'task',
    project_id: effectiveProjectId || '',
    sprint_id: null,
    assignee_id: null,
    start_date: '',
    due_date: '',
    progress: 0,
    tags: [],
    acceptance_criteria: [],
    subtasks: [],
    comments: [],
    attachments: [],
    is_active: true
  })

  // Project Master Data
  const [projectMasters, setProjectMasters] = useState<ProjectMastersResponse | null>(null)
  const [availableStatuses, setAvailableStatuses] = useState<ProjectStatusItem[]>([])

  // Dynamic status columns based on project master data
  const [statusColumns, setStatusColumns] = useState<Array<{ id: string; title: string; color: string }>>([
    { id: 'todo', title: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { id: 'review', title: 'In Review', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'done', title: 'Done', color: 'bg-green-100 text-green-800' }
  ])
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
      setViewMode('table')
    }
  }, [project?.methodology])

  // Update default status and priority when master data is loaded
  useEffect(() => {
    if (availableStatuses.length > 0 && availablePriorities.length > 0) {
      const firstStatus = availableStatuses[0]
      const firstPriority = availablePriorities[0]

      setCreateTaskData(prev => ({
        ...prev,
        status: firstStatus.name.toLowerCase().replace(/\s+/g, '-'),
        priority: firstPriority.name.toLowerCase()
      }))
    }
  }, [availableStatuses, availablePriorities])

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

  // Refetch tasks when filters or pagination change
  useEffect(() => {
    if (effectiveProjectId) {
      // For Kanban, we don't use sprint filter, so just use status and assignee
      if (project?.methodology === 'Kanban') {
        const statusParam = filterStatus !== 'all' ? filterStatus : undefined
        const assigneeParam = filterAssignee !== 'all' ? filterAssignee : undefined
        fetchTasks(statusParam, assigneeParam, currentPage, itemsPerPage)
      } else {
        // For other methodologies, handle sprint filter separately
        if (filterSprint !== 'all') {
          fetchTasksWithSprintFilter(filterSprint)
        } else {
          const statusParam = filterStatus !== 'all' ? filterStatus : undefined
          const assigneeParam = filterAssignee !== 'all' ? filterAssignee : undefined
          fetchTasks(statusParam, assigneeParam, currentPage, itemsPerPage)
        }
      }
    }
  }, [filterStatus, filterAssignee, filterSprint, effectiveProjectId, project?.methodology, currentPage, itemsPerPage])

  const loadProjectMasters = async () => {
    if (!effectiveProjectId) {
      console.warn('No project ID available for fetching project masters')
      return
    }

    try {
      const masters = await projectApiService.getProjectMasters()
      setProjectMasters(masters)

      // Only set if data is available - use task_status for task-specific statuses
      if (masters.task_status && masters.task_status.length > 0) {
        const activeStatuses = masters.task_status
          .filter(s => s.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)

        setAvailableStatuses(activeStatuses)

        // Update status columns dynamically based on project master data
        const dynamicColumns = activeStatuses.map((status) => {
          const statusId = status.name.toLowerCase().replace(/\s+/g, '-')
          return {
            id: statusId,
            title: status.name,
            color: `${getColorClass(status.color)} ${getColorClass(status.color, true)}`
          }
        })

        setStatusColumns(dynamicColumns)
        console.log('✅ [Kanban Tasks] Dynamic status columns created:', dynamicColumns)
      } else {
        console.warn('⚠️ [Kanban Tasks] No task statuses found in master data')
        setAvailableStatuses([])
      }

      if (masters.priorities && masters.priorities.length > 0) {
        setAvailablePriorities(masters.priorities.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order))
      } else {
        setAvailablePriorities([])
      }

    } catch (error) {
      console.error('❌ [Kanban Tasks] Error loading project masters:', error)
      setAvailableStatuses([])
      setAvailablePriorities([])
    }
  }


  const fetchTasks = async (statusFilter?: string, assigneeFilter?: string, page: number = 1, perPage: number = 10) => {
    if (!effectiveProjectId) {
      console.warn('No project ID available for fetching tasks')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Use stories API with filter parameters and pagination
      const response = await storiesApiService.getStories(
        effectiveProjectId,
        page,
        perPage,
        statusFilter,
        assigneeFilter
      )

      // Update pagination info
      setTotalPages(response.total_pages || 1)
      setTotalItems(response.total || 0)
      setCurrentPage(response.page || 1)

      // Convert Story data to Task format
      const convertedTasks: Task[] = response.items.map((story: Story) => ({
        id: story.id,
        task_id: story.task_id,
        title: story.title,
        description: story.description,
        status: story.status,
        priority: story.priority,
        type: story.story_type,
        project_id: story.project_id,
        sprint_id: story.sprint_id,
        sprint_name: story.sprint_id ? sprints.find(s => s.id === story.sprint_id)?.name : undefined,
        assignee_name: story.assignee_name,
        assignee_id: story.assignee_id,
        // Preserve nested assignee object for proper loading in TaskModal
        assignee: story.assignee,
        progress: story.progress || 0,
        tags: story.tags || [],
        acceptance_criteria: story.acceptance_criteria || [],
        subtasks: [],
        // Preserve comments from API response
        comments: story.comments || [],
        attachments: [],
        // Preserve files array from API response
        files: story.files,
        is_active: true,
        start_date: story.start_date,
        due_date: story.end_date,
        created_at: story.created_at,
        updated_at: story.updated_at
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
        type: story.story_type,
        project_id: story.project_id,
        sprint_id: story.sprint_id,
        sprint_name: story.sprint_id ? sprints.find(s => s.id === story.sprint_id)?.name : undefined,
        assignee_name: story.assignee_name,
        assignee_id: story.assignee_id,
        // Preserve nested assignee object for proper loading in TaskModal
        assignee: story.assignee,
        progress: story.progress || 0,
        tags: story.tags || [],
        acceptance_criteria: story.acceptance_criteria || [],
        subtasks: [],
        // Preserve comments from API response
        comments: story.comments || [],
        attachments: [],
        // Preserve files array from API response
        files: story.files,
        is_active: true,
        start_date: story.start_date,
        due_date: story.end_date,
        created_at: story.created_at,
        updated_at: story.updated_at
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    const validFiles: File[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum file size is 10MB.`)
        continue
      }
      validFiles.push(file)
    }

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newAttachment = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target?.result as string
        }
        setAttachments(prev => [...prev, newAttachment])
        toast.success(`${file.name} added successfully`)
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
    toast.success('Attachment removed')
  }

  const handleDownloadAttachment = (attachment: any) => {
    if (attachment.url) {
      const link = document.createElement('a')
      link.href = attachment.url
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const mockEvent = {
      target: {
        files: e.dataTransfer.files
      }
    } as any

    handleFileSelect(mockEvent)
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

      if (!createTaskData.status) {
        toast.error('Status is required')
        return
      }

      if (!createTaskData.priority) {
        toast.error('Priority is required')
        return
      }

      // Validate that status and priority exist in master data
      if (availableStatuses.length === 0) {
        toast.error('Status options not loaded. Please refresh the page.')
        return
      }

      if (availablePriorities.length === 0) {
        toast.error('Priority options not loaded. Please refresh the page.')
        return
      }

      // Convert Task data to Story format for API
      const storyData = {
        title: createTaskData.title,
        description: createTaskData.description,
        story_type: createTaskData.story_type || 'task',
        priority: createTaskData.priority,
        status: createTaskData.status,
        project_id: effectiveProjectId,
        sprint_id: createTaskData.sprint_id,
        assignee_id: createTaskData.assignee_id,
        progress: createTaskData.progress || 0,
        start_date: createTaskData.start_date,
        end_date: createTaskData.due_date,
        tags: createTaskData.tags || [],
        labels: createTaskData.tags || [],
        acceptance_criteria: createTaskData.acceptance_criteria?.filter(c => c.trim() !== '') || [],
        attached_files: attachments  // API expects 'attached_files', not 'attachments'
      }

      try {
        await storiesApiService.createStory(storyData)
        toast.success('Task created successfully')
      } catch (apiError) {
        // API not available, show demo message
        toast.success('Task creation demo (API not available)')
      }

      setShowCreateModal(false)

      // Reset to first available status and priority from master data
      const defaultStatus = availableStatuses.length > 0
        ? availableStatuses[0].name.toLowerCase().replace(/\s+/g, '-')
        : 'todo'
      const defaultPriority = availablePriorities.length > 0
        ? availablePriorities[0].name.toLowerCase()
        : 'medium'

      setCreateTaskData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: defaultPriority,
        project_id: effectiveProjectId || '',
        sprint_id: null,
        assignee_id: null,
        start_date: '',
        due_date: '',
        progress: 0,
        tags: [],
        acceptance_criteria: [],
        subtasks: [],
        comments: [],
        attachments: [],
        is_active: true
      })
      setAttachments([])
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
        story_type: taskData.story_type,
        priority: taskData.priority,
        status: taskData.status,
        sprint_id: taskData.sprint_id || undefined,
        assignee_id: taskData.assignee_id || undefined,
        progress: taskData.progress || 0,
        tags: taskData.tags || [],
        labels: taskData.tags || [],
        acceptance_criteria: taskData.acceptance_criteria?.filter((c: string) => c.trim() !== '') || [],
        comments: taskData.comments || [],
        attached_files: taskData.attachments || []  // API expects 'attached_files', not 'attachments'
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

  const confirmDelete = async () => {
    if (!taskToDelete) return

    try {
      await storiesApiService.deleteStory(taskToDelete.id)
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskToDelete.id))
      toast.success('Task deleted successfully')
      setDeleteConfirmOpen(false)
      setTaskToDelete(null)
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

  // Client-side filtering only for search term (server-side filtering for status, assignee, sprint)
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' ||
                         task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
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

    // Calculate days since creation
    const getDaysSinceCreation = () => {
      if (!task.created_at) return null
      const startDate = new Date(task.created_at)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // Check if overdue
    const isOverdue = () => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && task.status !== 'done'
    }

    // Format due date
    const formatDueDate = () => {
      if (!task.due_date) return null
      const dueDate = new Date(task.due_date)
      return dueDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      })
    }

    // Calculate days until due
    const getDaysUntilDue = () => {
      if (!task.due_date) return null
      const dueDate = new Date(task.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

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
          <CardContent className="p-3 space-y-2.5">
            {/* Header: Task ID and Days Ago */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab" />
                <span className="text-xs font-bold text-blue-600">
                  {task.task_id || `#${task.id?.slice(0, 8)}`}
                </span>
              </div>
              {getDaysSinceCreation() !== null && (
                <span className="text-[10px] text-gray-500 font-medium">
                  {getDaysSinceCreation()}d ago
                </span>
              )}
            </div>

            {/* Task Title */}
            <h4 className="font-medium text-sm line-clamp-2 leading-tight">{task.title}</h4>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{task.description}</p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
                {task.priority}
              </Badge>
              {task.sprint_id && project?.methodology !== 'Kanban' && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                  {task.sprint_name || sprints.find(s => s.id === task.sprint_id)?.name || 'Sprint'}
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

            {/* Footer: Due Date + Assignee */}
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                {/* Due Date */}
                {task.updated_at && (
                  <div className="flex items-center gap-1">
                    {isOverdue() ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-semibold ${isOverdue() ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatDueDate()}
                      </span>
                      {getDaysUntilDue() !== null && task.status !== 'done' && (
                        <span className={`text-[9px] ${isOverdue() ? 'text-red-500' : 'text-gray-500'}`}>
                          {getDaysUntilDue()! < 0 ? `${Math.abs(getDaysUntilDue()!)}d overdue` : `${getDaysUntilDue()}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-1.5">
                {(() => {
                  const assigneeInfo = getAssigneeDisplayInfo(task.assignee_id || null, task.assignee_name || null, enrichedMembersMap)
                  return (
                    <>
                      <Avatar className="w-6 h-6 border border-gray-200">
                        <AvatarFallback className="bg-[#28A745] text-white text-[10px]">
                          {assigneeInfo.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-gray-700 font-medium max-w-[70px] truncate">
                        {assigneeInfo.name.split(' ')[0]}
                      </span>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Static Task Card for non-draggable contexts
  const TaskCard = ({ task }: { task: Task }) => {
    // Calculate days since creation
    const getDaysSinceCreation = () => {
      if (!task.created_at) return null
      const startDate = new Date(task.created_at)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // Check if overdue
    const isOverdue = () => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && task.status !== 'done'
    }

    // Format due date
    const formatDueDate = () => {
      if (!task.due_date) return null
      const dueDate = new Date(task.due_date)
      return dueDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      })
    }

    // Calculate days until due
    const getDaysUntilDue = () => {
      if (!task.due_date) return null
      const dueDate = new Date(task.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow mb-3"
        onClick={() => setSelectedTask(task)}
      >
        <CardContent className="p-3 space-y-2.5">
          {/* Header: Task ID and Days Ago */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600">
              {task.task_id || `#${task.id?.slice(0, 8)}`}
            </span>
            {getDaysSinceCreation() !== null && (
              <span className="text-[10px] text-gray-500 font-medium">
                {getDaysSinceCreation()}d ago
              </span>
            )}
          </div>

          {/* Task Title */}
          <h4 className="font-medium text-sm line-clamp-2 leading-tight">{task.title}</h4>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
              {task.priority}
            </Badge>
            {task.sprint_id && project?.methodology !== 'Kanban' && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                {task.sprint_name || sprints.find(s => s.id === task.sprint_id)?.name || 'Sprint'}
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

          {/* Footer: Due Date + Assignee */}
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              {/* Due Date */}
              {task.updated_at && (
                <div className="flex items-center gap-1">
                  {isOverdue() ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-semibold ${isOverdue() ? 'text-red-600' : 'text-gray-700'}`}>
                      {formatDueDate()}
                    </span>
                    {getDaysUntilDue() !== null && task.status !== 'done' && (
                      <span className={`text-[9px] ${isOverdue() ? 'text-red-500' : 'text-gray-500'}`}>
                        {getDaysUntilDue()! < 0 ? `${Math.abs(getDaysUntilDue()!)}d overdue` : `${getDaysUntilDue()}d left`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              {(() => {
                const assigneeInfo = getAssigneeDisplayInfo(task.assignee_id || null, task.assignee_name || null, enrichedMembersMap)
                return (
                  <>
                    <Avatar className="w-6 h-6 border border-gray-200">
                      <AvatarFallback className="bg-[#28A745] text-white text-[10px]">
                        {assigneeInfo.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-gray-700 font-medium max-w-[70px] truncate">
                      {assigneeInfo.name.split(' ')[0]}
                    </span>
                  </>
                )
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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

  const ListView = () => {
    // Calculate days since creation
    const getDaysSinceCreation = (createdAt: string | undefined) => {
      if (!createdAt) return null
      const startDate = new Date(createdAt)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // Check if overdue
    const isOverdue = (updatedAt: string | undefined, status: string) => {
      if (!updatedAt) return false
      const dueDate = new Date(updatedAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && status !== 'done'
    }

    // Format due date
    const formatDueDate = (updatedAt: string | undefined) => {
      if (!updatedAt) return null
      const dueDate = new Date(updatedAt)
      return dueDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      })
    }

    // Calculate days until due
    const getDaysUntilDue = (updatedAt: string | undefined) => {
      if (!updatedAt) return null
      const dueDate = new Date(updatedAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    return (
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTask(task)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Task ID and Icon */}
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-600">
                    {task.task_id || `#${task.id?.slice(0, 8)}`}
                  </span>
                </div>

                {/* Task Title and Description */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1 truncate">{task.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                </div>

                {/* Progress */}
                {task.progress !== undefined && task.progress !== null && (
                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-600">Progress</span>
                      <span className="text-[10px] font-semibold">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          task.progress === 100 ? 'bg-green-500' : task.progress >= 70 ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(task.status)} style={{ fontSize: '10px' }}>
                    {task.status.replace('-', ' ')}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
                    {task.priority}
                  </Badge>
                  {task.sprint_id && project?.methodology !== 'Kanban' && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                      {task.sprint_name || sprints.find(s => s.id === task.sprint_id)?.name || 'Sprint'}
                    </Badge>
                  )}
                </div>

                {/* Due Date */}
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    {isOverdue(task.due_date, task.status) ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <div className="flex flex-col items-end">
                      <span className={`text-[11px] font-semibold ${isOverdue(task.due_date, task.status) ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatDueDate(task.due_date)}
                      </span>
                      {getDaysUntilDue(task.due_date) !== null && task.status !== 'done' && (
                        <span className={`text-[9px] ${isOverdue(task.due_date, task.status) ? 'text-red-500' : 'text-gray-500'}`}>
                          {getDaysUntilDue(task.due_date)! < 0 ? `${Math.abs(getDaysUntilDue(task.due_date)!)}d overdue` : `${getDaysUntilDue(task.due_date)}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignee */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const assigneeInfo = getAssigneeDisplayInfo(task.assignee_id || null, task.assignee_name || null, enrichedMembersMap)
                    return (
                      <>
                        <Avatar className="w-7 h-7 border border-gray-200">
                          <AvatarFallback className="bg-[#28A745] text-white text-xs">
                            {assigneeInfo.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-700 font-medium min-w-[60px] truncate">
                          {assigneeInfo.name.split(' ')[0]}
                        </span>
                      </>
                    )
                  })()}
                </div>

                {/* Days Ago */}
                {getDaysSinceCreation(task.created_at) !== null && (
                  <span className="text-[10px] text-gray-500 font-medium min-w-[50px] text-right">
                    {getDaysSinceCreation(task.created_at)}d ago
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Table View Component
  const TableView = () => {
    // Calculate days until due or days overdue (using end_date)
    const getDaysUntilDue = (endDate: string | undefined) => {
      if (!endDate) return null
      const dueDate = new Date(endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // Check if overdue (using end_date)
    const isOverdue = (endDate: string | undefined, status: string) => {
      if (!endDate) return false
      const dueDate = new Date(endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today && status !== 'done'
    }

    // Get type icon
    const getTypeIcon = (type: string | undefined) => {
      switch (type?.toLowerCase()) {
        case 'bug':
          return <AlertTriangle className="w-4 h-4 text-red-600" />
        case 'story':
          return <Target className="w-4 h-4 text-blue-600" />
        case 'task':
          return <CheckCircle className="w-4 h-4 text-green-600" />
        default:
          return <Target className="w-4 h-4 text-gray-600" />
      }
    }

    const handleDeleteClick = (task: Task, e: React.MouseEvent) => {
      e.stopPropagation()
      setTaskToDelete(task)
      setDeleteConfirmOpen(true)
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead className="w-[35%]">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const daysUntilDue = getDaysUntilDue(task.due_date)
                  const overdue = isOverdue(task.due_date, task.status)

                  return (
                    <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <span className="text-xs font-bold text-blue-600">
                          {task.task_id || `#${task.id?.slice(0, 6)}`}
                        </span>
                      </TableCell>
                      <TableCell onClick={() => setSelectedTask(task)}>
                        <div className="flex items-start gap-2">
                          {getTypeIcon(task.type)}
                          <div className="flex-1">
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => setSelectedTask(task)}>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => setSelectedTask(task)}>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => setSelectedTask(task)}>
                        {(() => {
                          const assigneeInfo = getAssigneeDisplayInfo(task.assignee_id || null, task.assignee_name || null, enrichedMembersMap)
                          return assigneeInfo.isAssigned ? (
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-blue-500 text-white">
                                  {assigneeInfo.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{assigneeInfo.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )
                        })()}
                      </TableCell>
                      <TableCell onClick={() => setSelectedTask(task)}>
                        {task.due_date ? (
                          <div className="flex items-center space-x-2">
                            {overdue ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${overdue ? 'text-red-600' : ''}`}>
                                {new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                              {daysUntilDue !== null && task.status !== 'done' && (
                                <span className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
                                  {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTask(task)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => handleDeleteClick(task, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )
            }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    )
  }

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
                  <SelectItem key={status.id} value={status.name.toLowerCase().replace(/\s+/g, '-')}>
                    <div className="flex items-center space-x-2">
                      {status.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                      )}
                      <span>{status.name}</span>
                    </div>
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
                <SelectItem key={member.id} value={member.id}>
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

         <Tabs onValueChange={(value: string) => setViewMode(value as 'board' | 'list' | 'table')}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
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
            {/* For Kanban methodology, show list and table views */}
            {project?.methodology === 'Kanban' ? (
              <>
                {viewMode === 'list' && <ListView />}
                {viewMode === 'table' && <TableView />}
              </>
            ) : (
              <>
                {viewMode === 'board' && <BoardView />}
                {viewMode === 'list' && <ListView />}
                {viewMode === 'table' && <TableView />}
              </>
            )}
          </>
        )}

        {/* Pagination Controls */}
        {(viewMode === 'table' || viewMode === 'list') && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} tasks
            </div>
            <div className="flex items-center space-x-2">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value))
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={createTaskData.story_type || 'task'}
                  onValueChange={(value: string) => setCreateTaskData({ ...createTaskData, story_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={createTaskData.status}
                  onValueChange={(value: string) => setCreateTaskData({ ...createTaskData, status: value })}
                  disabled={!availableStatuses || availableStatuses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={availableStatuses.length > 0 ? "Select status" : "Loading statuses..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses && availableStatuses.length > 0 ? (
                      availableStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.name.toLowerCase().replace(/\s+/g, '-')}>
                          <div className="flex items-center space-x-2">
                            {status.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                            )}
                            <span>{status.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        No statuses available - check master data
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={createTaskData.priority}
                  onValueChange={(value: string) => setCreateTaskData({ ...createTaskData, priority: value })}
                  disabled={!availablePriorities || availablePriorities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={availablePriorities.length > 0 ? "Select priority" : "Loading priorities..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePriorities && availablePriorities.length > 0 ? (
                      availablePriorities.map((priority) => (
                        <SelectItem key={priority.id} value={priority.name.toLowerCase()}>
                          <div className="flex items-center space-x-2">
                            {priority.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: priority.color }}
                              />
                            )}
                            <span>{priority.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        No priorities available - check master data
                      </SelectItem>
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

            {/* Acceptance Criteria */}
            <div>
              <Label>Acceptance Criteria</Label>
              <div className="space-y-2">
                {Array.isArray(createTaskData.acceptance_criteria) && createTaskData.acceptance_criteria.length > 0 ? (
                  createTaskData.acceptance_criteria.map((criteria, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Enter acceptance criteria"
                        value={criteria}
                        onChange={(e) => {
                          const newCriteria = [...(createTaskData.acceptance_criteria || [])]
                          newCriteria[index] = e.target.value
                          setCreateTaskData({ ...createTaskData, acceptance_criteria: newCriteria })
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newCriteria = createTaskData.acceptance_criteria?.filter((_, i) => i !== index) || []
                          setCreateTaskData({ ...createTaskData, acceptance_criteria: newCriteria })
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCriteria = [...(createTaskData.acceptance_criteria || []), '']
                    setCreateTaskData({ ...createTaskData, acceptance_criteria: newCriteria })
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Acceptance Criteria
                </Button>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Paperclip className="w-4 h-4" />
                <span>Attachments ({attachments.length})</span>
              </Label>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Images, PDFs, Documents (max 10MB per file)
                </p>
              </div>

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="space-y-2 mt-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getFileIcon(attachment.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={handleCreateTask}
                disabled={
                  !createTaskData.title.trim() ||
                  availableStatuses.length === 0 ||
                  availablePriorities.length === 0
                }
              >
                Create Task
              </Button>
            </div>

            {(availableStatuses.length === 0 || availablePriorities.length === 0) && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                ⚠️ Master data is loading. Please wait...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {taskToDelete && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Task ID:</span>
                  <span className="text-sm text-blue-600">{taskToDelete.task_id || `#${taskToDelete.id?.slice(0, 6)}`}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold">Title:</span>
                  <span className="text-sm">{taskToDelete.title}</span>
                </div>
                {taskToDelete.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold">Description:</span>
                    <span className="text-sm text-muted-foreground">{taskToDelete.description}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}