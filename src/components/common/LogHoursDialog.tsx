import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAppDispatch } from '../../store/hooks'
import { createTimeEntry } from '../../store/slices/timesheetSlice'
import { CreateTimeEntryRequest, TimeEntryAttachment } from '../../services/timesheetApi'
import { timesheetApiService } from '../../services/timesheetApi'
import { Clock, Upload, X, FileText, Check, Send } from 'lucide-react'

interface LogHoursDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  taskId?: string
  storyId?: string
  taskName?: string
  onSuccess?: () => void
}

export function LogHoursDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  storyId,
  taskName,
  onSuccess
}: LogHoursDialogProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<Partial<CreateTimeEntryRequest>>({
    project_id: projectId,
    task_id: taskId,
    story_id: storyId,
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    hours: 0,
    description: '',
    notes: '',
    activity_type: 'development',
    billable: true,
    status: 'draft'
  })

  // Calculate hours based on start and end time
  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0

    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)

    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    let diffMinutes = endTotalMinutes - startTotalMinutes

    // Handle case where end time is on the next day
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60
    }

    return Number((diffMinutes / 60).toFixed(2))
  }

  // Update hours when start or end time changes
  const handleStartTimeChange = (time: string) => {
    const hours = calculateHours(time, formData.end_time || '17:00')
    setFormData({ ...formData, start_time: time, hours })
  }

  const handleEndTimeChange = (time: string) => {
    const hours = calculateHours(formData.start_time || '09:00', time)
    setFormData({ ...formData, end_time: time, hours })
  }

  // Calculate initial hours when component mounts or dialog opens
  useEffect(() => {
    if (open && formData.start_time && formData.end_time) {
      const initialHours = calculateHours(formData.start_time, formData.end_time)
      if (formData.hours !== initialHours) {
        setFormData(prev => ({ ...prev, hours: initialHours }))
      }
    }
  }, [open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveDraft = async () => {
    if (!formData.hours || formData.hours <= 0) {
      toast.error('Please enter valid hours')
      return
    }

    if (!formData.description?.trim()) {
      toast.error('Please provide a description')
      return
    }

    setLoading(true)
    try {
      // Create entry as draft
      const entry = await dispatch(createTimeEntry({
        ...formData as CreateTimeEntryRequest,
        status: 'draft'
      })).unwrap()

      // Upload attachments if any
      if (attachments.length > 0) {
        setUploadingFile(true)
        for (const file of attachments) {
          await timesheetApiService.uploadAttachment(entry.id, file)
        }
        setUploadingFile(false)
      }

      toast.success('Time entry saved as draft')
      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(`Failed to save: ${error}`)
    } finally {
      setLoading(false)
      setUploadingFile(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!formData.hours || formData.hours <= 0) {
      toast.error('Please enter valid hours')
      return
    }

    if (!formData.description?.trim()) {
      toast.error('Please provide a description')
      return
    }

    setSubmitting(true)
    try {
      // Create entry as submitted
      const entry = await dispatch(createTimeEntry({
        ...formData as CreateTimeEntryRequest,
        status: 'submitted'
      })).unwrap()

      // Upload attachments if any
      if (attachments.length > 0) {
        setUploadingFile(true)
        for (const file of attachments) {
          await timesheetApiService.uploadAttachment(entry.id, file)
        }
        setUploadingFile(false)
      }

      toast.success('Time entry submitted for approval')
      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(`Failed to submit: ${error}`)
    } finally {
      setSubmitting(false)
      setUploadingFile(false)
    }
  }

  const resetForm = () => {
    setFormData({
      project_id: projectId,
      task_id: taskId,
      story_id: storyId,
      date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      hours: 8,
      description: '',
      notes: '',
      activity_type: 'development',
      billable: true,
      status: 'draft'
    })
    setAttachments([])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#007BFF]" />
            <span>Log Hours</span>
          </DialogTitle>
          <DialogDescription>
            {taskName ? `Log time for: ${taskName}` : 'Record your working hours'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Start Time and End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Calculated Hours Display */}
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-[#007BFF]" />
            <span className="font-medium">Total Hours:</span>
            <Badge variant="secondary" className="text-base">
              {formData.hours?.toFixed(2) || '0.00'} hours
            </Badge>
          </div>

          {/* Activity Type */}
          <div>
            <Label htmlFor="activity">Activity Type *</Label>
            <Select
              value={formData.activity_type}
              onValueChange={(value: any) => setFormData({ ...formData, activity_type: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="review">Code Review</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="bug_fix">Bug Fix</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="deployment">Deployment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Work Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you worked on..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Billable Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="billable"
              checked={formData.billable}
              onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="billable" className="cursor-pointer">
              Mark as billable
            </Label>
          </div>

          {/* File Attachments */}
          <div>
            <Label>Attachments (Optional)</Label>
            <div className="mt-2">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
              />
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </span>
                </Button>
              </label>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div className="text-sm">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || submitting}>
            Cancel
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={loading || submitting || uploadingFile}
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button
              onClick={handleSubmitForApproval}
              disabled={loading || submitting || uploadingFile}
              className="bg-[#28A745] hover:bg-[#218838]"
            >
              {submitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
