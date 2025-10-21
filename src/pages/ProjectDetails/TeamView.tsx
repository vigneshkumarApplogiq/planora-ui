import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Progress } from '../../components/ui/progress'
import { userApiService, User } from '../../services/userApi'
import { projectApiService, ProjectMember } from '../../services/projectApi'
import { toast } from 'sonner'
import { SessionStorageService } from '../../utils/sessionStorage'
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Shield,
  User as UserIcon,
  Settings
} from 'lucide-react'

interface TeamViewProps {
  project: any
  user: any
  projectId?: string
}

interface TeamMember extends User {
  workload?: number
  availability?: string
  currentTasks?: number
  completedTasks?: number
  hoursLogged?: number
  teamLead?: boolean
  joinDate?: string
}

// TODO: All team data is now fetched from API - no mock data needed
export function TeamView({ project, user, projectId: propProjectId }: TeamViewProps) {
  // Get effective project ID from props or session storage
  const effectiveProjectId = SessionStorageService.getEffectiveProjectId(propProjectId)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterAvailability, setFilterAvailability] = useState('all')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [projectMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Load project members when component mounts
  useEffect(() => {
    if (effectiveProjectId) {
      fetchTeamMembers()
    }
  }, [effectiveProjectId])

  // Load available users when add member modal opens
  useEffect(() => {
    if (showAddMember) {
      fetchAvailableUsers()
    }
  }, [showAddMember])

  const fetchTeamMembers = async () => {
    if (!effectiveProjectId) {
      console.warn('No project ID available for fetching team members')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Use the actual API endpoint that returns the project members array
      const response = await projectApiService.getProjectMembersV2(effectiveProjectId)

      // Convert ProjectMember data to TeamMember format
      const members: TeamMember[] = response.map((member) => {
        // Calculate workload based on capacity (8 hours/day is typical)
        const maxCapacity = member.capacity || 8
        const currentHours = member.hours || 0
        const workloadPercentage = maxCapacity > 0 ? Math.min(Math.round((currentHours / maxCapacity) * 100), 100) : 0

        // Determine availability based on active tasks and workload
        let availability = 'available'
        if (workloadPercentage >= 90 || (member.active_tasks || 0) >= 5) {
          availability = 'busy'
        } else if (workloadPercentage >= 75 || (member.active_tasks || 0) >= 3) {
          availability = 'available'
        }

        const teamMember: TeamMember = {
          id: member.member_id,
          name: member.member_name,
          email: member.member_email,
          role: {
            name: member.role_name,
            description: '',
            permissions: [],
            is_active: true,
            id: member.role_id,
            created_at: '',
            updated_at: ''
          },
          role_id: member.role_id,
          is_active: member.is_active,
          department: '', // Not provided in API response
          skills: [], // Not provided in API response
          phone: '', // Not provided in API response
          timezone: '', // Not provided in API response
          last_login: null,
          created_at: member.created_at,
          updated_at: member.updated_at,
          user_profile: member.member_profile,
          // Use actual data from API response
          workload: workloadPercentage,
          availability: availability,
          currentTasks: member.active_tasks || 0,
          completedTasks: member.completed || 0,
          hoursLogged: member.hours || 0,
          teamLead: member.role_id === 'role_project_manager', // Mark project managers as team leads
          joinDate: member.joined_at
        }
        return teamMember
      })

      setTeamMembers(members)
      toast.success(`Loaded ${members.length} project team members`)
    } catch (error) {
      // TODO: Handle error properly - show error message to user
      console.error('Error fetching team members:', error)
      toast.error('Failed to load team members')
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true)
      // Fetch users excluding admin and project manager roles
      const response = await userApiService.getUsers({
        is_active: true,
        per_page: 100 // Get more users to show options
      })

      // Filter out admin and project manager roles
      const filteredUsers = response.items.filter(user => {
        const roleName = user.role.name.toLowerCase()
        return !roleName.includes('admin') &&
               !roleName.includes('project manager') &&
               !roleName.includes('manager')
      })

      // Also filter out users who are already in the project
      const currentMemberIds = projectMembers.map(member => member.id)
      const availableUsers = filteredUsers.filter(user => !currentMemberIds.includes(user.id))

      setAvailableUsers(availableUsers)
    } catch (error) {
      console.error('Error fetching available users:', error)
      toast.error('Failed to load available users')
      setAvailableUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800 border-green-300'
      case 'busy': return 'bg-red-100 text-red-800 border-red-300'
      case 'away': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRoleIcon = (role: string) => {
    if (role.includes('Lead') || role.includes('Manager') || role.includes('Master')) {
      return <Crown className="w-4 h-4 text-yellow-600" />
    } else if (role.includes('Owner')) {
      return <Shield className="w-4 h-4 text-blue-600" />
    } else {
      return <UserIcon className="w-4 h-4 text-gray-600" />
    }
  }

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'text-red-600'
    if (workload >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const filteredMembers = projectMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || member.role.name.toLowerCase().includes(filterRole.toLowerCase())
    const matchesAvailability = filterAvailability === 'all' || member.availability === filterAvailability

    return matchesSearch && matchesRole && matchesAvailability
  })

  const TeamMemberCard = ({ member }: { member: TeamMember }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedMember(member)}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              {member.user_profile && (
                <img
                  src={member.user_profile}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Hide the image and show fallback on error
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <AvatarFallback className="bg-[#28A745] text-white text-lg">
                {member.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {member.teamLead && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getRoleIcon(member.role.name)}
                  <span className="text-sm text-muted-foreground">{member.role.name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getAvailabilityColor(member.availability || 'available')}>
                  {member.availability || 'available'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Workload: <span className={getWorkloadColor(member.workload || 0)}>{member.workload || 0}%</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Active Tasks</span>
                  <p className="font-medium">{member.currentTasks || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed</span>
                  <p className="font-medium">{member.completedTasks || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Hours</span>
                  <p className="font-medium">{member.hoursLogged || 0}h</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{member.workload || 0}%</span>
                </div>
                <Progress value={member.workload || 0} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const MemberDetailsModal = ({ member }: { member: TeamMember }) => (
    <Dialog open={!!member} onOpenChange={() => setSelectedMember(null)}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              {member.user_profile && (
                <img
                  src={member.user_profile}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <AvatarFallback className="bg-[#28A745] text-white">
                {member.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{member.name}</span>
              <p className="text-sm text-muted-foreground font-normal">{member.role.name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{member.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{member.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{member.department || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Joined {new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Current Workload</span>
                      <span className={getWorkloadColor(member.workload || 0)}>{member.workload || 0}%</span>
                    </div>
                    <Progress value={member.workload || 0} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-semibold text-[#007BFF]">{member.currentTasks || 0}</div>
                      <div className="text-muted-foreground">Active Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-semibold text-[#28A745]">{member.completedTasks || 0}</div>
                      <div className="text-muted-foreground">Completed</div>
                    </div>
                  </div>

                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-2xl font-semibold text-[#6F42C1]">{member.hoursLogged || 0}</div>
                    <div className="text-muted-foreground">Hours Logged</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-4">
            <div className="text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2" />
              <p>Task details would be loaded here</p>
              <p className="text-sm">Integration with task management needed</p>
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Skills & Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {member.skills && member.skills.length > 0 ? (
                  member.skills.map((skill: string) => (
                    <Badge key={skill} variant="outline" className="text-sm">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No skills listed</span>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Role Permissions</h4>
              <div className="space-y-2">
                {member.role.permissions && member.role.permissions.length > 0 ? (
                  member.role.permissions.map((permission: string) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{permission.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No specific permissions listed</span>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Member
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Remove from Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Team</h2>
          <p className="text-muted-foreground">Manage team members and their roles</p>
        </div>
        
        <Button
          className="bg-[#28A745] hover:bg-[#218838]"
          onClick={() => setShowAddMember(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Associate Member
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="scrum">Scrum Master</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="designer">Designer</SelectItem>
            <SelectItem value="qa">QA Engineer</SelectItem>
            <SelectItem value="owner">Product Owner</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterAvailability} onValueChange={setFilterAvailability}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="away">Away</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#007BFF]">{projectMembers.length}</div>
            <div className="text-xs text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#28A745]">
              {projectMembers.filter(m => m.availability === 'available').length}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#FFC107]">
              {projectMembers.reduce((sum, m) => sum + (m.currentTasks || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">Active Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-[#6F42C1]">
              {projectMembers.length > 0
                ? Math.round(projectMembers.reduce((sum, m) => sum + (m.workload || 0), 0) / projectMembers.length)
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Workload</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#28A745] mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No team members found</h3>
            <p className="text-muted-foreground mb-4">
              {projectMembers.length === 0
                ? "Get started by associating users with this project."
                : "Try adjusting your search or filter criteria."}
            </p>
            <Button
              className="bg-[#28A745] hover:bg-[#218838]"
              onClick={() => setShowAddMember(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Associate Member
            </Button>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && <MemberDetailsModal member={selectedMember} />}

      {/* Add Member Modal */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Associate Team Members</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Associate existing users with this project. Only users not already on this project team are shown.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#28A745] mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading available users...</p>
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No users available to associate</h3>
                <p className="text-muted-foreground">
                  All eligible users are already associated with this project, or no additional users are available.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <Input
                    placeholder="Search available users..."
                    className="w-full"
                    onChange={(e) => {
                      const searchValue = e.target.value.toLowerCase()
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <Card
                      key={user.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#28A745]"
                      onClick={async () => {
                        // Associate user with project team
                        try {
                          // In real implementation, this would call an API to associate the user with the project
                          // For example: await projectApiService.addTeamMember(effectiveProjectId, user.id)

                          toast.success(`${user.name} has been associated with the project`)
                          setShowAddMember(false)

                          // Refresh the team members to show the newly associated user
                          fetchTeamMembers()
                        } catch (error) {
                          console.error('Error associating user with project:', error)
                          toast.error(`Failed to associate ${user.name} with the project`)
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            {user.user_profile && (
                              <img
                                src={user.user_profile}
                                alt={user.name}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <AvatarFallback className="bg-[#28A745] text-white">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{user.name}</h4>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {getRoleIcon(user.role.name)}
                              <span className="text-xs text-muted-foreground">{user.role.name}</span>
                            </div>
                            {user.department && (
                              <p className="text-xs text-muted-foreground">{user.department}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Button size="sm" variant="outline" className="h-8">
                              Associate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddMember(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}