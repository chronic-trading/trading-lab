import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldAlert, Edit3, Check } from 'lucide-react'
import { useJournal } from '../hooks/useJournal'
import { useDrawdown } from '../hooks/useDrawdown'
import { POINT_VALUES } from '../hooks/useSettings'
import { useModalBackButton } from '../hooks/useModalBackButton'

interface Props {
  open: boolean
  onClose: () => void
}

export function DrawdownGuard({ open, onClose }: Props) {
  const { entries } = useJournal()
  const { settings, update } = useDrawdown()
  useModalBackButton(open, onClose)
  const [editingLimit,  setEditingLimit]  = useState(false)
  const [editingTarget, setEditingTarget] = useState(false)
  const [limitInput,    setLimitInput]    = useState('')
  const [targetInput,   setTargetInput]   = useState('')

  const todayStr     = new Date().toISOString().slice(0, 10)
  const todayEntries = entries.filter(e => e.date === todayStr)

  const todayPnL = todayEntries.reduce((sum, e) =>
    e.points !== null ? sum + e.points * POINT_VALUES[e.instrument] : sum, 0)

  const drawdownAbs = Math.max(0, -todayPnL)
  const drawdownPct = settings.dailyLimit > 0
    ? Math.min((drawdownAbs / settings.dailyLimit) * 100, 100) : 0
  const profitPct = settings.profitTarget > 0 && todayPnL > 0
    ? Math.min((todayPnL / settings.profitTarget) * 100, 100) : 0

  const danger = drawdownPct >= 80 ? 'critical' : drawdownPct >= 50 ? 'warning' : 'safe'

  const dangerStyles = {
    critical: { bar: 'bg-red-500',     icon: 'bg-red-500/10 border-red-500/25',     text: 'text-red-400'     },
    warning:  { bar: 'bg-amber-500',   icon: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400'   },
    safe:     { bar: 'bg-emerald-500', icon: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400' },
  }[danger]

  const saveLimit = () => {
    const v = parseFloat(limitInput)
    if (!isNaN(v) && v > 0) update({ dailyLimit: v })
    setEditingLimit(false)
  }
  const saveTarget = () => {
    const v = parseFloat(targetInput)
    if (!isNaN(v) && v > 0) update({ profitTarget: v })
    setEditingTarget(false)
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
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${dangerStyles.icon}`}>
                  <ShieldAlert size={14} className={dangerStyles.text} />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[var(--text)]">Drawdown Guard</p>
                  <p className="text-[10px] text-[var(--text-faint)] mt-0.5">Today · {todayStr}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text-dim)] hover:bg-[var(--surface-2)] transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {/* Today's P&L */}
              <div className={`rounded-2xl border px-4 py-4 ${todayPnL >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold mb-1">Today's P&L</p>
                <p className={`text-[28px] font-black leading-none ${todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {todayPnL >= 0 ? '+' : '-'}${Math.abs(todayPnL).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[11px] text-[var(--text-faint)] mt-1">{todayEntries.length} trade{todayEntries.length !== 1 ? 's' : ''} logged today</p>
              </div>

              {/* Drawdown limit meter */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Daily Drawdown Limit</span>
                  {editingLimit ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--text-dim)]">$</span>
                      <input
                        autoFocus value={limitInput} onChange={e => setLimitInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveLimit(); if (e.key === 'Escape') setEditingLimit(false) }}
                        className="w-20 bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg px-2 py-1 text-[12px] text-[var(--text)] focus:outline-none"
                      />
                      <button onClick={saveLimit} className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <Check size={11} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setLimitInput(settings.dailyLimit.toString()); setEditingLimit(true) }}
                      className="flex items-center gap-1 text-[11px] text-[var(--text-dim)] hover:text-[var(--text-dim)] transition-colors">
                      <Edit3 size={10} /> ${settings.dailyLimit.toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${dangerStyles.bar}`}
                       style={{ width: `${drawdownPct}%` }} />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className={dangerStyles.text}>{drawdownPct.toFixed(0)}% used</span>
                  <span className="text-[var(--text-faint)]">${drawdownAbs.toLocaleString()} / ${settings.dailyLimit.toLocaleString()}</span>
                </div>
                {danger === 'critical' && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2.5 text-center">
                    <p className="text-[12px] font-bold text-red-400">Stop trading — limit nearly reached.</p>
                  </div>
                )}
                {danger === 'warning' && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-center">
                    <p className="text-[12px] font-bold text-amber-400">Caution — over halfway to your limit.</p>
                  </div>
                )}
              </div>

              {/* Profit target meter */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Daily Profit Target</span>
                  {editingTarget ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--text-dim)]">$</span>
                      <input
                        autoFocus value={targetInput} onChange={e => setTargetInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditingTarget(false) }}
                        className="w-20 bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg px-2 py-1 text-[12px] text-[var(--text)] focus:outline-none"
                      />
                      <button onClick={saveTarget} className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <Check size={11} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setTargetInput(settings.profitTarget.toString()); setEditingTarget(true) }}
                      className="flex items-center gap-1 text-[11px] text-[var(--text-dim)] hover:text-[var(--text-dim)] transition-colors">
                      <Edit3 size={10} /> ${settings.profitTarget.toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                       style={{ width: `${profitPct}%` }} />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-blue-400">{profitPct.toFixed(0)}% reached</span>
                  <span className="text-[var(--text-faint)]">${Math.max(0, todayPnL).toLocaleString()} / ${settings.profitTarget.toLocaleString()}</span>
                </div>
                {todayPnL >= settings.profitTarget && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/8 px-3 py-2.5 text-center">
                    <p className="text-[12px] font-bold text-blue-400">Daily target reached. Consider calling it.</p>
                  </div>
                )}
              </div>

              {/* Today's trades */}
              {todayEntries.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider mb-2.5">Today's Trades</p>
                  <div className="space-y-1.5">
                    {todayEntries.map(e => {
                      const pnl = e.points !== null ? e.points * POINT_VALUES[e.instrument] : null
                      return (
                        <div key={e.id} className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            e.result === 'win' ? 'bg-emerald-400' : e.result === 'loss' ? 'bg-red-400' : 'bg-[var(--border-strong)]'
                          }`} />
                          <span className="text-[11px] font-bold text-amber-400/80"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{e.instrument}</span>
                          <span className="text-[11px] text-[var(--text-dim)] flex-1 capitalize">{e.result}</span>
                          {pnl !== null && (
                            <span className={`text-[11px] font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <p className="text-[12px] text-[var(--text-faint)]">No trades logged today</p>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
