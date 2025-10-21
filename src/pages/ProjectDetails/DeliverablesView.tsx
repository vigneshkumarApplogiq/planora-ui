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
import { Progress } from '../../components/ui/progress'
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Paperclip,
  Star,
  Archive
} from 'lucide-react'
import { format } from "date-fns"

interface DeliverablesViewProps {
  projectId: string
  user: any
}

// TODO: All deliverable data is now fetched from API - no mock data needed
export function DeliverablesView({ projectId, user }: DeliverablesViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPhase, setFilterPhase] = useState('all')
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  // TODO: Fetch deliverables from API
  const [deliverables, setDeliverables] = useState<any[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300'
      case 'in-review': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'submitted': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'design': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'technical': return 'bg-green-100 text-green-800 border-green-300'
      case 'documentation': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'testing': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in-review': return <Eye className="w-4 h-4 text-blue-600" />
      case 'submitted': return <Upload className="w-4 h-4 text-purple-600" />
      case 'in-progress': return <Edit className="w-4 h-4 text-yellow-600" />
      case 'draft': return <FileText className="w-4 h-4 text-gray-600" />
      case 'rejected': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'docx': return '📝'
      case 'fig': return '🎨'
      case 'vsdx': return '📊'
      case 'sql': return '🗄️'
      case 'html': return '🌐'
      case 'png': return '🖼️'
      default: return '📎'
    }
  }

  const filteredDeliverables = deliverables.filter(deliverable => {
    const matchesSearch = deliverable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deliverable.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || deliverable.status === filterStatus
    const matchesType = filterType === 'all' || deliverable.type === filterType
    const matchesPhase = filterPhase === 'all' || deliverable.phase === filterPhase
    
    return matchesSearch && matchesStatus && matchesType && matchesPhase
  })

  const DeliverableCard = ({ deliverable }: { deliverable: any }) => {
    const metCriteria = deliverable.approvalCriteria.filter((c: any) => c.met).length
    const totalCriteria = deliverable.approvalCriteria.length
    const progressPercentage = totalCriteria > 0 ? (metCriteria / totalCriteria) * 100 : 0
    
    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          selectedDeliverable?.id === deliverable.id ? 'ring-2 ring-[#28A745] ring-opacity-50' : ''
        }`}
        onClick={() => setSelectedDeliverable(deliverable)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(deliverable.status)}
              <div>
                <h3 className="font-semibold text-foreground">{deliverable.name}</h3>
                <p className="text-sm text-muted-foreground">{deliverable.phase} • v{deliverable.version}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getTypeColor(deliverable.type)}>
                {deliverable.type}
              </Badge>
              <Badge variant="outline" className={getStatusColor(deliverable.status)}>
                {deliverable.status.replace('-', ' ')}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{deliverable.description}</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due Date</span>
              <span className={`font-medium ${
                deliverable.dueDate < new Date() && deliverable.status !== 'approved' ? 'text-red-600' : 'text-foreground'
              }`}>
                {format(deliverable.dueDate, 'MMM d, yyyy')}
              </span>
            </div>
            
            {deliverable.submittedDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">{format(deliverable.submittedDate, 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {deliverable.approvedDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-medium text-green-600">{format(deliverable.approvedDate, 'MMM d, yyyy')}</span>
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Approval Criteria</span>
                <span className="font-medium">{metCriteria}/{totalCriteria}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#28A745] flex items-center justify-center text-white text-xs">
                  {deliverable.assignee.avatar}
                </div>
                <span className="text-sm text-muted-foreground">{deliverable.assignee.name}</span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{deliverable.attachments.length}</span>
                </div>
                <span>{deliverable.fileSize}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const DeliverableDetails = ({ deliverable }: { deliverable: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{deliverable.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getStatusColor(deliverable.status)}>
              {deliverable.status.replace('-', ' ')}
            </Badge>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
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
          <p className="text-muted-foreground">{deliverable.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className={getTypeColor(deliverable.type)}>
                  {deliverable.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>v{deliverable.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span>{deliverable.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span>{deliverable.fileSize}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{format(deliverable.dueDate, 'MMM d, yyyy')}</span>
              </div>
              {deliverable.submittedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{format(deliverable.submittedDate, 'MMM d, yyyy')}</span>
                </div>
              )}
              {deliverable.approvedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved:</span>
                  <span className="text-green-600">{format(deliverable.approvedDate, 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Assignment</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#28A745] flex items-center justify-center text-white text-xs">
                  {deliverable.assignee.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium">{deliverable.assignee.name}</p>
                  <p className="text-xs text-muted-foreground">Assignee</p>
                </div>
              </div>
              {deliverable.reviewer && (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#007BFF] flex items-center justify-center text-white text-xs">
                    {deliverable.reviewer.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{deliverable.reviewer.name}</p>
                    <p className="text-xs text-muted-foreground">Reviewer</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Phase</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phase:</span>
                <span>{deliverable.phase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant="outline" className={
                  deliverable.priority === 'high' ? 'bg-red-100 text-red-800 border-red-300' :
                  deliverable.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                  'bg-green-100 text-green-800 border-green-300'
                }>
                  {deliverable.priority}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Approval Criteria</h4>
          <div className="space-y-2">
            {deliverable.approvalCriteria.map((criterion: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-2 border rounded">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  criterion.met 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {criterion.met && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${criterion.met ? 'line-through text-muted-foreground' : ''}`}>
                  {criterion.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Attachments</h4>
          <div className="space-y-2">
            {deliverable.attachments.map((attachment: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded hover:bg-muted cursor-pointer">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(attachment.type)}</span>
                  <div>
                    <p className="text-sm font-medium">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{attachment.size}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {deliverable.comments.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Comments</h4>
            <div className="space-y-3">
              {deliverable.comments.map((comment: any, index: number) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">{comment.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
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
          <h2 className="text-2xl font-semibold">Deliverables</h2>
          <p className="text-muted-foreground">Manage project deliverables and documentation</p>
        </div>
        
        <Button 
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Deliverable
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search deliverables..."
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
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in-review">In Review</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="documentation">Documentation</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterPhase} onValueChange={setFilterPhase}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="Requirements Analysis">Requirements</SelectItem>
            <SelectItem value="System Design">Design</SelectItem>
            <SelectItem value="Implementation">Implementation</SelectItem>
            <SelectItem value="Testing">Testing</SelectItem>
            <SelectItem value="Deployment">Deployment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliverable Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#28A745]">{deliverables.filter(d => d.status === 'approved').length}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#007BFF]">{deliverables.filter(d => d.status === 'in-review').length}</div>
            <div className="text-xs text-muted-foreground">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#6F42C1]">{deliverables.filter(d => d.status === 'submitted').length}</div>
            <div className="text-xs text-muted-foreground">Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#FFC107]">{deliverables.filter(d => d.status === 'in-progress').length}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#6C757D]">{deliverables.filter(d => d.status === 'draft').length}</div>
            <div className="text-xs text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#DC3545]">
              {deliverables.filter(d => d.dueDate < new Date() && d.status !== 'approved').length}
            </div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliverables List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-medium">Project Deliverables</h3>
          {filteredDeliverables.map((deliverable) => (
            <DeliverableCard key={deliverable.id} deliverable={deliverable} />
          ))}
        </div>

        {/* Deliverable Details */}
        <div>
          {selectedDeliverable ? (
            <DeliverableDetails deliverable={selectedDeliverable} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p>Select a deliverable to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Deliverable Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Deliverable Name</Label>
              <Input placeholder="Enter deliverable name" />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea placeholder="Enter deliverable description" rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phase">Phase</Label>
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
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="bg-[#28A745] hover:bg-[#218838]">
                Create Deliverable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}