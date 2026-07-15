import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Layers, Sparkles, CheckCircle2, Eye, Link2 } from 'lucide-react'
import { concepts } from '../data/concepts'
import { GlossaryText } from '../components/GlossaryText'
import {
  useReviewData, buildQueue, gradeCard, previewInterval,
  currentStreak, dueTomorrow, todayStr, LEARNED_INTERVAL, type Grade,
} from '../hooks/useReview'
import { useAllMastery, MASTERY_COLORS, MASTERY_LABELS, MASTERY_TEXT, type MasteryLevel } from '../hooks/useMastery'

const tierColor: Record<string, string> = { basic: 'var(--green)', intermediate: 'var(--blue)', advanced: 'var(--violet)' }

const GRADES: { g: Grade; label: string; key: string; c: string; soft: string }[] = [
  { g: 0, label: 'Again', key: '1', c: 'var(--red)',    soft: 'var(--red-soft)' },
  { g: 1, label: 'Hard',  key: '2', c: 'var(--orange)', soft: 'var(--orange-soft)' },
  { g: 2, label: 'Good',  key: '3', c: 'var(--green)',  soft: 'var(--green-soft)' },
  { g: 3, label: 'Easy',  key: '4', c: 'var(--accent-ink)', soft: 'var(--accent-soft)' },
]

function Stat({ value, label, icon, color }: { value: number | string; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-3.5 py-3 flex-1 min-w-0 shadow-[var(--shadow-sm)]">
      <div className="flex-shrink-0" style={{ color }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[18px] font-extrabold text-[var(--text)] leading-none">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)] mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

export function Review() {
  const data = useReviewData()
  const masteryData = useAllMastery()

  // Session queue — built once per mount; Again-cards cycle to the back
  const [queue, setQueue] = useState<string[]>(() => {
    const { due, fresh } = buildQueue()
    return [...due, ...fresh]
  })
  const [doneCount, setDoneCount] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const currentId = queue[0]
  const concept = currentId ? concepts.find(c => c.id === currentId) : null
  const cardState = currentId ? data.cards[currentId] : undefined
  const isNew = !!currentId && !cardState

  const total = doneCount + queue.length
  const learned = Object.values(data.cards).filter(s => s.interval >= LEARNED_INTERVAL).length
  const streak = currentStreak(data)
  const todayLog = data.log[todayStr()]

  const onGrade = (g: Grade) => {
    if (!currentId) return
    gradeCard(currentId, g)
    setQueue(q => {
      const rest = q.slice(1)
      return g === 0 ? [...rest, currentId] : rest
    })
    if (g > 0) setDoneCount(n => n + 1)
    setRevealed(false)
  }

  // Keyboard: space/enter reveals, 1–4 grades
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!currentId) return
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault()
        setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        onGrade((parseInt(e.key) - 1) as Grade)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [currentId, revealed])

  const mLevel = concept ? ((masteryData[concept.id] ?? 0) as MasteryLevel) : 0
  const strongSynergies = concept
    ? concept.synergies.filter(s => s.strength === 3).slice(0, 3)
        .map(s => ({ ...s, partner: concepts.find(c => c.id === s.conceptId) }))
        .filter(s => s.partner)
    : []

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-9 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
            <Layers size={19} className="text-[var(--accent-ink)]" />
          </div>
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--text)] leading-tight tracking-tight">Daily Review</h1>
            <p className="text-[12px] text-[var(--text-dim)] mt-0.5">A few minutes a day keeps every concept sharp.</p>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="flex gap-2.5">
          <Stat value={queue.length} label="In queue"   color="var(--accent-ink)" icon={<Layers size={16} />} />
          <Stat value={streak}       label="Day streak"  color="var(--orange)"     icon={<Flame size={16} />} />
          <Stat value={learned}      label="Learned"     color="var(--green)"      icon={<CheckCircle2 size={16} />} />
        </div>

        {/* ── Progress bar ── */}
        {total > 0 && (
          <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--accent), #fbbf24)' }}
              animate={{ width: `${(doneCount / total) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        {/* ── Card / done state ── */}
        <AnimatePresence mode="wait">
          {concept ? (
            <motion.div
              key={`${currentId}-${queue.length}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[26px] overflow-hidden shadow-[var(--shadow-md)]"
            >
              {/* Badge row */}
              <div className="flex items-center justify-between gap-2 px-6 pt-5 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ color: tierColor[concept.tier], background: 'var(--surface-2)' }}
                  >
                    {concept.tier}
                  </span>
                  <span className="text-[11px] text-[var(--text-faint)] capitalize">{concept.category}</span>
                  {isNew ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent-ink)] bg-[var(--accent-soft)] rounded-full px-2.5 py-1 uppercase tracking-wide">
                      <Sparkles size={9} /> New
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[var(--text-faint)]">
                      every {cardState!.interval <= 1 ? 'day' : `${cardState!.interval}d`} · seen {cardState!.reps + cardState!.lapses}×
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className={`w-2 h-2 rounded-full ${n <= mLevel ? MASTERY_COLORS[mLevel] : 'bg-[var(--surface-2)]'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold ml-1 ${MASTERY_TEXT[mLevel]}`}>{MASTERY_LABELS[mLevel]}</span>
                </div>
              </div>

              {/* Front — the prompt */}
              <div className="px-6 py-8 md:py-10 text-center">
                <p className="text-[28px] md:text-[32px] font-extrabold text-[var(--text)] leading-tight tracking-tight">{concept.name}</p>
                {!revealed && (
                  <p className="text-[13px] text-[var(--text-faint)] mt-3">Recall the definition and how you'd trade it — then reveal.</p>
                )}
              </div>

              {/* Back — the answer */}
              {revealed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-[var(--border)] px-6 py-5 space-y-4"
                >
                  <p className="text-[14px] text-[var(--text-dim)] leading-relaxed"><GlossaryText text={concept.description} /></p>
                  <div className="bg-[var(--accent-soft)] rounded-2xl px-4 py-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent-ink)] mb-1.5">How to use</p>
                    <p className="text-[13px] text-[var(--text-dim)] leading-relaxed"><GlossaryText text={concept.howToUse} /></p>
                  </div>
                  {strongSynergies.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">Essential pairings</p>
                      {strongSynergies.map(s => (
                        <div key={s.conceptId} className="flex items-start gap-2 bg-[var(--surface-2)] rounded-xl px-3 py-2.5">
                          <Link2 size={11} className="text-[var(--text-faint)] mt-0.5 flex-shrink-0" />
                          <p className="text-[12px] text-[var(--text-dim)] leading-snug">
                            <span className="font-bold text-[var(--text)]">{s.partner!.shortName}</span> — {s.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grade buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {GRADES.map(({ g, label, key, c, soft }) => (
                      <button key={g} onClick={() => onGrade(g)}
                        className="flex flex-col items-center gap-0.5 py-3.5 rounded-2xl font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: soft, color: c, border: '1px solid', borderColor: `color-mix(in srgb, ${c} 32%, transparent)` }}>
                        <span className="text-[13px]">{label}</span>
                        <span className="text-[10px] opacity-75 font-semibold">{previewInterval(cardState, g)}</span>
                        <span className="hidden md:block text-[10px] opacity-40 font-bold">{key}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="border-t border-[var(--border)] p-4">
                  <button onClick={() => setRevealed(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-[14px] font-bold shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                    style={{ background: 'linear-gradient(180deg, #fbbf24, var(--accent))' }}>
                    <Eye size={16} /> Show answer
                    <span className="hidden md:inline text-[10px] opacity-70 font-bold ml-1">space</span>
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Done / caught up ── */
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[26px] px-6 py-12 text-center space-y-4 shadow-[var(--shadow-md)]"
            >
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--green-soft)] flex items-center justify-center">
                <CheckCircle2 size={30} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className="text-[20px] font-extrabold text-[var(--text)] tracking-tight">
                  {doneCount > 0 ? 'Session complete' : 'All caught up'}
                </p>
                <p className="text-[13px] text-[var(--text-dim)] mt-2 leading-relaxed max-w-sm mx-auto">
                  {doneCount > 0
                    ? `${todayLog?.done ?? doneCount} card${(todayLog?.done ?? doneCount) === 1 ? '' : 's'} reviewed today${streak > 1 ? ` — ${streak}-day streak` : ''}. The algorithm will bring each one back right before you'd forget it.`
                    : 'Nothing due right now. Come back tomorrow — reviews land daily.'}
                </p>
              </div>
              {dueTomorrow(data) > 0 && (
                <p className="text-[11px] font-semibold text-[var(--text-faint)]">
                  {dueTomorrow(data)} card{dueTomorrow(data) === 1 ? '' : 's'} due tomorrow
                </p>
              )}
              {streak > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-[var(--orange-soft)] rounded-full px-3.5 py-1.5">
                  <Flame size={13} style={{ color: 'var(--orange)' }} />
                  <span className="text-[12px] font-bold" style={{ color: 'var(--orange)' }}>{streak}-day streak</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
