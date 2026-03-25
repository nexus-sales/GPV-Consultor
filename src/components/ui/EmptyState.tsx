import React from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ElementType
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = SparklesIcon,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center animate-fade-in dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-6 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
