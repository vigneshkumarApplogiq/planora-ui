import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../../components/ui/dialog'
import { Progress } from '../../../../components/ui/progress'
import {
  Plus,
  Search,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  XCircle,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Upload,
  Download,
  FileX
} from 'lucide-react'
import { Deliverable, deliverableApiService, CreateDeliverableRequest, UpdateDeliverableRequest } from '../../../../services/deliverableApi'
import { Phase, phaseApiService } from '../../../../services/phaseApi'
import { Milestone, milestoneApiService } from '../../../../services/milestoneApi'
import { projectApiService, ProjectMember } from '../../../../services/projectApi'
import { DeliverableModal } from './DeliverableModal'
import { useToast } from '../../../../components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../../../../components/ui/pagination'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Simple date formatting function
const formatDate = (date: Date, formatType: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (formatType === 'MMM d') {
    return `${months[date.getMonth()]} ${date.getDate()}`
  } else if (formatType === 'MMM d, yyyy' || formatType === 'PPP') {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }
  return date.toLocaleDateString()
}

interface DeliverablesViewProps {
  projectId: string
  projectName: string
  user: any
  teamMembers?: Array<{ id: string; name: string }>
  selectedPhaseId?: string
  selectedMilestoneId?: string
}

export function DeliverablesView({
  projectId,
  projectName,
  user,
  teamMembers: propTeamMembers = [],
  selectedPhaseId,
  selectedMilestoneId
}: DeliverablesViewProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPhase, setFilterPhase] = useState(selectedPhaseId || 'all')
  const [filterMilestone, setFilterMilestone] = useState(selectedMilestoneId || 'all')
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)
  const [showDeliverableModal, setShowDeliverableModal] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>(propTeamMembers)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDeliverableId, setDeleteDeliverableId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchPhases()
    fetchMilestones()
    fetchDeliverables()
    fetchProjectMembers()
  }, [projectId])

  useEffect(() => {
    if (selectedPhaseId) {
      setFilterPhase(selectedPhaseId)
    }
  }, [selectedPhaseId])

  useEffect(() => {
    if (selectedMilestoneId) {
      setFilterMilestone(selectedMilestoneId)
    }
  }, [selectedMilestoneId])

  const fetchPhases = async () => {
    try {
      const response = await phaseApiService.getPhases(projectId)
      setPhases(response.items || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch phases',
        variant: 'destructive',
      })
    }
  }

  const fetchMilestones = async () => {
    try {
      const response = await milestoneApiService.getMilestones(projectId)
      setMilestones(response.items || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch milestones',
        variant: 'destructive',
      })
    }
  }

  const fetchDeliverables = async () => {
    try {
      setIsLoading(true)
      const response = await deliverableApiService.getDeliverables(projectId)
      setDeliverables(response.items || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch deliverables',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjectMembers = async () => {
    try {
      const members = await projectApiService.getProjectMembersV2(projectId)
      // Map the API response to the format expected by the DeliverableModal
      const mappedMembers = members.map((member: ProjectMember) => ({
        id: member.member_id,
        name: member.member_name
      }))
      setTeamMembers(mappedMembers)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch project members',
        variant: 'destructive',
      })
    }
  }

  const handleCreateDeliverable = async (data: CreateDeliverableRequest) => {
    try {
      await deliverableApiService.createDeliverable(data)
      toast({
        title: 'Success',
        description: 'Deliverable created successfully',
      })
      fetchDeliverables()
      setShowDeliverableModal(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create deliverable',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleUpdateDeliverable = async (data: UpdateDeliverableRequest) => {
    if (!editingDeliverable?.id) return

    try {
      await deliverableApiService.updateDeliverable(editingDeliverable.id, data)
      toast({
        title: 'Success',
        description: 'Deliverable updated successfully',
      })
      fetchDeliverables()
      setShowDeliverableModal(false)
      setEditingDeliverable(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update deliverable',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDeleteDeliverable = async () => {
    if (!deleteDeliverableId) return

    try {
      setIsDeleting(true)
      await deliverableApiService.deleteDeliverable(deleteDeliverableId)
      toast({
        title: 'Success',
        description: 'Deliverable deleted successfully',
      })
      fetchDeliverables()
      setDeleteDeliverableId(null)
      if (selectedDeliverable?.id === deleteDeliverableId) {
        setSelectedDeliverable(null)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete deliverable',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditDeliverable = (deliverable: Deliverable) => {
    setEditingDeliverable(deliverable)
    setShowDeliverableModal(true)
  }

  const handleAddDeliverable = () => {
    setEditingDeliverable(null)
    setShowDeliverableModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'under-review': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'in-progress': return 'bg-cyan-100 text-cyan-800 border-cyan-300'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'approved': return <FileCheck className="w-4 h-4 text-emerald-600" />
      case 'submitted': return <Upload className="w-4 h-4 text-blue-600" />
      case 'under-review': return <Eye className="w-4 h-4 text-indigo-600" />
      case 'in-progress': return <FileText className="w-4 h-4 text-cyan-600" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending': return <Clock className="w-4 h-4 text-gray-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredDeliverables = deliverables.filter(deliverable => {
    const matchesSearch = deliverable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deliverable.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || deliverable.status === filterStatus
    const matchesPhase = filterPhase === 'all' || deliverable.phase_id === filterPhase
    const matchesMilestone = filterMilestone === 'all' || deliverable.milestone_id === filterMilestone

    return matchesSearch && matchesStatus && matchesPhase && matchesMilestone
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredDeliverables.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDeliverables = filteredDeliverables.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterPhase, filterMilestone])

  const DeliverableCard = ({ deliverable }: { deliverable: Deliverable }) => {
    return (
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          selectedDeliverable?.id === deliverable.id ? 'ring-2 ring-[#28A745] ring-opacity-50' : ''
        }`}
        onClick={() => setSelectedDeliverable(deliverable)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 flex-1">
              {getStatusIcon(deliverable.status)}
              <div>
                <h3 className="font-semibold text-foreground">{deliverable.name}</h3>
                <p className="text-xs text-muted-foreground">{deliverable.deliverable_type} v{deliverable.version}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getPriorityColor(deliverable.priority)}>
                {deliverable.priority}
              </Badge>
              <Badge variant="outline" className={getStatusColor(deliverable.status)}>
                {deliverable.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditDeliverable(deliverable) }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Deliverable
                  </DropdownMenuItem>
                  {deliverable.file_path && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(deliverable.file_path, '_blank') }}>
                      <Download className="w-4 h-4 mr-2" />
                      View File
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => { e.stopPropagation(); setDeleteDeliverableId(deliverable.id || null) }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Deliverable
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{deliverable.description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Milestone: {deliverable.milestone_name}</span>
              <span className="text-muted-foreground">
                Due: {formatDate(new Date(deliverable.due_date), 'MMM d, yyyy')}
              </span>
            </div>

            {deliverable.progress > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{deliverable.progress}%</span>
                </div>
                <Progress value={deliverable.progress} className="h-1.5" />
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Owner: {deliverable.owner_name}</span>
              <span className="text-muted-foreground">Reviewer: {deliverable.reviewer_name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const DeliverableDetails = ({ deliverable }: { deliverable: Deliverable }) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{deliverable.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {deliverable.deliverable_type} v{deliverable.version}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={getPriorityColor(deliverable.priority)}>
            {deliverable.priority}
          </Badge>
          <Badge variant="outline" className={getStatusColor(deliverable.status)}>
            {deliverable.status}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => {
            setSelectedDeliverable(null)
            handleEditDeliverable(deliverable)
          }}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-muted-foreground text-sm">{deliverable.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Phase</h4>
            <p className="text-sm text-muted-foreground">{deliverable.phase_name}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Milestone</h4>
            <p className="text-sm text-muted-foreground">{deliverable.milestone_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Owner</h4>
            <p className="text-sm text-muted-foreground">{deliverable.owner_name}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Reviewer</h4>
            <p className="text-sm text-muted-foreground">{deliverable.reviewer_name}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Timeline</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span>{formatDate(new Date(deliverable.due_date), 'MMM d, yyyy')}</span>
            </div>
            {deliverable.submission_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submission Date:</span>
                <span>{formatDate(new Date(deliverable.submission_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {deliverable.approval_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval Date:</span>
                <span>{formatDate(new Date(deliverable.approval_date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Progress</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{deliverable.progress}%</span>
            </div>
            <Progress value={deliverable.progress} className="h-2" />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Acceptance Criteria</h4>
          <p className="text-sm text-muted-foreground">{deliverable.acceptance_criteria}</p>
        </div>

        {deliverable.file_path && (
          <div>
            <h4 className="font-medium mb-2">File</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(deliverable.file_path, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              View/Download File
            </Button>
          </div>
        )}

        {deliverable.review_comments && (
          <div>
            <h4 className="font-medium mb-2">Review Comments</h4>
            <p className="text-sm text-muted-foreground">{deliverable.review_comments}</p>
          </div>
        )}

        {deliverable.notes && (
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground">{deliverable.notes}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Deliverables</h2>
          <p className="text-muted-foreground">Manage project deliverables and submissions</p>
        </div>

        <Button
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={handleAddDeliverable}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Deliverable
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search deliverables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-64"
          />
        </div>

        <Select value={filterPhase} onValueChange={setFilterPhase}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {phases.map((phase) => (
              <SelectItem key={phase.id} value={phase.id || ''}>
                {phase.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMilestone} onValueChange={setFilterMilestone}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Milestone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Milestones</SelectItem>
            {milestones
              .filter(m => filterPhase === 'all' || m.phase_id === filterPhase)
              .map((milestone) => (
                <SelectItem key={milestone.id} value={milestone.id || ''}>
                  {milestone.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under-review">Under Review</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#28A745]" />
        </div>
      ) : (
        <>
          {/* Deliverable Statistics */}
          <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#10B981]">
                  {deliverables.filter(d => d.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#059669]">
                  {deliverables.filter(d => d.status === 'approved').length}
                </div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#3B82F6]">
                  {deliverables.filter(d => d.status === 'submitted').length}
                </div>
                <div className="text-xs text-muted-foreground">Submitted</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#6366F1]">
                  {deliverables.filter(d => d.status === 'under-review').length}
                </div>
                <div className="text-xs text-muted-foreground">Under Review</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#06B6D4]">
                  {deliverables.filter(d => d.status === 'in-progress').length}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#DC2626]">
                  {deliverables.filter(d => d.status === 'rejected').length}
                </div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#6B7280]">
                  {deliverables.filter(d => d.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
          </div>

          {/* Deliverables List - Full Width */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">All Deliverables ({filteredDeliverables.length})</h3>
              {filteredDeliverables.length > itemsPerPage && (
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredDeliverables.length)} of {filteredDeliverables.length}
                </p>
              )}
            </div>

            {filteredDeliverables.length > 0 ? (
              <>
                <div className="space-y-3">
                  {paginatedDeliverables.map((deliverable) => (
                    <DeliverableCard key={deliverable.id} deliverable={deliverable} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredDeliverables.length)} of {filteredDeliverables.length} deliverables
                    </div>
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
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <FileX className="w-12 h-12 mx-auto mb-2" />
                  <p>No deliverables found</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Deliverable Details Modal/Sidebar - Show when selected */}
          {selectedDeliverable && (
            <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Deliverable Details</DialogTitle>
                </DialogHeader>
                <DeliverableDetails deliverable={selectedDeliverable} />
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      {/* Deliverable Modal */}
      <DeliverableModal
        open={showDeliverableModal}
        onClose={() => {
          setShowDeliverableModal(false)
          setEditingDeliverable(null)
        }}
        onSubmit={editingDeliverable ? handleUpdateDeliverable : handleCreateDeliverable}
        deliverable={editingDeliverable}
        projectId={projectId}
        projectName={projectName}
        phases={phases}
        milestones={milestones}
        teamMembers={teamMembers}
        selectedPhaseId={filterPhase !== 'all' ? filterPhase : undefined}
        selectedMilestoneId={filterMilestone !== 'all' ? filterMilestone : undefined}
        userId={user?.id || ''}
        userName={user?.name || ''}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDeliverableId} onOpenChange={(open: any) => !open && setDeleteDeliverableId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deliverable</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this deliverable? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDeliverableId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDeliverable}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
