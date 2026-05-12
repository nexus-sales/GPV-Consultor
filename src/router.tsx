import React, { Suspense, lazy } from 'react'
/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom'

import Layout from './Layout'
import DataProviderWrapper from './DataProviderWrapper'
import ProtectedRoute from './ProtectedRoute'

/**
 * Envuelve importaciones lazy para manejar fallos de carga de chunks
 * (común cuando se despliega una nueva versión y el navegador tiene hashes viejos en cache).
 * Usa una clave por módulo para evitar que el retry de un módulo interfiera con otro.
 */
function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  moduleKey: string
): React.LazyExoticComponent<T> {
  const storageKey = `gpv_chunk_retry_${moduleKey}`
  return lazy(async () => {
    try {
      const component = await componentImport()
      sessionStorage.removeItem(storageKey)
      return component
    } catch (error) {
      console.error(`[lazyRetry] Error cargando módulo "${moduleKey}":`, error)
      const hasRetried = sessionStorage.getItem(storageKey)
      if (!hasRetried) {
        sessionStorage.setItem(storageKey, 'true')
        window.location.reload()
      }
      throw error
    }
  })
}

const Dashboard = lazyRetry(() => import('./pages/Dashboard'), 'Dashboard')
const Kanban = lazyRetry(() => import('./pages/Kanban'), 'Kanban')
const Distributors = lazyRetry(() => import('./pages/Distributors'), 'Distributors')
const DistributorDetail = lazyRetry(() => import('./pages/DistributorDetail'), 'DistributorDetail')
const Candidates = lazyRetry(() => import('./pages/Candidates'), 'Candidates')
const Leads = lazyRetry(() => import('./pages/Leads'), 'Leads')
const CandidateDetail = lazyRetry(() => import('./pages/CandidateDetail'), 'CandidateDetail')
const ReportsWeekly = lazyRetry(() => import('./pages/ReportsWeekly'), 'ReportsWeekly')
const Settings = lazyRetry(() => import('./pages/Settings'), 'Settings')
const Profile = lazyRetry(() => import('./pages/Profile'), 'Profile')
const Visits = lazyRetry(() => import('./pages/Visits'), 'Visits')
const Sales = lazyRetry(() => import('./pages/Sales'), 'Sales')
const Calls = lazyRetry(() => import('./pages/Calls'), 'Calls')
const Notifications = lazyRetry(() => import('./pages/Notifications'), 'Notifications')
const UpgradeRequests = lazyRetry(() => import('./pages/UpgradeRequests'), 'UpgradeRequests')
const D2DTeams = lazyRetry(() => import('./pages/D2DTeams'), 'D2DTeams')
const Tasks = lazyRetry(() => import('./pages/Tasks'), 'Tasks')
const Backoffice = lazyRetry(() => import('./pages/Backoffice'), 'Backoffice')
const Radar = lazyRetry(() => import('./pages/Radar'), 'Radar')
const Import = lazyRetry(
  () => import('./pages/Import').then((m) => ({ default: m.Import })),
  'Import'
)
const Login = lazyRetry(() => import('./pages/Login'), 'Login')
const Landing = lazyRetry(() => import('./pages/Landing'), 'Landing')
const AvisoLegal = lazyRetry(() => import('./pages/legal/AvisoLegal'), 'AvisoLegal')
const Privacidad = lazyRetry(() => import('./pages/legal/Privacidad'), 'Privacidad')
const Cookies = lazyRetry(() => import('./pages/legal/Cookies'), 'Cookies')
const GoogleCallbackPage = lazyRetry(() => import('./pages/auth/GoogleCallbackPage'), 'GoogleCallback')
const MicrosoftCallbackPage = lazyRetry(
  () => import('./pages/auth/MicrosoftCallbackPage'),
  'MicrosoftCallback'
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
