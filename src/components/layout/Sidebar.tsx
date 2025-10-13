import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../ui/utils'
import { Button } from '../ui/button'

import {
  LayoutDashboard,
  FolderOpen,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  Shield,
  UserCheck,
  Target,
  Clock,
} from 'lucide-react'


interface SidebarProps {
  activeModule: string
  user?: any
}

// Define navigation items for each role
const getNavigationItems = (userRole: string) => {
  const isAdminOrSuperAdmin = userRole === 'admin' || userRole === 'super_admin'

  const baseItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      path: '/dashboard',
      roles: ['admin', 'super_admin', 'project_manager', 'developer', 'tester']
    },
    {
      id: 'projects',
      label: isAdminOrSuperAdmin ? 'Projects' : 'My Projects', // Change label based on role
      icon: FolderOpen,
      badge: null,
      path: '/projects',
      roles: ['admin', 'super_admin', 'project_manager', 'developer', 'tester']
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: null,
      path: '/customers',
      roles: ['admin', 'super_admin', 'project_manager'] // Admin, super admin and project manager
    },
    {
      id: 'timesheet',
      label: 'Timesheet',
      icon: Clock,
      badge: null,
      path: '/timesheet',
      roles: ['project_manager', 'developer', 'tester'] // Only non-admin users
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      badge: null,
      path: '/reports',
      roles: ['admin', 'super_admin', 'project_manager', 'developer', 'tester']
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      badge: null,
      path: '/admin',
      roles: ['admin', 'super_admin'] // Admin and super admin
    }
  ]

  // Filter items based on user role
  return baseItems.filter(item => item.roles.includes(userRole))
}



export function Sidebar({ activeModule, user }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = user?.role || 'developer'

  // Use useMemo to ensure navigation items update when user changes
  const navigationItems = useMemo(() => {
    return getNavigationItems(userRole)
  }, [userRole])






  // Get role display info
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return { icon: Shield, label: 'System Administrator', color: 'text-[#DC3545]' }
      case 'super_admin':
        return { icon: Shield, label: 'Super Administrator', color: 'text-[#DC3545]' }
      case 'project_manager':
        return { icon: UserCheck, label: 'Project Manager', color: 'text-[#28A745]' }
      case 'developer':
        return { icon: Target, label: 'Developer', color: 'text-[#28A745]' }
      case 'tester':
        return { icon: Target, label: 'Tester', color: 'text-[#FFC107]' }
      default:
        return { icon: Target, label: 'User', color: 'text-muted-foreground' }
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-r border-green-200/50 dark:border-green-700/50 overflow-y-auto shadow-2xl">
      <div className="p-4">


        {/* Role Badge */}
        <div className="mb-6 p-4 bg-gradient-to-r from-white/80 to-green-50 dark:from-green-900/50 dark:to-green-800/50 rounded-xl border border-green-200/50 dark:border-green-600/30 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-800/50">
              <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
            </div>
            <div>
              <span className="text-sm font-medium text-black dark:text-green-50">{roleInfo.label}</span>
              <div className="text-xs text-gray-600 dark:text-green-300 mt-0.5">
                {user?.name || 'Current User'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || activeModule === item.id
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-11 px-4 rounded-xl transition-all duration-200 hover:bg-green-200/50 dark:hover:bg-green-800/50 text-black dark:text-green-200 hover:text-black dark:hover:text-white",
                  isActive && "bg-gradient-to-r from-[#28A745]/20 to-[#28A745]/10 text-[#28A745] border border-[#28A745]/30 shadow-lg backdrop-blur-sm hover:from-[#28A745]/30 hover:to-[#28A745]/20"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className={cn(
                  "w-5 h-5 mr-3 transition-colors",
                  isActive ? "text-[#28A745]" : "text-gray-700 dark:text-green-400"
                )} />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-2 text-[#28A745]" />}
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}