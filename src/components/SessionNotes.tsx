import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, StickyNote, RotateCcw } from 'lucide-react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'
import { useModalBackButton } from '../hooks/useModalBackButton'

const KEY = 'trading-lab-session-notes'

function load(): string {
  try { return localStorage.getItem(KEY) ?? '' } catch { return '' }
}

interface Props {
  open: boolean
  onClose: () => void
}

export function SessionNotes({ open, onClose }: Props) {
  useModalBackButton(open, onClose)
  const [note, setNote] = useState(load)

  useEffect(() => {
    localStorage.setItem(KEY, note)
    syncUserDataField('session_notes', note, getCurrentUserId())
  }, [note])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-[440px] h-full bg-[var(--bg-elev)] border-l border-[var(--border)] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                  <StickyNote size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[var(--text)]">Session Notes</p>
                  <p className="text-[10px] text-[var(--text-faint)] mt-0.5">{today}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {note && (
                  <button
                    onClick={() => setNote('')}
                    className="flex items-center gap-1 text-[11px] text-[var(--text-faint)] hover:text-[var(--text-dim)] px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-all"
                  >
                    <RotateCcw size={10} /> Clear
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text-dim)] hover:bg-[var(--surface-2)] transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Prompt lines */}
            <div className="px-5 pt-4 pb-2 space-y-1.5 border-b border-[var(--border)]">
              {['Daily bias:', 'Draw on liquidity:', 'Key levels:', 'What to avoid:'].map(p => (
                <p key={p} className="text-[11px] text-[var(--text-faint)] font-medium">{p}</p>
              ))}
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={`Today's bias, key levels, reminders...\n\nEx: Bullish bias NQ — targeting BSL at 22,450. Asian range: 22,380–22,410. Watch for Judas sweep SSL before NY AM...`}
              className="flex-1 bg-transparent px-5 py-4 text-[14px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none resize-none leading-relaxed"
            />

            <div className="px-5 py-3 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-faint)]">Saved automatically · persists across sessions</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
