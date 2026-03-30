/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode
} from 'react'
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'

interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  requireTextConfirm?: boolean
}

interface ConfirmContextType {
  confirm: (options?: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used dentro de ConfirmProvider')
  }
  return context
}

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({})
  const [resolvePromise, setResolvePromise] =
    useState<(value: boolean) => void>()

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
    title = 'Estas seguro?',
    description = 'Esta accion no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger'
  } = options

  const isDanger = type === 'danger'
  const isWarning = type === 'warning'

  const Icon = isDanger
    ? ShieldExclamationIcon
    : isWarning
      ? ExclamationTriangleIcon
      : InformationCircleIcon

  const iconColor = isDanger
    ? 'text-red-500'
    : isWarning
      ? 'text-amber-500'
      : 'text-blue-500'

  const iconBg = isDanger
    ? 'bg-red-50 dark:bg-red-900/20'
    : isWarning
      ? 'bg-amber-50 dark:bg-amber-900/20'
      : 'bg-blue-50 dark:bg-blue-900/20'

  const submitBtnColors = isDanger
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : isWarning
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/60 pointer-events-auto"
            onClick={handleCancel}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg pointer-events-auto animate-slide-up dark:border-gray-700 dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-lg font-semibold leading-tight text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-800/50 sm:flex-nowrap">
              <button
                onClick={handleCancel}
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`w-full rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition-colors duration-150 sm:w-auto ${submitBtnColors}`}
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
