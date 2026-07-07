import { useMemo, useState, useRef } from 'react'
import { concepts, getConceptById } from '../data/concepts'
import { useBuilds } from '../hooks/useBuilds'
import { useAllMastery, MASTERY_LABELS, type MasteryLevel } from '../hooks/useMastery'
import { GlossaryText } from '../components/GlossaryText'
import { useTheme } from '../hooks/useTheme'
import type { Build } from '../types'

// ── Layout ──────────────────────────────────────────────────────────────────
const RINGS: Record<string, number> = { basic: 170, intermediate: 305, advanced: 430 }
const NODE_R = 13

function getPositions() {
  const pos = new Map<string, { x: number; y: number }>()
  const tiers = ['basic', 'intermediate', 'advanced'] as const
  for (const tier of tiers) {
    const group = concepts.filter(c => c.tier === tier)
    const r = RINGS[tier]
    group.forEach((c, i) => {
      const angle = (i / group.length) * 2 * Math.PI - Math.PI / 2
      pos.set(c.id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r })
    })
  }
  return pos
}

function getEdges() {
  const seen = new Set<string>()
  const edges: { from: string; to: string; strength: 1 | 2 | 3 }[] = []
  for (const c of concepts) {
    for (const syn of c.synergies) {
      const key = [c.id, syn.conceptId].sort().join('--')
      if (!seen.has(key) && getConceptById(syn.conceptId)) {
        seen.add(key)
        edges.push({ from: c.id, to: syn.conceptId, strength: syn.strength })
      }
    }
  }
  return edges
}

// ── Tier colors ───────────────────────────────────────────────────────────────
const tierFill:   Record<string, string> = { basic: '#34d399', intermediate: '#60a5fa', advanced: '#c084fc' }
const tierStroke: Record<string, string> = { basic: '#10b981', intermediate: '#3b82f6', advanced: '#a855f7' }

// ── Mastery colors ────────────────────────────────────────────────────────────
const masteryFill:   Record<number, string> = { 0: '#1e2030', 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#f59e0b' }
const masteryStroke: Record<number, string> = { 0: '#2d2d45', 1: '#dc2626', 2: '#ea580c', 3: '#ca8a04', 4: '#16a34a', 5: '#d97706' }

const masteryLegend: { level: MasteryLevel; label: string; color: string }[] = [
  { level: 5, label: 'Mastered',   color: '#f59e0b' },
  { level: 4, label: 'Proficient', color: '#22c55e' },
  { level: 3, label: 'Familiar',   color: '#eab308' },
  { level: 2, label: 'Learning',   color: '#f97316' },
  { level: 1, label: 'Aware',      color: '#ef4444' },
  { level: 0, label: 'Not started',color: '#1e2030' },
]

// ── Component ─────────────────────────────────────────────────────────────
export function ConceptMap() {
  const positions   = useMemo(getPositions, [])
  const edges       = useMemo(getEdges,     [])
  const { builds }  = useBuilds()
  const masteryData = useAllMastery()

  const [hovered,       setHovered]       = useState<string | null>(null)
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null)
  const [mode,          setMode]          = useState<'all' | 'build'>('all')
  const [colorMode,     setColorMode]     = useState<'tier' | 'mastery'>('tier')

  const buildIds  = selectedBuild?.conceptIds ?? []
  const activeIds = mode === 'build' && buildIds.length > 0 ? buildIds : null

  const highlighted = new Set<string>()
  if (hovered) {
    highlighted.add(hovered)
    edges.forEach(e => {
      if (e.from === hovered) highlighted.add(e.to)
      if (e.to   === hovered) highlighted.add(e.from)
    })
  }

  const isEdgeActive  = (e: { from: string; to: string }) => {
    if (hovered)    return e.from === hovered || e.to === hovered
    if (activeIds)  return activeIds.includes(e.from) && activeIds.includes(e.to)
    return false
  }
  const isEdgeVisible = (e: { from: string; to: string }) => {
    if (mode === 'build' && activeIds) return activeIds.includes(e.from) && activeIds.includes(e.to)
    return true
  }

  const activeConcept = hovered ? getConceptById(hovered) : null
  const activeLevel   = activeConcept ? (masteryData[activeConcept.id] ?? 0) as MasteryLevel : 0

  // Structural map colors — themed so the canvas, rings, edges and idle nodes
  // read correctly on the warm light background (node/tier hues stay vivid).
  const { theme } = useTheme()
  const light = theme === 'light'
  const mapBgInner   = light ? '#fffdf9' : '#0d0d1a'
  const mapBgOuter   = light ? '#f1ebe0' : '#05050a'
  const ringStroke   = light ? '#e3dacb' : '#1e1e2e'
  const edgeIdle     = light ? '#d8cfbe' : '#1e2030'
  const edgeInBuild  = light ? '#a89e8b' : '#6b7280'
  const labelIdle    = light ? '#6d6456' : '#94a3b8'
  const notStarted   = light ? '#d8cfbe' : '#1e2030'
  const notStartedSt = light ? '#c3b9a6' : '#2d2d45'

  const getNodeFill   = (id: string) => colorMode === 'mastery' ? ((masteryData[id] ?? 0) === 0 ? notStarted : masteryFill[masteryData[id] ?? 0])   : tierFill[concepts.find(c => c.id === id)?.tier ?? 'basic']
  const getNodeStroke = (id: string) => colorMode === 'mastery' ? ((masteryData[id] ?? 0) === 0 ? notStartedSt : masteryStroke[masteryData[id] ?? 0]) : tierStroke[concepts.find(c => c.id === id)?.tier ?? 'basic']

  // ── Hover model ────────────────────────────────────────────────────────────
  // Single source of truth: hit-test the pointer against node centres in SVG
  // space. This avoids the per-node pointerEnter/Leave races (and the dead zone
  // between a node and its label) that made nodes flicker on hover. Nearest node
  // wins within a radius; min centre gap is ~105, so it's never ambiguous.
  const svgRef = useRef<SVGSVGElement>(null)
  const nodeAt = (clientX: number, clientY: number, current: string | null): string | null => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    let best: string | null = null
    let bestD = Infinity
    for (const c of concepts) {
      const p = positions.get(c.id)
      if (!p) continue
      const d = Math.hypot(pt.x - p.x, pt.y - p.y)
      if (d < bestD) { bestD = d; best = c.id }
    }
    // Hysteresis: once a node is hovered, hold it until the pointer moves well
    // clear (release 62 > acquire 40), so jitter near the edge can't strobe hover.
    if (current && best === current) return bestD <= 62 ? current : null
    return bestD <= 40 ? best : null
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#05050a] flex-col md:flex-row relative">

      {/* ── SVG Map ── */}
      <div className="flex-1 relative overflow-hidden">
        <svg ref={svgRef} viewBox="-520 -520 1040 1040" className="w-full h-full"
          style={{ cursor: hovered ? 'pointer' : 'default', touchAction: 'manipulation' }}
          onPointerMove={e => { if (e.pointerType === 'mouse') setHovered(prev => nodeAt(e.clientX, e.clientY, prev)) }}
          onPointerLeave={e => { if (e.pointerType === 'mouse') setHovered(null) }}
          onClick={e => { const id = nodeAt(e.clientX, e.clientY, null); setHovered(prev => (prev === id ? null : id)) }}
        >
          <defs>
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={mapBgInner} />
              <stop offset="100%" stopColor={mapBgOuter} />
            </radialGradient>
          </defs>

          <circle cx="0" cy="0" r="510" fill="url(#bg-grad)" />

          {Object.values(RINGS).map(r => (
            <circle key={r} cx="0" cy="0" r={r} fill="none" stroke={ringStroke} strokeWidth="1" strokeDasharray="4 6" />
          ))}

          {/* Ring tier labels — only in tier mode */}
          {colorMode === 'tier' && (['basic', 'intermediate', 'advanced'] as const).map(tier => (
            <text key={tier} x={RINGS[tier] + 12} y={6}
              fill={tierFill[tier]} fontSize="9" fontFamily="'JetBrains Mono', monospace" opacity="0.35" textAnchor="start">
              {tier.toUpperCase()}
            </text>
          ))}

          {/* Edges */}
          {edges.filter(isEdgeVisible).map(e => {
            const a = positions.get(e.from); const b = positions.get(e.to)
            if (!a || !b) return null
            const active  = isEdgeActive(e)
            const inBuild = activeIds ? activeIds.includes(e.from) && activeIds.includes(e.to) : false
            const strokeColor = active ? getNodeFill(e.from) : inBuild ? edgeInBuild : edgeIdle
            const opacity = active  ? (e.strength === 3 ? 0.9 : e.strength === 2 ? 0.7 : 0.5)
                          : inBuild ? 0.35
                          : hovered ? 0.04
                          : (e.strength === 3 ? 0.12 : e.strength === 2 ? 0.08 : 0.05)
            const sw = active ? (e.strength === 3 ? 2 : e.strength === 2 ? 1.5 : 1)
                     : e.strength === 3 ? 1.2 : e.strength === 2 ? 0.9 : 0.6
            return (
              <line key={`${e.from}--${e.to}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={strokeColor} strokeWidth={sw} opacity={opacity}
                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
              />
            )
          })}

          {/* Nodes */}
          {concepts.map(c => {
            const p         = positions.get(c.id); if (!p) return null
            const isHov     = hovered === c.id
            const isHighlit = highlighted.has(c.id)
            const inBuild   = activeIds ? activeIds.includes(c.id) : false
            const dimmed    = hovered ? !isHighlit : activeIds ? !inBuild : false
            const fill      = getNodeFill(c.id)
            const stroke    = getNodeStroke(c.id)


            return (
              // Pointer events are handled on the <svg> via hit-testing, so the
              // node graphics never intercept them (no enter/leave races).
              <g key={c.id} transform={`translate(${p.x},${p.y})`} style={{ pointerEvents: 'none' }}>
                {/* Soft flat halo on hover — no blur filter, so no repaint flicker */}
                <circle r={NODE_R + 11} fill={fill}
                  opacity={isHov ? 0.16 : 0}
                  style={{ transition: 'opacity 0.18s' }}
                />
                {/* Pulse ring — always rendered, opacity-transitioned to avoid pop-in */}
                <circle r={NODE_R + 8} fill="none" stroke={fill}
                  strokeWidth={isHov ? 1.5 : 1}
                  opacity={isHov ? 0.6 : (inBuild && !hovered) ? 0.2 : 0}
                  style={{ transition: 'opacity 0.18s, stroke-width 0.18s' }}
                />
                {/* Main node circle */}
                <circle r={NODE_R}
                  fill={fill}
                  fillOpacity={isHov ? 0.9 : inBuild ? 0.55 : dimmed ? 0.06 : colorMode === 'mastery' ? 0.45 : 0.22}
                  stroke={stroke}
                  strokeWidth={isHov ? 2 : inBuild ? 1.5 : 1}
                  strokeOpacity={isHov ? 1 : inBuild ? 0.8 : dimmed ? 0.08 : colorMode === 'mastery' ? 0.7 : 0.4}
                  style={{ transition: 'fill-opacity 0.15s, stroke-opacity 0.15s, stroke-width 0.15s' }}
                />
                {/* Label — always visible; dims when something else is hovered */}
                <text y={NODE_R + 14} textAnchor="middle" fontSize="9.5"
                  fontWeight={isHov ? '700' : '500'}
                  fill={isHov ? fill : labelIdle}
                  opacity={isHov ? 1 : (isHighlit && !!hovered) ? 0.85 : hovered ? 0.05 : 0.5}
                  fontFamily="Inter, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.15s' }}>
                  {c.shortName}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/85 border border-slate-800/60 rounded-xl px-4 py-2.5 backdrop-blur-sm">
          {colorMode === 'tier' ? (
            <div className="flex items-center gap-4">
              {(['basic', 'intermediate', 'advanced'] as const).map(tier => (
                <div key={tier} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: tierFill[tier] }} />
                  <span className="text-[11px] font-medium text-slate-400 capitalize">{tier}</span>
                </div>
              ))}
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-px bg-slate-300 opacity-40" />
                <span className="text-[10px] text-slate-500">Essential synergy</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              {masteryLegend.filter(m => m.level > 0).map(({ level, label, color }) => {
                const count = concepts.filter(c => (masteryData[c.id] ?? 0) === level).length
                return (
                  <div key={level} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-[10px] text-slate-400">{label}</span>
                    <span className="text-[9px] text-slate-600">({count})</span>
                  </div>
                )
              })}
              {(() => {
                const count = concepts.filter(c => (masteryData[c.id] ?? 0) === 0).length
                return count > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-slate-600">Not started ({count})</span>
                  </div>
                ) : null
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile bottom sheet — max 40vh so the map stays visible ── */}
      {activeConcept && (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-[#06060d] border-t border-slate-800/60 rounded-t-2xl shadow-2xl"
          style={{ maxHeight: '40vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-8 h-1 bg-slate-700 rounded-full" />
          </div>

          {/* Fixed header — always visible */}
          <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getNodeFill(activeConcept.id) }} />
              <span className="text-[10px] font-black uppercase tracking-wider flex-shrink-0"
                style={{ color: colorMode === 'tier' ? tierFill[activeConcept.tier] : masteryFill[activeLevel] }}>
                {colorMode === 'tier' ? activeConcept.tier : MASTERY_LABELS[activeLevel]}
              </span>
              <span className="text-slate-700 text-[9px]">·</span>
              <span className="text-[10px] text-slate-500 capitalize truncate">{activeConcept.category}</span>
            </div>
            <button
              onClick={() => setHovered(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all flex-shrink-0 ml-2 text-[15px]"
            >✕</button>
          </div>

          {/* Scrollable body — fills remaining height */}
          <div className="overflow-y-auto overscroll-contain px-4 pb-5"
            style={{ maxHeight: 'calc(40vh - 68px)' }}>

            <h3 className="text-[15px] font-bold text-white leading-tight mb-2">{activeConcept.name}</h3>

            {/* Mastery row */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className={`w-2.5 h-2.5 rounded-full border ${n <= activeLevel
                    ? (activeLevel === 5 ? 'bg-amber-400 border-amber-300' : activeLevel >= 4 ? 'bg-emerald-500 border-emerald-400' : activeLevel === 3 ? 'bg-yellow-500 border-yellow-400' : activeLevel === 2 ? 'bg-orange-500 border-orange-400' : 'bg-red-500 border-red-400')
                    : 'border-slate-700'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{MASTERY_LABELS[activeLevel]}</span>
            </div>

            {/* Description — 3-line clamp, readable without dominating */}
            <p className="text-[12px] text-slate-300 leading-relaxed line-clamp-3 mb-3">
              <GlossaryText text={activeConcept.description} />
            </p>

            {/* Synergies as compact pills */}
            {activeConcept.synergies.length > 0 && (
              <div>
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-600 mb-2">
                  Synergies ({activeConcept.synergies.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeConcept.synergies.map(syn => {
                    const partner = getConceptById(syn.conceptId)
                    if (!partner) return null
                    return (
                      <span key={syn.conceptId}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: syn.strength === 3 ? '#f59e0b' : syn.strength === 2 ? '#94a3b8' : '#475569' }} />
                        {partner.shortName}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Right panel (desktop only) ── */}
      <div className="hidden md:flex w-[300px] flex-shrink-0 border-l border-slate-800/50 flex-col bg-[#06060d]">

        <div className="px-5 py-4 border-b border-slate-800/50 space-y-3">
          <div>
            <p className="text-[13px] font-bold text-white">Concept Map</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{concepts.length} concepts · hover to explore</p>
          </div>

          {/* Color mode toggle */}
          <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-0.5 gap-0.5">
            <button
              onClick={() => setColorMode('tier')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${colorMode === 'tier' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Tier View
            </button>
            <button
              onClick={() => setColorMode('mastery')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${colorMode === 'mastery' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Mastery View
            </button>
          </div>

          {builds.length > 0 && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Highlight a build</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-slate-500 transition-colors"
                value={selectedBuild?.id ?? ''}
                onChange={e => {
                  const b = builds.find(x => x.id === e.target.value) ?? null
                  setSelectedBuild(b); setMode(b ? 'build' : 'all')
                }}
              >
                <option value="">None</option>
                {builds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {selectedBuild && (
                <div className="flex gap-1.5">
                  {(['all', 'build'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold transition-all
                        ${mode === m ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}>
                      {m === 'all' ? 'All connections' : 'Build only'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Concept detail */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeConcept ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeFill(activeConcept.id) }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colorMode === 'tier' ? tierFill[activeConcept.tier] : masteryFill[activeLevel] }}>
                    {colorMode === 'tier' ? activeConcept.tier : MASTERY_LABELS[activeLevel]}
                  </span>
                  <span className="text-slate-600 text-[10px]">·</span>
                  <span className="text-[11px] text-slate-500 capitalize">{activeConcept.category}</span>
                </div>
                <h3 className="text-[15px] font-bold text-white leading-snug">{activeConcept.name}</h3>
              </div>

              {/* Mastery dots in detail panel */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`w-3 h-3 rounded-full border transition-all ${n <= activeLevel
                      ? (activeLevel === 5 ? 'bg-amber-400 border-amber-300' : activeLevel >= 4 ? 'bg-emerald-500 border-emerald-400' : activeLevel === 3 ? 'bg-yellow-500 border-yellow-400' : activeLevel === 2 ? 'bg-orange-500 border-orange-400' : 'bg-red-500 border-red-400')
                      : 'border-slate-700'}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{MASTERY_LABELS[activeLevel]}</span>
              </div>

              <p className="text-[12px] text-slate-300 leading-relaxed"><GlossaryText text={activeConcept.description} /></p>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">How to use</p>
                <p className="text-[12px] text-slate-400 leading-relaxed"><GlossaryText text={activeConcept.howToUse} /></p>
              </div>

              {activeConcept.synergies.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Synergies ({activeConcept.synergies.length})
                  </p>
                  <div className="space-y-1.5">
                    {activeConcept.synergies.map(syn => {
                      const partner = getConceptById(syn.conceptId)
                      if (!partner) return null
                      return (
                        <div key={syn.conceptId} className="flex items-center gap-2 bg-slate-900/50 rounded-xl px-3 py-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getNodeFill(partner.id) }} />
                          <span className="text-[11.5px] text-slate-200 flex-1">{partner.shortName}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3].map(i => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= syn.strength ? 'bg-amber-400' : 'bg-slate-700'}`} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-lg">🔭</div>
              <div>
                <p className="text-[13px] font-semibold text-slate-300">Hover a concept</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed max-w-40">
                  {colorMode === 'mastery' ? 'Nodes colored by your mastery level' : 'Move your cursor over any node to explore it'}
                </p>
              </div>
              {colorMode === 'mastery' && (
                <div className="flex flex-col gap-1.5 mt-2 w-full px-2">
                  {masteryLegend.slice(0, 5).map(({ level, label, color }) => {
                    const count = concepts.filter(c => (masteryData[c.id] ?? 0) === level).length
                    if (count === 0) return null
                    return (
                      <div key={level} className="flex items-center gap-2 w-full">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-[11px] text-slate-400 flex-1 text-left">{label}</span>
                        <span className="text-[11px] font-bold text-slate-300">{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
