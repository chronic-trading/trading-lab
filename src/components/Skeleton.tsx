/**
 * Loading placeholders.
 *
 * Every one of the app's 21 lazily-loaded pages shared a single centred
 * spinner, so each tab change blanked the screen, showed a spinner in the
 * middle of nothing, then popped a full page in. A skeleton shaped like the
 * destination keeps the layout still: the header, the stats strip and the
 * first cards land where they are about to be, so the arriving content
 * replaces the placeholder rather than shoving it aside.
 *
 * 15 of the 16 pages share the same shell — scroll container, centred column,
 * `tl-page-head` (eyebrow, title, subtitle), then content — so one skeleton
 * matching that shell covers nearly all of them. Bespoke skeletons per page
 * would drift out of sync with the pages the first time one was redesigned.
 */

type BlockProps = {
  className?: string
  /** Inline width, for the ragged line lengths that make text look like text. */
  width?: string
}

/** A single shimmering block. Decorative: the announcement is on the wrapper. */
export function Skeleton({ className = '', width }: BlockProps) {
  return <div aria-hidden className={`tl-skeleton ${className}`} style={width ? { width } : undefined} />
}

type PageSkeletonProps = {
  /** Match the destination page's column so content does not jump on arrival. */
  maxWidth?: string
  /** Stat cards in the strip under the header. 0 hides the strip. */
  stats?: number
  /** Content cards below. */
  cards?: number
}

export function PageSkeleton({ maxWidth = 'max-w-5xl', stats = 3, cards = 3 }: PageSkeletonProps) {
  return (
    /* role="status" + aria-live so a screen reader hears that something is
       loading. Without it the blocks are silent and the page reads as empty. */
    <div className="flex-1 overflow-y-auto" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>

      <div className={`${maxWidth} mx-auto px-4 py-6 md:py-9 space-y-5`}>

        {/* Page head — eyebrow, title, subtitle. Mirrors .tl-page-head. */}
        <div className="space-y-2.5">
          <Skeleton className="h-3 rounded-full" width="92px" />
          <Skeleton className="h-8 md:h-9 rounded-lg" width="62%" />
          <Skeleton className="h-3.5 rounded-full" width="80%" />
        </div>

        {/* Stats strip */}
        {stats > 0 && (
          <div className="flex gap-2.5">
            {Array.from({ length: stats }, (_, i) => (
              <div key={i} className="flex-1 tl-card px-3.5 py-3 space-y-2">
                <Skeleton className="h-5 rounded" width="44%" />
                <Skeleton className="h-2.5 rounded-full" width="70%" />
              </div>
            ))}
          </div>
        )}

        {/* Content cards. Ragged final line so a block of text reads as text
            rather than as a solid rectangle. */}
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="tl-card p-5 space-y-3">
            <Skeleton className="h-4 rounded" width="38%" />
            <Skeleton className="h-3 rounded-full" />
            <Skeleton className="h-3 rounded-full" width="88%" />
            <Skeleton className="h-3 rounded-full" width="54%" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * For the chart tools, where the page is one large canvas rather than a column
 * of cards. A card skeleton there would promise the wrong layout.
 */
export function ChartSkeleton() {
  return (
    <div className="flex-1 flex flex-col" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading chart…</span>

      {/* Toolbar row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
        <Skeleton className="h-8 rounded-xl" width="56px" />
        <Skeleton className="h-8 rounded-xl" width="56px" />
        <Skeleton className="h-8 rounded-xl" width="56px" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 rounded-xl" width="72px" />
        </div>
      </div>

      {/* Chart body */}
      <div className="flex-1 p-4">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    </div>
  )
}
