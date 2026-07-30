import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, CheckSquare, Square, ClipboardList } from 'lucide-react'
import { generateChecklist, phaseLabels } from '../data/checklist'
import type { ChecklistPhase } from '../data/checklist'

const phaseColors: Record<ChecklistPhase, string> = {
  'pre-session': 'text-amber-400  border-amber-500/30  bg-amber-500/10',
  'draw':        'text-blue-400   border-blue-500/30   bg-blue-500/10',
  'structure':   'text-[var(--text-dim)]  border-[var(--border-strong)]  bg-[var(--surface-hover)]',
  'timing':      'text-purple-400 border-purple-500/30 bg-purple-500/10',
  'setup':       'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'entry':       'text-rose-400   border-rose-500/30   bg-rose-500/10',
  'model':       'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
}

interface Props {
  open: boolean
  onClose: () => void
  conceptIds: string[]
}

export function Checklist({ open, onClose, conceptIds }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const sections = generateChecklist(conceptIds)

  const totalItems = Array.from(sections.values()).reduce((s, items) => s + items.length, 0)
  const checkedCount = checked.size

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const reset = () => setChecked(new Set())

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-[480px] h-full bg-[var(--bg-elev)] border-l border-[var(--border)] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                  <ClipboardList size={15} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--text)]">Pre-Trade Checklist</h2>
                  <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                    {checkedCount} / {totalItems} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {checkedCount > 0 && (
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)] hover:text-[var(--text-dim)] px-2.5 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition-all"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text-dim)] hover:bg-[var(--surface-2)] transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[var(--surface-2)] flex-shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {sections.size === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                  <ClipboardList size={24} className="text-[var(--text-faint)]" />
                  <p className="text-[13px] text-[var(--text-dim)]">No checklist items for current build</p>
                </div>
              ) : (
                Array.from(sections.entries()).map(([phase, items]) => (
                  <div key={phase}>
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg border mb-2.5 ${phaseColors[phase]}`}>
                      {phaseLabels[phase]}
                    </div>
                    <div className="space-y-1.5">
                      {items.map(item => {
                        const done = checked.has(item.id)
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggle(item.id)}
                            className={`w-full flex items-start gap-3 text-left px-3.5 py-3 rounded-xl border transition-all
                              ${done
                                ? 'bg-[var(--surface)] border-[var(--border)]'
                                : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border)]'
                              }`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {done
                                ? <CheckSquare size={15} className="text-emerald-400" />
                                : <Square size={15} className="text-[var(--text-faint)]" />
                              }
                            </div>
                            <span className={`text-[13px] leading-relaxed transition-colors ${done ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text)]'}`}>
                              {item.text}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {checkedCount === totalItems && totalItems > 0 && (
              <div className="px-5 py-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">
                  <CheckSquare size={15} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[12px] font-semibold text-emerald-300">All checks complete. You're ready.</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
