import React, { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import Layout from './Layout'
import DataProviderWrapper from './DataProviderWrapper'
import ProtectedRoute from './ProtectedRoute'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Kanban = lazy(() => import('./pages/Kanban'))
const Distributors = lazy(() => import('./pages/Distributors'))
const DistributorDetail = lazy(() => import('./pages/DistributorDetail'))
const Candidates = lazy(() => import('./pages/Candidates'))
const Leads = lazy(() => import('./pages/Leads'))
const CandidateDetail = lazy(() => import('./pages/CandidateDetail'))
const ReportsWeekly = lazy(() => import('./pages/ReportsWeekly'))
const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))
const Visits = lazy(() => import('./pages/Visits'))
const Sales = lazy(() => import('./pages/Sales'))
const Calls = lazy(() => import('./pages/Calls'))
const Notifications = lazy(() => import('./pages/Notifications'))
const UpgradeRequests = lazy(() => import('./pages/UpgradeRequests'))
const D2DTeams = lazy(() => import('./pages/D2DTeams'))
import { Import } from './pages/Import'
const Login = lazy(() => import('./pages/Login'))

const PageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
)

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<PageFallback />}>{node}</Suspense>
)

const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<Login />)
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
              { index: true, element: withSuspense(<Dashboard />) },
              { path: 'dashboard', element: withSuspense(<Dashboard />) },
              { path: 'pipeline', element: withSuspense(<Kanban />) },
              { path: 'distributors', element: withSuspense(<Distributors />) },
              { path: 'distributors/:id', element: withSuspense(<DistributorDetail />) },
              { path: 'candidates', element: withSuspense(<Candidates />) },
              { path: 'candidates/:id', element: withSuspense(<CandidateDetail />) },
              { path: 'leads', element: withSuspense(<Leads />) },
              { path: 'visits', element: withSuspense(<Visits />) },
              { path: 'sales', element: withSuspense(<Sales />) },
              { path: 'calls', element: withSuspense(<Calls />) },
              { path: 'reports', element: withSuspense(<ReportsWeekly />) },
              { path: 'reports/weekly', element: withSuspense(<ReportsWeekly />) },
              { path: 'notifications', element: withSuspense(<Notifications />) },
              { path: 'upgrade-requests', element: withSuspense(<UpgradeRequests />) },
              { path: 'd2d-teams', element: withSuspense(<D2DTeams />) },
              { path: 'import', element: <Import /> },
              { path: 'profile', element: withSuspense(<Profile />) },
              { path: 'settings', element: withSuspense(<Settings />) },
              { path: 'dashboard-old', element: withSuspense(<Dashboard />) },
              { path: 'kanban', element: withSuspense(<Kanban />) }
            ]
          }
        ]
      }
    ]
  }
])

export default router
