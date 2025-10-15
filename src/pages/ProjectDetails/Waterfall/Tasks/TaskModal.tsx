import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Badge } from '../../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { Label } from '../../../../components/ui/label'
import {
  Clock,
  Calendar,
  User,
  Tag,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Save,
  X,
  Plus,
  Upload,
  File,
  Image as ImageIcon,
  Download,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { ProjectStatusItem, ProjectPriorityItem, ProjectMemberDetail } from '../../../../services/projectApi'
import { Phase } from '../../../../services/phaseApi'
import { Milestone } from '../../../../services/milestoneApi'
import { Deliverable } from '../../../../services/deliverableApi'
import { LogHoursDialog } from '../../../../components/common/LogHoursDialog'

interface TaskModalProps {
  task: any
  isOpen: boolean
  onClose: () => void
  onUpdate: (task: any) => void
  user: any
  availableStatuses?: ProjectStatusItem[]
  availablePriorities?: ProjectPriorityItem[]
  projectTeamMembers?: ProjectMemberDetail[]
  projectTeamLead?: ProjectMemberDetail
  phases?: Phase[]
  milestones?: Milestone[]
  deliverables?: Deliverable[]
  project?: any
}

const statusOptions = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'review', label: 'In Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800' }
]

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  { value: 'critical', label: 'Critical', color: 'bg-purple-100 text-purple-800' }
]

const typeOptions = [
  { value: 'story', label: 'User Story-2' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'epic', label: 'Epic' }
]

export function TaskModal({ task, isOpen, onClose, onUpdate, user, availableStatuses, availablePriorities, projectTeamMembers = [], projectTeamLead, phases = [], milestones = [], deliverables = [], project }: TaskModalProps) {
  const [editedTask, setEditedTask] = useState(task)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Array<{id: string, author_id: string, author_name: string, content: string, created_at: string}>>([])
  const [attachments, setAttachments] = useState<Array<{id: string, name: string, size: number, type: string, url?: string}>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showLogHoursDialog, setShowLogHoursDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update editedTask when task prop changes
  useEffect(() => {
    if (task) {
      // Normalize status to match the format expected by Select (lowercase-with-hyphens)
      const normalizedTask = {
        ...task,
        status: task.status ? task.status.toLowerCase().replace(/\s+/g, '-') : 'todo',
        priority: task.priority ? task.priority.toLowerCase().replace(/\s+/g, '-') : 'medium',
        // Extract assignee details from nested assignee object if it exists
        assignee_id: task.assignee?.id || task.assignee_id,
        assignee_name: task.assignee?.name || task.assignee_name
      }
      setEditedTask(normalizedTask)

      // Load comments if they exist
      if (task.comments && Array.isArray(task.comments)) {
        setComments(task.comments)
      } else {
        setComments([])
      }

      // Load attachments from 'files' field (API returns files, not attachments)
      if (task.files && Array.isArray(task.files)) {
        // Convert API file format to attachment format
        const convertedFiles = task.files.map((file: any) => ({
          id: file.id,
          name: file.original_filename || file.filename,
          size: file.file_size,
          type: file.content_type || '',
          url: file.file_path ? `/${file.file_path.replace(/\\/g, '/')}` : undefined
        }))
        setAttachments(convertedFiles)
      } else if (task.attachments && Array.isArray(task.attachments)) {
        setAttachments(task.attachments)
      } else {
        setAttachments([])
      }
    }
  }, [task])

  // Debug logging for project master data
  useEffect(() => {
  }, [isOpen, availableStatuses, availablePriorities, projectTeamMembers, editedTask])

  const handleSave = () => {
    // Include attachments and comments in the saved task
    onUpdate({
      ...editedTask,
      attachments: attachments,
      comments: comments
    })
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: `temp-${Date.now()}`, // Temporary ID, will be replaced by server
        author_id: user?.id || 'current-user',
        author_name: user?.name || 'Current User',
        content: newComment.trim(),
        created_at: new Date().toISOString()
      }
      setComments(prev => [...prev, newCommentObj])
      setNewComment('')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Validate file size (max 10MB per file)
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

    // Process valid files
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

    // Reset input
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

    // Create a mock event for handleFileSelect
    const mockEvent = {
      target: {
        files: e.dataTransfer.files
      }
    } as any

    handleFileSelect(mockEvent)
  }

  const getStatusColor = (status: string) => {
    // Try to find color from available statuses first
    if (availableStatuses && availableStatuses.length > 0) {
      const statusItem = availableStatuses.find(s => s.name.toLowerCase() === status.toLowerCase())
      if (statusItem && statusItem.color) {
        return `bg-[${statusItem.color}] text-white`
      }
    }

    // Fallback to static colors
    const option = statusOptions.find(opt => opt.value === status)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    // Try to find color from available priorities first
    if (availablePriorities && availablePriorities.length > 0) {
      const priorityItem = availablePriorities.find(p => p.name.toLowerCase() === priority.toLowerCase())
      if (priorityItem && priorityItem.color) {
        return `bg-[${priorityItem.color}] text-white`
      }
    }

    // Fallback to static colors
    const option = priorityOptions.find(opt => opt.value === priority)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Task Details{editedTask.task_id ? ` : ${editedTask.task_id}` : ''}</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getStatusColor(editedTask.status)}>
                {editedTask.status.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(editedTask.priority)}>
                {editedTask.priority} priority
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  placeholder="Add a description..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={editedTask.start_date ? new Date(editedTask.start_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={editedTask.end_date ? new Date(editedTask.end_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, end_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={editedTask.story_type || 'task'}
                    onValueChange={(value: string) => setEditedTask({ ...editedTask, story_type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={editedTask.progress || 0}
                    onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <Label>Acceptance Criteria</Label>
                <div className="space-y-2 mt-2">
                  {Array.isArray(editedTask.acceptance_criteria) && editedTask.acceptance_criteria.length > 0 ? (
                    editedTask.acceptance_criteria.map((criteria, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Enter acceptance criteria"
                          value={criteria}
                          onChange={(e) => {
                            const newCriteria = [...(editedTask.acceptance_criteria || [])]
                            newCriteria[index] = e.target.value
                            setEditedTask({ ...editedTask, acceptance_criteria: newCriteria })
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCriteria = editedTask.acceptance_criteria?.filter((_, i) => i !== index) || []
                            setEditedTask({ ...editedTask, acceptance_criteria: newCriteria })
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
                      const newCriteria = [...(editedTask.acceptance_criteria || []), '']
                      setEditedTask({ ...editedTask, acceptance_criteria: newCriteria })
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Acceptance Criteria
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Comments ({comments.length})</span>
              </h4>

              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
                <Button onClick={handleAddComment} size="sm" disabled={!newComment.trim()}>
                  Add Comment
                </Button>
              </div>

              {/* Existing Comments */}
              {comments.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-[#28A745] text-white text-xs">
                            {comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Priority */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedTask.status}
                  onValueChange={(value: string) => setEditedTask({ ...editedTask, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
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
                      statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`}></div>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={editedTask.priority}
                  onValueChange={(value: string) => setEditedTask({ ...editedTask, priority: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePriorities && availablePriorities.length > 0 ? (
                      availablePriorities.map((priority) => (
                        <SelectItem key={priority.id} value={priority.name.toLowerCase().replace(/\s+/g, '-')}>
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
                      priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-3 h-3" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignment */}
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={editedTask.assignee_id || 'unassigned'}
                onValueChange={(value: string) => {
                  if (value === 'unassigned') {
                    setEditedTask({
                      ...editedTask,
                      assignee_id: null,
                      assignee_name: null
                    })
                  } else {
                    const selectedMember = projectTeamMembers.find(member => member.id === value)
                    setEditedTask({
                      ...editedTask,
                      assignee_id: value,
                      assignee_name: selectedMember?.name || null
                    })
                  }
                }}
              >
                <SelectTrigger className="mt-1">
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

            {/* Phase */}
            <div className="space-y-2">
              <Label htmlFor="phase">Phase</Label>
              <Select
                value={editedTask.phase_id || 'unassigned'}
                onValueChange={(value: string) => {
                  // When phase changes, reset milestone and deliverable
                  setEditedTask({
                    ...editedTask,
                    phase_id: value === 'unassigned' ? null : value,
                    phase_name: value === 'unassigned' ? null : phases.find(p => p.id === value)?.name,
                    milestone_id: null,
                    milestone_name: null,
                    deliverable_id: null,
                    deliverable_name: null
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id || ''}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Milestone */}
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select
                value={editedTask.milestone_id || 'unassigned'}
                onValueChange={(value: string) => {
                  // When milestone changes, reset deliverable
                  setEditedTask({
                    ...editedTask,
                    milestone_id: value === 'unassigned' ? null : value,
                    milestone_name: value === 'unassigned' ? null : milestones.find(m => m.id === value)?.name,
                    deliverable_id: null,
                    deliverable_name: null
                  })
                }}
                disabled={!editedTask.phase_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={editedTask.phase_id ? "Select milestone" : "Select phase first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {milestones
                    .filter((milestone) => milestone.phase_id === editedTask.phase_id)
                    .map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id || ''}>
                        {milestone.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deliverable */}
            <div className="space-y-2">
              <Label htmlFor="deliverable">Deliverable</Label>
              <Select
                value={editedTask.deliverable_id || 'unassigned'}
                onValueChange={(value: string) => {
                  setEditedTask({
                    ...editedTask,
                    deliverable_id: value === 'unassigned' ? null : value,
                    deliverable_name: value === 'unassigned' ? null : deliverables.find(d => d.id === value)?.name
                  })
                }}
                disabled={!editedTask.milestone_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={editedTask.milestone_id ? "Select deliverable" : "Select milestone first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {deliverables
                    .filter((deliverable) => deliverable.milestone_id === editedTask.milestone_id)
                    .map((deliverable) => (
                      <SelectItem key={deliverable.id} value={deliverable.id || ''}>
                        {deliverable.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4" />
                <span>Attachments ({attachments.length})</span>
              </Label>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Images, PDFs, Documents (max 10MB)
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowLogHoursDialog(true)}
              className="text-[#007BFF] border-[#007BFF] hover:bg-[#007BFF]/10"
            >
              <Clock className="w-4 h-4 mr-1" />
              Log Hours
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#28A745] hover:bg-[#218838]">
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Log Hours Dialog */}
      <LogHoursDialog
        open={showLogHoursDialog}
        onOpenChange={setShowLogHoursDialog}
        projectId={project?.id || editedTask.project_id}
        taskId={editedTask.id || editedTask.task_id}
        taskName={editedTask.title}
        onSuccess={() => {
          toast.success('Time logged successfully')
        }}
      />
    </Dialog>
  )
}
