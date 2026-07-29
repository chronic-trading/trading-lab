import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg)] gap-6 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-3xl">
            ⚗️
          </div>
          <div>
            <p className="text-[18px] font-bold text-[var(--text)]">Something broke</p>
            <p className="text-[13px] text-[var(--text-dim)] mt-2 max-w-sm leading-relaxed mx-auto">
              An unexpected error occurred. Your data is safe — reload to continue.
            </p>
            {this.state.message && (
              <p className="text-[11px] text-[var(--text-faint)] mt-3 font-mono max-w-sm mx-auto break-all">
                {this.state.message}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[13px] font-semibold hover:bg-amber-500/25 transition-all"
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
