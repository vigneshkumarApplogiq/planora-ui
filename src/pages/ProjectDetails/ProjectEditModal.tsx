import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Card } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Separator } from '../../components/ui/separator'
import { Switch } from '../../components/ui/switch'
import { Calendar } from '../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { 
  CalendarIcon,
  X,
  Plus,
  Trash2,
  Save,
  Users,
  Settings,
  DollarSign,
  Calendar as CalendarDays,
  Target,
  FileText,
  AlertTriangle,
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe
} from 'lucide-react'
import { format } from 'date-fns@4.1.0'
import { cn } from '../../components/ui/utils'
import { toast } from 'sonner@2.0.3'

interface ProjectEditModalProps {
  isOpen: boolean
  onClose: () => void
  project: any
  onSave: (projectData: any) => void
  user?: any
}

// TODO: Replace with API data - customers should be fetched from customer API
// TODO: Replace with API data - team members should be fetched from user/team API
// TODO: Replace with API data - project types should be fetched from master data API
// TODO: Replace with API data - methodologies should be fetched from master data API
// TODO: Replace with API data - priorities should be fetched from master data API
// TODO: Replace with API data - statuses should be fetched from master data API

export function ProjectEditModal({ isOpen, onClose, project, onSave, user }: ProjectEditModalProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '',
    priority: '',
    methodology: '',
    type: '',
    startDate: new Date(),
    dueDate: new Date(),
    budget: 0,
    customer: '',
    owner: '',
    team: [] as any[],
    isPublic: true,
    notifications: true,
    autoArchive: false,
    version: '',
    tags: [] as string[],
    customFields: {} as Record<string, any>
  })
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'Planning',
        priority: project.priority || 'Medium',
        methodology: project.methodology || 'Scrum',
        type: project.type || 'Software Development',
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        dueDate: project.dueDate ? new Date(project.dueDate) : new Date(),
        budget: project.budget || 0,
        customer: project.customer || 'Internal',
        owner: project.owner || user?.name || '',
        team: project.team || [],
        isPublic: project.isPublic !== undefined ? project.isPublic : true,
        notifications: project.notifications !== undefined ? project.notifications : true,
        autoArchive: project.autoArchive !== undefined ? project.autoArchive : false,
        version: project.version || 'v1.0.0',
        tags: project.tags || [],
        customFields: project.customFields || {}
      })
    }
  }, [project, user])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddTeamMember = (member: any) => {
    if (!formData.team.find(m => m.id === member.id)) {
      setFormData(prev => ({
        ...prev,
        team: [...prev.team, member]
      }))
    }
  }

  const handleRemoveTeamMember = (memberId: number) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.filter(m => m.id !== memberId)
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      setIsLoading(false)
      return
    }
    
    if (!formData.description.trim()) {
      toast.error('Project description is required')
      setIsLoading(false)
      return
    }
    
    if (formData.dueDate <= formData.startDate) {
      toast.error('Due date must be after start date')
      setIsLoading(false)
      return
    }
    
    if (formData.budget < 0) {
      toast.error('Budget must be a positive number')
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const updatedProject = {
        ...project,
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name || 'Current User'
      }
      
      onSave(updatedProject)
      toast.success('Project updated successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to update project')
    } finally {
      setIsLoading(false)
    }
  }

  // TODO: Load available team members from API
  const availableMembers: any[] = []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Edit Project: {project?.name}</span>
          </DialogTitle>
          <DialogDescription>
            Update project details, manage team members, set timeline and budget, and configure project settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Team</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4" />
              <span>Timeline & Budget</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter project name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter project description"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={formData.customer} onValueChange={(value) => handleInputChange('customer', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load customers from API */}
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    placeholder="e.g., v1.0.0"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load statuses from master data API */}
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load priorities from master data API */}
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="methodology">Methodology</Label>
                  <Select value={formData.methodology} onValueChange={(value) => handleInputChange('methodology', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select methodology" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load methodologies from master data API */}
                      <SelectItem value="Scrum">Scrum</SelectItem>
                      <SelectItem value="Kanban">Kanban</SelectItem>
                      <SelectItem value="Waterfall">Waterfall</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Project Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load project types from master data API */}
                      <SelectItem value="Software Development">Software Development</SelectItem>
                      <SelectItem value="Web Application">Web Application</SelectItem>
                      <SelectItem value="Mobile Application">Mobile Application</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="owner">Project Owner</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => handleInputChange('owner', e.target.value)}
                    placeholder="Enter project owner name"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Current Team ({formData.team.length})</span>
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {formData.team.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No team members assigned</p>
                  ) : (
                    formData.team.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#007BFF] text-white text-sm">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Available Team Members</span>
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableMembers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">All team members are already assigned</p>
                  ) : (
                    availableMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#28A745] text-white text-sm">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                            <p className="text-xs text-muted-foreground">{member.department}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTeamMember(member)}
                          className="text-[#28A745] hover:text-[#28A745] hover:bg-[#28A745]/10"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>Timeline</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('startDate', date)
                              setShowStartDatePicker(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Popover open={showDueDatePicker} onOpenChange={setShowDueDatePicker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !formData.dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('dueDate', date)
                              setShowDueDatePicker(false)
                            }
                          }}
                          initialFocus
                          disabled={(date) => date <= formData.startDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="pt-2">
                    <Label className="text-muted-foreground">Duration</Label>
                    <p className="text-sm font-medium mt-1">
                      {Math.ceil((formData.dueDate.getTime() - formData.startDate.getTime()) / (1000 * 3600 * 24))} days
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="budget">Total Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                      placeholder="Enter budget amount"
                      className="mt-1"
                      min="0"
                      step="1000"
                    />
                  </div>

                  {project?.spent && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Budget Usage</span>
                        <span className="text-sm font-medium">
                          {project.spent ? Math.round((project.spent / formData.budget) * 100) : 0}%
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Spent:</span>
                          <span className="font-medium">${project.spent?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining:</span>
                          <span className="font-medium text-[#28A745]">
                            ${(formData.budget - (project.spent || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-4">
              <h3 className="font-medium mb-4 flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Project Settings</span>
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Public Project</Label>
                    <p className="text-sm text-muted-foreground">Allow all team members to view this project</p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email updates for project activities</p>
                  </div>
                  <Switch
                    checked={formData.notifications}
                    onCheckedChange={(checked) => handleInputChange('notifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Auto Archive</Label>
                    <p className="text-sm text-muted-foreground">Automatically archive completed projects after 30 days</p>
                  </div>
                  <Switch
                    checked={formData.autoArchive}
                    onCheckedChange={(checked) => handleInputChange('autoArchive', checked)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-4 flex items-center space-x-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone</span>
              </h3>
              <div className="space-y-4">
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">Archive Project</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Archive this project to hide it from active projects. Archived projects can be restored later.
                  </p>
                  <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                    Archive Project
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-[#28A745] hover:bg-[#218838]">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}