import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchProjectById } from '../../store/slices/projectSlice'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { getProfilePictureUrl, getUserInitials } from '../../utils/profileUtils'
// ScrollArea component not available, using regular div
import {
  ArrowLeft,
  Settings,
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  FolderOpen,
  Activity,
  Calendar,
  Target,
  GitBranch,
  Layers,
  Flag,
  Clock,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  LogOut,
  User
} from 'lucide-react'
import logoImage from 'figma:asset/6748e9361ee0546a59b88c4fb2d8d612f9260020.png'
import { SessionStorageService } from '../../utils/sessionStorage'
import { projectApiService, ProjectMastersResponse } from '../../services/projectApi'
import { ProjectDashboard } from './ProjectDashboard'
import { TasksView as ScrumTasksView } from './Scrum/Tasks/TasksView'
import { TasksView as KanbanTasksView } from './Kanban/Tasks/TasksView'
import { TasksView as WaterfallTasksView } from './Waterfall/Tasks/TasksView'
import { FilesView } from './FilesView'
import { BacklogView } from './Scrum/Backlog'
import { SprintsView } from './Scrum/Sprints/SprintsView'
import { NativeDragDropKanban as KanbanBoardView } from './Kanban/NativeDragDropKanban'
import { PhasesView } from './Waterfall/Phases'
import { MilestonesView } from './Waterfall/Milestones'
import { DeliverablesView } from './Waterfall/Deliverables'
import { TeamView } from './TeamView'
import { ReportsView as ScrumReportsView } from './Scrum/Reports/ReportsView'
import { ReportsView as KanbanReportsView } from './Kanban/Reports/ReportsView'
import { ReportsView as WaterfallReportsView } from './Waterfall/Reports/ReportsView'
import { ActivityView } from './ActivityView'
import { ProjectSettings } from './ProjectSettings'
import { ProjectEditModal } from './ProjectEditModal'
import { Epic } from './Scrum/Epic'

interface ProjectDetailsProps {
  projectId: string
  onBack?: () => void
  user?: any
  onLogout?: () => void
}

export function ProjectDetails({ projectId, onBack, user, onLogout }: ProjectDetailsProps) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const {
    selectedProject: project,
    selectedProjectLoading: loading,
    error
  } = useAppSelector((state) => state.projects)


  const [activeView, setActiveView] = useState('dashboard')
  const [showEditModal, setShowEditModal] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Load master project data once at parent level
  const [masterData, setMasterData] = useState<ProjectMastersResponse | null>(null)
  const [masterLoading, setMasterLoading] = useState(false)

  // Load project data and manage session storage
  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId))
      // Store project ID in session storage for persistence
      SessionStorageService.setCurrentProjectId(projectId)
    }
  }, [dispatch, projectId])

  // Store project data in session storage when loaded
  useEffect(() => {
    if (project) {
      SessionStorageService.setCurrentProjectData(project)
    }
  }, [project])

  // Load master data once for all child components
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setMasterLoading(true)
        const masters = await projectApiService.getProjectMasters()
        setMasterData(masters)
      } catch (error) {
        setMasterData(null)
      } finally {
        setMasterLoading(false)
      }
    }

    loadMasterData()
  }, [])

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/projects')
    }
  }

  const getMethodologyMenu = (methodology: string) => {
    switch (methodology?.toLowerCase()) {
      case 'scrum':
      case 'agile':
        return [
          { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { value: 'epics', label: 'Epics', icon: Layers },
          { value: 'backlog', label: 'Backlog', icon: GitBranch },
          { value: 'sprints', label: 'Sprints', icon: Target },
          { value: 'tasks', label: 'Tasks', icon: CheckSquare },
          { value: 'team', label: 'Team', icon: Users },
          { value: 'reports', label: 'Reports', icon: BarChart3 },
          { value: 'files', label: 'Files', icon: FolderOpen },
          { value: 'activity', label: 'Activity', icon: Activity },
          { value: 'settings', label: 'Settings', icon: Settings }
        ]
      case 'kanban':
        return [
          { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { value: 'kanban', label: 'Board', icon: Layers },
          { value: 'tasks', label: 'Tasks', icon: CheckSquare },
          { value: 'team', label: 'Team', icon: Users },
          { value: 'reports', label: 'Reports', icon: BarChart3 },
          { value: 'files', label: 'Files', icon: FolderOpen },
          { value: 'activity', label: 'Activity', icon: Activity },
          { value: 'settings', label: 'Settings', icon: Settings }
        ]
      case 'waterfall':
        return [
          { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { value: 'phases', label: 'Phases', icon: Layers },
          { value: 'milestones', label: 'Milestones', icon: Flag },
          { value: 'deliverables', label: 'Deliverables', icon: Calendar },
          { value: 'tasks', label: 'Tasks', icon: CheckSquare },
          { value: 'team', label: 'Team', icon: Users },
          { value: 'reports', label: 'Reports', icon: BarChart3 },
          { value: 'files', label: 'Files', icon: FolderOpen },
          { value: 'activity', label: 'Activity', icon: Activity },
          { value: 'settings', label: 'Settings', icon: Settings }
        ]
      default:
        return [
          { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { value: 'tasks', label: 'Tasks', icon: CheckSquare },
          { value: 'team', label: 'Team', icon: Users },
          { value: 'reports', label: 'Reports', icon: BarChart3 },
          { value: 'files', label: 'Files', icon: FolderOpen },
          { value: 'activity', label: 'Activity', icon: Activity },
          { value: 'settings', label: 'Settings', icon: Settings }
        ]
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28A745] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Button variant="ghost" onClick={handleBack} className="mb-6 hover:bg-white/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Project Not Found</h2>
              <p className="text-muted-foreground">The requested project could not be found or may have been deleted.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const menuItems = getMethodologyMenu(project.methodology)

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ProjectDashboard project={project} user={user} masterData={masterData} masterLoading={masterLoading} />
      case 'epics':
        return <Epic projectId={projectId} user={user} teamMembers={project?.team_members_detail || []} />
      case 'backlog':
        return <BacklogView projectId={projectId} user={user} project={project} />
      case 'sprints':
        return <SprintsView project={project} user={user} />
      case 'kanban':
        return <KanbanBoardView project={project} user={user} masterData={masterData} masterLoading={masterLoading} />
      case 'phases':
        return <PhasesView projectId={project.id} user={user} />
      case 'milestones':
        return <MilestonesView projectId={project.id} projectName={project.name} user={user} />
      case 'deliverables':
        return <DeliverablesView projectId={project.id} projectName={project.name} user={user} />
      case 'tasks':
        // Use methodology-specific TasksView
        const methodology = project?.methodology?.toLowerCase()
        if (methodology === 'kanban') {
          return <KanbanTasksView project={project} user={user} />
        } else if (methodology === 'waterfall') {
          return <WaterfallTasksView project={project} user={user} />
        }
        return <ScrumTasksView project={project} user={user} />
      case 'team':
        return <TeamView project={project} user={user} />
      case 'reports':
        // Use methodology-specific ReportsView
        const reportsMethodology = project?.methodology?.toLowerCase()
        if (reportsMethodology === 'kanban') {
          return <KanbanReportsView project={project} user={user} />
        } else if (reportsMethodology === 'waterfall') {
          return <WaterfallReportsView project={project} user={user} />
        }
        return <ScrumReportsView project={project} user={user} />
      case 'files':
        return <FilesView project={project} user={user} />
      case 'activity':
        return <ActivityView project={project} user={user} />
      case 'settings':
        return <ProjectSettings project={project} user={user} onProjectUpdate={() => {
          if (projectId) dispatch(fetchProjectById(projectId))
        }} />
      default:
        return <ProjectDashboard project={project} user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-500/30 dark:border-gray-500/50 shadow-xl backdrop-blur-md" style={{ backgroundColor: '#262626' }}>
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left side - Logo and Back */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#28A745] to-[#20943a] shadow-lg">
                <img
                  src={logoImage}
                  alt="Planora Logo"
                  className="w-6 h-6 object-contain filter brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white drop-shadow-sm">Planora</h1>
                <p className="text-xs text-gray-200 -mt-0.5 drop-shadow-sm">Project Management</p>
              </div>
            </div>
            <div className="h-6 border-l border-gray-500/50 mx-2"></div>
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-200 hover:text-white hover:bg-gray-700/50 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <Button
              variant="outline"
              size="sm"
              className="relative min-w-[200px] justify-start text-gray-200 bg-gray-700/40 border-gray-500/40 hover:bg-gray-700/60 hover:text-white backdrop-blur-sm"
            >
              <Search className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Search in project...</span>
            </Button>

            {/* Quick Create */}
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#28A745] to-[#20943a] hover:from-[#218838] hover:to-[#1e7e34] text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>

            {/* Notifications */}
            <Button
              variant="outline"
              size="sm"
              className="relative bg-gray-700/40 border-gray-500/40 hover:bg-gray-700/60 text-white hover:text-white backdrop-blur-sm"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#DC3545] to-[#c82333] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                3
              </span>
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="bg-gray-700/40 border-gray-500/40 hover:bg-gray-700/60 text-white hover:text-white backdrop-blur-sm"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* User Menu */}
            <div className="relative user-menu">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-gray-700/40 border-gray-500/40 hover:bg-gray-700/60 text-white hover:text-white backdrop-blur-sm px-3 py-2 h-10"
              >
                <Avatar className="w-8 h-8 ring-2 ring-green-600/50">
                  <AvatarImage src={getProfilePictureUrl(user?.user_profile)} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#28A745] to-[#20943a] text-white text-sm font-medium">
                    {getUserInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white drop-shadow-sm">{user?.name}</p>
                  <p className="text-xs text-gray-200 -mt-0.5 drop-shadow-sm">
                    {user?.role?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                </div>
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-[60] backdrop-blur-md border border-gray-500/50" style={{ backgroundColor: '#262626' }}>
                  <div className="p-6 border-b border-gray-500/50">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-14 h-14 ring-4 ring-green-600/30">
                        <AvatarImage src={getProfilePictureUrl(user?.user_profile)} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-[#28A745] to-[#20943a] text-white text-lg font-semibold">
                          {getUserInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-white drop-shadow-sm text-base">{user?.name}</p>
                        <p className="text-sm text-gray-200 mb-2 drop-shadow-sm">{user?.email}</p>
                        <Badge
                          className="text-xs font-normal bg-[#28A745]/20 text-[#28A745] border-[#28A745]/30 hover:bg-[#28A745]/30"
                          variant="outline"
                        >
                          {user?.role?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-11 px-4 rounded-xl text-white hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                      onClick={() => {
                        navigate('/profile')
                        setShowUserMenu(false)
                      }}
                    >
                      <User className="w-5 h-5 mr-3" />
                      My Profile
                    </Button>

                    <div className="border-t border-gray-500/50 pt-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-11 px-4 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200"
                        onClick={onLogout}
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign out
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-16">

        {/* Left Sidebar - Compact design */}
        <div className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">

          {/* Project Information - Compact */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
              {project.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 line-clamp-2">
              {project.description || 'Project description'}
            </p>

            {/* Status Badges - Stacked */}
            <div className="flex flex-col gap-1 mb-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-100 text-xs py-0.5"
              >
                {project.status}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-800 hover:bg-red-100 text-xs py-0.5"
              >
                {project.priority}
              </Badge>
            </div>

            {/* Team Members - Compact */}
            <div className="flex items-center gap-1">
              {project?.teamMembers?.slice(0, 3).map((memberId: string, index: number) => (
                <div
                  key={memberId || index}
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                >
                  {memberId?.charAt(0)?.toUpperCase() || '?'}
                </div>
              ))}
              {project?.teamMembers?.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                  +{project.teamMembers.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu - Compact */}
          <div className="flex-1">
            <nav className="p-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.value

                return (
                  <button
                    key={item.value}
                    onClick={() => setActiveView(item.value)}
                    className={`
                      w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-xs font-medium text-left transition-colors
                      ${isActive
                        ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Progress Section at Bottom - Compact */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
              Progress
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              {project.progress || 75}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 75}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="p-8">
            {renderActiveView()}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <ProjectEditModal
          project={project}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false)
          }}
        />
      )}
    </div>
  )
}

export { ProjectDetails as default }