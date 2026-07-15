import { useState } from 'react'
import { concepts } from '../data/concepts'
import { useAllMastery, MASTERY_LABELS, MASTERY_TEXT, type MasteryLevel } from '../hooks/useMastery'
import type { Tier } from '../types'

const tierDot: Record<string, string> = { basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400' }
const tierPillActive: Record<string, string> = {
  basic: 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300',
  intermediate: 'bg-blue-500/15 border-blue-500/45 text-blue-300',
  advanced: 'bg-purple-500/15 border-purple-500/45 text-purple-300',
}
const levelColors = ['bg-slate-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-amber-400']

export function MasteryOverview() {
  const [tierFilter, setTierFilter] = useState<Tier | null>(null)
  const masteryData = useAllMastery()

  const all = concepts.map(c => ({ ...c, level: (masteryData[c.id] ?? 0) as MasteryLevel }))
  const filtered = tierFilter ? all.filter(c => c.tier === tierFilter) : all

  const mastered   = all.filter(c => c.level === 5).length
  const proficient = all.filter(c => c.level >= 4).length
  const started    = all.filter(c => c.level > 0).length
  const notStarted = all.filter(c => c.level === 0).length
  const avgLevel   = all.reduce((s, c) => s + c.level, 0) / all.length

  // Level distribution for progress bar
  const dist = [1, 2, 3, 4, 5].map(l => all.filter(c => c.level === l).length)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Summary stats */}
      <div className="px-3 pt-3 pb-2 space-y-2.5 border-b border-slate-800/40">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { val: mastered,   label: 'Mastered',   color: 'text-amber-300' },
            { val: proficient, label: 'Proficient+', color: 'text-emerald-400' },
            { val: started,    label: 'Started',     color: 'text-blue-400' },
            { val: notStarted, label: 'Not yet',     color: 'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d0d16] border border-slate-800/60 rounded-xl px-2 py-2 text-center">
              <p className={`text-[17px] font-bold leading-none ${s.color}`}>{s.val}</p>
              <p className="text-[8.5px] text-slate-600 mt-1 leading-none uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
          {dist.map((count, i) => count > 0 ? (
            <div key={i} className={`${levelColors[i + 1]} transition-all duration-500`} style={{ flex: count }} />
          ) : null)}
          {notStarted > 0 && <div className="bg-slate-800/60 transition-all duration-500" style={{ flex: notStarted }} />}
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          Avg mastery <span className="text-slate-400 font-semibold">{avgLevel.toFixed(1)}</span> / 5.0
        </p>

        {/* Tier filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setTierFilter(null)}
            className={`flex-1 py-1 rounded-xl border text-[10px] font-semibold transition-all ${tierFilter === null ? 'bg-slate-800 border-slate-600 text-slate-200' : 'border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700'}`}
          >
            all
          </button>
          {(['basic', 'intermediate', 'advanced'] as Tier[]).map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(prev => prev === t ? null : t)}
              className={`flex-1 py-1 rounded-xl border text-[10px] font-semibold capitalize transition-all ${tierFilter === t ? tierPillActive[t] : 'border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700'}`}
            >
              {t === 'intermediate' ? 'int.' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Concept list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center gap-2.5 bg-[#0d0d16] border border-slate-800/50 rounded-xl px-3 py-2 hover:border-slate-700/60 transition-all">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierDot[c.tier]}`} />
            <span className="text-[11.5px] font-semibold text-slate-200 flex-1 min-w-0 truncate">{c.name}</span>
            <div className="flex gap-0.5 flex-shrink-0">
              {[1, 2, 3, 4, 5].map(n => (
                <div
                  key={n}
                  className={`w-3 h-3 rounded-full border transition-all ${n <= c.level ? `${levelColors[c.level]} border-transparent` : 'border-slate-700/60 bg-transparent'}`}
                />
              ))}
            </div>
            <span className={`text-[10px] font-bold w-[54px] text-right flex-shrink-0 ${MASTERY_TEXT[c.level]}`}>
              {MASTERY_LABELS[c.level]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
