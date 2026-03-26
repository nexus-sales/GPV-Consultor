import React from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Outlet } from 'react-router-dom'
import { useTheme } from './lib/useTheme'

const App: React.FC = () => {
  const { isDark } = useTheme()

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen font-sans transition-colors duration-500 ${
          isDark
            ? 'bg-slate-950 text-slate-100'
            : 'bg-gray-50 text-gray-900'
        }`}
      >
        <Outlet />
      </div>
    </ErrorBoundary>
  )
}

export default App
