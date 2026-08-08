import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /**
   * 'app'  — full-screen. The whole app is unusable; the only move is a reload.
   * 'tab'  — inline. One page failed, so the shell, nav and every other tab are
   *          still fine. Replacing all of that with a full-screen error would
   *          throw away a working app because one chunk did not arrive.
   */
  scope?: 'app' | 'tab'
  /** Name of the failing area, so the message can say what actually broke. */
  label?: string
}

interface State { hasError: boolean; message: string }

/**
 * A dynamic import that fails leaves React re-throwing the *cached* rejection,
 * so re-rendering the same lazy component cannot recover — only a fresh page
 * load will. Worth detecting, because it changes which button is the real fix:
 * "Try again" is useless for a missing chunk, and offering it as the primary
 * action sends people in circles.
 */
function isChunkLoadError(message: string): boolean {
  return /dynamically imported module|Loading chunk|Importing a module script failed|ChunkLoadError/i.test(message)
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  private reset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children

    const { scope = 'app', label } = this.props
    const chunkFailed = isChunkLoadError(this.state.message)

    const reload = (
      <button
        onClick={() => window.location.reload()}
        className="tl-tap-h px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[13px] font-semibold hover:bg-amber-500/25 transition-all"
      >
        Reload app
      </button>
    )

    const tryAgain = (
      <button
        onClick={this.reset}
        className="tl-tap-h px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] text-[13px] font-semibold hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all"
      >
        Try again
      </button>
    )

    if (scope === 'tab') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center" role="alert">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
            <span className="text-2xl" aria-hidden>⚠️</span>
          </div>
          <div>
            <p className="text-[15px] font-bold text-[var(--text)]">
              {label ? `${label} didn’t load` : 'This page didn’t load'}
            </p>
            <p className="text-[12px] text-[var(--text-dim)] mt-2 max-w-xs leading-relaxed mx-auto">
              {chunkFailed
                ? 'That usually means the connection dropped mid-download. Everything else still works — switch tabs, or reload to fetch it again.'
                : 'Something went wrong rendering this page. Your data is safe.'}
            </p>
          </div>
          {/* A cached chunk rejection cannot be re-rendered away, so reload
              leads for that case and "Try again" leads for everything else. */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {chunkFailed ? <>{reload}{tryAgain}</> : <>{tryAgain}{reload}</>}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg)] gap-6 p-8 text-center" role="alert">
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
        {reload}
      </div>
    )
  }
}
