import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Zap, X, RotateCcw, Share2, Check, Layers, Droplets, Target, Clock, Compass, GitBranch, ClipboardList, Bookmark, Library, BarChart2 } from 'lucide-react'
import { concepts, getSynergiesFor, getConceptById } from '../data/concepts'
import { ConceptCard } from '../components/ConceptCard'
import { SynergyPanel } from '../components/SynergyPanel'
import { BuildSuggestions } from '../components/BuildSuggestions'
import { BuildRadar } from '../components/BuildRadar'
import { MasteryOverview } from '../components/MasteryOverview'
import { SaveBuildModal } from '../components/SaveBuildModal'
import { Checklist } from '../components/Checklist'
import { useBuilds } from '../hooks/useBuilds'
import { useBookmarks } from '../hooks/useBookmarks'
import type { Tier, Category, Build } from '../types'

const tiers: Tier[] = ['basic', 'intermediate', 'advanced']
const categories: Category[] = ['structure', 'liquidity', 'entry', 'timing', 'bias', 'model']

const tierStyles: Record<Tier, { active: string; idle: string; dot: string }> = {
  basic:        { active: 'bg-emerald-500/12 border-emerald-500/45 text-emerald-300', idle: 'border-[var(--border)] text-[var(--text-dim)] hover:border-emerald-500/30 hover:text-emerald-400/80', dot: 'bg-emerald-400' },
  intermediate: { active: 'bg-blue-500/12 border-blue-500/45 text-blue-300',         idle: 'border-[var(--border)] text-[var(--text-dim)] hover:border-blue-500/30 hover:text-blue-400/80',     dot: 'bg-blue-400'    },
  advanced:     { active: 'bg-purple-500/12 border-purple-500/45 text-purple-300',   idle: 'border-[var(--border)] text-[var(--text-dim)] hover:border-purple-500/30 hover:text-purple-400/80', dot: 'bg-purple-400'  },
}

const tierBar: Record<string, string> = {
  basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400',
}
const tierText: Record<string, string> = {
  basic: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-purple-400',
}

const catMeta: Record<Category, { icon: React.ReactNode; label: string }> = {
  structure: { icon: <Layers size={11} />,    label: 'Structure' },
  liquidity: { icon: <Droplets size={11} />,  label: 'Liquidity' },
  entry:     { icon: <Target size={11} />,    label: 'Entry' },
  timing:    { icon: <Clock size={11} />,     label: 'Timing' },
  bias:      { icon: <Compass size={11} />,   label: 'Bias' },
  model:     { icon: <GitBranch size={11} />, label: 'Model' },
}

type LeftTab = 'library' | 'mastery'
type MobileTab = 'library' | 'build' | 'synergy'

interface Props { initialBuild?: Build | null }

export function Builder({ initialBuild }: Props) {
  const [selectedIds,   setSelectedIds]   = useState<string[]>(initialBuild?.conceptIds ?? [])
  const [tierFilter,    setTierFilter]    = useState<Tier | null>(null)
  const [catFilter,     setCatFilter]     = useState<Category | null>(null)
  const [search,        setSearch]        = useState('')
  const [saveOpen,      setSaveOpen]      = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [copied,        setCopied]        = useState(false)
  const [leftTab,       setLeftTab]       = useState<LeftTab>('library')
  const [mobileTab,     setMobileTab]     = useState<MobileTab>('library')
  const { saveBuild, getBuildShareUrl }   = useBuilds()
  const [currentBuild, setCurrentBuild]  = useState<Build | null>(initialBuild ?? null)
  const { bookmarkedIds, toggle: toggleBookmark } = useBookmarks()
  const pinnedConcepts = bookmarkedIds.map(id => getConceptById(id)).filter(Boolean)

  useEffect(() => {
    if (initialBuild) { setSelectedIds(initialBuild.conceptIds); setCurrentBuild(initialBuild) }
  }, [initialBuild])

  const filtered = concepts.filter(c => {
    if (tierFilter && c.tier !== tierFilter) return false
    if (catFilter && c.category !== catFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q))
    }
    return true
  })

  const toggle = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSave  = (build: Build) => { saveBuild(build); setCurrentBuild(build) }

  const handleShare = async () => {
    if (!currentBuild) return
    await navigator.clipboard.writeText(getBuildShareUrl(currentBuild))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const synergyCount = getSynergiesFor(selectedIds).length
  const hasFilters   = !!(tierFilter || catFilter || search)
  const searchRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (leftTab === 'mastery') setLeftTab('library')
        setTimeout(() => searchRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [leftTab])

  // ── Left library panel (shared between desktop + mobile library tab)
  const LibraryPanel = (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Library / Mastery toggle */}
      <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-0.5 gap-0.5 mx-6 mt-5 mb-3 flex-shrink-0">
        <button
          onClick={() => setLeftTab('library')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${leftTab === 'library' ? 'bg-[var(--surface-hover)] text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text-dim)]'}`}
        >
          <Library size={11} /> Library
        </button>
        <button
          onClick={() => setLeftTab('mastery')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${leftTab === 'mastery' ? 'bg-[var(--surface-hover)] text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text-dim)]'}`}
        >
          <BarChart2 size={11} /> Mastery
        </button>
      </div>

      {leftTab === 'mastery' ? (
        <MasteryOverview />
      ) : (
        <>
          {/* Search + filters */}
          <div className="px-6 pb-5 pt-1 space-y-3 border-b border-[var(--border)] flex-shrink-0">
            <div className="relative">
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search concepts or tags..."
                className="w-full tl-card pl-4 pr-9 py-2.5 text-[13px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--surface)] transition-all"
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
                >
                  <X size={11} />
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-faint)] tracking-wider select-none">⌘K</span>
              )}
            </div>

            <div className="flex gap-1.5">
              {tiers.map(tier => {
                const s = tierStyles[tier]
                const active = tierFilter === tier
                const count = concepts.filter(c => c.tier === tier).length
                return (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(prev => prev === tier ? null : tier)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border text-[12px] font-semibold capitalize transition-all ${active ? s.active : s.idle}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${active ? 'opacity-100' : 'opacity-40'}`} />
                    {tier}
                    {/* A color tier, not opacity: opacity-40 pushed these counts
                        to ~1.6:1 in dark and ~1.8:1 in light. */}
                    <span className="text-[10px] text-[var(--text-dim)]">{count}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(prev => prev === cat ? null : cat)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-xl border capitalize transition-all
                    ${catFilter === cat
                      ? 'border-amber-500/50 bg-amber-500/12 text-amber-300'
                      : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)]'}`}
                >
                  {catMeta[cat].icon}
                  <span className="ml-0.5">{cat}</span>
                </button>
              ))}
              <AnimatePresence>
                {hasFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => { setTierFilter(null); setCatFilter(null); setSearch('') }}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-all ml-auto"
                  >
                    <RotateCcw size={10} /> Reset
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Studying Now */}
          <AnimatePresence>
            {pinnedConcepts.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-amber-500/15 bg-amber-500/4 flex-shrink-0"
              >
                <div className="px-6 pt-4 pb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bookmark size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Studying Now</span>
                    <span className="text-[10px] text-amber-500/60 ml-0.5">({pinnedConcepts.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pinnedConcepts.map(c => {
                      if (!c) return null
                      return (
                        <div key={c.id} className="flex items-center gap-1.5 bg-[var(--surface)] border border-amber-500/20 rounded-xl px-2.5 py-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierBar[c.tier]}`} />
                          <span className="text-[11px] font-semibold text-[var(--text)]">{c.shortName}</span>
                          <button
                            onClick={() => toggleBookmark(c.id)}
                            className="w-3.5 h-3.5 flex items-center justify-center text-amber-500/40 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X size={9} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Concept list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
            <AnimatePresence mode="popLayout">
              {filtered.map(concept => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                  selected={selectedIds.includes(concept.id)}
                  onToggle={toggle}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <p className="text-[12px] text-[var(--text-faint)]">No concepts match your filters</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  // ── Workbench panel
  const WorkbenchPanel = (
    <div className="flex flex-col flex-1 overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elev)] flex-shrink-0 gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[15px] font-bold text-[var(--text)] truncate">
              {currentBuild?.name ?? 'Untitled Build'}
            </h2>
            {currentBuild?.instrument && (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {currentBuild.instrument}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
            {selectedIds.length === 0
              ? 'Pick concepts from the library'
              : `${selectedIds.length} concept${selectedIds.length !== 1 ? 's' : ''} · ${synergyCount} synerg${synergyCount !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedIds.length > 0 && (
            <button
              onClick={() => { setSelectedIds([]); setCurrentBuild(null) }}
              className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)] hover:text-[var(--text-dim)] px-2.5 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition-all"
            >
              <RotateCcw size={11} /> Clear
            </button>
          )}
          {currentBuild && (
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-xl border transition-all
                ${copied ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'}`}
            >
              {copied ? <Check size={12} /> : <Share2 size={12} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          )}
          <button
            onClick={() => setChecklistOpen(true)}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ClipboardList size={12} /> Checklist
          </button>
          <button
            onClick={() => setSaveOpen(true)}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/22 hover:border-amber-400/50 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <Save size={12} /> Save
          </button>
        </div>
      </div>

      {/* Concept slots */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6">
        {selectedIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center text-[22px]">⚗️</div>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-dim)]">Build is empty</p>
              <p className="text-[12px] text-[var(--text-faint)] mt-1.5 max-w-52 leading-relaxed">
                Select concepts from the library to start crafting your model
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-w-xl mx-auto">
            <AnimatePresence mode="popLayout">
              {selectedIds.map((id, idx) => {
                const c = concepts.find(x => x.id === id)
                if (!c) return null
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 tl-card px-4 py-3 group hover:border-[var(--border)] transition-all relative overflow-hidden"
                  >
                    <div className={`absolute left-0 inset-y-0 w-[3px] rounded-r-lg ${tierBar[c.tier]}`} />
                    <span className="text-[12px] text-[var(--text-faint)] w-5 text-center flex-shrink-0 ml-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{idx + 1}</span>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tierBar[c.tier]}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold text-[var(--text)]">{c.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[11px] font-semibold ${tierText[c.tier]}`}>{c.tier}</span>
                        <span className="text-[var(--text-faint)] text-[10px]">·</span>
                        <span className="text-[11px] text-[var(--text-dim)] capitalize">{c.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-faint)] hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )

  // ── Synergy panel
  const SynergyPanelContent = (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
          <Zap size={12} className="text-amber-400" />
        </div>
        <span className="text-[13px] font-semibold text-[var(--text)]">Synergies</span>
        {synergyCount > 0 && (
          <span className="ml-auto text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {synergyCount}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <BuildRadar selectedIds={selectedIds} />
        <SynergyPanel selectedIds={selectedIds} />
        <BuildSuggestions selectedIds={selectedIds} onAdd={toggle} />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Panel tab bar ─── (hidden once the 3-column layout fits, at xl)
          The three columns need ~1280px (540 library + 270 synergies + a usable
          workbench). Below xl they don't fit: the workbench collapsed to ~48px
          and the synergies panel ran off-screen. Use the tabbed layout instead. */}
      <div className="flex xl:hidden border-b border-[var(--border)] bg-[var(--bg-elev)] flex-shrink-0">
        {([
          { id: 'library',  label: 'Library',  icon: Library    },
          { id: 'build',    label: 'Build',     icon: Zap        },
          { id: 'synergy',  label: 'DNA',       icon: BarChart2  },
        ] as { id: MobileTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold transition-all border-b-2
              ${mobileTab === id ? 'text-amber-300 border-amber-400 bg-[var(--surface-2)]' : 'text-[var(--text-faint)] border-transparent hover:text-[var(--text-dim)]'}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── 3-column from xl | single tabbed panel below ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Library (all three visible from xl / below xl only the active tab) */}
        <div className={`${mobileTab === 'library' ? 'flex' : 'hidden'} xl:flex flex-col xl:w-[540px] 2xl:w-[560px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-elev)] w-full`}>
          {LibraryPanel}
        </div>

        {/* Center: Workbench */}
        <div className={`${mobileTab === 'build' ? 'flex' : 'hidden'} xl:flex flex-col flex-1 overflow-hidden min-w-0`}>
          {WorkbenchPanel}
        </div>

        {/* Right: Synergies */}
        <div className={`${mobileTab === 'synergy' ? 'flex' : 'hidden'} xl:flex flex-col xl:w-[270px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-elev)] w-full`}>
          {SynergyPanelContent}
        </div>
      </div>

      <SaveBuildModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSave}
        selectedIds={selectedIds}
        existingBuild={currentBuild}
      />
      <Checklist
        open={checklistOpen}
        onClose={() => setChecklistOpen(false)}
        conceptIds={selectedIds}
      />
    </div>
  )
}
