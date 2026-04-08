import React, { Suspense, lazy } from 'react'
/* eslint-disable react-refresh/only-export-components */
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
const Tasks = lazy(() => import('./pages/Tasks'))
const Import = lazy(() => import('./pages/Import').then(m => ({ default: m.Import })))
const Login = lazy(() => import('./pages/Login'))
const Landing = lazy(() => import('./pages/Landing'))
const AvisoLegal = lazy(() => import('./pages/legal/AvisoLegal'))
const Privacidad = lazy(() => import('./pages/legal/Privacidad'))
const Cookies = lazy(() => import('./pages/legal/Cookies'))
const GoogleCallbackPage = lazy(() => import('./pages/auth/GoogleCallbackPage'))
const MicrosoftCallbackPage = lazy(
  () => import('./pages/auth/MicrosoftCallbackPage')
)

export function PageFallback() {
  return (
    <div className="w-full animate-pulse space-y-8 p-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
      
      {/* Dashboard Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"></div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 2xl:grid-cols-4 gap-8">
        <div className="2xl:col-span-3 h-[450px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"></div>
        <div className="space-y-8">
          <div className="h-64 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"></div>
          <div className="h-64 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"></div>
        </div>
      </div>
    </div>
  )
}

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/auth/google/callback',
    element: withSuspense(<GoogleCallbackPage />)
  },
  {
    path: '/auth/microsoft/callback',
    element: withSuspense(<MicrosoftCallbackPage />)
  },
  {
    path: '/login',
    element: withSuspense(<Login />)
  },
  {
    path: '/landing',
    element: withSuspense(<Landing />)
  },
  {
    path: '/legal/aviso',
    element: withSuspense(<AvisoLegal />)
  },
  {
    path: '/legal/privacidad',
    element: withSuspense(<Privacidad />)
  },
  {
    path: '/legal/cookies',
    element: withSuspense(<Cookies />)
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
              { path: 'kanban', element: withSuspense(<Kanban />) },
              { path: 'distributors', element: withSuspense(<Distributors />) },
              {
                path: 'distributors/:id',
                element: withSuspense(<DistributorDetail />)
              },
              { path: 'candidates', element: withSuspense(<Candidates />) },
              {
                path: 'candidates/:id',
                element: withSuspense(<CandidateDetail />)
              },
              { path: 'leads', element: withSuspense(<Leads />) },
              { path: 'visits', element: withSuspense(<Visits />) },
              { path: 'sales', element: withSuspense(<Sales />) },
              { path: 'calls', element: withSuspense(<Calls />) },
              { path: 'reports', element: withSuspense(<ReportsWeekly />) },
              {
                path: 'reports/weekly',
                element: withSuspense(<ReportsWeekly />)
              },
              {
                path: 'notifications',
                element: withSuspense(<Notifications />)
              },
              {
                path: 'upgrade-requests',
                element: withSuspense(<UpgradeRequests />)
              },
              { path: 'd2d-teams', element: withSuspense(<D2DTeams />) },
              { path: 'import', element: withSuspense(<Import />) },
              { path: 'profile', element: withSuspense(<Profile />) },
              { path: 'settings', element: withSuspense(<Settings />) },
              { path: 'tasks', element: withSuspense(<Tasks />) }
            ]
          }
        ]
      }
    ]
  }
])

export default router
