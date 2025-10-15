import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Checkbox } from '../../components/ui/checkbox'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { timesheetApiService, TimeEntry } from '../../services/timesheetApi'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Filter,
  Download,
  FileText,
  Eye,
  CheckSquare
} from 'lucide-react'
import { cn } from '../../components/ui/utils'

export function ApprovalManagement() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })

  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingEntries, setRejectingEntries] = useState<string[]>([])

  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingEntry, setViewingEntry] = useState<TimeEntry | null>(null)

  useEffect(() => {
    fetchPendingApprovals()
  }, [dateRange])

  const fetchPendingApprovals = async () => {
    setLoading(true)
    try {
      const response = await timesheetApiService.getPendingApprovals({
        start_date: dateRange.start,
        end_date: dateRange.end,
      })
      setEntries(response.items)
    } catch (error) {
      toast.error(`Failed to load pending approvals: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(filteredEntries.map(e => e.id)))
    }
  }

  const handleApproveSelected = async () => {
    if (selectedEntries.size === 0) {
      toast.error('No entries selected')
      return
    }

    try {
      const ids = Array.from(selectedEntries)
      await timesheetApiService.bulkApprove(ids)
      toast.success(`Approved ${ids.length} time entries`)
      setSelectedEntries(new Set())
      fetchPendingApprovals()
    } catch (error) {
      toast.error(`Failed to approve entries: ${error}`)
    }
  }

  const handleRejectSelected = () => {
    if (selectedEntries.size === 0) {
      toast.error('No entries selected')
      return
    }
    setRejectingEntries(Array.from(selectedEntries))
    setShowRejectDialog(true)
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      await timesheetApiService.bulkReject(rejectingEntries, rejectReason)
      toast.success(`Rejected ${rejectingEntries.length} time entries`)
      setSelectedEntries(new Set())
      setShowRejectDialog(false)
      setRejectReason('')
      setRejectingEntries([])
      fetchPendingApprovals()
    } catch (error) {
      toast.error(`Failed to reject entries: ${error}`)
    }
  }

  const handleApproveSingle = async (entryId: string) => {
    try {
      await timesheetApiService.approveTimeEntry(entryId)
      toast.success('Time entry approved')
      fetchPendingApprovals()
    } catch (error) {
      toast.error(`Failed to approve: ${error}`)
    }
  }

  const handleRejectSingle = (entryId: string) => {
    setRejectingEntries([entryId])
    setShowRejectDialog(true)
  }

  const handleViewEntry = (entry: TimeEntry) => {
    setViewingEntry(entry)
    setShowViewDialog(true)
  }

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'development': return 'bg-blue-500'
      case 'testing': return 'bg-yellow-500'
      case 'design': return 'bg-purple-500'
      case 'review': return 'bg-green-500'
      case 'meeting': return 'bg-orange-500'
      case 'documentation': return 'bg-indigo-500'
      case 'bug_fixing': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getActivityLabel = (activity: string) => {
    return activity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const filteredEntries = entries.filter(entry => {
    if (filterProject !== 'all' && entry.project_id !== filterProject) return false
    if (filterUser !== 'all' && entry.user_id !== filterUser) return false
    return true
  })

  const uniqueProjects = Array.from(new Set(entries.map(e => e.project_id)))
  const uniqueUsers = Array.from(new Set(entries.map(e => e.user_id)))

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0)
  const billableHours = filteredEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Approval Management</h1>
          <p className="text-muted-foreground">
            Review and approve pending time entries
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold">{filteredEntries.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Entries awaiting approval
              </p>
            </div>
            <div className="p-3 bg-[#FFC107]/10 rounded-full">
              <Clock className="w-6 h-6 text-[#FFC107]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold">{totalHours.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pending approval
              </p>
            </div>
            <div className="p-3 bg-[#007BFF]/10 rounded-full">
              <Clock className="w-6 h-6 text-[#007BFF]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billable Hours</p>
              <p className="text-3xl font-bold">{billableHours.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Can be invoiced
              </p>
            </div>
            <div className="p-3 bg-[#28A745]/10 rounded-full">
              <CheckCircle className="w-6 h-6 text-[#28A745]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Selected</p>
              <p className="text-3xl font-bold">{selectedEntries.size}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Entries selected
              </p>
            </div>
            <div className="p-3 bg-[#DC3545]/10 rounded-full">
              <CheckSquare className="w-6 h-6 text-[#DC3545]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label>From:</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label>To:</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-40"
            />
          </div>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map(projectId => (
                <SelectItem key={projectId} value={projectId}>
                  {entries.find(e => e.project_id === projectId)?.project_name || projectId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {selectedEntries.size > 0 && (
            <>
              <Button
                size="sm"
                className="bg-[#28A745] hover:bg-[#218838]"
                onClick={handleApproveSelected}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected ({selectedEntries.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleRejectSelected}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Selected
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Entries Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-muted-foreground">Loading pending approvals...</div>
                </TableCell>
              </TableRow>
            ) : filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-muted-foreground">No pending approvals</div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEntries.has(entry.id)}
                      onCheckedChange={() => handleSelectEntry(entry.id)}
                    />
                  </TableCell>
                  <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#007BFF] text-white flex items-center justify-center text-xs">
                        {entry.user_name?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <span>{entry.user_name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{entry.project_name || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {entry.task_name || entry.task_id || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-white', getActivityColor(entry.activity_type))}>
                      {getActivityLabel(entry.activity_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{entry.hours.toFixed(2)}h</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {entry.billable && (
                        <Badge variant="outline" className="text-green-600 border-green-600 w-fit">
                          Billable
                        </Badge>
                      )}
                      {entry.attachments && entry.attachments.length > 0 && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600 w-fit">
                          <FileText className="w-3 h-3 mr-1" />
                          {entry.attachments.length} files
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => handleViewEntry(entry)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-green-600 hover:text-green-700"
                        onClick={() => handleApproveSingle(entry.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-destructive hover:text-destructive"
                        onClick={() => handleRejectSingle(entry.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Time Entries</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {rejectingEntries.length} time {rejectingEntries.length === 1 ? 'entry' : 'entries'}
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why these entries are being rejected..."
              rows={4}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Reject Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Time Entry Details</DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{format(new Date(viewingEntry.date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hours</Label>
                  <p className="font-medium">{viewingEntry.hours.toFixed(2)} hours</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{viewingEntry.user_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Activity Type</Label>
                  <Badge className={cn('text-white mt-1', getActivityColor(viewingEntry.activity_type))}>
                    {getActivityLabel(viewingEntry.activity_type)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Project</Label>
                <p className="font-medium">{viewingEntry.project_name || 'N/A'}</p>
              </div>

              {viewingEntry.task_name && (
                <div>
                  <Label className="text-muted-foreground">Task</Label>
                  <p className="font-medium">{viewingEntry.task_name}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm">{viewingEntry.description}</p>
              </div>

              {viewingEntry.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm">{viewingEntry.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Billable</Label>
                <p className="mt-1">{viewingEntry.billable ? 'Yes' : 'No'}</p>
              </div>

              {viewingEntry.attachments && viewingEntry.attachments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Attachments</Label>
                  <div className="mt-2 space-y-2">
                    {viewingEntry.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{attachment.filename}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {viewingEntry && (
              <>
                <Button
                  onClick={() => {
                    handleApproveSingle(viewingEntry.id)
                    setShowViewDialog(false)
                  }}
                  className="bg-[#28A745] hover:bg-[#218838]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setShowViewDialog(false)
                    handleRejectSingle(viewingEntry.id)
                  }}
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
