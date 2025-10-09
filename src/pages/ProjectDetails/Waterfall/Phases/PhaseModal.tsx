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
import { Phase, CreatePhaseRequest, UpdatePhaseRequest } from '../../../../services/phaseApi'

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

interface PhaseModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreatePhaseRequest | UpdatePhaseRequest) => Promise<void>
  phase?: Phase | null
  projectId: string
  projectName: string
  userId: string
  userName: string
  nextPhaseOrder: number
}

export function PhaseModal({
  open,
  onClose,
  onSubmit,
  phase,
  projectId,
  projectName,
  userId,
  userName,
  nextPhaseOrder
}: PhaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreatePhaseRequest>({
    name: '',
    description: '',
    project_id: projectId,
    project_name: projectName,
    phase_order: nextPhaseOrder,
    status: 'pending',
    progress: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    owner_id: userId,
    owner_name: userName,
    budget: 0,
    spent: 0,
    notes: ''
  })

  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [actualStartDate, setActualStartDate] = useState<Date | undefined>()
  const [actualEndDate, setActualEndDate] = useState<Date | undefined>()

  useEffect(() => {
    if (phase) {
      setFormData({
        name: phase.name,
        description: phase.description,
        project_id: phase.project_id,
        project_name: phase.project_name,
        phase_order: phase.phase_order,
        status: phase.status,
        progress: phase.progress,
        start_date: phase.start_date,
        end_date: phase.end_date,
        actual_start_date: phase.actual_start_date,
        actual_end_date: phase.actual_end_date,
        owner_id: phase.owner_id,
        owner_name: phase.owner_name,
        budget: phase.budget,
        spent: phase.spent || 0,
        notes: phase.notes || ''
      })
      setStartDate(new Date(phase.start_date))
      setEndDate(new Date(phase.end_date))
      if (phase.actual_start_date) setActualStartDate(new Date(phase.actual_start_date))
      if (phase.actual_end_date) setActualEndDate(new Date(phase.actual_end_date))
    } else {
      setFormData({
        name: '',
        description: '',
        project_id: projectId,
        project_name: projectName,
        phase_order: nextPhaseOrder,
        status: 'pending',
        progress: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        owner_id: userId,
        owner_name: userName,
        budget: 0,
        spent: 0,
        notes: ''
      })
      setStartDate(new Date())
      setEndDate(new Date())
      setActualStartDate(undefined)
      setActualEndDate(undefined)
    }
  }, [phase, projectId, projectName, userId, userName, nextPhaseOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        start_date: startDate ? startDate.toISOString().split('T')[0] : formData.start_date,
        end_date: endDate ? endDate.toISOString().split('T')[0] : formData.end_date,
        actual_start_date: actualStartDate ? actualStartDate.toISOString().split('T')[0] : undefined,
        actual_end_date: actualEndDate ? actualEndDate.toISOString().split('T')[0] : undefined,
      }

      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error submitting phase:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{phase ? 'Edit Phase' : 'Create New Phase'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Phase Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter phase name"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter phase description and objectives"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="phase_order">Phase Order *</Label>
              <Input
                id="phase_order"
                type="number"
                value={formData.phase_order}
                onChange={(e) => setFormData({ ...formData, phase_order: parseInt(e.target.value) })}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
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
              <Label htmlFor="budget">Budget ($) *</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <Label htmlFor="spent">Spent ($)</Label>
              <Input
                id="spent"
                type="number"
                value={formData.spent}
                onChange={(e) => setFormData({ ...formData, spent: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Start Date *</Label>
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
              <Label>End Date *</Label>
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

            <div>
              <Label>Actual Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {actualStartDate ? formatDate(actualStartDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={actualStartDate}
                    onSelect={setActualStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Actual End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {actualEndDate ? formatDate(actualEndDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={actualEndDate}
                    onSelect={setActualEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes and comments"
                rows={3}
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
                  {phase ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                phase ? 'Update Phase' : 'Create Phase'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
