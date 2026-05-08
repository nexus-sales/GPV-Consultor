import React, { useEffect } from 'react'

interface ModalProps {
  children: React.ReactNode
  onClose?: () => void
  title?: string
  maxWidth?: string
  className?: string
  closeLabel?: string
}

const Modal: React.FC<ModalProps> = ({
  children,
  onClose,
  title,
  maxWidth = 'max-w-2xl',
  className = '',
  closeLabel = 'Cerrar'
}) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose?.()
      }
      if (event.key === 'Backspace') {
        const target = event.target as HTMLElement
        const isEditable =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        if (!isEditable) {
          event.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const panelClasses = [
    'fixed z-50 flex flex-col',
    'top-[5vh] left-1/2 -translate-x-1/2',
    'w-[calc(100vw-2rem)] h-[90vh]',
    'rounded-xl border border-gray-200 bg-white shadow-xl',
    'dark:border-gray-700 dark:bg-gray-800',
    maxWidth,
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header fijo */}
        {(title || onClose) && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 pb-4 pt-5 dark:border-gray-700">
            {title ? (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {closeLabel}
              </button>
            )}
          </div>
        )}

        {/* Contenido con scroll garantizado */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex flex-col">
          {children}
        </div>
      </div>
    </>
  )
}

export default Modal
