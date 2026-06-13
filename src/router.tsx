import React, { Suspense, lazy } from 'react'
/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom'

import Layout from './Layout'
import DataProviderWrapper from './DataProviderWrapper'
import ProtectedRoute from './ProtectedRoute'
import { createLogger } from './lib/logger'

const routerLogger = createLogger('router')

/**
 * Envuelve importaciones lazy para manejar fallos de carga de chunks
 * (común cuando se despliega una nueva versión y el navegador tiene hashes viejos en cache)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const component = await componentImport()
      sessionStorage.removeItem('gpv_chunk_retry') // Limpiar flag si carga bien
      return component
    } catch (error) {
      routerLogger.error('Error cargando módulo, reintentando con refresh...', error)
      const hasRefreshed = sessionStorage.getItem('gpv_chunk_retry')
      if (!hasRefreshed) {
        sessionStorage.setItem('gpv_chunk_retry', 'true')
        window.location.reload()
      }
      throw error
    }
  })
}

const Dashboard = lazyRetry(() => import('./pages/Dashboard'))
const Kanban = lazyRetry(() => import('./pages/Kanban'))
const Distributors = lazyRetry(() => import('./pages/Distributors'))
const DistributorDetail = lazyRetry(() => import('./pages/DistributorDetail'))
const Candidates = lazyRetry(() => import('./pages/Candidates'))
const Leads = lazyRetry(() => import('./pages/Leads'))
const CandidateDetail = lazyRetry(() => import('./pages/CandidateDetail'))
const ReportsWeekly = lazyRetry(() => import('./pages/ReportsWeekly'))
const Settings = lazyRetry(() => import('./pages/Settings'))
const Profile = lazyRetry(() => import('./pages/Profile'))
const Visits = lazyRetry(() => import('./pages/Visits'))
const Sales = lazyRetry(() => import('./pages/Sales'))
const Calls = lazyRetry(() => import('./pages/Calls'))
const Notifications = lazyRetry(() => import('./pages/Notifications'))
const UpgradeRequests = lazyRetry(() => import('./pages/UpgradeRequests'))
const D2DTeams = lazyRetry(() => import('./pages/D2DTeams'))
const Tasks = lazyRetry(() => import('./pages/Tasks'))
const Backoffice = lazyRetry(() => import('./pages/Backoffice'))
const Radar = lazyRetry(() => import('./pages/Radar'))
const Import = lazyRetry(() =>
  import('./pages/Import').then((m) => ({ default: m.Import }))
)
const Login = lazyRetry(() => import('./pages/Login'))
const ChangePassword = lazyRetry(() => import('./pages/ChangePassword'))
const Landing = lazyRetry(() => import('./pages/Landing'))
const AvisoLegal = lazyRetry(() => import('./pages/legal/AvisoLegal'))
const Privacidad = lazyRetry(() => import('./pages/legal/Privacidad'))
const Cookies = lazyRetry(() => import('./pages/legal/Cookies'))
const GoogleCallbackPage = lazyRetry(() => import('./pages/auth/GoogleCallbackPage'))
const MicrosoftCallbackPage = lazyRetry(
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
          <div
            key={i}
            className="h-32 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"
          ></div>
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
    path: '/change-password',
    element: withSuspense(<ChangePassword />)
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
              { path: 'tasks', element: withSuspense(<Tasks />) },
              { path: 'backoffice', element: withSuspense(<Backoffice />) },
              { path: 'radar', element: withSuspense(<Radar />) }
            ]
          }
        ]
      }
    ]
  }
])

export default router
