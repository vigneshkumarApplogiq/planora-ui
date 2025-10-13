import { createBrowserRouter, Navigate, useParams, useNavigate } from 'react-router-dom'
import { useProjectId } from '../hooks/useProjectId'
import { Dashboard } from '../pages/Dashboard/Dashboard'
import { Projects } from '../pages/Project/Projects'
import { MyProjects } from '../pages/MyProjects'
import { ProjectDetails } from '../pages/ProjectDetails'
import { Customers } from '../pages/Customers/Customers'
import { Reports } from '../pages/Reports/Reports'
import { Admin } from '../pages/Admin/Admin'
import { UserProfile } from '../pages/Admin/UserProfile'
import { Timesheet } from '../pages/Timesheet'
import { Auth } from '../pages/Login/Auth'
import { MainLayout } from '../components/layout/MainLayout'

// Wrapper components for routing
const ProjectsWrapper = ({ user }: { user: any }) => {
  const navigate = useNavigate()
  const userRole = user?.role || ''
  const isAdminOrSuperAdmin = userRole === 'admin' || userRole === 'super_admin'

  // Admin and super_admin see all projects, others see my projects
  if (isAdminOrSuperAdmin) {
    return <Projects onProjectSelect={(projectId) => navigate(`/projects/${projectId}`)} user={user} />
  } else {
    return <MyProjects onProjectSelect={(projectId) => navigate(`/projects/${projectId}`)} user={user} />
  }
}

const ProjectDetailsWrapper = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const navigate = useNavigate()
  const projectId = useProjectId()

  return <ProjectDetails projectId={projectId || ''} onBack={() => navigate('/projects')} user={user} onLogout={onLogout} />
}

export const createAppRouter = (user: any, onLogin: (userData: any) => void, onLogout: () => void) => {
  return createBrowserRouter([
    {
      path: "/login",
      element: user ? <Navigate to="/" replace /> : <Auth onLogin={onLogin} />
    },
    {
      path: "/projects/:projectId",
      element: user ? <ProjectDetailsWrapper user={user} onLogout={onLogout} /> : <Navigate to="/login" replace />
    },
    {
      path: "/",
      element: user ? <MainLayout user={user} onLogout={onLogout} /> : <Navigate to="/login" replace />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />
        },
        {
          path: "dashboard",
          element: <Dashboard user={user} />
        },
        {
          path: "projects",
          element: <ProjectsWrapper user={user} />
        },
        {
          path: "customers",
          element: <Customers user={user} />
        },
        {
          path: "timesheet",
          element: <Timesheet user={user} />
        },
        {
          path: "reports",
          element: <Reports user={user} />
        },
        {
          path: "admin",
          element: <Admin user={user} />
        },
        {
          path: "profile",
          element: <UserProfile user={user} />
        }
      ]
    },
    {
      path: "*",
      element: user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
    }
  ])
}