import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import {
  Kanban,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Activity
} from 'lucide-react'
import { projectApiService } from '../../../services/projectApi'
import { storiesApiService } from '../../../services/storiesApi'

interface KanbanProjectDashboardProps {
  project: any
  user: any
  masterData?: any
  masterLoading?: boolean
}

export function KanbanProjectDashboard({ project, user, masterData: propMasterData, masterLoading: propMasterLoading }: KanbanProjectDashboardProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<any[]>([])

  // Use master data from props or local state (for backwards compatibility)
  const masterData = propMasterData
  const masterLoading = propMasterLoading || false

  // Load tasks only (master data comes from parent)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Load tasks if project ID is available
        if (project?.id) {
          const tasksResponse = await storiesApiService.getStories(project.id, 1, 100)
          setTasks(tasksResponse.items || [])

          // Create columns from master statuses with task counts
          if (masterData?.statuses) {
            const columnsData = masterData.statuses
              .filter((status: any) => status.is_active)
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((status: any) => {
                const statusId = status.name.toLowerCase().replace(/\s+/g, '-')
                const count = tasksResponse.items.filter((task: any) =>
                  task.status?.toLowerCase().replace(/\s+/g, '-') === statusId
                ).length

                return {
                  name: status.name,
                  count: count,
                  limit: status.name.toLowerCase().includes('done') ? null : 10
                }
              })
            setColumns(columnsData)
            console.log('✅ [Kanban Dashboard] Columns created:', columnsData)
          }
        }
      } catch (error) {
        console.error('❌ [Kanban Dashboard] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only load data when masterData is available
    if (masterData) {
      loadData()
    }
  }, [project?.id, masterData])

  const totalTasks = columns.reduce((sum, col) => sum + col.count, 0)
  const completedTasks = columns.find(col => col.name.toLowerCase().includes('done'))?.count || 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading || masterLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Kanban Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Kanban className="w-5 h-5 text-[#007BFF]" />
              <span>Kanban Board Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${columns.length <= 4 ? 'grid-cols-6' : 'grid-cols-6'}`}>
              {columns.map((column) => (
                <div key={column.name} className="text-center">
                  <div className="mb-2">
                    <h4 className="text-sm font-medium">{column.name}</h4>
                    {column.limit && (
                      <div className="text-xs text-muted-foreground">
                        Limit: {column.limit}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold">{column.count}</span>
                    </div>

                    {column.limit && column.count >= column.limit && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">!</span>
                      </div>
                    )}
                  </div>

                  {column.limit && (
                    <div className="mt-2">
                      <Progress
                        value={(column.count / column.limit) * 100}
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Under Limit</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>At Limit</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Over Limit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#28A745]" />
              <span>Flow Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Total Tasks</span>
                <Badge variant="outline" className="bg-[#007BFF]/10 text-[#007BFF] border-[#007BFF]/30">
                  Active
                </Badge>
              </div>
              <div className="text-2xl font-semibold">{totalTasks}</div>
              <div className="text-xs text-muted-foreground">
                Across all columns
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge variant="outline" className="bg-[#28A745]/10 text-[#28A745] border-[#28A745]/30">
                  Done
                </Badge>
              </div>
              <div className="text-2xl font-semibold">{completedTasks}</div>
              <div className="text-xs text-muted-foreground">
                Tasks completed
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-[#28A745]">
                  {completionRate}%
                </div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WIP Limits Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#28A745]/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#28A745]" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {columns.filter(col => col.limit && col.count < col.limit).length}
                </div>
                <div className="text-xs text-muted-foreground">Columns Under Limit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#FFC107]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#FFC107]" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {columns.filter(col => col.limit && col.count === col.limit).length}
                </div>
                <div className="text-xs text-muted-foreground">Columns At Limit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#DC3545]/10 rounded-lg">
                <Activity className="w-5 h-5 text-[#DC3545]" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {columns.filter(col => col.limit && col.count > col.limit).length}
                </div>
                <div className="text-xs text-muted-foreground">Columns Over Limit</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#6F42C1]" />
            <span>Team Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project?.team_members_detail && project.team_members_detail.length > 0 ? (
              project.team_members_detail.slice(0, 4).map((member: any) => {
                const memberTasks = tasks.filter((task: any) => task.assignee_id === member.id)
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#28A745] text-white text-xs">
                          {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role_name}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-center">
                      <div>
                        <div className="text-sm font-semibold">
                          {memberTasks.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Tasks</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {memberTasks.filter((t: any) => t.status?.toLowerCase().includes('done')).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No team members assigned
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}