import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Calendar as CalendarComponent } from '../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { cn } from '../../components/ui/utils'
import { format } from 'date-fns'
import { toast } from 'sonner@2.0.3'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchMyTimeEntries,
  fetchTimesheetSummary,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  clearError,
  setSelectedEntry
} from '../../store/slices/timesheetSlice'
import { CreateTimeEntryRequest, TimeEntry } from '../../services/timesheetApi'
import {
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Activity,
  Filter
} from 'lucide-react'

interface TimesheetProps {
  user?: any
}

export function Timesheet({ user }: TimesheetProps) {
  const dispatch = useAppDispatch()
  const {
    entries,
    summary,
    totalHours,
    billableHours,
    loading,
    error,
  } = useAppSelector((state) => state.timesheet)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })

  const [newEntry, setNewEntry] = useState<Partial<CreateTimeEntryRequest>>({
    project_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: 0,
    description: '',
    activity_type: 'development',
    billable: true,
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [myProjects, setMyProjects] = useState<any[]>([])

  // Fetch timesheet data
  useEffect(() => {
    dispatch(fetchMyTimeEntries({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }))
    dispatch(fetchTimesheetSummary({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }))
  }, [dispatch, dateRange])

  // Load my projects for time logging
  useEffect(() => {
    // This would fetch projects from MyProjects API
    // For now, we'll use the entries to extract unique projects
    const uniqueProjects = Array.from(
      new Set(entries.map(e => e.project_id))
    ).map(projectId => ({
      id: projectId,
      name: entries.find(e => e.project_id === projectId)?.project_name || 'Unknown Project'
    }))
    setMyProjects(uniqueProjects)
  }, [entries])

  const handleAddEntry = async () => {
    if (!newEntry.project_id || !newEntry.hours || newEntry.hours <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await dispatch(createTimeEntry(newEntry as CreateTimeEntryRequest)).unwrap()
      toast.success('Time entry added successfully')
      setShowAddDialog(false)
      setNewEntry({
        project_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: 0,
        description: '',
        activity_type: 'development',
        billable: true,
      })
    } catch (error) {
      toast.error(`Failed to add time entry: ${error}`)
    }
  }

  const handleEditEntry = async () => {
    if (!editingEntry) return

    try {
      await dispatch(updateTimeEntry({
        id: editingEntry.id,
        data: {
          hours: editingEntry.hours,
          description: editingEntry.description,
          activity_type: editingEntry.activity_type,
          billable: editingEntry.billable,
        }
      })).unwrap()
      toast.success('Time entry updated successfully')
      setShowEditDialog(false)
      setEditingEntry(null)
    } catch (error) {
      toast.error(`Failed to update time entry: ${error}`)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    try {
      await dispatch(deleteTimeEntry(id)).unwrap()
      toast.success('Time entry deleted successfully')
    } catch (error) {
      toast.error(`Failed to delete time entry: ${error}`)
    }
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

  // Show error if there's one
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Timesheet</h1>
          <p className="text-muted-foreground">
            Track and manage your working hours
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className="bg-[#28A745] hover:bg-[#218838] text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Time
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold">{totalHours.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                This period
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
              <DollarSign className="w-6 h-6 text-[#28A745]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entries</p>
              <p className="text-3xl font-bold">{entries.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Time entries logged
              </p>
            </div>
            <div className="p-3 bg-[#FFC107]/10 rounded-full">
              <Activity className="w-6 h-6 text-[#FFC107]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg/Day</p>
              <p className="text-3xl font-bold">
                {(totalHours / Math.max(1, Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 3600 * 24)))).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hours per day
              </p>
            </div>
            <div className="p-3 bg-[#DC3545]/10 rounded-full">
              <TrendingUp className="w-6 h-6 text-[#DC3545]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
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
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filter
          </Button>
        </div>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Task/Story</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">Loading time entries...</div>
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">No time entries found for this period</div>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
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
                    <div className="max-w-xs truncate">{entry.description}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{entry.hours.toFixed(2)}h</span>
                  </TableCell>
                  <TableCell>
                    {entry.billable ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Billable
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Non-Billable
                      </Badge>
                    )}
                    {entry.approved && (
                      <Badge variant="outline" className="ml-1 text-blue-600 border-blue-600">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => {
                          setEditingEntry(entry)
                          setShowEditDialog(true)
                        }}
                        disabled={entry.approved}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-destructive"
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={entry.approved}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Time Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Time Entry</DialogTitle>
            <DialogDescription>
              Record your working hours for a project or task
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Hours *</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={newEntry.hours}
                  onChange={(e) => setNewEntry({ ...newEntry, hours: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 8.5"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Project *</Label>
              <Select
                value={newEntry.project_id}
                onValueChange={(value) => setNewEntry({ ...newEntry, project_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {myProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Activity Type *</Label>
              <Select
                value={newEntry.activity_type}
                onValueChange={(value: any) => setNewEntry({ ...newEntry, activity_type: value })}
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
                  <SelectItem value="bug_fixing">Bug Fixing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Describe what you worked on..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="billable"
                checked={newEntry.billable}
                onChange={(e) => setNewEntry({ ...newEntry, billable: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="billable" className="cursor-pointer">
                Mark as billable
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} className="bg-[#28A745] hover:bg-[#218838]">
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Time Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Update your time entry details
            </DialogDescription>
          </DialogHeader>

          {editingEntry && (
            <div className="space-y-4">
              <div>
                <Label>Hours *</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={editingEntry.hours}
                  onChange={(e) => setEditingEntry({ ...editingEntry, hours: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Activity Type *</Label>
                <Select
                  value={editingEntry.activity_type}
                  onValueChange={(value: any) => setEditingEntry({ ...editingEntry, activity_type: value })}
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
                    <SelectItem value="bug_fixing">Bug Fixing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-billable"
                  checked={editingEntry.billable}
                  onChange={(e) => setEditingEntry({ ...editingEntry, billable: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-billable" className="cursor-pointer">
                  Mark as billable
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEntry} className="bg-[#007BFF] hover:bg-[#0056b3]">
              Update Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
