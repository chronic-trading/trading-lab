// ── Funnel event tracking ─────────────────────────────────────────────────────
// Thin wrapper over GoatCounter (privacy-first, no cookies, no consent banner).
// The count.js script is loaded from index.html and auto-ignores localhost, so
// events only fire in production — dev clicking never pollutes the dashboard.
//
// Events show up in the GoatCounter dashboard under their own paths, so the
// funnel reads as: pageview → scroll depth → demo used → buy click.

interface GoatCounter {
  count: (opts: { path: string; title?: string; event?: boolean }) => void
}

declare global {
  interface Window { goatcounter?: GoatCounter }
}

/**
 * Record a funnel event. Never throws — analytics must not break the page, and
 * the script may not have loaded yet (async) or may be blocked by an ad blocker.
 */
export function track(event: string, title?: string): void {
  try {
    window.goatcounter?.count({ path: event, title: title ?? event, event: true })
  } catch {
    /* analytics is best-effort by design — swallow */
  }
}

/** Fire an event at most once per page load (e.g. "user touched the demo"). */
const fired = new Set<string>()
export function trackOnce(event: string, title?: string): void {
  if (fired.has(event)) return
  fired.add(event)
  track(event, title)
}
