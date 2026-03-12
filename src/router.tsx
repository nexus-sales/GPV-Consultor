import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import DataProviderWrapper from './DataProviderWrapper'
import ProtectedRoute from './ProtectedRoute'

// Lazy loading de páginas para code splitting
// Esto reduce significativamente el bundle inicial
const Login = React.lazy(() => import('./pages/Login'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Kanban = React.lazy(() => import('./pages/Kanban'))
const Distributors = React.lazy(() => import('./pages/Distributors'))
const DistributorDetail = React.lazy(() => import('./pages/DistributorDetail'))
const Candidates = React.lazy(() => import('./pages/Candidates'))
const CandidateDetail = React.lazy(() => import('./pages/CandidateDetail'))
const ReportsWeekly = React.lazy(() => import('./pages/ReportsWeekly'))
const Settings = React.lazy(() => import('./pages/Settings'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Visits = React.lazy(() => import('./pages/Visits'))
const Sales = React.lazy(() => import('./pages/Sales'))
const Calls = React.lazy(() => import('./pages/Calls'))
const Notifications = React.lazy(() => import('./pages/Notifications'))
const UpgradeRequests = React.lazy(() => import('./pages/UpgradeRequests'))
const D2DTeams = React.lazy(() => import('./pages/D2DTeams'))
const Import = React.lazy(() => import('./pages/Import'))

// Componente de fallback para Suspense
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-pastel-indigo/5 to-pastel-cyan/10">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-pastel-indigo border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
        Cargando...
      </p>
    </div>
  </div>
)

// Wrapper para páginas con Suspense
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
)

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyPage><Login /></LazyPage>
  },
  {
    element: <DataProviderWrapper />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <Layout />,
            children: [
              { index: true, element: <LazyPage><Dashboard /></LazyPage> },
              { path: 'dashboard', element: <LazyPage><Dashboard /></LazyPage> },
              { path: 'pipeline', element: <LazyPage><Kanban /></LazyPage> },
              { path: 'distributors', element: <LazyPage><Distributors /></LazyPage> },
              { path: 'distributors/:id', element: <LazyPage><DistributorDetail /></LazyPage> },
              { path: 'candidates', element: <LazyPage><Candidates /></LazyPage> },
              { path: 'candidates/:id', element: <LazyPage><CandidateDetail /></LazyPage> },
              { path: 'visits', element: <LazyPage><Visits /></LazyPage> },
              { path: 'sales', element: <LazyPage><Sales /></LazyPage> },
              { path: 'calls', element: <LazyPage><Calls /></LazyPage> },
              { path: 'reports', element: <LazyPage><ReportsWeekly /></LazyPage> },
              { path: 'reports/weekly', element: <LazyPage><ReportsWeekly /></LazyPage> },
              { path: 'notifications', element: <LazyPage><Notifications /></LazyPage> },
              { path: 'upgrade-requests', element: <LazyPage><UpgradeRequests /></LazyPage> },
              { path: 'd2d-teams', element: <LazyPage><D2DTeams /></LazyPage> },
              { path: 'import', element: <LazyPage><Import /></LazyPage> },
              { path: 'profile', element: <LazyPage><Profile /></LazyPage> },
              { path: 'settings', element: <LazyPage><Settings /></LazyPage> },
              { path: 'dashboard-old', element: <LazyPage><Dashboard /></LazyPage> },
              { path: 'kanban', element: <LazyPage><Kanban /></LazyPage> }
            ]
          }
        ]
      }
    ]
  }
])

export default router
