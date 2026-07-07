import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
  errorDetails: string
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
      errorDetails: '',
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
      errorDetails: '',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorMessage: error.message,
      errorDetails: errorInfo.componentStack ?? '',
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
      errorDetails: '',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="error-boundary" role="alert">
          <h2 className="page-title">Something went wrong</h2>
          <p className="error-message">{this.state.errorMessage}</p>
          {this.state.errorDetails && (
            <pre className="error-details">{this.state.errorDetails}</pre>
          )}
          <button
            type="button"
            className="primary-button"
            onClick={this.handleReset}
          >
            Try Again
          </button>
        </section>
      )
    }

    return this.props.children
  }
}