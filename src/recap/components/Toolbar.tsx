import { X } from 'lucide-react'
import type { ThemeKey, ThemeConfig } from '../lib/themes'
import { THEMES } from '../lib/themes'

export type FilterMode = 'all' | 'wins' | 'losses'
export type SortMode = 'default' | 'pnl_desc' | 'pnl_asc' | 'symbol' | 'date'

interface Props {
  theme: ThemeConfig
  onThemeChange: (k: ThemeKey) => void
  filterMode: FilterMode
  onFilterChange: (f: FilterMode) => void
  sortBy: SortMode
  onSortChange: (s: SortMode) => void
  selectMode: boolean
  onSelectModeChange: (v: boolean) => void
  selectedCount: number
  onCombine: () => void
  onClearSelection: () => void
  symbolSearch: string
  onSymbolSearch: (v: string) => void
  showStats: boolean
  onToggleStats: () => void
  totalTrades: number
  visibleCount: number
}

const THEME_COLORS: Record<ThemeKey, string> = {
  midnight: '#00d4ff',
  void: '#f8fafc',
  goldrush: '#fbbf24',
  aurora: '#00ff9d',
  toxic: '#b8ff00',
  ocean: '#00e5cc',
  inferno: '#f97316',
  sakura: '#f9a8d4',
  arctic: '#bae6fd',
  obsidian: '#fcd34d',
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'pnl_desc', label: 'P&L ↓' },
  { value: 'pnl_asc', label: 'P&L ↑' },
  { value: 'date', label: 'Date' },
  { value: 'symbol', label: 'Symbol' },
]

export function Toolbar({
  theme, onThemeChange,
  filterMode, onFilterChange, sortBy, onSortChange,
  symbolSearch, onSymbolSearch, showStats, onToggleStats,
  selectMode, onSelectModeChange, selectedCount, onCombine, onClearSelection,
  totalTrades, visibleCount,
}: Props) {
  return (
    <div className="w-full flex items-center gap-3 px-5 md:px-6 py-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={{ background: 'rgba(0,0,0,0.35)', borderBottom: `1px solid ${theme.divider}`, minHeight: 48 }}>

      {/* Theme — dot grid */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase shrink-0"
          style={{ color: theme.textMuted }}>Theme</span>
        <div className="flex gap-1.5 shrink-0">
          {(Object.keys(THEMES) as ThemeKey[]).map(key => {
            const active = theme.key === key
            const color = THEME_COLORS[key]
            return (
              <button key={key} onClick={() => onThemeChange(key)} title={THEMES[key].label}
                className="group relative flex items-center justify-center transition-all duration-150"
                style={{
                  width: 22, height: 22, borderRadius: 6, cursor: 'pointer',
                  background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: active ? `0 0 8px ${color}60` : 'none',
                }}>
                <div className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{ background: color, boxShadow: active ? `0 0 6px ${color}` : 'none' }} />
                {/* Tooltip */}
                <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-lg text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                  style={{ background: 'rgba(0,0,0,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {THEMES[key].label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-px h-4 shrink-0" style={{ background: theme.divider }} />

      {/* Filter */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase shrink-0"
          style={{ color: theme.textMuted }}>Show</span>
        <div className="flex gap-0.5 p-0.5 rounded-lg"
          style={{ background: theme.surface2, border: `1px solid ${theme.divider}` }}>
          {([['all', 'All'], ['wins', 'Wins ▲'], ['losses', 'Losses ▼']] as [FilterMode, string][]).map(([f, lbl]) => (
            <button key={f} onClick={() => onFilterChange(f)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150"
              style={{
                background: filterMode === f ? (f === 'wins' ? `${theme.profit}20` : f === 'losses' ? `${theme.loss}20` : theme.surface) : 'transparent',
                color: filterMode === f ? (f === 'wins' ? theme.profit : f === 'losses' ? theme.loss : theme.textSecondary) : theme.textMuted,
                border: filterMode === f ? `1px solid ${f === 'wins' ? theme.profit + '35' : f === 'losses' ? theme.loss + '35' : theme.divider}` : '1px solid transparent',
                cursor: 'pointer',
              }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase shrink-0"
          style={{ color: theme.textMuted }}>Sort</span>
        <select value={sortBy} onChange={e => onSortChange(e.target.value as SortMode)}
          className="text-[11px] font-mono rounded-lg px-2.5 py-1 outline-none appearance-none cursor-pointer"
          style={{ background: theme.surface, border: `1px solid ${theme.divider}`, color: theme.textSecondary }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="w-px h-4 shrink-0" style={{ background: theme.divider }} />

      {/* Select / Combine */}
      <div className="flex items-center gap-2">
        {!selectMode ? (
          <button onClick={() => onSelectModeChange(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: theme.surface, border: `1px solid ${theme.divider}`, color: theme.textSecondary, cursor: 'pointer' }}>
            ☐ Combine
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: theme.textMuted }}>{selectedCount} selected</span>
            <button onClick={onCombine} disabled={selectedCount < 2}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: selectedCount >= 2 ? `${theme.accent}25` : theme.surface2,
                border: `1px solid ${selectedCount >= 2 ? theme.accent + '50' : theme.divider}`,
                color: selectedCount >= 2 ? theme.accentText : theme.textMuted,
                cursor: selectedCount >= 2 ? 'pointer' : 'not-allowed',
              }}>⊕ Merge</button>
            <button onClick={onClearSelection}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{ background: theme.surface, border: `1px solid ${theme.divider}`, color: theme.textMuted, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        )}
      </div>

      {/* Symbol search */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase shrink-0"
          style={{ color: theme.textMuted }}>Search</span>
        <input
          type="text"
          value={symbolSearch}
          onChange={e => onSymbolSearch(e.target.value.toUpperCase())}
          placeholder="AAPL…"
          className="font-mono rounded-lg px-2.5 py-1 outline-none uppercase"
          style={{
            background: theme.surface,
            border: `1px solid ${symbolSearch ? theme.accent + '50' : theme.divider}`,
            color: symbolSearch ? theme.accentText : theme.textSecondary,
            fontSize: 11, width: 80,
          }}
        />
        {symbolSearch && (
          <button onClick={() => onSymbolSearch('')} aria-label="Clear symbol search"
            style={{ color: theme.textMuted, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, display: 'flex', alignItems: 'center' }}><X size={12} strokeWidth={2.5} /></button>
        )}
      </div>

      <div className="w-px h-4 shrink-0" style={{ background: theme.divider }} />

      {/* Stats toggle */}
      <button
        onClick={onToggleStats}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
        style={{
          background: showStats ? `${theme.accent}22` : theme.surface,
          border: `1px solid ${showStats ? theme.accent + '50' : theme.divider}`,
          color: showStats ? theme.accentText : theme.textSecondary,
          cursor: 'pointer',
        }}>
        📊 Stats
      </button>

      <span className="font-mono text-[10px] ml-auto px-2 py-1 rounded-lg"
        style={{ background: theme.surface2, color: theme.textMuted, border: `1px solid ${theme.divider}` }}>
        {visibleCount}/{totalTrades}
      </span>
    </div>
  )
}
