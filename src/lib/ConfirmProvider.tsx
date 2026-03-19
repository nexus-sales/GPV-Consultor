/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ExclamationTriangleIcon, InformationCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
  confirm: (options?: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used dentro de ConfirmProvider')
  return context
}

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({})
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>()

  const confirm = useCallback((opts?: ConfirmOptions) => {
    setOptions(opts || {})
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    resolvePromise?.(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolvePromise?.(false)
  }

  const {
    title = '¿Estás seguro?',
    description = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger'
  } = options

  const isDanger = type === 'danger'
  const isWarning = type === 'warning'

  const Icon = isDanger ? ShieldExclamationIcon : isWarning ? ExclamationTriangleIcon : InformationCircleIcon
  const iconColor = isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-500'
  const iconBg = isDanger ? 'bg-red-100 dark:bg-red-900/30' : isWarning ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
  const submitBtnColors = isDanger 
    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30 text-white' 
    : isWarning 
      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30 text-white'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
            onClick={handleCancel}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up pointer-events-auto">
            <div className="p-8">
              <div className="flex items-start gap-5">
                <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl ${iconBg}`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-3 font-bold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`w-full sm:w-auto px-6 py-3 font-bold text-sm rounded-xl transition-all shadow-lg hover:-translate-y-0.5 ${submitBtnColors}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
