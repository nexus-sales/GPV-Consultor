import React, { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
}

const SlideOver: React.FC<SlideOverProps> = ({ 
  open, 
  onClose, 
  title, 
  subtitle, 
  children 
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col overflow-y-scroll">
          <header className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                {title && <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>}
                {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </header>

          <main className="relative flex-1 px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export default SlideOver
