import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Calendar } from '../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Deliverable, CreateDeliverableRequest, UpdateDeliverableRequest } from '../../../../services/deliverableApi'
import { Phase } from '../../../../services/phaseApi'
import { Milestone } from '../../../../services/milestoneApi'

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

// Deliverable types
const DELIVERABLE_TYPES = [
  'Document',
  'Report',
  'Specification',
  'Design',
  'Code',
  'Test Plan',
  'Test Results',
  'User Manual',
  'Training Material',
  'Presentation',
  'Database Schema',
  'API Documentation',
  'Deployment Package',
  'Other'
]

interface DeliverableModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateDeliverableRequest | UpdateDeliverableRequest) => Promise<void>
  deliverable?: Deliverable | null
  projectId: string
  projectName: string
  phases: Phase[]
  milestones: Milestone[]
  teamMembers?: Array<{ id: string; name: string }>
  selectedPhaseId?: string
  selectedMilestoneId?: string
  userId: string
  userName: string
}

export function DeliverableModal({
  open,
  onClose,
  onSubmit,
  deliverable,
  projectId,
  projectName,
  phases,
  milestones,
  teamMembers = [],
  selectedPhaseId,
  selectedMilestoneId,
  userId,
  userName
}: DeliverableModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([])
  const [formData, setFormData] = useState<CreateDeliverableRequest>({
    name: '',
    description: '',
    project_id: projectId,
    project_name: projectName,
    phase_id: selectedPhaseId || '',
    phase_name: '',
    milestone_id: selectedMilestoneId || '',
    milestone_name: '',
    story_id: '',
    deliverable_type: 'Document',
    status: 'pending',
    progress: 0,
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    owner_id: userId,
    owner_name: userName,
    reviewer_id: '',
    reviewer_name: '',
    acceptance_criteria: '',
    review_comments: '',
    file_path: '',
    version: '1.0',
    notes: ''
  })

  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  const [submissionDate, setSubmissionDate] = useState<Date | undefined>()
  const [approvalDate, setApprovalDate] = useState<Date | undefined>()

  useEffect(() => {
    if (deliverable) {
      setFormData({
        name: deliverable.name,
        description: deliverable.description,
        project_id: deliverable.project_id,
        project_name: deliverable.project_name,
        phase_id: deliverable.phase_id,
        phase_name: deliverable.phase_name,
        milestone_id: deliverable.milestone_id,
        milestone_name: deliverable.milestone_name,
        story_id: deliverable.story_id,
        deliverable_type: deliverable.deliverable_type,
        status: deliverable.status,
        progress: deliverable.progress,
        priority: deliverable.priority,
        due_date: deliverable.due_date,
        submission_date: deliverable.submission_date,
        approval_date: deliverable.approval_date,
        owner_id: deliverable.owner_id,
        owner_name: deliverable.owner_name,
        reviewer_id: deliverable.reviewer_id,
        reviewer_name: deliverable.reviewer_name,
        acceptance_criteria: deliverable.acceptance_criteria,
        review_comments: deliverable.review_comments || '',
        file_path: deliverable.file_path || '',
        version: deliverable.version,
        notes: deliverable.notes || ''
      })
      setDueDate(new Date(deliverable.due_date))
      if (deliverable.submission_date) setSubmissionDate(new Date(deliverable.submission_date))
      if (deliverable.approval_date) setApprovalDate(new Date(deliverable.approval_date))
    } else {
      const selectedPhase = phases.find(p => p.id === selectedPhaseId)
      const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId)

      setFormData({
        name: '',
        description: '',
        project_id: projectId,
        project_name: projectName,
        phase_id: selectedPhaseId || '',
        phase_name: selectedPhase?.name || '',
        milestone_id: selectedMilestoneId || '',
        milestone_name: selectedMilestone?.name || '',
        story_id: '',
        deliverable_type: 'Document',
        status: 'pending',
        progress: 0,
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        owner_id: userId,
        owner_name: userName,
        reviewer_id: '',
        reviewer_name: '',
        acceptance_criteria: '',
        review_comments: '',
        file_path: '',
        version: '1.0',
        notes: ''
      })
      setDueDate(new Date())
      setSubmissionDate(undefined)
      setApprovalDate(undefined)
    }
  }, [deliverable, projectId, projectName, selectedPhaseId, selectedMilestoneId, userId, userName, phases, milestones])

  useEffect(() => {
    if (formData.phase_id) {
      const filtered = milestones.filter(m => m.phase_id === formData.phase_id)
      setFilteredMilestones(filtered)
    } else {
      setFilteredMilestones(milestones)
    }
  }, [formData.phase_id, milestones])

  const handlePhaseChange = (phaseId: string) => {
    const selectedPhase = phases.find(p => p.id === phaseId)
    setFormData({
      ...formData,
      phase_id: phaseId,
      phase_name: selectedPhase?.name || '',
      milestone_id: '',
      milestone_name: ''
    })
  }

  const handleMilestoneChange = (milestoneId: string) => {
    const selectedMilestone = filteredMilestones.find(m => m.id === milestoneId)
    setFormData({
      ...formData,
      milestone_id: milestoneId,
      milestone_name: selectedMilestone?.name || ''
    })
  }

  const handleReviewerChange = (reviewerId: string) => {
    const reviewer = teamMembers.find(m => m.id === reviewerId)
    setFormData({
      ...formData,
      reviewer_id: reviewerId,
      reviewer_name: reviewer?.name || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : formData.due_date,
        submission_date: submissionDate ? submissionDate.toISOString().split('T')[0] : undefined,
        approval_date: approvalDate ? approvalDate.toISOString().split('T')[0] : undefined,
      }

      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error submitting deliverable:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deliverable ? 'Edit Deliverable' : 'Create New Deliverable'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="col-span-2">
              <Label htmlFor="name">Deliverable Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter deliverable name"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter deliverable description"
                rows={3}
                required
              />
            </div>

            {/* Phase and Milestone */}
            <div>
              <Label htmlFor="phase">Phase *</Label>
              <Select
                value={formData.phase_id}
                onValueChange={handlePhaseChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id || ''}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="milestone">Milestone *</Label>
              <Select
                value={formData.milestone_id}
                onValueChange={handleMilestoneChange}
                disabled={!formData.phase_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMilestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id || ''}>
                      {milestone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type and Version */}
            <div>
              <Label htmlFor="deliverable_type">Deliverable Type *</Label>
              <Select
                value={formData.deliverable_type}
                onValueChange={(value) => setFormData({ ...formData, deliverable_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERABLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g., 1.0, 2.1"
                required
              />
            </div>

            {/* Status and Priority */}
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                min="0"
                max="100"
              />
            </div>

            {/* Reviewer */}
            <div>
              <Label htmlFor="reviewer">Reviewer *</Label>
              <Select
                value={formData.reviewer_id}
                onValueChange={handleReviewerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div>
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? formatDate(dueDate, "PPP") : <span>Pick a date</span>}
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

            <div>
              <Label>Submission Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {submissionDate ? formatDate(submissionDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={submissionDate}
                    onSelect={setSubmissionDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Approval Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {approvalDate ? formatDate(approvalDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={approvalDate}
                    onSelect={setApprovalDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* File Path */}
            <div className="col-span-2">
              <Label htmlFor="file_path">File Path / URL</Label>
              <Input
                id="file_path"
                value={formData.file_path}
                onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                placeholder="Enter file path or URL"
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="col-span-2">
              <Label htmlFor="acceptance_criteria">Acceptance Criteria *</Label>
              <Textarea
                id="acceptance_criteria"
                value={formData.acceptance_criteria}
                onChange={(e) => setFormData({ ...formData, acceptance_criteria: e.target.value })}
                placeholder="Define the acceptance criteria for this deliverable"
                rows={3}
                required
              />
            </div>

            {/* Review Comments */}
            <div className="col-span-2">
              <Label htmlFor="review_comments">Review Comments</Label>
              <Textarea
                id="review_comments"
                value={formData.review_comments}
                onChange={(e) => setFormData({ ...formData, review_comments: e.target.value })}
                placeholder="Add review comments or feedback"
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes and comments"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#28A745] hover:bg-[#218838]" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {deliverable ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                deliverable ? 'Update Deliverable' : 'Create Deliverable'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
