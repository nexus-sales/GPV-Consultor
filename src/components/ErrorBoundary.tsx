import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode
  },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    // Aquí podrías enviar el error a un servicio externo
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-8">
          <h1 className="text-2xl font-bold mb-4">
            ¡Ha ocurrido un error inesperado!
          </h1>
          <p className="mb-2">
            Por favor, recarga la página o contacta con soporte si el problema
            persiste.
          </p>
          {this.state.error && (
            <details className="whitespace-pre-wrap text-xs mt-4">
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
