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
import { Milestone, CreateMilestoneRequest, UpdateMilestoneRequest } from '../../../../services/milestoneApi'
import { Phase } from '../../../../services/phaseApi'

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

interface MilestoneModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateMilestoneRequest | UpdateMilestoneRequest) => Promise<void>
  milestone?: Milestone | null
  projectId: string
  projectName: string
  phases: Phase[]
  selectedPhaseId?: string
  userId: string
  userName: string
  nextMilestoneOrder: number
}

export function MilestoneModal({
  open,
  onClose,
  onSubmit,
  milestone,
  projectId,
  projectName,
  phases,
  selectedPhaseId,
  userId,
  userName,
  nextMilestoneOrder
}: MilestoneModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateMilestoneRequest>({
    name: '',
    description: '',
    project_id: projectId,
    project_name: projectName,
    phase_id: selectedPhaseId || '',
    phase_name: '',
    milestone_order: nextMilestoneOrder,
    status: 'pending',
    progress: 0,
    due_date: new Date().toISOString().split('T')[0],
    owner_id: userId,
    owner_name: userName,
    priority: 'medium',
    criteria: '',
    notes: ''
  })

  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  const [completionDate, setCompletionDate] = useState<Date | undefined>()

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name,
        description: milestone.description,
        project_id: milestone.project_id,
        project_name: milestone.project_name,
        phase_id: milestone.phase_id,
        phase_name: milestone.phase_name,
        milestone_order: milestone.milestone_order,
        status: milestone.status,
        progress: milestone.progress,
        due_date: milestone.due_date,
        completion_date: milestone.completion_date,
        owner_id: milestone.owner_id,
        owner_name: milestone.owner_name,
        priority: milestone.priority,
        criteria: milestone.criteria,
        notes: milestone.notes || ''
      })
      setDueDate(new Date(milestone.due_date))
      if (milestone.completion_date) setCompletionDate(new Date(milestone.completion_date))
    } else {
      const selectedPhase = phases.find(p => p.id === selectedPhaseId)
      setFormData({
        name: '',
        description: '',
        project_id: projectId,
        project_name: projectName,
        phase_id: selectedPhaseId || '',
        phase_name: selectedPhase?.name || '',
        milestone_order: nextMilestoneOrder,
        status: 'pending',
        progress: 0,
        due_date: new Date().toISOString().split('T')[0],
        owner_id: userId,
        owner_name: userName,
        priority: 'medium',
        criteria: '',
        notes: ''
      })
      setDueDate(new Date())
      setCompletionDate(undefined)
    }
  }, [milestone, projectId, projectName, selectedPhaseId, userId, userName, nextMilestoneOrder, phases])

  const handlePhaseChange = (phaseId: string) => {
    const selectedPhase = phases.find(p => p.id === phaseId)
    setFormData({
      ...formData,
      phase_id: phaseId,
      phase_name: selectedPhase?.name || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : formData.due_date,
        completion_date: completionDate ? completionDate.toISOString().split('T')[0] : undefined,
      }

      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error submitting milestone:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{milestone ? 'Edit Milestone' : 'Create New Milestone'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Milestone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter milestone name"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter milestone description"
                rows={3}
                required
              />
            </div>

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
              <Label htmlFor="milestone_order">Milestone Order *</Label>
              <Input
                id="milestone_order"
                type="number"
                value={formData.milestone_order}
                onChange={(e) => setFormData({ ...formData, milestone_order: parseInt(e.target.value) })}
                min="0"
                required
              />
            </div>

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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
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
              <Label>Completion Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {completionDate ? formatDate(completionDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={completionDate}
                    onSelect={setCompletionDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="col-span-2">
              <Label htmlFor="criteria">Completion Criteria *</Label>
              <Textarea
                id="criteria"
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                placeholder="Define the criteria for milestone completion"
                rows={3}
                required
              />
            </div>

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
                  {milestone ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                milestone ? 'Update Milestone' : 'Create Milestone'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
