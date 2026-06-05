import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: React.ReactNode
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
        className={`fixed inset-0 z-50 bg-slate-950/25 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed right-3 top-16 z-50 w-[calc(100vw-1.5rem)] max-w-[420px] max-h-[calc(100vh-5rem)] overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-xl shadow-indigo-950/10 transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 sm:right-6 sm:top-20 sm:max-h-[calc(100vh-6rem)] ${open ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'}`}
      >
        <div className="flex max-h-[calc(100vh-5rem)] min-h-0 flex-col sm:max-h-[calc(100vh-6rem)]">
          <header className="border-b border-indigo-100 bg-indigo-50/40 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {title && (
                  <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {subtitle}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                onClick={onClose}
                aria-label="Cerrar panel"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/70 px-5 py-5 dark:from-slate-950 dark:to-slate-900/70">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export default SlideOver
