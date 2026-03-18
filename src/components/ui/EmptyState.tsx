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
    <div className="flex flex-col items-center justify-center p-12 lg:p-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/20 animate-fade-in group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        <Icon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
