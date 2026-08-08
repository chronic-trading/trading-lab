import { useEffect, useState } from 'react'
import type { Transition } from 'framer-motion'

/**
 * Shared motion for overlays.
 *
 * The app had three different modal presentations: centred scale-in dialogs,
 * right-edge drawers that slid in from x:380-440, and one correct bottom sheet
 * (QuizModal). On a 375px phone a 440px drawer is not a drawer — it covers the
 * whole screen while animating in from the side, which is a desktop gesture
 * with nothing to anchor it. QuizModal already did the right thing, so this
 * generalises that rather than inventing a fourth style.
 *
 * Modals branch on `sm:` (640px) in their classNames, so the hook below uses
 * the same breakpoint. That is deliberately NOT the 768px used by the touch
 * layer in index.css — matching each system's own boundary avoids a band where
 * the CSS says phone and the JS says desktop.
 */

const PHONE_QUERY = '(max-width: 639px)'

export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    mq.addEventListener('change', onChange)
    // Re-sync in case the viewport changed between first render and effect.
    setIsPhone(mq.matches)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isPhone
}

/**
 * Damped spring rather than a fixed duration. A sheet that decelerates into
 * place reads as physical; a linear 170ms fade reads as a web page. Damping is
 * high enough to settle without overshoot — a bouncing sheet reads as playful,
 * which is wrong for a tool opened fifty times a session.
 *
 * These values match QuizModal, which already shipped this presentation. Kept
 * identical on purpose: one sheet feel across the app, and it is the version
 * that has actually run on real devices.
 */
export const SPRING: Transition = { type: 'spring', damping: 30, stiffness: 300 }

/** Snappier curve for small in-place changes (chips, rows, inline reveals). */
export const QUICK: Transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] }

/** Scrim. Always a plain fade — a moving scrim competes with the panel. */
export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

/**
 * Bottom sheet on phones. One definition serves both sizes: when the panel is
 * centred on desktop, the same y-offset reads as a short rise rather than a
 * full-height slide, so there is no need to branch.
 */
export const sheetPanel = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: SPRING,
}

/**
 * Edge drawers keep their horizontal slide on desktop, where there is a screen
 * edge for them to come from, and become bottom sheets on phones.
 * `width` is the drawer's own width, so it starts fully offscreen.
 */
export function useDrawerMotion(width: number) {
  const phone = useIsPhone()
  if (phone) return sheetPanel
  // Pixel offset, so a spring resolves fine here.
  return {
    initial: { x: width },
    animate: { x: 0 },
    exit: { x: width },
    transition: SPRING,
  }
}

/** Shared class strings so the eight overlays cannot drift apart again. */
export const SHEET_OVERLAY_CLASS =
  'fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm'

/** Phones: full-width, top-rounded, capped to the dynamic viewport so the
 *  iOS URL bar collapsing cannot push the sheet's footer offscreen. */
export const SHEET_PANEL_CLASS =
  'w-full border-t sm:border rounded-t-2xl sm:rounded-2xl border-[var(--border)] shadow-2xl overflow-hidden'

/**
 * Edge drawers. Bottom-anchored on phones, right-edge from `sm:` up.
 * The panel width is left to each caller (they differ: 440px / 480px), so add
 * an `sm:w-[…]` alongside this.
 *
 * `max-h-[88dvh]` rather than `h-full`: these were `h-full` with a fixed pixel
 * width, so on a 375px phone a 480px drawer ran off the side of the screen
 * while covering the entire height — a full-screen takeover animating in from
 * an edge that is not there.
 */
export const DRAWER_OVERLAY_CLASS =
  'fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end bg-black/50 backdrop-blur-sm'

export const DRAWER_PANEL_CLASS =
  'w-full max-h-[88dvh] sm:max-h-none sm:h-full bg-[var(--bg-elev)] border-t sm:border-t-0 sm:border-l border-[var(--border)] rounded-t-2xl sm:rounded-none flex flex-col shadow-2xl'
