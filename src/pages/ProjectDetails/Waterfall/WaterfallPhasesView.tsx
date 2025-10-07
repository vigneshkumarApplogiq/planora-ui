import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Progress } from '../../../components/ui/progress'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
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
  AlertTriangle
} from 'lucide-react'

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

// Mock waterfall phases data
const mockPhases = [
  {
    id: 'PHASE-001',
    name: 'Requirements Analysis',
    description: 'Gather and analyze all project requirements, create specifications',
    status: 'completed',
    progress: 100,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-15'),
    actualEndDate: new Date('2024-02-12'),
    budget: 25000,
    actualCost: 24500,
    assignees: [
      { name: 'Emma Rodriguez', avatar: 'ER', role: 'Business Analyst' },
      { name: 'Alice Johnson', avatar: 'AJ', role: 'Project Manager' }
    ],
    deliverables: [
      { name: 'Requirements Document', status: 'completed' },
      { name: 'Technical Specifications', status: 'completed' },
      { name: 'User Stories', status: 'completed' }
    ],
    dependencies: [],
    risks: ['Incomplete requirements', 'Stakeholder availability']
  },
  {
    id: 'PHASE-002',
    name: 'System Design',
    description: 'Create system architecture and detailed design documents',
    status: 'completed',
    progress: 100,
    startDate: new Date('2024-02-16'),
    endDate: new Date('2024-03-15'),
    actualEndDate: new Date('2024-03-18'),
    budget: 35000,
    actualCost: 36200,
    assignees: [
      { name: 'Bob Chen', avatar: 'BC', role: 'Lead Architect' },
      { name: 'Carol Davis', avatar: 'CD', role: 'UI/UX Designer' }
    ],
    deliverables: [
      { name: 'System Architecture', status: 'completed' },
      { name: 'Database Design', status: 'completed' },
      { name: 'UI/UX Mockups', status: 'completed' },
      { name: 'API Design', status: 'completed' }
    ],
    dependencies: ['PHASE-001'],
    risks: ['Technical complexity', 'Design changes']
  },
  {
    id: 'PHASE-003',
    name: 'Implementation',
    description: 'Develop the system according to design specifications',
    status: 'active',
    progress: 65,
    startDate: new Date('2024-03-16'),
    endDate: new Date('2024-05-15'),
    actualEndDate: null,
    budget: 80000,
    actualCost: 48000,
    assignees: [
      { name: 'Bob Chen', avatar: 'BC', role: 'Lead Developer' },
      { name: 'Frank Miller', avatar: 'FM', role: 'Frontend Developer' },
      { name: 'Grace Kim', avatar: 'GK', role: 'Backend Developer' },
      { name: 'John Smith', avatar: 'JS', role: 'Full Stack Developer' }
    ],
    deliverables: [
      { name: 'Frontend Application', status: 'in-progress' },
      { name: 'Backend Services', status: 'in-progress' },
      { name: 'Database Implementation', status: 'completed' },
      { name: 'API Implementation', status: 'in-progress' }
    ],
    dependencies: ['PHASE-002'],
    risks: ['Resource availability', 'Technical challenges', 'Scope creep']
  },
  {
    id: 'PHASE-004',
    name: 'Testing',
    description: 'Comprehensive testing including unit, integration, and user acceptance testing',
    status: 'pending',
    progress: 0,
    startDate: new Date('2024-05-16'),
    endDate: new Date('2024-06-15'),
    actualEndDate: null,
    budget: 20000,
    actualCost: 0,
    assignees: [
      { name: 'David Wilson', avatar: 'DW', role: 'QA Lead' },
      { name: 'Sarah Wilson', avatar: 'SW', role: 'QA Engineer' }
    ],
    deliverables: [
      { name: 'Test Plans', status: 'pending' },
      { name: 'Test Cases', status: 'pending' },
      { name: 'Test Execution Report', status: 'pending' },
      { name: 'Bug Reports', status: 'pending' }
    ],
    dependencies: ['PHASE-003'],
    risks: ['Bug discovery', 'User acceptance issues']
  },
  {
    id: 'PHASE-005',
    name: 'Deployment',
    description: 'Deploy the system to production and provide user training',
    status: 'pending',
    progress: 0,
    startDate: new Date('2024-06-16'),
    endDate: new Date('2024-07-15'),
    actualEndDate: null,
    budget: 15000,
    actualCost: 0,
    assignees: [
      { name: 'Alex Chen', avatar: 'AC', role: 'DevOps Engineer' },
      { name: 'Alice Johnson', avatar: 'AJ', role: 'Project Manager' }
    ],
    deliverables: [
      { name: 'Production Deployment', status: 'pending' },
      { name: 'User Training Materials', status: 'pending' },
      { name: 'Go-Live Support', status: 'pending' },
      { name: 'Handover Documentation', status: 'pending' }
    ],
    dependencies: ['PHASE-004'],
    risks: ['Deployment issues', 'User adoption']
  },
  {
    id: 'PHASE-006',
    name: 'Maintenance',
    description: 'Ongoing maintenance and support after deployment',
    status: 'pending',
    progress: 0,
    startDate: new Date('2024-07-16'),
    endDate: new Date('2024-10-15'),
    actualEndDate: null,
    budget: 25000,
    actualCost: 0,
    assignees: [
      { name: 'Mike Johnson', avatar: 'MJ', role: 'Support Engineer' }
    ],
    deliverables: [
      { name: 'Support Documentation', status: 'pending' },
      { name: 'Monitoring Setup', status: 'pending' },
      { name: 'Performance Reports', status: 'pending' }
    ],
    dependencies: ['PHASE-005'],
    risks: ['System issues', 'Performance problems']
  }
]

export function WaterfallPhasesView({ projectId, user }: WaterfallPhasesViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPhase, setSelectedPhase] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())

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

  const filteredPhases = mockPhases.filter(phase => {
    const matchesSearch = phase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         phase.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || phase.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const PhaseCard = ({ phase, index }: { phase: any, index: number }) => {
    const isDelayed = phase.endDate < new Date() && phase.status !== 'completed'
    const actualStatus = isDelayed ? 'delayed' : phase.status
    
    return (
      <div className="relative">
        {/* Connection Line */}
        {index < mockPhases.length - 1 && (
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
                  <span className="text-white font-semibold">{index + 1}</span>
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
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{phase.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatDate(phase.startDate, 'MMM d')} - {formatDate(phase.endDate, 'MMM d, yyyy')}
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
                    <div className="flex items-center -space-x-1">
                      {phase.assignees.slice(0, 3).map((assignee: any, idx: number) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full bg-[#28A745] border-2 border-white flex items-center justify-center text-white text-xs"
                        >
                          {assignee.avatar}
                        </div>
                      ))}
                      {phase.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-muted border-2 border-white flex items-center justify-center text-xs text-muted-foreground">
                          +{phase.assignees.length - 3}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Flag className="w-3 h-3" />
                        <span>{phase.deliverables.length} deliverables</span>
                      </div>
                      {phase.dependencies.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <ArrowRight className="w-3 h-3" />
                          <span>{phase.dependencies.length} dependencies</span>
                        </div>
                      )}
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

  const PhaseDetails = ({ phase }: { phase: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{phase.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getStatusColor(phase.status)}>
              {phase.status}
            </Badge>
            <Button size="sm" variant="outline">
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
                <span>{formatDate(phase.startDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span>{formatDate(phase.endDate, 'MMM d, yyyy')}</span>
              </div>
              {phase.actualEndDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual End:</span>
                  <span>{formatDate(phase.actualEndDate, 'MMM d, yyyy')}</span>
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
                <span>${phase.actualCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span>${(phase.budget - phase.actualCost).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Team Members</h4>
          <div className="space-y-2">
            {phase.assignees.map((assignee: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-2 border rounded">
                <div className="w-8 h-8 rounded-full bg-[#28A745] flex items-center justify-center text-white text-sm">
                  {assignee.avatar}
                </div>
                <div>
                  <p className="font-medium text-sm">{assignee.name}</p>
                  <p className="text-xs text-muted-foreground">{assignee.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Deliverables</h4>
          <div className="space-y-2">
            {phase.deliverables.map((deliverable: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">{deliverable.name}</span>
                <Badge variant="outline" className={getDeliverableStatusColor(deliverable.status)}>
                  {deliverable.status.replace('-', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        {phase.risks.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Risks</h4>
            <div className="space-y-1">
              {phase.risks.map((risk: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-muted-foreground">{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

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
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Phase
        </Button>
      </div>

      {/* Filters and Search */}
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
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Phase Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#28A745]">{mockPhases.filter(p => p.status === 'completed').length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#007BFF]">{mockPhases.filter(p => p.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#6C757D]">{mockPhases.filter(p => p.status === 'pending').length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#FFC107]">
              {Math.round(mockPhases.reduce((sum, p) => sum + p.progress, 0) / mockPhases.length)}%
            </div>
            <div className="text-xs text-muted-foreground">Overall Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#6F42C1]">
              ${(mockPhases.reduce((sum, p) => sum + p.budget, 0) / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-muted-foreground">Total Budget</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phases Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-medium">Phase Timeline</h3>
          {filteredPhases.map((phase, index) => (
            <PhaseCard key={phase.id} phase={phase} index={index} />
          ))}
        </div>

        {/* Phase Details */}
        <div>
          {selectedPhase ? (
            <PhaseDetails phase={selectedPhase} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Flag className="w-12 h-12 mx-auto mb-2" />
                <p>Select a phase to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Phase Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Phase Name</Label>
              <Input placeholder="Enter phase name" />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea placeholder="Enter phase description and objectives" rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? formatDate(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? formatDate(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <Label htmlFor="budget">Budget</Label>
              <Input type="number" placeholder="Enter budget amount" />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="bg-[#28A745] hover:bg-[#218838]">
                Create Phase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}