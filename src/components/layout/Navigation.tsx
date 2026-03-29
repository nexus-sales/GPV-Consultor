import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowUpCircleIcon,
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'

// Tipos para la navegación
type ColorVariant = 'indigo' | 'cyan' | 'green' | 'yellow' | 'red'

interface NavigationItem {
  name: string
  href: string
  icon: React.ReactNode
  color: ColorVariant
}

interface NavLinkProps {
  isActive: boolean
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <ChartBarIcon className="h-5 w-5" />,
    color: 'indigo'
  },
  {
    name: 'Pipeline',
    href: '/kanban',
    icon: <UserGroupIcon className="h-5 w-5" />,
    color: 'cyan'
  },
  {
    name: 'Distribuidores',
    href: '/distributors',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'green'
  },
  {
    name: 'Candidatos',
    href: '/candidates',
    icon: <UsersIcon className="h-5 w-5" />,
    color: 'yellow'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: <DocumentTextIcon className="h-5 w-5" />,
    color: 'red'
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: <IdentificationIcon className="h-5 w-5" />,
    color: 'cyan'
  },
  {
    name: 'Solicitudes',
    href: '/upgrade-requests',
    icon: <ArrowUpCircleIcon className="h-5 w-5" />,
    color: 'indigo'
  }
]

const colorVariants: Record<ColorVariant, string> = {
  indigo: 'text-indigo-600 border-indigo-600 bg-indigo-50',
  cyan: 'text-cyan-600 border-cyan-600 bg-cyan-50',
  green: 'text-emerald-600 border-emerald-600 bg-emerald-50',
  yellow: 'text-amber-600 border-amber-600 bg-amber-50',
  red: 'text-red-600 border-red-600 bg-red-50'
}

const Navigation: React.FC = () => {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600/50 dark:border-gray-700/50 shadow-sm sticky top-16 z-40 transition-all duration-700 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex space-x-1 overflow-x-auto py-1"
          id="navigation-tabs"
        >
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }: NavLinkProps) =>
                `flex items-center space-x-2 py-4 px-6 border-b-3 font-medium text-sm transition-all duration-300 whitespace-nowrap rounded-t-xl ${
                  isActive
                    ? `${colorVariants[item.color]} border-b-3`
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
