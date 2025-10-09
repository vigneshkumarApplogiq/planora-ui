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
  Flag,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Milestone, milestoneApiService, CreateMilestoneRequest, UpdateMilestoneRequest } from '../../../../services/milestoneApi'
import { Phase, phaseApiService } from '../../../../services/phaseApi'
import { MilestoneModal } from './MilestoneModal'
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../../components/ui/pagination'

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

interface MilestonesViewProps {
  projectId: string
  projectName: string
  user: any
  selectedPhaseId?: string
}

export function MilestonesView({ projectId, projectName, user, selectedPhaseId }: MilestonesViewProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPhase, setFilterPhase] = useState(selectedPhaseId || 'all')
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)

  useEffect(() => {
    fetchPhases()
    fetchMilestones()
  }, [projectId, currentPage, perPage])

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterPhase])

  useEffect(() => {
    if (selectedPhaseId) {
      setFilterPhase(selectedPhaseId)
    }
  }, [selectedPhaseId])

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
      setIsLoading(true)
      const response = await milestoneApiService.getMilestones(projectId, undefined, currentPage, perPage)
      console.log('Milestones API Response:', response)

      // Check if response is an array (old API format) or object with items (new format)
      if (Array.isArray(response)) {
        // Old API format - direct array
        setMilestones(response)
        setTotalPages(1)
        setTotalItems(response.length)
      } else {
        // New API format - paginated response
        setMilestones(response.items || [])
        setTotalPages(response.total_pages || 1)
        setTotalItems(response.total || 0)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch milestones',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMilestone = async (data: CreateMilestoneRequest) => {
    try {
      await milestoneApiService.createMilestone(data)
      toast({
        title: 'Success',
        description: 'Milestone created successfully',
      })
      fetchMilestones()
      setShowMilestoneModal(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create milestone',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleUpdateMilestone = async (data: UpdateMilestoneRequest) => {
    if (!editingMilestone?.id) return

    try {
      await milestoneApiService.updateMilestone(editingMilestone.id, data)
      toast({
        title: 'Success',
        description: 'Milestone updated successfully',
      })
      fetchMilestones()
      setShowMilestoneModal(false)
      setEditingMilestone(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update milestone',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDeleteMilestone = async () => {
    if (!deleteMilestoneId) return

    try {
      setIsDeleting(true)
      await milestoneApiService.deleteMilestone(deleteMilestoneId)
      toast({
        title: 'Success',
        description: 'Milestone deleted successfully',
      })
      fetchMilestones()
      setDeleteMilestoneId(null)
      if (selectedMilestone?.id === deleteMilestoneId) {
        setSelectedMilestone(null)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete milestone',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setShowMilestoneModal(true)
  }

  const handleAddMilestone = () => {
    setEditingMilestone(null)
    setShowMilestoneModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'delayed': return 'bg-red-100 text-red-800 border-red-300'
      case 'at-risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'in-progress': return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'pending': return <Clock className="w-4 h-4 text-gray-600" />
      case 'delayed': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'at-risk': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
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

  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || milestone.status === filterStatus
    const matchesPhase = filterPhase === 'all' || milestone.phase_id === filterPhase

    return matchesSearch && matchesStatus && matchesPhase
  })

  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const dueDate = new Date(milestone.due_date)
    const isOverdue = dueDate < new Date() && milestone.status !== 'completed'
    const actualStatus = isOverdue ? 'delayed' : milestone.status

    return (
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          selectedMilestone?.id === milestone.id ? 'ring-2 ring-[#28A745] ring-opacity-50' : ''
        }`}
        onClick={() => setSelectedMilestone(milestone)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 flex-1">
              {getStatusIcon(actualStatus)}
              <h3 className="font-semibold text-foreground">{milestone.name}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getPriorityColor(milestone.priority)}>
                {milestone.priority}
              </Badge>
              <Badge variant="outline" className={getStatusColor(actualStatus)}>
                {actualStatus}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditMilestone(milestone) }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Milestone
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => { e.stopPropagation(); setDeleteMilestoneId(milestone.id || null) }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Milestone
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{milestone.description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Phase: {milestone.phase_name}</span>
              <span className="text-muted-foreground">
                Due: {formatDate(new Date(milestone.due_date), 'MMM d, yyyy')}
              </span>
            </div>

            {milestone.progress > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{milestone.progress}%</span>
                </div>
                <Progress value={milestone.progress} className="h-2" />
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Owner: {milestone.owner_name}</span>
              <span className="text-muted-foreground">Order: #{milestone.milestone_order}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Milestones</h2>
          <p className="text-muted-foreground">Track project milestones and deliverables</p>
        </div>

        <Button
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={handleAddMilestone}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search milestones..."
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

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={perPage.toString()} onValueChange={(value) => setPerPage(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#28A745]" />
        </div>
      ) : (
        <>
          {/* Milestone Statistics */}
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#28A745]">
                  {milestones.filter(m => m.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#007BFF]">
                  {milestones.filter(m => m.status === 'in-progress').length}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#6C757D]">
                  {milestones.filter(m => m.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#FFC107]">
                  {milestones.filter(m => m.status === 'at-risk').length}
                </div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#DC3545]">
                  {milestones.filter(m => m.status === 'delayed').length}
                </div>
                <div className="text-xs text-muted-foreground">Delayed</div>
              </CardContent>
            </Card>
          </div>

          {/* Milestones List */}
          <div className="space-y-4">
            <h3 className="font-medium">All Milestones</h3>
            {filteredMilestones.length > 0 ? (
              <div className="space-y-3">
                {filteredMilestones.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-2" />
                  <p>No milestones found</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalItems)} of {totalItems} milestones
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="gap-1 px-2.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:block">Previous</span>
                    </Button>
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "bg-[#28A745] hover:bg-[#218838]" : ""}
                          >
                            {page}
                          </Button>
                        </PaginationItem>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <PaginationEllipsis key={page} />
                    }
                    return null
                  })}

                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-1 px-2.5"
                    >
                      <span className="hidden sm:block">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Milestone Modal */}
      <MilestoneModal
        open={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false)
          setEditingMilestone(null)
        }}
        onSubmit={editingMilestone
          ? (data: UpdateMilestoneRequest) => handleUpdateMilestone(data)
          : (data: CreateMilestoneRequest) => handleCreateMilestone(data)
        }
        milestone={editingMilestone}
        projectId={projectId}
        projectName={projectName}
        phases={phases}
        selectedPhaseId={filterPhase !== 'all' ? filterPhase : undefined}
        userId={user?.id || ''}
        userName={user?.name || ''}
        nextMilestoneOrder={milestones.length + 1}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteMilestoneId} onOpenChange={(open: boolean) => !open && setDeleteMilestoneId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMilestoneId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMilestone}
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
