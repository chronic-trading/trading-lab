import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, XCircle, RotateCcw, Trophy, Brain, Zap } from 'lucide-react'
import { concepts } from '../data/concepts'
import { useAllMastery, MASTERY_LABELS, MASTERY_COLORS, MASTERY_TEXT, type MasteryLevel } from '../hooks/useMastery'
import { useModalBackButton } from '../hooks/useModalBackButton'

interface Question {
  type: 'name-to-desc' | 'desc-to-name' | 'synergy'
  conceptId: string
  question: string
  correct: string
  options: string[]
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Weight: level 0 → 5×, 1 → 4×, 2 → 3×, 3 → 2×, 4-5 → 1×
function getWeight(level: number): number {
  if (level === 0) return 5
  if (level === 1) return 4
  if (level === 2) return 3
  if (level === 3) return 2
  return 1
}

function buildWeightedQuestions(masteryData: Record<string, MasteryLevel>): Question[] {
  // Build a weighted pool — duplicate concepts based on weakness
  const pool: string[] = []
  for (const c of concepts) {
    const w = getWeight(masteryData[c.id] ?? 0)
    for (let i = 0; i < w; i++) pool.push(c.id)
  }

  // Pick up to 20 unique concepts from the weighted pool
  const shuffledPool = shuffle(pool)
  const picked: typeof concepts = []
  const seen = new Set<string>()
  for (const id of shuffledPool) {
    if (!seen.has(id)) {
      seen.add(id)
      const c = concepts.find(x => x.id === id)
      if (c) picked.push(c)
    }
    if (picked.length >= 20) break
  }

  // Build one question per picked concept
  const qs: Question[] = []
  for (const c of picked) {
    const roll = Math.random()

    if (roll < 0.35) {
      // Name → description
      const wrongs = shuffle(concepts.filter(x => x.id !== c.id)).slice(0, 3).map(x => x.description.slice(0, 150) + '…')
      qs.push({
        type: 'name-to-desc',
        conceptId: c.id,
        question: `What is "${c.name}"?`,
        correct: c.description.slice(0, 150) + '…',
        options: shuffle([c.description.slice(0, 150) + '…', ...wrongs]),
      })
    } else if (roll < 0.70) {
      // Description → name
      const wrongs = shuffle(concepts.filter(x => x.id !== c.id)).slice(0, 3).map(x => x.shortName)
      qs.push({
        type: 'desc-to-name',
        conceptId: c.id,
        question: c.description.slice(0, 180) + '…',
        correct: c.shortName,
        options: shuffle([c.shortName, ...wrongs]),
      })
    } else {
      // Synergy — fall back to desc-to-name if none available
      const strongSyns = c.synergies.filter(s => s.strength === 3)
      if (strongSyns.length > 0) {
        const syn     = strongSyns[Math.floor(Math.random() * strongSyns.length)]
        const partner = concepts.find(x => x.id === syn.conceptId)
        if (partner) {
          const wrongs = shuffle(concepts.filter(x => x.id !== partner.id && x.id !== c.id)).slice(0, 3).map(x => x.shortName)
          qs.push({
            type: 'synergy',
            conceptId: c.id,
            question: `Which concept is ESSENTIAL to pair with "${c.shortName}"?`,
            correct: partner.shortName,
            options: shuffle([partner.shortName, ...wrongs]),
          })
          continue
        }
      }
      // Fallback
      const wrongs = shuffle(concepts.filter(x => x.id !== c.id)).slice(0, 3).map(x => x.shortName)
      qs.push({
        type: 'desc-to-name',
        conceptId: c.id,
        question: c.description.slice(0, 180) + '…',
        correct: c.shortName,
        options: shuffle([c.shortName, ...wrongs]),
      })
    }
  }

  return qs
}

const tierDot: Record<string, string>   = { basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400' }
const tierLabel: Record<string, string> = { basic: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-purple-400' }
const OPTION_LABELS = ['A', 'B', 'C', 'D']

interface Props { open: boolean; onClose: () => void }

export function QuizModal({ open, onClose }: Props) {
  useModalBackButton(open, onClose)
  const masteryData = useAllMastery()

  const ratedCount = concepts.filter(c => (masteryData[c.id] ?? 0) > 0).length
  const weakCount  = concepts.filter(c => (masteryData[c.id] ?? 0) > 0 && (masteryData[c.id] ?? 0) <= 2).length

  const [idx,        setIdx]        = useState(0)
  const [selected,   setSelected]   = useState<string | null>(null)
  const [score,      setScore]      = useState(0)
  const [done,       setDone]       = useState(false)
  const [wrong,      setWrong]      = useState<string[]>([])
  const [sessionKey, setSessionKey] = useState(0)

  const questions = useMemo(() => buildWeightedQuestions(masteryData), [open, sessionKey])

  const q       = questions[idx]
  const concept = q ? concepts.find(c => c.id === q.conceptId) : null
  const correct = selected === q?.correct
  const cLevel  = concept ? (masteryData[concept.id] ?? 0) as MasteryLevel : 0

  const pick = (opt: string) => {
    if (selected) return
    setSelected(opt)
    if (opt === q.correct) {
      setScore(s => s + 1)
    } else {
      setWrong(w => w.includes(q.conceptId) ? w : [...w, q.conceptId])
    }
  }

  const next = () => {
    if (idx + 1 >= questions.length) { setDone(true); return }
    setIdx(i => i + 1); setSelected(null)
  }

  const restart = () => {
    setIdx(0); setSelected(null); setScore(0); setDone(false); setWrong([])
    setSessionKey(k => k + 1)
  }

  const pct = Math.round((score / questions.length) * 100)

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || done) return
    const handle = (e: KeyboardEvent) => {
      if (['1','2','3','4'].includes(e.key)) {
        const i = parseInt(e.key) - 1
        if (i < q.options.length && !selected) pick(q.options[i])
      }
      if ((e.key === 'Enter' || e.key === ' ') && selected) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, done, selected, q])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          /* Mobile: bottom sheet anchored to bottom edge, no side padding
             Desktop: centered dialog with side padding               */
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            /* Mobile: slides up from bottom, full width, tall, top-rounded only
               Desktop: centered card, max-w-2xl, fully rounded              */
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-2xl bg-[#0d0d16] border-t sm:border border-slate-700/60 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100dvh - 20px)', height: 'auto' }}
          >
            {/* Drag handle (mobile visual affordance) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 border-b border-slate-800/60 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                  <Brain size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[15px] sm:text-[16px] font-bold text-white leading-none">Concept Quiz</p>
                  {!done && (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[11px] text-slate-500">Question {idx + 1} of {questions.length}</p>
                      {ratedCount >= 5 && weakCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Zap size={9} className="text-amber-500" />
                          <span className="text-[10px] text-amber-600 font-semibold">Weak-spot focus</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {!done && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl px-2.5 py-1.5">
                    <span className="text-[13px] font-bold text-amber-300">{score}</span>
                    <span className="text-[10px] text-amber-600 font-semibold">pts</span>
                  </div>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Progress bar ── */}
            {!done && (
              <div className="h-1 sm:h-1.5 bg-slate-800/80 flex-shrink-0">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                  animate={{ width: `${((idx + (selected ? 1 : 0)) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {done ? (
                <div className="flex flex-col items-center justify-center py-8 px-5 sm:py-10 sm:px-8 gap-5 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                    <Trophy size={30} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[38px] sm:text-[42px] font-black text-white leading-none">
                      {score}<span className="text-[22px] sm:text-[24px] text-slate-500 font-semibold">/{questions.length}</span>
                    </p>
                    <p className="text-[15px] sm:text-[16px] font-bold mt-2" style={{ color: pct >= 80 ? '#34d399' : pct >= 60 ? '#f59e0b' : '#f87171' }}>
                      {pct}% correct
                    </p>
                    <p className="text-[12.5px] sm:text-[13px] text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                      {pct >= 80 ? 'Sharp. You know your ICT concepts cold.' : pct >= 60 ? 'Getting there — drill the ones you missed.' : 'Keep going. Repetition is how these concepts stick.'}
                    </p>
                  </div>

                  {wrong.length > 0 && (
                    <div className="w-full max-w-sm text-left">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Study these — you got them wrong</p>
                      <div className="space-y-1.5">
                        {wrong.map(id => {
                          const c = concepts.find(x => x.id === id)
                          if (!c) return null
                          const lvl = (masteryData[id] ?? 0) as MasteryLevel
                          return (
                            <div key={id} className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierDot[c.tier]}`} />
                              <span className="text-[12px] font-semibold text-slate-200 flex-1">{c.name}</span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(n => (
                                    <div key={n} className={`w-2 h-2 rounded-full border ${n <= lvl ? MASTERY_COLORS[lvl] + ' border-transparent' : 'border-slate-700'}`} />
                                  ))}
                                </div>
                                <span className={`text-[10px] font-bold ${MASTERY_TEXT[lvl]}`}>{MASTERY_LABELS[lvl]}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pb-2">
                    <button onClick={restart}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[14px] font-semibold hover:bg-amber-500/25 transition-all">
                      <RotateCcw size={14} /> Try Again
                    </button>
                    <button onClick={onClose}
                      className="px-5 py-3 rounded-2xl border border-slate-700 text-slate-300 text-[14px] font-semibold hover:border-slate-500 hover:text-white transition-all">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-5">
                  {/* Concept badge row */}
                  {concept && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDot[concept.tier]}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${tierLabel[concept.tier]}`}>{concept.tier}</span>
                        <span className="text-slate-700 text-[10px]">·</span>
                        <span className="text-[11px] text-slate-500 capitalize">{concept.category}</span>
                        {q.type === 'synergy' && (
                          <span className="text-[10px] font-semibold text-amber-500/70 uppercase tracking-wide">· Synergy</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <div key={n} className={`w-2 h-2 rounded-full border transition-all ${n <= cLevel ? MASTERY_COLORS[cLevel] + ' border-transparent' : 'border-slate-700/60'}`} />
                          ))}
                        </div>
                        <span className={`text-[10px] font-bold ml-1 ${MASTERY_TEXT[cLevel]}`}>{MASTERY_LABELS[cLevel]}</span>
                      </div>
                    </div>
                  )}

                  {/* Question — larger text, less padding on mobile */}
                  <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4">
                    <p className="text-[15px] sm:text-[15px] text-slate-100 leading-relaxed font-medium">{q.question}</p>
                  </div>

                  {/* Options — tighter vertical padding on mobile so all 4 fit */}
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const isSelected = selected === opt
                      const reveal     = !!selected
                      const isRight    = opt === q.correct
                      let cls = 'border-slate-800/80 bg-slate-900/30 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer'
                      if (reveal && isRight)         cls = 'border-emerald-500/70 bg-emerald-500/12 text-emerald-100'
                      else if (reveal && isSelected) cls = 'border-red-500/70 bg-red-500/12 text-red-200'
                      else if (reveal)               cls = 'border-slate-800/40 bg-transparent text-slate-600 opacity-50'
                      return (
                        <button key={opt} onClick={() => pick(opt)} disabled={!!selected}
                          className={`w-full text-left px-3.5 sm:px-5 py-3 sm:py-4 rounded-2xl border transition-all flex items-start gap-3 sm:gap-4 ${cls}`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-xl border flex items-center justify-center text-[11px] sm:text-[12px] font-bold transition-all mt-0.5
                            ${reveal && isRight ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                            : reveal && isSelected ? 'border-red-500/60 bg-red-500/20 text-red-300'
                            : reveal ? 'border-slate-700/40 text-slate-600'
                            : 'border-slate-700 text-slate-500'}`}>
                            {reveal && isRight ? <CheckCircle size={13} className="text-emerald-400" />
                            : reveal && isSelected ? <XCircle size={13} className="text-red-400" />
                            : OPTION_LABELS[i]}
                          </span>
                          <span className="text-[13px] sm:text-[13.5px] leading-snug sm:leading-relaxed flex-1">{opt}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Feedback + next */}
                  <AnimatePresence>
                    {selected && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5 pb-4">
                        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${correct ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                          {correct
                            ? <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                            : <XCircle size={15} className="text-red-400 flex-shrink-0" />}
                          <p className={`text-[13px] font-semibold ${correct ? 'text-emerald-300' : 'text-red-300'}`}>
                            {correct ? 'Correct!' : `Answer: ${q.correct}`}
                          </p>
                        </div>
                        <button onClick={next}
                          className="w-full py-3.5 rounded-2xl bg-slate-700/60 border border-slate-600/50 text-white text-[14px] font-semibold hover:bg-slate-700 transition-all">
                          {idx + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
