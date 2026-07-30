import { StrictMode, lazy, Suspense, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Dev-only style preview at ?style. Most of the app is behind auth, so this is
// the only way to see the design primitives while restyling.
//
// The lazy() call has to live INSIDE the DEV branch, not at module scope. Vite
// replaces import.meta.env.DEV with the literal false in a production build, so
// this whole block is dead code and Rollup drops it along with the dynamic
// import — whereas a top-level `const X = lazy(...)` is a live module-scope call
// that survives tree-shaking and ships the preview chunk to users.
let root: ReactNode = <App />
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('style')) {
  const StylePreview = lazy(() => import('./dev/StylePreview').then(m => ({ default: m.StylePreview })))
  root = <Suspense fallback={null}><StylePreview /></Suspense>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {root}
    </ErrorBoundary>
  </StrictMode>,
)
