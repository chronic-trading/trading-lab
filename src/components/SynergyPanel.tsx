import { Zap, Sparkles } from 'lucide-react'
import { getSynergiesFor, getConceptById } from '../data/concepts'

const strengthConfig = [
  null,
  { label: 'Decent',    color: 'text-yellow-400', bar: 'bg-yellow-500/60',  width: '33%'  },
  { label: 'Strong',    color: 'text-amber-400',  bar: 'bg-amber-400/70',   width: '66%'  },
  { label: 'Essential', color: 'text-amber-200',  bar: 'bg-amber-300',      width: '100%' },
]

const tierDot: Record<string, string> = {
  basic:        'bg-emerald-400',
  intermediate: 'bg-blue-400',
  advanced:     'bg-purple-400',
}

interface Props { selectedIds: string[] }

export function SynergyPanel({ selectedIds }: Props) {
  const synergies = getSynergiesFor(selectedIds)

  if (selectedIds.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center gap-3 px-5">
        <div className="w-10 h-10 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center">
          <Zap size={18} className="text-slate-500" />
        </div>
        <p className="text-[12px] text-slate-400 leading-relaxed">
          {selectedIds.length === 0
            ? 'Add concepts to see how they pair'
            : 'Add one more concept to reveal synergies'}
        </p>
      </div>
    )
  }

  if (synergies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center gap-3 px-5">
        <div className="w-10 h-10 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center">
          <Sparkles size={18} className="text-slate-500" />
        </div>
        <p className="text-[12px] text-slate-400 leading-relaxed">No direct pairings documented for this combo</p>
      </div>
    )
  }

  const score = Math.round(
    (synergies.reduce((s, x) => s + x.strength, 0) / (synergies.length * 3)) * 100
  )
  const essential = synergies.filter(s => s.strength === 3).length

  return (
    <div className="space-y-2">
      {/* Score card */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4 mb-3">
        <div className="flex items-end justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Build Score</span>
          <span className={`text-2xl font-bold tabular-nums leading-none
            ${score >= 80 ? 'text-amber-200' : score >= 60 ? 'text-amber-400' : score >= 40 ? 'text-yellow-500' : 'text-slate-400'}`}>
            {score}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700
              ${score >= 80 ? 'bg-gradient-to-r from-amber-400 to-amber-200'
              : score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
              : score >= 40 ? 'bg-yellow-600' : 'bg-slate-600'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {synergies.length} pair{synergies.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {essential} essential
        </p>
      </div>

      {synergies.map(syn => {
        const a = getConceptById(syn.conceptA)
        const b = getConceptById(syn.conceptB)
        if (!a || !b) return null
        const cfg = strengthConfig[syn.strength]!

        return (
          <div
            key={`${syn.conceptA}--${syn.conceptB}`}
            className="rounded-2xl border border-slate-800/60 bg-[#0b0b12] overflow-hidden"
          >
            {/* Strength stripe */}
            <div className={`h-[2.5px] ${cfg.bar}`} style={{ width: cfg.width }} />

            <div className="px-4 py-3.5 space-y-2.5">
              {/* Pair names */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDot[a.tier]}`} />
                <span className="text-[12px] font-semibold text-slate-200 truncate flex-1">{a.shortName}</span>
                <span className="text-slate-600 text-[11px] flex-shrink-0">×</span>
                <span className="text-[12px] font-semibold text-slate-200 truncate flex-1 text-right">{b.shortName}</span>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDot[b.tier]}`} />
              </div>

              {/* Note */}
              <p className="text-[12px] text-slate-400 leading-relaxed">{syn.notes[0]}</p>

              {/* Strength label */}
              <span className={`inline-block text-[10px] font-bold tracking-wider uppercase ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
