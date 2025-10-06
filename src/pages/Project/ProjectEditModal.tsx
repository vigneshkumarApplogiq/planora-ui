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
import { useAppDispatch } from '../../store/hooks'
import { updateProject } from '../../store/slices/projectSlice'
import { UpdateProjectRequest } from '../../services/projectApi'
import { customerApiService, Customer } from '../../services/customerApi'
import { userApiService, User } from '../../services/userApi'
import { useProjectMasters } from '../../hooks/useProjectMasters'
import { useProjectOwners } from '../../hooks/useProjectOwners'
import { useProjectMembers } from '../../hooks/useProjectMembers'
import { useFormik } from 'formik'
import * as Yup from 'yup'
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
import { getAssetUrl } from '../../config/api'

interface ProjectEditModalProps {
  isOpen: boolean
  onClose: () => void
  project: any
  onSave: (projectData: any) => void
  user?: any
}

export function ProjectEditModal({ isOpen, onClose, project, onSave, user }: ProjectEditModalProps) {
  const dispatch = useAppDispatch()
  const {
    data: projectMasters,
    loading: mastersLoading,
    error: mastersError
  } = useProjectMasters()

  const {
    data: projectOwners,
    loading: ownersLoading,
    error: ownersError
  } = useProjectOwners()

  const {
    data: projectMembers,
    loading: membersLoading,
    error: membersError
  } = useProjectMembers()

  // Customer state management
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Team members state management
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)

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

  // Formik validation schema - same as create project
  const projectValidationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Project name is required')
      .min(3, 'Project name must be at least 3 characters')
      .max(100, 'Project name must be at most 100 characters'),
    description: Yup.string()
      .optional(),
    customer: Yup.string()
      .required('Customer is required'),
    status: Yup.string()
      .required('Status is required'),
    priority: Yup.string()
      .required('Priority is required'),
    methodology: Yup.string()
      .required('Methodology is required'),
    type: Yup.string()
      .required('Project type is required'),
    owner: Yup.string()
      .required('Project owner is required'),
    startDate: Yup.date()
      .required('Start date is required'),
    dueDate: Yup.date()
      .required('End date is required')
      .min(Yup.ref('startDate'), 'End date must be after start date'),
    budget: Yup.number()
      .min(0, 'Budget must be a positive number')
  })

  // Initialize Formik
  const formik = useFormik({
    initialValues: formData,
    validationSchema: projectValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await handleSaveSubmit(values)
    }
  })

  // Helper functions to process API data
  const getApiStatuses = () => {
    if (!projectMasters?.statuses) return []
    return projectMasters.statuses
      .filter(status => status.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(status => ({
        value: status.name,
        color: `bg-[${status.color}] text-white`
      }))
  }

  const getApiPriorities = () => {
    if (!projectMasters?.priorities) return []
    return projectMasters.priorities
      .filter(priority => priority.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(priority => ({
        value: priority.name,
        color: `bg-[${priority.color}] text-white`
      }))
  }

  const getApiMethodologies = () => {
    if (!projectMasters?.methodologies) return []
    return projectMasters.methodologies
      .filter(methodology => methodology.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(methodology => methodology.name)
  }

  const getApiProjectTypes = () => {
    if (!projectMasters?.types) return []
    return projectMasters.types
      .filter(type => type.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(type => type.name)
  }

  // Use API data if available, fallback to mock data
  const statuses = getApiStatuses().length > 0 ? getApiStatuses() : [
    { value: 'Planning', color: 'bg-gray-500 text-white' },
    { value: 'Active', color: 'bg-[#28A745] text-white' },
    { value: 'On Hold', color: 'bg-[#FFC107] text-white' },
    { value: 'Completed', color: 'bg-[#007BFF] text-white' }
  ]

  const priorities = getApiPriorities().length > 0 ? getApiPriorities() : [
    { value: 'Low', color: 'bg-[#28A745] text-white' },
    { value: 'Medium', color: 'bg-[#FFC107] text-white' },
    { value: 'High', color: 'bg-[#DC3545] text-white' },
    { value: 'Critical', color: 'bg-[#6F42C1] text-white' }
  ]

  const editableMethodologies = getApiMethodologies().length > 0 ? getApiMethodologies() : [
    'Agile', 'Waterfall', 'Scrum', 'Kanban', 'Lean', 'Hybrid'
  ]

  const editableProjectTypes = getApiProjectTypes().length > 0 ? getApiProjectTypes() : [
    'Web Development', 'Mobile App', 'Desktop App', 'API Development', 'Data Analytics', 'E-commerce', 'CRM', 'ERP', 'DevOps', 'Machine Learning', 'Other'
  ]

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || '',
        priority: project.priority || '',
        methodology: project.methodology || '',
        // Map API field names to form field names
        type: project.project_type || project.projectType || project.type || '',
        startDate: project.start_date ? new Date(project.start_date) :
                   project.startDate ? new Date(project.startDate) : new Date(),
        dueDate: project.end_date ? new Date(project.end_date) :
                 project.dueDate ? new Date(project.dueDate) : new Date(),
        budget: project.budget || 0,
        customer: project.customer || '',
        // Use team_lead_detail for Project Owner display
        owner: project.team_lead_detail?.name ||
               project.team_lead?.name ||
               project.teamLead ||
               project.owner ||
               (typeof project.team_lead === 'string' ? project.team_lead : '') ||
               user?.name || '',
        // Use team_members_detail for Current Team display
        team: project.team_members_detail ?
              project.team_members_detail.map((member: any) => ({
                id: member.id,
                originalId: member.id, // Store the original ID for API calls
                name: member.name,
                role: member.role_name || member.role?.name || 'Member',
                avatar: member.user_profile ? member.user_profile.split('/').pop()?.charAt(0).toUpperCase() : member.name?.charAt(0).toUpperCase(),
                email: member.email || `${member.name?.toLowerCase().replace(/\s+/g, '.')}@company.com`,
                department: member.department || 'Unknown',
                user_profile: member.user_profile
              })) :
              // Fallback to old logic if team_members_detail is not available
              project.team_members ?
              project.team_members.map((memberIdOrName: string, index: number) => {
                // Skip empty or invalid entries
                if (!memberIdOrName || typeof memberIdOrName !== 'string') {
                  return null
                }

                // Try to find in projectMembers API data
                const apiMember = projectMembers?.items?.find(m => m.id === memberIdOrName || m.name === memberIdOrName)
                if (apiMember) {
                  return {
                    id: apiMember.id,
                    originalId: memberIdOrName,
                    name: apiMember.name,
                    role: apiMember.role?.name || 'Member',
                    avatar: apiMember.user_profile || apiMember.name.charAt(0).toUpperCase(),
                    email: apiMember.email,
                    department: apiMember.department,
                    user_profile: apiMember.user_profile
                  }
                }

                // Fallback for IDs without detail
                return {
                  id: memberIdOrName,
                  originalId: memberIdOrName,
                  name: `User ${memberIdOrName.slice(0, 8)}`,
                  role: 'Member',
                  avatar: memberIdOrName.charAt(0).toUpperCase(),
                  email: `user${index}@company.com`,
                  department: 'Unknown'
                }
              }).filter(Boolean) :
              project.team || [],
        isPublic: project.isPublic !== undefined ? project.isPublic : true,
        notifications: project.notifications !== undefined ? project.notifications : true,
        autoArchive: project.autoArchive !== undefined ? project.autoArchive : false,
        version: project.version || 'v1.0.0',
        tags: project.tags || [],
        customFields: project.customFields || {}
      })
    }
  }, [project, user])

  // Load customers from API
  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true)
      try {
        const response = await customerApiService.getCustomers({ size: 100 })
        setCustomers(response.customers || [])
      } catch (error) {
        console.error('Failed to load customers:', error)
      } finally {
        setLoadingCustomers(false)
      }
    }
    loadCustomers()
  }, [])

  // Load team members from API
  useEffect(() => {
    const loadTeamMembers = async () => {
      setLoadingTeamMembers(true)
      try {
        const response = await userApiService.getTeamMembers({ per_page: 100, is_active: true })
        setTeamMembers(response.items || [])
      } catch (error) {
        console.error('Failed to load team members:', error)
      } finally {
        setLoadingTeamMembers(false)
      }
    }
    loadTeamMembers()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    formik.setFieldValue(field, value)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddTeamMember = (member: any) => {
    if (!formData.team.find(m => m.id === member.id)) {
      // Add originalId to the member object for proper ID tracking
      const memberWithOriginalId = {
        ...member,
        originalId: member.id // Store the original ID for API calls
      }
      setFormData(prev => ({
        ...prev,
        team: [...prev.team, memberWithOriginalId]
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
    const tagToAdd = newTag.trim()
    if (tagToAdd && !formData.tags.includes(tagToAdd)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagToAdd]
      }))
      setNewTag('')
    } else if (tagToAdd && formData.tags.includes(tagToAdd)) {
      toast.error('Tag already exists')
    } else if (!tagToAdd) {
      toast.error('Please enter a tag name')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSaveSubmit = async (values: typeof formData) => {
    setIsLoading(true)

    if (!project?.id) {
      toast.error('Project ID is required')
      setIsLoading(false)
      return
    }

    try {
      // Find customer and owner IDs from the selected names
      const selectedCustomer = customers.find(c => c.name === values.customer)
      const selectedOwner = projectOwners?.items?.find(owner => owner.name === values.owner)

      const updateData: UpdateProjectRequest = {
        name: values.name,
        description: values.description,
        status: values.status,
        start_date: values.startDate.toISOString().split('T')[0],
        end_date: values.dueDate.toISOString().split('T')[0],
        budget: values.budget,
        customer_id: selectedCustomer?.id || null,
        customer: values.customer,
        priority: values.priority,
        team_lead_id: selectedOwner?.id || null,
        team_members: values.team
          .map(member => {
            // First priority: try to find the member ID from the API data
            const apiMember = projectMembers?.items?.find(apiM => apiM.name === member.name)
            if (apiMember?.id) {
              return apiMember.id
            }

            // Second priority: try to find in team members data
            const teamMember = teamMembers.find(tm => tm.name === member.name)
            if (teamMember?.id) {
              return teamMember.id
            }

            // Third priority: use the stored originalId only if it looks like a valid UUID
            if (member.originalId && member.originalId.match(/^[a-f0-9\-]{8,}$/)) {
              return member.originalId
            }

            // If we can't find a valid ID, don't include this member
            console.warn(`Could not find valid ID for team member: ${member.name}`)
            return null
          })
          .filter(Boolean), // Remove null entries
        tags: values.tags,
        methodology: values.methodology as 'Agile' | 'Waterfall' | 'Scrum' | 'Kanban' | 'Lean' | 'Hybrid',
        project_type: values.type as 'Web Development' | 'Mobile App' | 'Desktop App' | 'API Development' | 'Data Analytics' | 'E-commerce' | 'CRM' | 'ERP' | 'DevOps' | 'Machine Learning' | 'Other'
      }

      await dispatch(updateProject({ id: project.id, projectData: updateData })).unwrap()

      toast.success('Project updated successfully')
      onSave(values) // Call the callback for any local UI updates
      onClose()
    } catch (error) {
      toast.error(`Failed to update project: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Get available team members from API data
  const getAvailableMembers = () => {
    const apiMembers = projectMembers?.items?.filter(member => member.is_active) || []
    const availableTeamMembers = teamMembers.filter(member => member.is_active) || []

    // Use API data if available, otherwise fallback to team members data
    const allMembers = apiMembers.length > 0 ? apiMembers.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role.name,
      avatar: member.user_profile || member.name.charAt(0).toUpperCase(),
      email: member.email,
      department: member.department,
      user_profile: member.user_profile
    })) : availableTeamMembers.map(member => ({
      id: member.id,
      name: member.name,
      role: typeof member.role === 'object' ? member.role.name : member.role,
      avatar: member.user_profile || member.name.charAt(0).toUpperCase(),
      email: member.email,
      department: member.department,
      user_profile: member.user_profile
    }))

    return allMembers.filter(availableMember => {
      // Check if this member is already in the team by multiple criteria
      const isAlreadyInTeam = formData.team.some(teamMember => {
        // Check by ID (both string and number comparison)
        if (teamMember.id === availableMember.id ||
            teamMember.id.toString() === availableMember.id.toString()) {
          return true
        }

        // Check by name
        if (teamMember.name === availableMember.name) {
          return true
        }

        // Check by originalId if it exists
        if (teamMember.originalId &&
            (teamMember.originalId === availableMember.id.toString() ||
             teamMember.originalId === availableMember.id)) {
          return true
        }

        // Check if the available member's ID matches any team member's originalId
        if (availableMember.id.toString() === teamMember.originalId ||
            availableMember.id === teamMember.originalId) {
          return true
        }

        return false
      })

      return !isAlreadyInTeam
    })
  }

  const availableMembers = getAvailableMembers()

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
                    onBlur={formik.handleBlur}
                    placeholder="Enter project name"
                    className={cn("mt-1", formik.touched.name && formik.errors.name && "border-red-500")}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
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
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer}
                    onValueChange={(value) => {
                      handleInputChange('customer', value)
                      formik.setFieldTouched('customer', true)
                    }}
                  >
                    <SelectTrigger className={cn("mt-1", formik.touched.customer && formik.errors.customer && "border-red-500")}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCustomers ? (
                        <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                      ) : customers.length === 0 ? (
                        <SelectItem value="empty" disabled>No customers available</SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.name}>
                            <div className="flex items-center space-x-2">
                              <span>{customer.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {customer.industry}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formik.touched.customer && formik.errors.customer && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.customer}</p>
                  )}
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
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => {
                      handleInputChange('status', value)
                      formik.setFieldTouched('status', true)
                    }}
                  >
                    <SelectTrigger className={cn("mt-1", formik.touched.status && formik.errors.status && "border-red-500")}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                            <span>{status.value}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.status && formik.errors.status && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.status}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => {
                      handleInputChange('priority', value)
                      formik.setFieldTouched('priority', true)
                    }}
                  >
                    <SelectTrigger className={cn("mt-1", formik.touched.priority && formik.errors.priority && "border-red-500")}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${priority.color.split(' ')[0]}`} />
                            <span>{priority.value}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.priority && formik.errors.priority && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.priority}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="methodology">Methodology *</Label>
                  <Select
                    value={formData.methodology}
                    onValueChange={(value) => {
                      handleInputChange('methodology', value)
                      formik.setFieldTouched('methodology', true)
                    }}
                  >
                    <SelectTrigger className={cn("mt-1", formik.touched.methodology && formik.errors.methodology && "border-red-500")}>
                      <SelectValue placeholder="Select methodology" />
                    </SelectTrigger>
                    <SelectContent>
                      {editableMethodologies.map((methodology) => (
                        <SelectItem key={methodology} value={methodology}>
                          {methodology}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.methodology && formik.errors.methodology && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.methodology}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Project Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      handleInputChange('type', value)
                      formik.setFieldTouched('type', true)
                    }}
                  >
                    <SelectTrigger className={cn("mt-1", formik.touched.type && formik.errors.type && "border-red-500")}>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {editableProjectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.type && formik.errors.type && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.type}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="owner">Project Owner *</Label>
                  <Select
                    value={formData.owner}
                    onValueChange={(value) => {
                      handleInputChange('owner', value)
                      formik.setFieldTouched('owner', true)
                    }}
                  >
                    <SelectTrigger className={cn("mt-1", formik.touched.owner && formik.errors.owner && "border-red-500")}>
                      <SelectValue placeholder="Select project owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownersLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading owners...
                        </SelectItem>
                      ) : projectOwners?.items?.length ? (
                        projectOwners.items
                          .filter(owner => owner.is_active)
                          .map((owner) => (
                            <SelectItem key={owner.id} value={owner.name}>
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  {owner.user_profile && owner.user_profile !== '/public/user-profile/default.png' ? (
                                    <img
                                      src={getAssetUrl(owner.user_profile)}
                                      alt={owner.name}
                                      className="w-6 h-6 rounded-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <AvatarFallback className="text-xs bg-[#007BFF] text-white">
                                    {owner.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="font-medium">{owner.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {owner.role?.name || owner.role_name} • {owner.department}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-owners" disabled>
                          No owners available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formik.touched.owner && formik.errors.owner && (
                    <p className="text-sm text-red-500 mt-1">{formik.errors.owner}</p>
                  )}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button
                  onClick={handleAddTag}
                  variant="outline"
                  size="sm"
                  disabled={!newTag.trim()}
                >
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
                            {member.user_profile && member.user_profile !== '/public/user-profile/default.png' ? (
                              <img
                                src={getAssetUrl(member.user_profile)}
                                alt={member.name}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <AvatarFallback className="bg-[#007BFF] text-white text-sm">
                              {member.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                            {member.department && (
                              <p className="text-xs text-muted-foreground">{member.department}</p>
                            )}
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
                  {membersLoading || loadingTeamMembers ? (
                    <p className="text-muted-foreground text-sm">Loading team members...</p>
                  ) : availableMembers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">All team members are already assigned</p>
                  ) : (
                    availableMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            {member.user_profile && member.user_profile !== '/public/user-profile/default.png' ? (
                              <img
                                src={getAssetUrl(member.user_profile)}
                                alt={member.name}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <AvatarFallback className="bg-[#28A745] text-white text-sm">
                              {member.name?.charAt(0) || 'U'}
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
                    <Label>Start Date *</Label>
                    <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !formData.startDate && "text-muted-foreground",
                            formik.touched.startDate && formik.errors.startDate && "border-red-500"
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
                              formik.setFieldTouched('startDate', true)
                              setShowStartDatePicker(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formik.touched.startDate && formik.errors.startDate && (
                      <p className="text-sm text-red-500 mt-1">{formik.errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <Label>End Date *</Label>
                    <Popover open={showDueDatePicker} onOpenChange={setShowDueDatePicker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !formData.dueDate && "text-muted-foreground",
                            formik.touched.dueDate && formik.errors.dueDate && "border-red-500"
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
                              formik.setFieldTouched('dueDate', true)
                              setShowDueDatePicker(false)
                            }
                          }}
                          initialFocus
                          disabled={(date) => date <= formData.startDate}
                        />
                      </PopoverContent>
                    </Popover>
                    {formik.touched.dueDate && formik.errors.dueDate && (
                      <p className="text-sm text-red-500 mt-1">{formik.errors.dueDate}</p>
                    )}
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
          <Button
            onClick={() => {
              // Mark all fields as touched to show validation errors
              formik.setTouched({
                name: true,
                customer: true,
                status: true,
                priority: true,
                methodology: true,
                type: true,
                owner: true,
                startDate: true,
                dueDate: true
              })
              formik.handleSubmit()
            }}
            disabled={isLoading}
            className="bg-[#28A745] hover:bg-[#218838]">
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