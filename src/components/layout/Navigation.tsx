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
  indigo:
    'text-pastel-indigo border-pastel-indigo bg-gradient-to-r from-pastel-indigo/10 to-pastel-indigo/5',
  cyan: 'text-pastel-cyan border-pastel-cyan bg-gradient-to-r from-pastel-cyan/10 to-pastel-cyan/5',
  green:
    'text-pastel-green border-pastel-green bg-gradient-to-r from-pastel-green/10 to-pastel-green/5',
  yellow:
    'text-pastel-yellow border-pastel-yellow bg-gradient-to-r from-pastel-yellow/10 to-pastel-yellow/5',
  red: 'text-pastel-red border-pastel-red bg-gradient-to-r from-pastel-red/10 to-pastel-red/5'
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
                `flex items-center space-x-2 py-4 px-6 border-b-3 font-medium text-sm transition-all duration-300 whitespace-nowrap rounded-t-xl ${isActive
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
