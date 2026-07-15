import { useMemo } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { concepts, getConceptById } from '../data/concepts'

const tierDot: Record<string, string> = {
  basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400',
}
const tierText: Record<string, string> = {
  basic: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-purple-400',
}

interface Props {
  selectedIds: string[]
  onAdd: (id: string) => void
}

export function BuildSuggestions({ selectedIds, onAdd }: Props) {
  const suggestions = useMemo(() => {
    if (selectedIds.length === 0) return []

    // Score each unselected concept by how many strong synergies it has with the current build
    const scores: Record<string, number> = {}
    for (const c of concepts) {
      if (selectedIds.includes(c.id)) continue
      let score = 0
      for (const syn of c.synergies) {
        if (selectedIds.includes(syn.conceptId)) score += syn.strength
      }
      // Also check reverse: existing concepts pointing to this one
      for (const selId of selectedIds) {
        const selC = getConceptById(selId)
        if (!selC) continue
        for (const syn of selC.synergies) {
          if (syn.conceptId === c.id) score += syn.strength
        }
      }
      if (score > 0) scores[c.id] = score
    }

    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id, score]) => ({ concept: getConceptById(id)!, score }))
      .filter(x => x.concept)
  }, [selectedIds])

  if (selectedIds.length === 0 || suggestions.length === 0) return null

  return (
    <div className="border-t border-slate-800/50 pt-3 mt-1">
      <div className="flex items-center gap-1.5 mb-2.5 px-1">
        <Sparkles size={11} className="text-amber-400" />
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Suggested next</span>
      </div>
      <div className="space-y-1.5">
        {suggestions.map(({ concept: c, score }) => (
          <div
            key={c.id}
            className="flex items-center gap-2.5 bg-[#0d0d16] border border-slate-800/60 rounded-xl px-3 py-2 hover:border-slate-700/60 transition-all group"
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierDot[c.tier]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-semibold text-slate-200 truncate">{c.shortName}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${tierText[c.tier]}`}>{c.tier}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {[...Array(Math.min(3, Math.ceil(score / 3)))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
              ))}
            </div>
            <button
              onClick={() => onAdd(c.id)}
              className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-slate-600 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <Plus size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
