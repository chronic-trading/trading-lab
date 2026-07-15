import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Layers, Droplets, Target, Clock, Compass, GitBranch } from 'lucide-react'
import { templates, type Template } from '../data/templates'
import { getConceptById } from '../data/concepts'
import type { Build, Category } from '../types'

const diffConfig = {
  basic:        { label: 'Basic',        dot: 'bg-emerald-400', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' },
  intermediate: { label: 'Intermediate', dot: 'bg-blue-400',    color: 'text-blue-300 bg-blue-500/10 border-blue-500/25'         },
  advanced:     { label: 'Advanced',     dot: 'bg-purple-400',  color: 'text-purple-300 bg-purple-500/10 border-purple-500/25'   },
}

const tierBar: Record<string, string> = {
  basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400',
}

const catIcons: Record<Category, React.ReactNode> = {
  structure: <Layers size={10} />, liquidity: <Droplets size={10} />, entry: <Target size={10} />,
  timing: <Clock size={10} />, bias: <Compass size={10} />, model: <GitBranch size={10} />,
}

interface CardProps { t: Template; i: number; onLoad: (id: string) => void }

function TemplateCard({ t, i, onLoad }: CardProps) {
  const conceptList = t.conceptIds.map(id => getConceptById(id)).filter(Boolean)
  const diff = diffConfig[t.difficulty]
  const tierCounts = { basic: 0, intermediate: 0, advanced: 0 }
  conceptList.forEach(c => c && tierCounts[c.tier]++)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700/50 transition-all group flex flex-col"
    >
      <div className={`h-[3px] w-full ${tierBar[t.difficulty]}`} />

      <div className="p-4 flex flex-col flex-1 gap-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.color}`}>{diff.label}</span>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {t.instrument}
              </span>
            </div>
            <h2 className="text-[14px] font-bold text-white leading-snug">{t.name}</h2>
          </div>
          {/* Tier breakdown dots */}
          <div className="flex flex-col gap-1 flex-shrink-0 pt-0.5">
            {(Object.entries(tierCounts) as [string, number][]).filter(([, n]) => n > 0).map(([tier, n]) => (
              <div key={tier} className="flex items-center gap-1 justify-end">
                <span className="text-[10px] text-slate-600">{n}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${tierBar[tier]}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] text-slate-300 leading-relaxed">{t.description}</p>

        {/* Concept chips */}
        <div className="flex flex-wrap gap-1.5">
          {conceptList.map(c => c && (
            <div key={c.id} className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/50 rounded-lg px-1.5 py-1">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierBar[c.tier]}`} />
              <span className="flex items-center text-[10px] text-slate-600">{catIcons[c.category]}</span>
              <span className="text-[11px] font-medium text-slate-300">{c.shortName}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {t.notes && (
          <div className="flex gap-2 bg-slate-900/40 rounded-xl p-2.5 border border-slate-800/40">
            <BookOpen size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-400 leading-relaxed">{t.notes}</p>
          </div>
        )}

        {/* Load button */}
        <button
          onClick={() => onLoad(t.id)}
          className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[12px] font-semibold text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-600/50 transition-all"
        >
          Load into Builder <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  )
}

interface Props { onLoad: (build: Build) => void }

export function Templates({ onLoad }: Props) {
  const handleLoad = (templateId: string) => {
    const t = templates.find(x => x.id === templateId)
    if (!t) return
    onLoad({
      id: crypto.randomUUID(),
      name: t.name,
      instrument: t.instrument,
      conceptIds: t.conceptIds,
      notes: t.notes,
      createdAt: new Date().toISOString(),
    })
  }

  const sections: { difficulty: Template['difficulty']; cols: string }[] = [
    { difficulty: 'basic',        cols: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' },
    { difficulty: 'intermediate', cols: 'grid-cols-1 md:grid-cols-2' },
    { difficulty: 'advanced',     cols: 'grid-cols-1 md:grid-cols-2' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-10">
        {/* Page header */}
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Build Templates</h1>
          <p className="text-[13px] text-slate-400 mt-1.5">
            Pre-built models to load into the builder and make your own. Each one is a starting point, not a rulebook.
          </p>
        </div>

        {sections.map(({ difficulty, cols }) => {
          const group = templates.filter(t => t.difficulty === difficulty)
          const diff = diffConfig[difficulty]
          return (
            <div key={difficulty}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${diff.dot}`} />
                <span className={`text-[12px] font-bold uppercase tracking-widest`} style={{ color: diff.dot.replace('bg-', 'var(--tw-') }}>
                  <span className={`${difficulty === 'basic' ? 'text-emerald-400' : difficulty === 'intermediate' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {diff.label}
                  </span>
                </span>
                <span className="text-[11px] text-slate-600">{group.length} template{group.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={`grid ${cols} gap-4`}>
                {group.map((t, i) => <TemplateCard key={t.id} t={t} i={i} onLoad={handleLoad} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
