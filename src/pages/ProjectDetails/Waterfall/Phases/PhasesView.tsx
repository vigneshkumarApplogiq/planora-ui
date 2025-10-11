import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../../components/ui/dialog'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Progress } from '../../../../components/ui/progress'
import { Calendar } from '../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Flag,
  TrendingUp,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Loader2,
  FileText
} from 'lucide-react'
import { Phase, phaseApiService, CreatePhaseRequest, UpdatePhaseRequest } from '../../../../services/phaseApi'
import { Milestone, milestoneApiService } from '../../../../services/milestoneApi'
import { Deliverable, deliverableApiService } from '../../../../services/deliverableApi'
import { PhaseModal } from './PhaseModal'
import { useToast } from '../../../../components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
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

interface WaterfallPhasesViewProps {
  projectId: string
  user: any
}

export function WaterfallPhasesView({ projectId, user }: WaterfallPhasesViewProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletePhaseId, setDeletePhaseId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'delayed': return 'bg-red-100 text-red-800 border-red-300'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'active': return <Play className="w-4 h-4 text-blue-600" />
      case 'pending': return <Clock className="w-4 h-4 text-gray-600" />
      case 'delayed': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'on-hold': return <Pause className="w-4 h-4 text-yellow-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getDeliverableStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Fetch phases on component mount or when filters/pagination change
  useEffect(() => {
    fetchPhases()
  }, [projectId, currentPage, perPage])

  // Reset to page 1 when search term or filter status changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  // Fetch milestones and deliverables only when a phase is selected
  useEffect(() => {
    if (selectedPhase) {
      fetchMilestones()
      fetchDeliverables()
    }
  }, [selectedPhase])

  const fetchPhases = async () => {
    try {
      setIsLoading(true)
      const response = await phaseApiService.getPhases(projectId, currentPage, perPage)
      console.log('Phases API Response:', response)

      // Check if response is an array (old API format) or object with items (new format)
      if (Array.isArray(response)) {
        // Old API format - direct array
        setPhases(response)
        setTotalPages(1)
        setTotalItems(response.length)
      } else {
        // New API format - paginated response
        setPhases(response.items || [])
        setTotalPages(response.total_pages || 1)
        setTotalItems(response.total || 0)
      }
    } catch (error: any) {
      console.error('Fetch phases error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch phases',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMilestones = async () => {
    try {
      const response = await milestoneApiService.getMilestones(projectId)
      setMilestones(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch milestones:', error)
    }
  }

  const fetchDeliverables = async () => {
    try {
      const response = await deliverableApiService.getDeliverables(projectId)
      setDeliverables(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch deliverables:', error)
    }
  }

  const handleCreatePhase = async (data: CreatePhaseRequest) => {
    try {
      await phaseApiService.createPhase(data)
      toast({
        title: 'Success',
        description: 'Phase created successfully',
      })
      fetchPhases()
      setShowPhaseModal(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create phase',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleUpdatePhase = async (data: UpdatePhaseRequest) => {
    if (!editingPhase?.id) return

    try {
      await phaseApiService.updatePhase(editingPhase.id, data)
      toast({
        title: 'Success',
        description: 'Phase updated successfully',
      })
      fetchPhases()
      setShowPhaseModal(false)
      setEditingPhase(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update phase',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDeletePhase = async () => {
    if (!deletePhaseId) return

    try {
      setIsDeleting(true)
      await phaseApiService.deletePhase(deletePhaseId)
      toast({
        title: 'Success',
        description: 'Phase deleted successfully',
      })
      fetchPhases()
      setDeletePhaseId(null)
      if (selectedPhase?.id === deletePhaseId) {
        setSelectedPhase(null)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete phase',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase)
    setShowPhaseModal(true)
  }

  const handleAddPhase = () => {
    setEditingPhase(null)
    setShowPhaseModal(true)
  }

  const filteredPhases = phases.filter(phase => {
    const matchesSearch = phase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         phase.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || phase.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const PhaseCard = ({ phase, index }: { phase: Phase, index: number }) => {
    const phaseEndDate = new Date(phase.end_date)
    const isDelayed = phaseEndDate < new Date() && phase.status !== 'completed'
    const actualStatus = isDelayed ? 'delayed' : phase.status

    return (
      <div className="relative">
        {/* Connection Line */}
        {index < filteredPhases.length - 1 && (
          <div className="absolute left-6 top-20 w-0.5 h-16 bg-border z-0"></div>
        )}

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow relative z-10 ${
            selectedPhase?.id === phase.id ? 'ring-2 ring-[#28A745] ring-opacity-50' : ''
          }`}
          onClick={() => setSelectedPhase(phase)}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full border-4 ${
                  actualStatus === 'completed' ? 'bg-green-500 border-green-200' :
                  actualStatus === 'active' ? 'bg-blue-500 border-blue-200' :
                  actualStatus === 'delayed' ? 'bg-red-500 border-red-200' :
                  'bg-gray-300 border-gray-200'
                } flex items-center justify-center`}>
                  <span className="text-white font-semibold">{phase.phase_order}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(actualStatus)}
                    <h3 className="font-semibold text-foreground">{phase.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditPhase(phase) }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Phase
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); setDeletePhaseId(phase.id || null) }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Phase
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{phase.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatDate(new Date(phase.start_date), 'MMM d')} - {formatDate(new Date(phase.end_date), 'MMM d, yyyy')}
                    </span>
                    <span className="text-muted-foreground">
                      Budget: ${(phase.budget / 1000).toFixed(0)}k
                    </span>
                  </div>

                  {phase.progress > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{phase.owner_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Spent: ${(phase.spent / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const PhaseDetails = ({ phase }: { phase: Phase }) => {
    const phaseMilestones = milestones.filter(m => m.phase_id === phase.id)
    const completedMilestones = phaseMilestones.filter(m => m.status === 'completed').length
    const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id)
    const approvedDeliverables = phaseDeliverables.filter(d => d.status === 'approved' || d.status === 'completed').length

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{phase.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getStatusColor(phase.status)}>
                {phase.status}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => handleEditPhase(phase)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Phase
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-muted-foreground">{phase.description}</p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span>{formatDate(new Date(phase.start_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span>{formatDate(new Date(phase.end_date), 'MMM d, yyyy')}</span>
              </div>
              {phase.actual_start_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual Start:</span>
                  <span>{formatDate(new Date(phase.actual_start_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {phase.actual_end_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual End:</span>
                  <span>{formatDate(new Date(phase.actual_end_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Budget</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allocated:</span>
                <span>${phase.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spent:</span>
                <span>${phase.spent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span>${(phase.budget - phase.spent).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Phase Owner</h4>
          <div className="flex items-center space-x-3 p-2 border rounded">
            <div className="w-8 h-8 rounded-full bg-[#28A745] flex items-center justify-center text-white text-sm">
              {phase.owner_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-medium text-sm">{phase.owner_name}</p>
              <p className="text-xs text-muted-foreground">Phase Owner</p>
            </div>
          </div>
        </div>

        {phase.notes && (
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-muted-foreground text-sm">{phase.notes}</p>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Progress</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{phase.progress}%</span>
            </div>
            <Progress value={phase.progress} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phaseMilestones.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Milestones</h4>
              <div className="flex items-center space-x-2 text-sm">
                <Flag className="w-4 h-4 text-[#28A745]" />
                <span className="text-muted-foreground">
                  {completedMilestones} of {phaseMilestones.length} completed
                </span>
              </div>
            </div>
          )}

          {phaseDeliverables.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Deliverables</h4>
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="w-4 h-4 text-[#28A745]" />
                <span className="text-muted-foreground">
                  {approvedDeliverables} of {phaseDeliverables.length} approved
                </span>
              </div>
            </div>
          )}
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
          <h2 className="text-2xl font-semibold">Project Phases</h2>
          <p className="text-muted-foreground">Manage waterfall project phases and milestones</p>
        </div>

        <Button
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={handleAddPhase}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Phase
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search phases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#28A745]" />
        </div>
      ) : (
        <>
          {/* Phase Statistics */}
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#28A745]">{phases.filter(p => p.status === 'completed').length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#007BFF]">{phases.filter(p => p.status === 'active').length}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#6C757D]">{phases.filter(p => p.status === 'pending').length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
             <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#FF0000]">{phases.filter(p => p.status === 'delayed').length}</div>
                <div className="text-xs text-muted-foreground">Delayed</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-[#FFC107]">
                  {phases.length > 0 ? Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Overall Progress</div>
              </CardContent>
            </Card>
          </div>

          {/* Phases Timeline */}
          <div className="space-y-6">
            <h3 className="font-medium">Phase Timeline</h3>
            {filteredPhases.length > 0 ? (
              filteredPhases.map((phase, index) => (
                <PhaseCard key={phase.id} phase={phase} index={index} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Flag className="w-12 h-12 mx-auto mb-2" />
                  <p>No phases found</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalItems)} of {totalItems} phases
              </div>
              <div className="flex items-center space-x-2">
                <Select value={perPage.toString()} onValueChange={(value) => {
                  setPerPage(parseInt(value))
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
        </>
      )}

      {/* Phase Modal */}
      <PhaseModal
        open={showPhaseModal}
        onClose={() => {
          setShowPhaseModal(false)
          setEditingPhase(null)
        }}
        onSubmit={editingPhase ? handleUpdatePhase : handleCreatePhase}
        phase={editingPhase}
        projectId={projectId}
        projectName="Project Name"
        userId={user?.id || ''}
        userName={user?.name || ''}
        nextPhaseOrder={phases.length + 1}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePhaseId} onOpenChange={(open) => !open && setDeletePhaseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Phase</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this phase? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePhaseId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePhase}
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