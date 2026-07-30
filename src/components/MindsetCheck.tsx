import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smile, Trash2 } from 'lucide-react'
import { useMindset, type MindsetEntry } from '../hooks/useMindset'
import { useJournal } from '../hooks/useJournal'
import { useModalBackButton } from '../hooks/useModalBackButton'

// ── Score config ──────────────────────────────────────────────────────────────
const SCORES: {
  score: MindsetEntry['score']
  label: string
  emoji: string
  color: string
  bg: string
}[] = [
  { score: 1, label: 'Revenge', emoji: '😤', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'        },
  { score: 2, label: 'Off',     emoji: '😕', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30'  },
  { score: 3, label: 'Okay',   emoji: '😐', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30'  },
  { score: 4, label: 'Sharp',  emoji: '😊', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30'      },
  { score: 5, label: 'Locked', emoji: '🔒', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
]

// ── Verdict data per score ────────────────────────────────────────────────────
const VERDICTS: Record<number, {
  verdict: string
  shouldTrade: number   // % chance they should trade
  lossChance: number    // % chance of losing money
  barColor: string
  lossBarColor: string
  borderColor: string
  bgColor: string
  textColor: string
  message: string
}> = {
  1: {
    verdict:      'DO NOT TRADE',
    shouldTrade:  0,
    lossChance:   87,
    barColor:     'bg-red-500',
    lossBarColor: 'bg-red-500',
    borderColor:  'border-red-500/30',
    bgColor:      'bg-red-500/6',
    textColor:    'text-red-400',
    message:      'Revenge mindset is the #1 account killer. Every setup feels urgent right now — none are. Close the platform, journal what you\'re feeling, and come back tomorrow.',
  },
  2: {
    verdict:      'SIT THIS OUT',
    shouldTrade:  20,
    lossChance:   68,
    barColor:     'bg-orange-500',
    lossBarColor: 'bg-orange-400',
    borderColor:  'border-orange-500/30',
    bgColor:      'bg-orange-500/6',
    textColor:    'text-orange-400',
    message:      'Something\'s off today. Emotional decisions disguise themselves as logic in this state. Sim-mode only, or step away entirely. The market will be there tomorrow.',
  },
  3: {
    verdict:      'TRADE WITH CAUTION',
    shouldTrade:  55,
    lossChance:   44,
    barColor:     'bg-yellow-500',
    lossBarColor: 'bg-yellow-500',
    borderColor:  'border-yellow-500/30',
    bgColor:      'bg-yellow-500/6',
    textColor:    'text-yellow-400',
    message:      'Acceptable — not optimal. A+ setups only, half size. You\'re one poor decision away from a bad day, so keep your rules tight and your targets honest.',
  },
  4: {
    verdict:      'CLEAR TO TRADE',
    shouldTrade:  85,
    lossChance:   24,
    barColor:     'bg-blue-500',
    lossBarColor: 'bg-blue-400',
    borderColor:  'border-blue-500/30',
    bgColor:      'bg-blue-500/6',
    textColor:    'text-blue-400',
    message:      'Sharp and focused. Your edge works best in this state. Full size, full plan — execute what you prepared pre-market and trust the process.',
  },
  5: {
    verdict:      'EXECUTE YOUR PLAN',
    shouldTrade:  95,
    lossChance:   12,
    barColor:     'bg-emerald-500',
    lossBarColor: 'bg-emerald-400',
    borderColor:  'border-emerald-500/30',
    bgColor:      'bg-emerald-500/6',
    textColor:    'text-emerald-400',
    message:      'Peak clarity. Setups will be obvious, exits will be clean. This is when your best trades happen — trust the system and let your edge compound.',
  },
}

// ── Historical win rate for a given mindset score ─────────────────────────────
function useHistoricalWinRate(
  score: number | null,
  mindsetEntries: MindsetEntry[],
  journalEntries: ReturnType<typeof useJournal>['entries'],
) {
  if (!score) return null

  const matching = mindsetEntries.filter(m => m.score === score)
  let wins = 0, total = 0

  for (const m of matching) {
    const date = m.timestamp.slice(0, 10)
    const dayTrades = journalEntries.filter(j => j.date === date && j.result !== 'breakeven')
    if (dayTrades.length === 0) continue
    wins  += dayTrades.filter(j => j.result === 'win').length
    total += dayTrades.length
  }

  if (total < 2) return null  // not enough data yet
  return { winRate: Math.round((wins / total) * 100), sampleSize: total }
}

// ── Verdict card ──────────────────────────────────────────────────────────────
function VerdictCard({
  score,
  historical,
}: {
  score: MindsetEntry['score']
  historical: { winRate: number; sampleSize: number } | null
}) {
  const v = VERDICTS[score]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={`rounded-2xl border px-5 py-4 space-y-4 ${v.borderColor} ${v.bgColor}`}
    >
      {/* Verdict label */}
      <div className="flex items-center justify-between">
        <p className={`text-[14px] font-black tracking-wider ${v.textColor}`}>{v.verdict}</p>
        <span className="text-[22px] leading-none">{SCORES[score - 1].emoji}</span>
      </div>

      {/* Meters */}
      <div className="space-y-3">
        {/* Should trade */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Should you trade?</span>
            <span className={`text-[13px] font-black ${v.textColor}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {v.shouldTrade}%
            </span>
          </div>
          <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${v.shouldTrade}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${v.barColor}`}
            />
          </div>
        </div>

        {/* Loss probability */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Chance of losing money</span>
            <span className={`text-[13px] font-black ${v.lossChance >= 60 ? 'text-red-400' : v.lossChance >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {v.lossChance}%
            </span>
          </div>
          <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${v.lossChance}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
              className={`h-full rounded-full ${v.lossBarColor}`}
            />
          </div>
        </div>
      </div>

      {/* Message */}
      <p className="text-[12px] text-[var(--text-dim)] leading-relaxed">{v.message}</p>

      {/* Historical data — your own numbers */}
      {historical && (
        <div className={`rounded-xl border ${v.borderColor} px-3 py-2.5`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Your data</p>
          <p className="text-[12px] text-[var(--text-dim)]">
            When you've rated{' '}
            <span className={`font-bold ${v.textColor}`}>{score}/5</span>
            {' '}before, your win rate that day was{' '}
            <span className={`font-black ${historical.winRate >= 55 ? 'text-emerald-400' : historical.winRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {historical.winRate}%
            </span>
            <span className="text-[var(--text-faint)] text-[10px] ml-1">({historical.sampleSize} trades)</span>
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
}

export function MindsetCheck({ open, onClose }: Props) {
  useModalBackButton(open, onClose)
  const { entries, addEntry, deleteEntry } = useMindset()
  const { entries: journalEntries }        = useJournal()
  const [selected, setSelected] = useState<MindsetEntry['score'] | null>(null)
  const [note,     setNote]     = useState('')

  const todayStr   = new Date().toISOString().slice(0, 10)
  const todayEntry = entries.find(e => e.timestamp.startsWith(todayStr))
  const avgScore   = entries.length > 0
    ? entries.reduce((s, e) => s + e.score, 0) / entries.length : 0

  const historical = useHistoricalWinRate(
    selected ?? (todayEntry?.score ?? null),
    entries,
    journalEntries,
  )

  const handleSave = () => {
    if (!selected) return
    addEntry(selected, note)
    setSelected(null)
    setNote('')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-[440px] h-full bg-[var(--bg-elev)] border-l border-[var(--border)] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
                  <Smile size={14} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[var(--text)]">Mindset Check</p>
                  <p className="text-[10px] text-[var(--text-faint)] mt-0.5">
                    {entries.length > 0
                      ? `${entries.length} check-in${entries.length !== 1 ? 's' : ''} · avg ${avgScore.toFixed(1)}/5`
                      : 'No check-ins yet'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text-dim)] hover:bg-[var(--surface-2)] transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Already logged today — show verdict for that score */}
              {todayEntry ? (
                <>
                  <div className={`rounded-2xl border px-4 py-4 ${SCORES[todayEntry.score - 1].bg}`}>
                    <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold mb-2">Today's Mindset</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[28px] leading-none">{SCORES[todayEntry.score - 1].emoji}</span>
                      <div>
                        <p className={`text-[22px] font-black leading-none ${SCORES[todayEntry.score - 1].color}`}>
                          {SCORES[todayEntry.score - 1].label}
                        </p>
                        <p className="text-[10px] text-[var(--text-faint)] mt-0.5">{todayEntry.score} / 5</p>
                      </div>
                    </div>
                    {todayEntry.note && (
                      <p className="text-[12px] text-[var(--text-dim)] mt-3 leading-relaxed">{todayEntry.note}</p>
                    )}
                  </div>

                  {/* Verdict for today's logged score */}
                  <VerdictCard score={todayEntry.score} historical={historical} />
                </>
              ) : (
                <>
                  {/* Score picker */}
                  <div>
                    <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-3">How are you feeling right now?</p>
                    <div className="grid grid-cols-5 gap-2">
                      {SCORES.map(s => (
                        <button key={s.score} onClick={() => setSelected(s.score)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                            selected === s.score ? s.bg : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)]'
                          }`}
                        >
                          <span className="text-[22px] leading-none">{s.emoji}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${selected === s.score ? s.color : 'text-[var(--text-faint)]'}`}>
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live verdict — appears instantly on selection */}
                  <AnimatePresence mode="wait">
                    {selected && (
                      <VerdictCard key={selected} score={selected} historical={historical} />
                    )}
                  </AnimatePresence>

                  {/* Note + save */}
                  <div className="space-y-2">
                    <textarea
                      value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Optional note (e.g. poor sleep, after a loss, big news day...)"
                      rows={2}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[12px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-colors resize-none"
                    />
                    <button
                      onClick={handleSave} disabled={!selected}
                      className="w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[12px] font-semibold hover:bg-violet-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Log Check-In
                    </button>
                  </div>
                </>
              )}

              {/* History */}
              {entries.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider mb-2.5">History</p>
                  <div className="space-y-1.5">
                    {entries.map(e => {
                      const s = SCORES[e.score - 1]
                      const v = VERDICTS[e.score]
                      const dateLabel = new Date(e.timestamp).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })
                      return (
                        <div key={e.id} className="flex items-start gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5">
                          <span className="text-[18px] leading-none flex-shrink-0">{s.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[11px] font-bold ${s.color}`}>{s.label}</span>
                              <span className="text-[10px] text-[var(--text-faint)]">{dateLabel}</span>
                              <span className={`text-[10px] font-bold ml-auto ${v.textColor}`}>{v.verdict}</span>
                            </div>
                            {e.note && <p className="text-[11px] text-[var(--text-dim)] mt-0.5 line-clamp-1">{e.note}</p>}
                          </div>
                          <button onClick={() => deleteEntry(e.id)}
                            className="w-5 h-5 flex items-center justify-center text-[var(--text-faint)] hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
