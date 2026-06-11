import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRules, type RuleCategory } from '../hooks/useRules'
import { useModalBackButton } from '../hooks/useModalBackButton'

const catConfig: Record<RuleCategory, { label: string; color: string }> = {
  entry:   { label: 'Entry',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/25'     },
  risk:    { label: 'Risk',    color: 'text-red-400 bg-red-500/10 border-red-500/25'         },
  mindset: { label: 'Mindset', color: 'text-purple-400 bg-purple-500/10 border-purple-500/25'},
  session: { label: 'Session', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25'  },
}

const cats: RuleCategory[] = ['entry', 'risk', 'mindset', 'session']

interface Props {
  open: boolean
  onClose: () => void
}

export function TradingRules({ open, onClose }: Props) {
  useModalBackButton(open, onClose)
  const { rules, addRule, deleteRule, toggleActive, updateText } = useRules()
  const [newText,    setNewText]    = useState('')
  const [newCat,     setNewCat]     = useState<RuleCategory>('entry')
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editText,   setEditText]   = useState('')
  const [filterCat,  setFilterCat]  = useState<RuleCategory | 'all'>('all')

  const handleAdd = () => {
    if (!newText.trim()) return
    addRule(newText.trim(), newCat)
    setNewText('')
  }

  const startEdit = (id: string, text: string) => { setEditingId(id); setEditText(text) }
  const saveEdit  = () => { if (editingId) { updateText(editingId, editText); setEditingId(null) } }

  const displayed = filterCat === 'all' ? rules : rules.filter(r => r.category === filterCat)
  const activeCount = rules.filter(r => r.active).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-[480px] h-full bg-[#08080f] border-l border-slate-800/70 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                  <Shield size={14} className="text-red-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white">Trading Rules</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{activeCount} active rules</p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                <X size={14} />
              </button>
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 px-5 py-4 border-b border-slate-800/40 flex-wrap">
              {(['all', ...cats] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all capitalize
                    ${filterCat === cat
                      ? cat === 'all'
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : catConfig[cat as RuleCategory].color + ' border-opacity-50'
                      : 'border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'
                    }`}
                >
                  {cat === 'all' ? 'All' : catConfig[cat as RuleCategory].label}
                </button>
              ))}
            </div>

            {/* Rules list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {displayed.map(rule => (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`rounded-2xl border p-3.5 transition-all ${rule.active ? 'bg-[#0d0d16] border-slate-800/60' : 'bg-slate-900/20 border-slate-800/30 opacity-50'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button onClick={() => toggleActive(rule.id)} className="flex-shrink-0 mt-0.5 text-slate-600 hover:text-slate-300 transition-colors">
                        {rule.active
                          ? <ToggleRight size={16} className="text-emerald-400" />
                          : <ToggleLeft size={16} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        {editingId === rule.id ? (
                          <input
                            autoFocus
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-[12.5px] text-slate-100 focus:outline-none"
                          />
                        ) : (
                          <p
                            className={`text-[13px] leading-relaxed cursor-text ${rule.active ? 'text-slate-100' : 'text-slate-600'}`}
                            onClick={() => startEdit(rule.id, rule.text)}
                          >
                            {rule.text}
                          </p>
                        )}
                        <span className={`inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${catConfig[rule.category].color}`}>
                          {catConfig[rule.category].label}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayed.length === 0 && (
                <div className="flex items-center justify-center h-24 text-slate-700 text-[12px]">No rules in this category</div>
              )}
            </div>

            {/* Add rule */}
            <div className="px-5 py-5 border-t border-slate-800/60 space-y-2.5">
              <div className="flex gap-1.5">
                {cats.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCat(cat)}
                    className={`flex-1 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all
                      ${newCat === cat ? catConfig[cat].color : 'border-slate-800 text-slate-600'}`}
                  >
                    {catConfig[cat].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Write a rule..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-[12.5px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newText.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-all disabled:opacity-30"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-700">Click any rule text to edit it · Toggle to include in pre-trade checklist</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
