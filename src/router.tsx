import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import DataProviderWrapper from './DataProviderWrapper'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import Distributors from './pages/Distributors'
import DistributorDetail from './pages/DistributorDetail'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import ReportsWeekly from './pages/ReportsWeekly'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Visits from './pages/Visits'
import Calls from './pages/Calls'
import Notifications from './pages/Notifications'
import UpgradeRequests from './pages/UpgradeRequests'
import D2DTeams from './pages/D2DTeams'
import { Import } from './pages/Import'
import ProtectedRoute from './ProtectedRoute'
import Login from './pages/Login'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    element: <DataProviderWrapper />, // Provee el contexto a todas las rutas protegidas
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <Layout />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'pipeline', element: <Kanban /> },
              { path: 'distributors', element: <Distributors /> },
              { path: 'distributors/:id', element: <DistributorDetail /> },
              { path: 'candidates', element: <Candidates /> },
              { path: 'candidates/:id', element: <CandidateDetail /> },
              { path: 'visits', element: <Visits /> },
              { path: 'calls', element: <Calls /> },
              { path: 'reports', element: <ReportsWeekly /> },
              { path: 'reports/weekly', element: <ReportsWeekly /> },
              { path: 'notifications', element: <Notifications /> },
              { path: 'upgrade-requests', element: <UpgradeRequests /> },
              { path: 'd2d-teams', element: <D2DTeams /> },
              { path: 'import', element: <Import /> },
              { path: 'profile', element: <Profile /> },
              { path: 'settings', element: <Settings /> },
              { path: 'dashboard-old', element: <Dashboard /> },
              { path: 'kanban', element: <Kanban /> }
            ]
          }
        ]
      }
    ]
  }
])

export default router
