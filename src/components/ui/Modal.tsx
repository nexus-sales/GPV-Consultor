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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const containerClass = [
    'relative w-full rounded-3xl border border-white/30 dark:border-gray-700/30 bg-white/95 dark:bg-gray-800/95 p-6 shadow-2xl',
    maxWidth,
    className
  ]
    .filter(Boolean)
    .join(' ')

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={handleBackdropClick}
    >
      <div className={containerClass}>
        {title ? (
          <header className="mb-4 pr-10">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
          </header>
        ) : null}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-4 top-4 rounded-full bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-indigo focus:ring-offset-2"
          >
            {closeLabel}
          </button>
        )}

        <div className="max-h-[80vh] overflow-y-auto pr-2">{children}</div>
      </div>
    </div>
  )
}

export default Modal
