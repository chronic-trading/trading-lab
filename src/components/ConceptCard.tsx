import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, ChevronDown, Layers, Droplets, Target, Clock, Compass, GitBranch, StickyNote, Bookmark } from 'lucide-react'
import { useState } from 'react'
import type { Concept, Category } from '../types'
import { useNotes } from '../hooks/useNotes'
import { useMastery, MASTERY_LABELS, type MasteryLevel } from '../hooks/useMastery'
import { useBookmarks } from '../hooks/useBookmarks'
import { GlossaryText } from './GlossaryText'

const tierConfig = {
  basic: {
    bar:            'bg-emerald-400',
    glow:           'shadow-emerald-500/20',
    gradient:       'from-emerald-500/8 via-emerald-500/3 to-transparent',
    selectedGrad:   'from-emerald-500/14 via-emerald-500/5 to-transparent',
    border:         'border-slate-800/70 hover:border-emerald-500/40',
    selectedBorder: 'border-emerald-500/60',
    badge:          'text-emerald-300 bg-emerald-500/12 border border-emerald-500/25',
    addBtnIdle:     'border-slate-700 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10',
    addBtnActive:   'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
    catColor:       'text-emerald-400/70',
    dotGlow:        'shadow-emerald-400/50',
    label:          'Basic',
    dot:            'bg-emerald-400',
  },
  intermediate: {
    bar:            'bg-blue-400',
    glow:           'shadow-blue-500/20',
    gradient:       'from-blue-500/8 via-blue-500/3 to-transparent',
    selectedGrad:   'from-blue-500/14 via-blue-500/5 to-transparent',
    border:         'border-slate-800/70 hover:border-blue-500/40',
    selectedBorder: 'border-blue-500/60',
    badge:          'text-blue-300 bg-blue-500/12 border border-blue-500/25',
    addBtnIdle:     'border-slate-700 text-slate-500 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10',
    addBtnActive:   'border-blue-500/50 bg-blue-500/15 text-blue-300',
    catColor:       'text-blue-400/70',
    dotGlow:        'shadow-blue-400/50',
    label:          'Intermediate',
    dot:            'bg-blue-400',
  },
  advanced: {
    bar:            'bg-purple-400',
    glow:           'shadow-purple-500/20',
    gradient:       'from-purple-500/8 via-purple-500/3 to-transparent',
    selectedGrad:   'from-purple-500/14 via-purple-500/5 to-transparent',
    border:         'border-slate-800/70 hover:border-purple-500/40',
    selectedBorder: 'border-purple-500/60',
    badge:          'text-purple-300 bg-purple-500/12 border border-purple-500/25',
    addBtnIdle:     'border-slate-700 text-slate-500 hover:border-purple-500/50 hover:text-purple-400 hover:bg-purple-500/10',
    addBtnActive:   'border-purple-500/50 bg-purple-500/15 text-purple-300',
    catColor:       'text-purple-400/70',
    dotGlow:        'shadow-purple-400/50',
    label:          'Advanced',
    dot:            'bg-purple-400',
  },
}

const catMeta: Record<Category, { icon: React.ReactNode; label: string }> = {
  structure: { icon: <Layers size={12} />,    label: 'Structure' },
  liquidity: { icon: <Droplets size={12} />,  label: 'Liquidity' },
  entry:     { icon: <Target size={12} />,    label: 'Entry'     },
  timing:    { icon: <Clock size={12} />,     label: 'Timing'    },
  bias:      { icon: <Compass size={12} />,   label: 'Bias'      },
  model:     { icon: <GitBranch size={12} />, label: 'Model'     },
}

interface Props {
  concept: Concept
  selected: boolean
  onToggle: (id: string) => void
}

export function ConceptCard({ concept, selected, onToggle }: Props) {
  const [expanded,    setExpanded]    = useState(false)
  const [notesOpen,   setNotesOpen]   = useState(false)
  const { note, hasNote, update }     = useNotes(concept.id)
  const { level, set: setMastery }    = useMastery(concept.id)
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(concept.id)
  const cfg = tierConfig[concept.tier]
  const cat = catMeta[concept.category]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`relative rounded-2xl border overflow-hidden cursor-pointer group transition-all duration-200 shadow-md hover:shadow-lg
        ${selected ? `${cfg.selectedBorder} ${cfg.glow} shadow-lg` : cfg.border}`}
      onClick={() => onToggle(concept.id)}
    >
      {/* Tier-tinted background wash */}
      <div className={`absolute inset-0 bg-gradient-to-r ${selected ? cfg.selectedGrad : cfg.gradient} pointer-events-none`} />
      <div className="absolute inset-0 bg-[#0b0b13] -z-10" />

      {/* Left accent bar */}
      <div className={`absolute left-0 inset-y-0 w-[3.5px] rounded-r ${cfg.bar}
        ${selected ? 'opacity-100 shadow-lg ' + cfg.dotGlow : 'opacity-35 group-hover:opacity-65'} transition-opacity duration-200`}
      />

      <div className="relative pl-5 pr-5 pt-4 pb-4">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${selected ? 'shadow-sm ' + cfg.dotGlow : ''}`} />
          <span className={`text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          <span className={`flex items-center gap-1.5 text-[11px] font-medium ${cfg.catColor}`}>{cat.icon}{cat.label}</span>

          <button
            onClick={e => { e.stopPropagation(); onToggle(concept.id) }}
            className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-150
              ${selected ? cfg.addBtnActive : cfg.addBtnIdle}`}
          >
            {selected ? <Check size={13} /> : <Plus size={13} />}
          </button>
        </div>

        {/* Name */}
        <h3 className="text-[15px] font-bold text-white leading-snug mb-2 pr-1 tracking-tight">{concept.name}</h3>

        {/* Description */}
        <p className={`text-[12.5px] text-slate-300 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}><GlossaryText text={concept.description} /></p>

        {/* Mastery rating */}
        <div className="flex items-center gap-2.5 mt-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex-shrink-0">Mastery</span>
          <div className="flex gap-1.5">
            {([1,2,3,4,5] as MasteryLevel[]).map(n => (
              <button
                key={n}
                title={MASTERY_LABELS[n]}
                onClick={e => { e.stopPropagation(); setMastery(level === n ? 0 as MasteryLevel : n) }}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-150 hover:scale-125 flex-shrink-0
                  ${n <= level
                    ? level === 5 ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-400/40'
                    : level >= 4 ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/30'
                    : level === 3 ? 'bg-yellow-500 border-yellow-400'
                    : level === 2 ? 'bg-orange-500 border-orange-400'
                    : 'bg-red-500 border-red-400'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
              />
            ))}
          </div>
          <span className={`text-[11px] font-semibold transition-all
            ${level === 0 ? 'text-slate-700'
            : level === 5 ? 'text-amber-300'
            : level >= 4 ? 'text-emerald-400'
            : level === 3 ? 'text-yellow-400'
            : level === 2 ? 'text-orange-400'
            : 'text-red-400'}`}>
            {MASTERY_LABELS[level]}
          </span>
        </div>

        {/* Bottom row: expand + bookmark + notes */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/40">
          <button
            onClick={e => { e.stopPropagation(); setExpanded(x => !x) }}
            className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500 hover:text-amber-400 transition-colors"
          >
            <ChevronDown size={12} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'show less' : 'how to use'}
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={e => { e.stopPropagation(); toggleBookmark(concept.id) }}
              title={bookmarked ? 'Remove from Studying Now' : 'Pin to Studying Now'}
              className={`flex items-center gap-1 text-[11.5px] font-medium transition-colors ${bookmarked ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <Bookmark size={12} className={bookmarked ? 'fill-amber-400' : ''} />
              {bookmarked ? 'pinned' : 'pin'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setNotesOpen(x => !x) }}
              className={`flex items-center gap-1 text-[11.5px] font-medium transition-colors ${hasNote ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <StickyNote size={12} />
              {hasNote ? 'note' : 'add note'}
            </button>
          </div>
        </div>
      </div>

      {/* How to use */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="relative px-5 pb-4 pt-3.5 border-t border-slate-800/60">
              <div className="absolute inset-0 bg-slate-900/40" />
              <div className="relative">
                <p className="text-[12.5px] text-slate-200 leading-relaxed"><GlossaryText text={concept.howToUse} /></p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {concept.tags.map(t => (
                    <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-400 border border-slate-700/40">#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personal notes */}
      <AnimatePresence>
        {notesOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div
              className="relative px-5 pb-4 pt-3 border-t border-amber-500/15 bg-amber-500/4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <StickyNote size={11} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">My Notes</span>
              </div>
              <textarea
                value={note}
                onChange={e => update(e.target.value)}
                placeholder="Your personal observations about this concept..."
                rows={3}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-[12px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-colors resize-none"
                onClick={e => e.stopPropagation()}
              />
              {note && (
                <p className="text-[10px] text-slate-700 mt-1.5">Saved automatically</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
