import React from 'react'
import { logger } from '../lib/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * ErrorBoundary con logging estructurado
 *
 * Captura errores de React, los loguea de forma estructurada
 * y muestra una UI de error amigable.
 *
 * Características:
 * - Logging estructurado con logger centralizado
 * - Callback opcional para integración con Sentry/telemetría
 * - Fallback UI personalizable
 * - Información detallada en desarrollo
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Actualizar estado
    this.setState({ errorInfo })

    // Logging estructurado del error
    logger.error('React ErrorBoundary caught an error', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })

    // Callback opcional para integración con servicios externos
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // En producción, aquí podrías enviar el error a un servicio de telemetría
    if (import.meta.env.PROD) {
      // Ejemplo: Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    logger.info('User attempted to retry after error')
  }

  handleReload = () => {
    logger.info('User reloading page after error')
    window.location.reload()
  }

  render() {
    // Si no hay error, renderizar children normalmente
    if (!this.state.hasError) {
      return this.props.children
    }

    // Si hay fallback personalizado, usarlo
    if (this.props.fallback) {
      return this.props.fallback
    }

    // UI de error por defecto
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-red-100 dark:border-red-900/30">
          {/* Icono de error */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            ¡Ha ocurrido un error!
          </h1>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Algo salió mal. No te preocupes, estamos trabajando en solucionarlo.
          </p>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 bg-pastel-indigo hover:bg-pastel-indigo/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-pastel-indigo/25"
            >
              Intentar de nuevo
            </button>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200"
            >
              Recargar página
            </button>
          </div>

          {/* Información del error (solo desarrollo) */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Ver detalles del error (Desarrollo)
              </summary>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-x-auto">
                <div className="text-xs">
                  <div className="mb-3">
                    <strong className="text-red-600 dark:text-red-400 block mb-1">
                      Error:
                    </strong>
                    <code className="text-gray-800 dark:text-gray-200">
                      {this.state.error.toString()}
                    </code>
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-3">
                      <strong className="text-orange-600 dark:text-orange-400 block mb-1">
                        Stack:
                      </strong>
                      <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong className="text-blue-600 dark:text-blue-400 block mb-1">
                        Component Stack:
                      </strong>
                      <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Información de contacto */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>¿Necesitas ayuda?</strong> Contacta con soporte técnico:
              <br />
              <a
                href="mailto:soporte@gpvcanarias.com"
                className="underline hover:text-blue-600 dark:hover:text-blue-200"
              >
                soporte@gpvcanarias.com
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
