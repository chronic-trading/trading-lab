import type { ReactNode } from 'react'

/**
 * Empty states.
 *
 * These were scattered and inconsistent: some were a full centred block with an
 * icon and two lines, others were a single line of faint 11px text, and none of
 * them offered a way out. "Craft a model in the Builder and hit Save Build"
 * tells you what to do but leaves you to go and find it — an empty state's job
 * is to get you to the first action, not just to explain the absence.
 *
 * Modelled on the MyBuilds block, which was already the best of them: a dashed
 * container reads as a slot waiting to be filled rather than as something that
 * failed to load. That distinction matters when it sits next to an error state.
 */

type Props = {
  icon: ReactNode
  title: string
  description?: string
  /** The first step out. Omit when there is no single obvious next action. */
  action?: { label: string; onClick: () => void }
  /**
   * 'page'   — owns the viewport (a whole tab with no content yet).
   * 'inline' — sits inside a card next to other content, so it stays compact.
   */
  size?: 'page' | 'inline'
}

export function EmptyState({ icon, title, description, action, size = 'page' }: Props) {
  const page = size === 'page'

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        page ? 'flex-1 gap-5 py-20 px-6' : 'gap-3 py-8 px-4'
      }`}
    >
      <div
        className={`rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-faint)] ${
          page ? 'w-16 h-16' : 'w-11 h-11'
        }`}
        aria-hidden
      >
        {icon}
      </div>

      <div>
        <p className={`font-semibold text-[var(--text-dim)] ${page ? 'text-[15px]' : 'text-[13px]'}`}>
          {title}
        </p>
        {description && (
          <p
            className={`text-[var(--text-faint)] leading-relaxed mx-auto ${
              page ? 'text-[12px] mt-2 max-w-xs' : 'text-[11px] mt-1.5 max-w-[36ch]'
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="tl-tap-h px-4 py-2.5 rounded-xl border border-amber-500/35 bg-amber-500/12 text-amber-300 text-[12px] font-semibold hover:bg-amber-500/22 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
