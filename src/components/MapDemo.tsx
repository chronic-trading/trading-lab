import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { concepts, getConceptById } from '../data/concepts'
import { trackOnce } from '../lib/track'

// A live, no-login preview of the Concept Map built from the REAL concept data.
// Deliberately self-contained (no app hooks) so it can run on the marketing page.
// Lazy-loaded by Landing so the concept dataset never weighs down first paint.
//
// Scope: the BASIC tier only. This is the first thing someone new to ICT sees,
// and all 52 nodes read as noise to a beginner — the ten foundations and how they
// connect is the actual pitch. The intermediate/advanced tiers live in the app.

const RING = 300          // single ring — one tier, so it can use the whole canvas
const NODE_R = 15
const BASIC_FILL = '#34d399'

const basics = concepts.filter(c => c.tier === 'basic')
const basicIds = new Set(basics.map(c => c.id))

function getPositions() {
  const pos = new Map<string, { x: number; y: number }>()
  basics.forEach((c, i) => {
    const angle = (i / basics.length) * 2 * Math.PI - Math.PI / 2
    pos.set(c.id, { x: Math.cos(angle) * RING, y: Math.sin(angle) * RING })
  })
  return pos
}

// Only synergies where BOTH ends are basic — an edge pointing at a node that
// isn't drawn would render as a line into empty space.
function getEdges() {
  const seen = new Set<string>()
  const edges: { from: string; to: string; strength: number }[] = []
  for (const c of basics) {
    for (const syn of c.synergies) {
      if (!basicIds.has(syn.conceptId)) continue
      const key = [c.id, syn.conceptId].sort().join('--')
      if (!seen.has(key)) {
        seen.add(key)
        edges.push({ from: c.id, to: syn.conceptId, strength: syn.strength })
      }
    }
  }
  return edges
}

interface Props {
  onCTA?: () => void
  ctaLabel?: string
}

export function MapDemo({ onCTA, ctaLabel = 'Get instant access' }: Props) {
  const positions = useMemo(getPositions, [])
  const edges     = useMemo(getEdges, [])
  // Start on a hub concept so the map reads as "alive" before any interaction.
  const [active, setActive] = useState<string>('liquidity')

  const select = (id: string) => {
    trackOnce('map-demo-used', 'Explored the live Concept Map demo')
    setActive(id)
  }

  const concept = getConceptById(active)
  const basicSynergies = useMemo(
    () => concept?.synergies.filter(s => basicIds.has(s.conceptId)) ?? [],
    [concept],
  )

  const linked = useMemo(() => {
    const s = new Set<string>()
    for (const e of edges) {
      if (e.from === active) s.add(e.to)
      if (e.to === active)   s.add(e.from)
    }
    return s
  }, [active, edges])

  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{ background: 'rgba(8,8,15,0.98)', border: '1px solid rgba(96,165,250,0.16)', boxShadow: '0 0 60px rgba(96,165,250,0.05)' }}>
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.6),transparent)' }} />

      <div className="grid grid-cols-1 md:grid-cols-5">

        {/* Map */}
        <div className="md:col-span-3 p-4 md:p-6 md:border-r border-slate-800/50">
          <svg viewBox="-420 -420 840 840" className="w-full h-auto" style={{ maxHeight: 460 }}>
            <defs>
              <radialGradient id="map-demo-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#0d0d1a" />
                <stop offset="100%" stopColor="#05050a" />
              </radialGradient>
            </defs>
            <circle cx="0" cy="0" r="410" fill="url(#map-demo-bg)" />
            <circle cx="0" cy="0" r={RING} fill="none" stroke="#1e1e2e" strokeWidth="1" strokeDasharray="4 6" />

            {/* Edges */}
            {edges.map(e => {
              const a = positions.get(e.from), b = positions.get(e.to)
              if (!a || !b) return null
              const on = e.from === active || e.to === active
              return (
                <line key={`${e.from}--${e.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={on ? BASIC_FILL : '#1e2030'}
                  strokeWidth={on ? (e.strength === 3 ? 2 : 1.4) : 0.6}
                  opacity={on ? (e.strength === 3 ? 0.9 : 0.6) : 0.07}
                  style={{ transition: 'opacity 0.2s' }} />
              )
            })}

            {/* Nodes */}
            {basics.map(c => {
              const p = positions.get(c.id); if (!p) return null
              const isActive = active === c.id
              const isLinked = linked.has(c.id)
              const dim = !isActive && !isLinked
              const fill = BASIC_FILL
              return (
                <g key={c.id} transform={`translate(${p.x},${p.y})`}
                  style={{ cursor: 'pointer' }}
                  onPointerEnter={e => { if (e.pointerType === 'mouse') select(c.id) }}
                  onClick={() => select(c.id)}>
                  {/* Generous invisible hit area — easy to hit on a phone */}
                  <circle r={26} fill="transparent" />
                  <circle r={NODE_R + 9} fill={fill} opacity={isActive ? 0.16 : 0} style={{ transition: 'opacity 0.18s' }} />
                  <circle r={NODE_R} fill={fill}
                    fillOpacity={isActive ? 0.9 : isLinked ? 0.45 : dim ? 0.08 : 0.22}
                    stroke={fill}
                    strokeWidth={isActive ? 2 : 1}
                    strokeOpacity={isActive ? 1 : dim ? 0.12 : 0.5}
                    style={{ transition: 'fill-opacity 0.15s, stroke-opacity 0.15s' }} />
                  <text y={NODE_R + 15} textAnchor="middle" fontSize="12" fontWeight="600"
                    fill={isActive ? fill : '#94a3b8'}
                    opacity={isActive ? 1 : isLinked ? 0.8 : 0.12}
                    fontFamily="Inter, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.15s' }}>
                    {c.shortName}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* A tier legend would be noise here — every node is the same tier. */}
          <p className="text-center text-[11px] text-slate-600 mt-1">
            The {basics.length} foundations. Every other concept builds on these.
          </p>
        </div>

        {/* Detail */}
        <div className="md:col-span-2 p-6 md:p-8 flex flex-col"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(96,165,250,0.04), transparent 70%)' }}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 mb-4">
            Hover any node · {basics.length} foundations
          </p>

          {concept && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: BASIC_FILL }} />
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: BASIC_FILL }}>{concept.tier}</span>
                <span className="text-slate-700 text-[10px]">·</span>
                <span className="text-[10px] text-slate-500 capitalize">{concept.category}</span>
              </div>
              <h3 className="text-[18px] font-bold text-white leading-snug mb-2.5">{concept.name}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-5">{concept.description}</p>

              {/* Only basic partners: a pill for an intermediate/advanced concept
                  would select a node this map doesn't draw, leaving the graph with
                  nothing highlighted. */}
              {basicSynergies.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2">
                    Connects to {basicSynergies.length}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {basicSynergies.slice(0, 5).map(syn => {
                      const partner = getConceptById(syn.conceptId)
                      if (!partner) return null
                      return (
                        <button key={syn.conceptId} onClick={() => select(syn.conceptId)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:border-slate-600 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: syn.strength === 3 ? '#f59e0b' : syn.strength === 2 ? '#94a3b8' : '#475569' }} />
                          {partner.shortName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <button onClick={onCTA}
            className="group mt-auto pt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ marginTop: 'auto' }}>
            <span className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0800' }}>
              {ctaLabel}
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
