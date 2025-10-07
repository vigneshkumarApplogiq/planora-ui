import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Settings,
  Shield,
  Bell,
  Palette,
  Archive,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react'
import { projectApiService } from '../../services/projectApi'
import { toast } from 'sonner'

interface ProjectSettingsProps {
  project: any
  user: any
}

export function ProjectSettings({ project, user }: ProjectSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    methodology: '',
    status: '',
    priority: '',
    budget: 0,
    spent: 0,
    progress: 0,
    start_date: '',
    end_date: '',
    customer: '',
    customer_id: '',
    project_type: '',
    tags: [] as string[],
    color: '',
    team_lead_id: ''
  })

  const [tagInput, setTagInput] = useState('')

  const [permissions, setPermissions] = useState({
    publicProject: false,
    guestAccess: false,
    timeTracking: true,
    fileSharing: true,
    taskCreation: true
  })

  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    fileUploads: true,
    comments: true,
    mentions: true,
    deadlines: true,
    statusChanges: true
  })

  // Load project data on mount and when project changes
  useEffect(() => {
    if (project && project.id) {
      setProjectData({
        name: project.name || '',
        description: project.description || '',
        methodology: project.methodology || '',
        status: project.status || '',
        priority: project.priority || '',
        budget: project.budget || 0,
        spent: project.spent || 0,
        progress: project.progress || 0,
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        customer: project.customer || '',
        customer_id: project.customer_id || '',
        project_type: project.project_type || '',
        tags: project.tags || [],
        color: project.color || '',
        team_lead_id: project.team_lead_id || ''
      })
    }
  }, [project])

  const handleAddTag = () => {
    if (tagInput.trim() && !projectData.tags.includes(tagInput.trim())) {
      setProjectData({ ...projectData, tags: [...projectData.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setProjectData({
      ...projectData,
      tags: projectData.tags.filter(tag => tag !== tagToRemove)
    })
  }


  const methodologyOptions = [
    { value: 'agile', label: 'Agile' },
    { value: 'scrum', label: 'Scrum' },
    { value: 'kanban', label: 'Kanban' },
    { value: 'waterfall', label: 'Waterfall' },
    { value: 'hybrid', label: 'Hybrid' }
  ]

  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ]


  const handleSave = async () => {
    if (!project || !project.id) {
      toast.error('Project ID not found')
      return
    }

    // Validation
    if (!projectData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      setSaving(true)

      // Prepare update data
      const updateData = {
        name: projectData.name,
        description: projectData.description,
        methodology: projectData.methodology,
        status: projectData.status,
        priority: projectData.priority,
        budget: projectData.budget,
        spent: projectData.spent,
        progress: projectData.progress,
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        customer: projectData.customer,
        customer_id: projectData.customer_id,
        project_type: projectData.project_type,
        tags: projectData.tags,
        color: projectData.color,
        team_lead_id: projectData.team_lead_id
      }

      await projectApiService.updateProject(project.id, updateData)
      toast.success('Project settings updated successfully')

      // Refresh page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to update project:', error)
      toast.error('Failed to update project settings')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveProject = async () => {
    if (!project || !project.id) return

    if (!window.confirm('Are you sure you want to archive this project? It will be hidden from active projects.')) {
      return
    }

    try {
      await projectApiService.updateProject(project.id, { status: 'archived' })
      toast.success('Project archived successfully')
      setTimeout(() => {
        window.location.href = '/projects'
      }, 1500)
    } catch (error) {
      console.error('Failed to archive project:', error)
      toast.error('Failed to archive project')
    }
  }

  const handleDeleteProject = async () => {
    if (!project || !project.id) return

    const projectName = window.prompt(
      `This action cannot be undone. Type "${project.name}" to confirm deletion:`
    )

    if (projectName !== project.name) {
      if (projectName !== null) {
        toast.error('Project name does not match')
      }
      return
    }

    try {
      await projectApiService.deleteProject(project.id)
      toast.success('Project deleted successfully')
      setTimeout(() => {
        window.location.href = '/projects'
      }, 1500)
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Project Settings</h2>
          <p className="text-muted-foreground">Manage project configuration and team access</p>
        </div>
        
        <Button
          onClick={handleSave}
          className="bg-[#28A745] hover:bg-[#218838]"
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectData.name}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Input
                    id="customer"
                    value={projectData.customer}
                    onChange={(e) => setProjectData({ ...projectData, customer: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="methodology">Methodology</Label>
                  <Select
                    value={projectData.methodology}
                    onValueChange={(value: string) => setProjectData({ ...projectData, methodology: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {methodologyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={projectData.status}
                    onValueChange={(value: string) => setProjectData({ ...projectData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={projectData.priority}
                    onValueChange={(value: string) => setProjectData({ ...projectData, priority: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={projectData.start_date}
                    onChange={(e) => setProjectData({ ...projectData, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={projectData.end_date}
                    onChange={(e) => setProjectData({ ...projectData, end_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={projectData.budget}
                    onChange={(e) => setProjectData({ ...projectData, budget: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="spent">Spent ($)</Label>
                  <Input
                    id="spent"
                    type="number"
                    value={projectData.spent}
                    onChange={(e) => setProjectData({ ...projectData, spent: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={projectData.progress}
                    onChange={(e) => setProjectData({ ...projectData, progress: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project_type">Project Type</Label>
                  <Input
                    id="project_type"
                    value={projectData.project_type}
                    onChange={(e) => setProjectData({ ...projectData, project_type: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., Web Development, Mobile App"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Project Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="color"
                      type="color"
                      value={projectData.color || '#3b82f6'}
                      onChange={(e) => setProjectData({ ...projectData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={projectData.color || '#3b82f6'}
                      onChange={(e) => setProjectData({ ...projectData, color: e.target.value })}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {projectData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="permissions" className="space-y-6">
          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Project Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Project</Label>
                    <p className="text-sm text-muted-foreground">Allow anyone in the organization to view this project</p>
                  </div>
                  <Switch
                    checked={permissions.publicProject}
                    onCheckedChange={(checked: boolean) => setPermissions({ ...permissions, publicProject: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Guest Access</Label>
                    <p className="text-sm text-muted-foreground">Allow external users to access limited project data</p>
                  </div>
                  <Switch
                    checked={permissions.guestAccess}
                    onCheckedChange={(checked: boolean) => setPermissions({ ...permissions, guestAccess: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Time Tracking</Label>
                    <p className="text-sm text-muted-foreground">Allow team members to track time on tasks</p>
                  </div>
                  <Switch
                    checked={permissions.timeTracking}
                    onCheckedChange={(checked: boolean) => setPermissions({ ...permissions, timeTracking: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable File Sharing</Label>
                    <p className="text-sm text-muted-foreground">Allow team members to upload and share files</p>
                  </div>
                  <Switch
                    checked={permissions.fileSharing}
                    onCheckedChange={(checked: boolean) => setPermissions({ ...permissions, fileSharing: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Task Creation</Label>
                    <p className="text-sm text-muted-foreground">Allow team members to create new tasks</p>
                  </div>
                  <Switch
                    checked={permissions.taskCreation}
                    onCheckedChange={(checked: boolean) => setPermissions({ ...permissions, taskCreation: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when {key.replace(/([A-Z])/g, ' $1').toLowerCase()} occur
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, [key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Advanced Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Project Template</Label>
                  <p className="text-sm text-muted-foreground mb-2">Save this project as a template for future use</p>
                  <Button variant="outline">
                    <Archive className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Label>Export Project Data</Label>
                  <p className="text-sm text-muted-foreground mb-2">Download all project data as a backup</p>
                  <Button variant="outline">
                    Export Data
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Label>Archive Project</Label>
                  <p className="text-sm text-muted-foreground mb-2">Archive this project to hide it from active projects</p>
                  <Button variant="outline" onClick={handleArchiveProject}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Project
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Danger Zone</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Delete Project</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Permanently delete this project and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleDeleteProject}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}