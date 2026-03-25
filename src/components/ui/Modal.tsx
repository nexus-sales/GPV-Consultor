import React, { useEffect } from 'react'

// Interfaces para el componente Modal
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
      // Evitar que Backspace navegue hacia atrás cuando el foco no está en un campo editable
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

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>
  ): void => {
    if (!onClose) return
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={handleBackdropClick}
    >
      <div
        className={[
          'relative w-full flex flex-col rounded-3xl border border-white/30 dark:border-gray-700/30 bg-white/95 dark:bg-gray-800/95 shadow-2xl',
          'max-h-[90vh]',
          maxWidth,
          className
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        {(title || onClose) && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
            {title ? (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            ) : <span />}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {closeLabel}
              </button>
            )}
          </div>
        )}

        {/* Contenido con scroll */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
