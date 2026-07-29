import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react'

export interface Command {
  id: string
  label: string
  /** Group heading, e.g. "Go to" or "Concepts" */
  section: string
  /** Extra words to match on that aren't shown, e.g. a concept's aliases */
  keywords?: string
  hint?: string
  Icon?: React.ElementType
  run: () => void
}

/**
 * Subsequence match with a relevance score, the behaviour people expect from
 * ⌘K: "grdr" finds Grader, "jour" finds Journal.
 *
 * Returns null for no match so callers can filter. Higher score is better.
 * The weighting favours, in order: an exact alias hit (so "FVG" finds Fair
 * Value Gap rather than Inversion FVG, which merely contains it earlier in the
 * string), a prefix match on the label, matches on word boundaries, and matches
 * whose characters sit close together.
 */
function score(query: string, cmd: Command): number | null {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const label = cmd.label.toLowerCase()
  const keys  = (cmd.keywords ?? '').toLowerCase()
  const hay = `${label} ${keys} ${cmd.section}`.toLowerCase()

  // Order matters. The label always wins when it starts with the query —
  // otherwise "journal" would surface Recap first, since Recap carries its
  // parent's name as an alias. An exact alias hit sits just below that, which
  // is what makes "FVG" find Fair Value Gap ahead of Inversion FVG (whose label
  // merely contains the substring earlier).
  if (label.startsWith(q)) return 1000 - label.length
  if (keys.split(/\s+/).includes(q)) return 900
  if (label.includes(q)) return 700 - label.indexOf(q)

  // Subsequence walk over the label first, then the wider haystack.
  const walk = (text: string, base: number): number | null => {
    let i = 0, hits = 0, last = -1, gaps = 0
    for (const ch of q) {
      const at = text.indexOf(ch, i)
      if (at === -1) return null
      if (last >= 0) gaps += at - last - 1
      if (at === 0 || text[at - 1] === ' ') hits += 12   // word-boundary bonus
      last = at
      i = at + 1
    }
    return base + hits - Math.min(gaps, 60)
  }
  return walk(label, 400) ?? walk(hay, 120)
}

export function CommandPalette({ open, onClose, commands, onSelectConcept }: {
  open: boolean
  onClose: () => void
  commands: Command[]
  /** Opens the Concept Map focused on this concept. */
  onSelectConcept: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [concepts, setConcepts] = useState<Command[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  // The concept dataset is ~87KB, so it's fetched when the palette first opens
  // rather than bundled with the shell. Until it lands the palette still works;
  // the concepts section simply appears a moment later.
  useEffect(() => {
    if (!open || concepts.length) return
    let cancelled = false
    import('../data/concepts').then(({ concepts: all }) => {
      if (cancelled) return
      setConcepts(all.map(c => ({
        id: `concept:${c.id}`,
        label: c.name,
        section: 'Concepts',
        // shortName and tags are how traders actually refer to these ("FVG",
        // "OB"), so they matter more for search than the full name.
        keywords: `${c.shortName} ${c.category} ${c.tier} ${c.tags.join(' ')}`,
        hint: c.category,
        run: () => onSelectConcept(c.id),
      })))
    }).catch(() => { /* palette still works without concepts */ })
    return () => { cancelled = true }
  }, [open, concepts.length, onSelectConcept])

  const results = useMemo(() => {
    // Concepts rank below tools: with 50+ of them, an unfiltered palette would
    // otherwise be a wall of concepts instead of the destinations you want.
    const pool = [...commands, ...concepts]
    const scored = pool
      .map(c => {
        const s = score(query, c)
        return { cmd: c, s: s === null ? null : s - (c.section === 'Concepts' ? 40 : 0) }
      })
      .filter((r): r is { cmd: Command; s: number } => r.s !== null)
    // Stable within a score so the list doesn't jitter as you type.
    scored.sort((a, b) => b.s - a.s)
    return scored.slice(0, 40).map(r => r.cmd)
    // `concepts` matters: it arrives asynchronously, and without it here the
    // list would stay frozen on the pre-load results.
  }, [query, commands, concepts])

  // No reset effect: the shell mounts this only while it's open, so every
  // opening is a fresh mount and the useState initialisers above are the reset.
  // Focus comes from autoFocus on the input for the same reason.

  // Keep the highlighted row in view when navigating by keyboard.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter')     {
        e.preventDefault()
        const cmd = results[active]
        if (cmd) { onClose(); cmd.run() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, onClose])

  if (!open) return null

  // Group headings are rendered inline as the section changes, so the list stays
  // one flat keyboard-navigable sequence.
  let lastSection: string | null = null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4 bg-black/55 backdrop-blur-sm"
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Command palette"
        className="w-full max-w-xl tl-card overflow-hidden shadow-2xl">

        <div className="flex items-center gap-2.5 px-4 border-b border-[var(--border)]">
          <Search size={15} className="text-[var(--text-faint)] flex-shrink-0" />
          {/* Highlight resets here rather than in an effect on `query`, so a new
              search can't briefly point at the previous result's row. */}
          <input ref={inputRef} autoFocus value={query} onChange={e => { setQuery(e.target.value); setActive(0) }}
            placeholder="Jump to a tool, concept, or setup…"
            aria-label="Search commands"
            className="flex-1 bg-transparent py-3.5 text-[14px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none" />
          <kbd className="text-[10px] font-semibold text-[var(--text-faint)] border border-[var(--border)] rounded-md px-1.5 py-0.5">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {results.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--text-faint)]">
              Nothing matches “{query}”.
            </p>
          )}
          {results.map((cmd, i) => {
            const header = cmd.section !== lastSection ? cmd.section : null
            lastSection = cmd.section
            const on = i === active
            return (
              <div key={cmd.id}>
                {header && (
                  <p className="tl-eyebrow px-4 pt-2.5 pb-1">{header}</p>
                )}
                <button
                  data-active={on}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { onClose(); cmd.run() }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                    on ? 'bg-[var(--accent-soft)]' : ''
                  }`}>
                  {cmd.Icon && <cmd.Icon size={14} className={`flex-shrink-0 ${on ? 'text-[var(--accent-ink)]' : 'text-[var(--text-faint)]'}`} />}
                  <span className={`text-[13px] truncate ${on ? 'text-[var(--accent-ink)] font-semibold' : 'text-[var(--text)]'}`}>
                    {cmd.label}
                  </span>
                  {cmd.hint && (
                    <span className="ml-auto text-[11px] text-[var(--text-faint)] truncate flex-shrink-0 pl-3">{cmd.hint}</span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-faint)] font-semibold">
          <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={10} /> open</span>
          <span className="ml-auto">{results.length} result{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  )
}
