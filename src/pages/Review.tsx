import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Layers, Sparkles, CheckCircle2, Eye, CalendarCheck2, Link2 } from 'lucide-react'
import { concepts } from '../data/concepts'
import {
  useReviewData, buildQueue, gradeCard, previewInterval,
  currentStreak, dueTomorrow, todayStr, LEARNED_INTERVAL, type Grade,
} from '../hooks/useReview'
import { useAllMastery, MASTERY_COLORS, MASTERY_LABELS, MASTERY_TEXT, type MasteryLevel } from '../hooks/useMastery'

const tierDot: Record<string, string>   = { basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400' }
const tierLabel: Record<string, string> = { basic: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-purple-400' }

const GRADES: { g: Grade; label: string; key: string; cls: string }[] = [
  { g: 0, label: 'Again', key: '1', cls: 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 active:bg-red-500/25' },
  { g: 1, label: 'Hard',  key: '2', cls: 'border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 active:bg-orange-500/25' },
  { g: 2, label: 'Good',  key: '3', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 active:bg-emerald-500/25' },
  { g: 3, label: 'Easy',  key: '4', cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:bg-amber-500/25' },
]

function Stat({ value, label, icon, color }: { value: number | string; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-slate-900/50 border border-slate-800/60 rounded-2xl px-3.5 py-2.5 flex-1 min-w-0">
      <div className={`flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[16px] font-black text-white leading-none">{value}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mt-1 truncate">{label}</p>
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
      <div className="max-w-2xl mx-auto px-4 py-5 md:py-8 space-y-4 md:space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <Layers size={17} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-[17px] font-black text-white leading-none">Daily Review</h1>
            <p className="text-[11px] text-slate-500 mt-1">Spaced repetition over the concept map — a few minutes a day keeps every concept sharp.</p>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="flex gap-2 md:gap-3">
          <Stat value={queue.length} label="In queue"  color="text-amber-400"   icon={<Layers size={15} />} />
          <Stat value={streak}       label="Day streak" color="text-orange-400" icon={<Flame size={15} />} />
          <Stat value={learned}      label="Learned"   color="text-emerald-400" icon={<CheckCircle2 size={15} />} />
          <Stat value={data.log[todayStr()]?.done ?? 0} label="Done today" color="text-blue-400" icon={<CalendarCheck2 size={15} />} />
        </div>

        {/* ── Progress bar ── */}
        {total > 0 && (
          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
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
              className="bg-[#0d0d16] border border-slate-700/60 rounded-3xl overflow-hidden"
            >
              {/* Badge row */}
              <div className="flex items-center justify-between gap-2 px-5 pt-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDot[concept.tier]}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${tierLabel[concept.tier]}`}>{concept.tier}</span>
                  <span className="text-slate-700 text-[10px]">·</span>
                  <span className="text-[11px] text-slate-500 capitalize">{concept.category}</span>
                  {isNew ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-0.5 uppercase tracking-wide">
                      <Sparkles size={9} /> New
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-600">
                      every {cardState!.interval <= 1 ? 'day' : `${cardState!.interval}d`} · seen {cardState!.reps + cardState!.lapses}×
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className={`w-2 h-2 rounded-full border ${n <= mLevel ? MASTERY_COLORS[mLevel] + ' border-transparent' : 'border-slate-700/60'}`} />
                    ))}
                  </div>
                  <span className={`text-[9px] font-bold ml-1 ${MASTERY_TEXT[mLevel]}`}>{MASTERY_LABELS[mLevel]}</span>
                </div>
              </div>

              {/* Front — the prompt */}
              <div className="px-5 py-6 md:py-8 text-center">
                <p className="text-[26px] md:text-[30px] font-black text-white leading-tight">{concept.name}</p>
                {!revealed && (
                  <p className="text-[12px] text-slate-600 mt-3">Recall the definition and how you'd trade it — then reveal.</p>
                )}
              </div>

              {/* Back — the answer */}
              {revealed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-slate-800/60 px-5 py-4 space-y-4"
                >
                  <p className="text-[13.5px] text-slate-300 leading-relaxed">{concept.description}</p>
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-500 mb-1.5">How to use</p>
                    <p className="text-[13px] text-slate-300 leading-relaxed">{concept.howToUse}</p>
                  </div>
                  {strongSynergies.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Essential pairings</p>
                      {strongSynergies.map(s => (
                        <div key={s.conceptId} className="flex items-start gap-2 bg-slate-900/50 border border-slate-800/60 rounded-xl px-3 py-2">
                          <Link2 size={11} className="text-slate-600 mt-0.5 flex-shrink-0" />
                          <p className="text-[12px] text-slate-400 leading-snug">
                            <span className="font-bold text-slate-200">{s.partner!.shortName}</span> — {s.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grade buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {GRADES.map(({ g, label, key, cls }) => (
                      <button key={g} onClick={() => onGrade(g)}
                        className={`flex flex-col items-center gap-0.5 py-3 rounded-2xl border transition-all ${cls}`}>
                        <span className="text-[13px] font-bold">{label}</span>
                        <span className="text-[10px] opacity-70 font-semibold">{previewInterval(cardState, g)}</span>
                        <span className="hidden md:block text-[9px] opacity-40 font-bold">{key}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="border-t border-slate-800/60 p-4">
                  <button onClick={() => setRevealed(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[14px] font-semibold hover:bg-amber-500/25 transition-all">
                    <Eye size={15} /> Show answer
                    <span className="hidden md:inline text-[10px] opacity-50 font-bold ml-1">space</span>
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
              className="bg-[#0d0d16] border border-slate-700/60 rounded-3xl px-6 py-10 text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[20px] font-black text-white">
                  {doneCount > 0 ? 'Session complete' : 'All caught up'}
                </p>
                <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed max-w-sm mx-auto">
                  {doneCount > 0
                    ? `${todayLog?.done ?? doneCount} card${(todayLog?.done ?? doneCount) === 1 ? '' : 's'} reviewed today${streak > 1 ? ` — ${streak}-day streak` : ''}. The algorithm will bring each one back right before you'd forget it.`
                    : 'Nothing due right now. Come back tomorrow — reviews land daily.'}
                </p>
              </div>
              {dueTomorrow(data) > 0 && (
                <p className="text-[11px] font-semibold text-slate-600">
                  {dueTomorrow(data)} card{dueTomorrow(data) === 1 ? '' : 's'} due tomorrow
                </p>
              )}
              {streak > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/25 rounded-xl px-3 py-1.5">
                  <Flame size={13} className="text-orange-400" />
                  <span className="text-[12px] font-bold text-orange-300">{streak}-day streak</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
