import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitCompare } from 'lucide-react'
import { useBuilds } from '../hooks/useBuilds'
import { getConceptById, getSynergiesFor } from '../data/concepts'
import type { Build } from '../types'

const CATS = ['structure', 'liquidity', 'entry', 'timing', 'bias', 'model'] as const
const tierDot: Record<string, string> = { basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400' }

function catCount(build: Build | undefined, cat: string): number {
  if (!build) return 0
  return build.conceptIds.map(id => getConceptById(id)).filter(c => c?.category === cat).length
}

interface Props { open: boolean; onClose: () => void }

export function BuildCompareModal({ open, onClose }: Props) {
  const { builds } = useBuilds()
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const buildA = builds.find(b => b.id === idA)
  const buildB = builds.find(b => b.id === idB)

  const setA = new Set(buildA?.conceptIds ?? [])
  const setB = new Set(buildB?.conceptIds ?? [])
  const onlyA  = [...setA].filter(id => !setB.has(id))
  const onlyB  = [...setB].filter(id => !setA.has(id))
  const shared = [...setA].filter(id => setB.has(id))

  const synA = getSynergiesFor(buildA?.conceptIds ?? []).length
  const synB = getSynergiesFor(buildB?.conceptIds ?? []).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-3xl bg-[#0c0c15] border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
                  <GitCompare size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white">Build Comparison</p>
                  {buildA && buildB && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{buildA.name} vs {buildB.name}</p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
                <X size={15} />
              </button>
            </div>

            {/* Build selectors */}
            <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-slate-800/40 flex-shrink-0">
              {[
                { id: idA, setId: setIdA, other: idB, label: 'Build A', color: 'focus:border-blue-500/50', dot: 'bg-blue-400', textCol: 'text-blue-300' },
                { id: idB, setId: setIdB, other: idA, label: 'Build B', color: 'focus:border-purple-500/50', dot: 'bg-purple-400', textCol: 'text-purple-300' },
              ].map(({ id, setId, other, label, color, dot, textCol }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${textCol}`}>{label}</label>
                  </div>
                  <select
                    value={id}
                    onChange={e => setId(e.target.value)}
                    className={`w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-[12px] text-slate-200 focus:outline-none transition-colors ${color}`}
                  >
                    <option value="">— select build —</option>
                    {builds.filter(b => b.id !== other).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {(!buildA || !buildB) ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <GitCompare size={28} className="text-slate-700" />
                <p className="text-[12px] text-slate-600">Select two builds above to compare them</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* KPI stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Concepts', a: buildA.conceptIds.length, b: buildB.conceptIds.length },
                    { label: 'Synergies', a: synA, b: synB },
                    { label: 'Shared', shared: shared.length },
                  ].map(stat => (
                    <div key={stat.label} className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl px-4 py-3 text-center">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">{stat.label}</p>
                      {'shared' in stat ? (
                        <p className="text-[20px] font-bold text-slate-300">{stat.shared}
                          <span className="text-[10px] text-slate-600 font-normal ml-1">in common</span>
                        </p>
                      ) : (
                        <div className="flex items-center justify-center gap-2.5">
                          <span className={`text-[18px] font-bold ${(stat.a ?? 0) > (stat.b ?? 0) ? 'text-blue-400' : (stat.a ?? 0) < (stat.b ?? 0) ? 'text-slate-500' : 'text-slate-300'}`}>{stat.a}</span>
                          <span className="text-slate-700 text-[11px]">vs</span>
                          <span className={`text-[18px] font-bold ${(stat.b ?? 0) > (stat.a ?? 0) ? 'text-purple-400' : (stat.b ?? 0) < (stat.a ?? 0) ? 'text-slate-500' : 'text-slate-300'}`}>{stat.b}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Category coverage */}
                <div className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-4">Category Coverage</p>
                  <div className="space-y-3">
                    {CATS.map(cat => {
                      const a = catCount(buildA, cat)
                      const b = catCount(buildB, cat)
                      const maxV = Math.max(a, b, 1)
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 capitalize w-16 text-right flex-shrink-0">{cat}</span>
                          {/* A bar (grows left→center) */}
                          <div className="flex-1 flex justify-end">
                            <div className="h-2 rounded-l-full overflow-hidden bg-blue-500/15" style={{ width: `${(a / maxV) * 100}%`, maxWidth: '100%' }}>
                              <div className="h-full bg-blue-400 w-full" />
                            </div>
                          </div>
                          {/* Center labels */}
                          <div className="flex items-center gap-1 flex-shrink-0 w-12 justify-center">
                            <span className="text-[10px] font-bold text-blue-400">{a}</span>
                            <span className="text-slate-700 text-[10px]">/</span>
                            <span className="text-[10px] font-bold text-purple-400">{b}</span>
                          </div>
                          {/* B bar (grows center→right) */}
                          <div className="flex-1">
                            <div className="h-2 rounded-r-full overflow-hidden bg-purple-500/15" style={{ width: `${(b / maxV) * 100}%`, maxWidth: '100%' }}>
                              <div className="h-full bg-purple-400 w-full" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[10px] text-blue-300 font-semibold">{buildA.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-1.5 rounded-full bg-purple-400" />
                      <span className="text-[10px] text-purple-300 font-semibold">{buildB.name}</span>
                    </div>
                  </div>
                </div>

                {/* Concept breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { ids: onlyA, title: `Only in ${buildA.name}`, count: onlyA.length, bg: 'bg-blue-500/5', border: 'border-blue-500/15', text: 'text-blue-200/80', header: 'text-blue-400' },
                    { ids: shared, title: 'Shared', count: shared.length, bg: 'bg-slate-800/30', border: 'border-slate-700/30', text: 'text-slate-400', header: 'text-slate-500' },
                    { ids: onlyB, title: `Only in ${buildB.name}`, count: onlyB.length, bg: 'bg-purple-500/5', border: 'border-purple-500/15', text: 'text-purple-200/80', header: 'text-purple-400' },
                  ].map(({ ids, title, count, bg, border, text, header }) => (
                    <div key={title}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${header}`}>
                        {title} <span className="text-slate-700 font-normal">({count})</span>
                      </p>
                      <div className="space-y-1.5">
                        {ids.map(id => {
                          const c = getConceptById(id)
                          if (!c) return null
                          return (
                            <div key={id} className={`flex items-center gap-1.5 ${bg} border ${border} rounded-xl px-2.5 py-1.5`}>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierDot[c.tier]}`} />
                              <span className={`text-[11px] font-medium ${text} leading-snug`}>{c.shortName}</span>
                            </div>
                          )
                        })}
                        {ids.length === 0 && <p className="text-[10px] text-slate-700 italic px-1">none</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
