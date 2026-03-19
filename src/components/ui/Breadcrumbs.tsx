import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const location = useLocation()

  // Si no se proveen items, intentamos generar algo básico basado en la URL
  // (Aunque lo ideal es pasarlos por props desde cada vista)
  const paths = location.pathname.split('/').filter((p) => p !== '')

  const generatedItems =
    items ||
    paths.map((path, index) => {
      const href = `/${paths.slice(0, index + 1).join('/')}`
      return {
        label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
        href
      }
    })

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 rounded-2xl w-max shadow-inner border border-slate-100 dark:border-slate-800 animate-slide-up">
      <Link
        to="/"
        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"
        title="Inicio"
      >
        <HomeIcon className="h-4 w-4" />
      </Link>

      {generatedItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRightIcon className="h-4 w-4 text-slate-300 dark:text-slate-700" />
          <div className="flex items-center">
            {item.href && index !== generatedItems.length - 1 ? (
              <Link
                to={item.href}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors p-1"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-bold text-slate-900 dark:text-white p-1">
                {item.label}
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  )
}
