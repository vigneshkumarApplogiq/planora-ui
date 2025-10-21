import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Calendar } from '../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  Flag,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Target,
  Star
} from 'lucide-react'
import { format } from "date-fns"

interface MilestonesViewProps {
  projectId: string
  user: any
}

// TODO: All milestone data is now fetched from API - no mock data needed
export function MilestonesView({ projectId, user }: MilestonesViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  // TODO: Fetch milestones from API
  const [milestones, setMilestones] = useState<any[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300'
      case 'at-risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'active': return <Target className="w-4 h-4 text-blue-600" />
      case 'pending': return <Clock className="w-4 h-4 text-gray-600" />
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'at-risk': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getMilestoneStatus = (milestone: any) => {
    if (milestone.status === 'completed') return 'completed'
    if (milestone.status === 'active') return 'active'
    
    const today = new Date()
    const daysUntilDue = Math.ceil((milestone.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) return 'overdue'
    if (daysUntilDue <= 7) return 'at-risk'
    return 'pending'
  }

  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.description.toLowerCase().includes(searchTerm.toLowerCase())
    const actualStatus = getMilestoneStatus(milestone)
    const matchesStatus = filterStatus === 'all' || actualStatus === filterStatus
    const matchesPriority = filterPriority === 'all' || milestone.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const MilestoneCard = ({ milestone }: { milestone: any }) => {
    const actualStatus = getMilestoneStatus(milestone)
    const completedCriteria = milestone.criteria.filter((c: any) => c.completed).length
    const totalCriteria = milestone.criteria.length
    const progressPercentage = totalCriteria > 0 ? (completedCriteria / totalCriteria) * 100 : 0
    
    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          selectedMilestone?.id === milestone.id ? 'ring-2 ring-[#28A745] ring-opacity-50' : ''
        }`}
        onClick={() => setSelectedMilestone(milestone)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(actualStatus)}
              <div>
                <h3 className="font-semibold text-foreground">{milestone.name}</h3>
                <p className="text-sm text-muted-foreground">{milestone.phase}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getPriorityColor(milestone.priority)}>
                {milestone.priority}
              </Badge>
              <Badge variant="outline" className={getStatusColor(actualStatus)}>
                {actualStatus.replace('-', ' ')}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{milestone.description}</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due Date</span>
              <span className={`font-medium ${
                actualStatus === 'overdue' ? 'text-red-600' :
                actualStatus === 'at-risk' ? 'text-yellow-600' :
                'text-foreground'
              }`}>
                {format(milestone.dueDate, 'MMM d, yyyy')}
              </span>
            </div>
            
            {milestone.completedDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">
                  {format(milestone.completedDate, 'MMM d, yyyy')}
                </span>
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Criteria Progress</span>
                <span className="font-medium">{completedCriteria}/{totalCriteria}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#28A745] h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#28A745] flex items-center justify-center text-white text-xs">
                  {milestone.assignee.avatar}
                </div>
                <span className="text-sm text-muted-foreground">{milestone.assignee.name}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{milestone.stakeholders.length} stakeholders</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const MilestoneDetails = ({ milestone }: { milestone: any }) => {
    const actualStatus = getMilestoneStatus(milestone)
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{milestone.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getStatusColor(actualStatus)}>
                {actualStatus.replace('-', ' ')}
              </Badge>
              <Button size="sm" variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-muted-foreground">{milestone.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{format(milestone.dueDate, 'MMM d, yyyy')}</span>
                </div>
                {milestone.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="text-green-600">{format(milestone.completedDate, 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phase:</span>
                  <span>{milestone.phase}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Assignment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#28A745] flex items-center justify-center text-white text-xs">
                    {milestone.assignee.avatar}
                  </div>
                  <span>{milestone.assignee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge variant="outline" className={getPriorityColor(milestone.priority)}>
                    {milestone.priority}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Completion Criteria</h4>
            <div className="space-y-2">
              {milestone.criteria.map((criterion: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-2 border rounded">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    criterion.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {criterion.completed && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${criterion.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {criterion.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Stakeholders</h4>
            <div className="flex flex-wrap gap-2">
              {milestone.stakeholders.map((stakeholder: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {stakeholder}
                </Badge>
              ))}
            </div>
          </div>
          
          {milestone.dependencies.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Dependencies</h4>
              <div className="space-y-1">
                {milestone.dependencies.map((dep: string, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {dep}
                  </div>
                ))}
              </div>
            </div>
          )}
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
          <p className="text-muted-foreground">Track key project milestones and deliverables</p>
        </div>
        
        <Button 
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Filters and Search */}
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
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Milestone Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#28A745]">{milestones.filter(m => m.status === 'completed').length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#007BFF]">{milestones.filter(m => m.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#6C757D]">{milestones.filter(m => getMilestoneStatus(m) === 'pending').length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#FFC107]">{milestones.filter(m => getMilestoneStatus(m) === 'at-risk').length}</div>
            <div className="text-xs text-muted-foreground">At Risk</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#DC3545]">{milestones.filter(m => getMilestoneStatus(m) === 'overdue').length}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-medium">Project Milestones</h3>
          {filteredMilestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>

        {/* Milestone Details */}
        <div>
          {selectedMilestone ? (
            <MilestoneDetails milestone={selectedMilestone} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Flag className="w-12 h-12 mx-auto mb-2" />
                <p>Select a milestone to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Milestone Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Milestone Name</Label>
              <Input placeholder="Enter milestone name" />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea placeholder="Enter milestone description and objectives" rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <Label htmlFor="phase">Associated Phase</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requirements">Requirements Analysis</SelectItem>
                  <SelectItem value="design">System Design</SelectItem>
                  <SelectItem value="implementation">Implementation</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="deployment">Deployment</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="bg-[#28A745] hover:bg-[#218838]">
                Create Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}