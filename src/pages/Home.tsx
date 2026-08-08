import { useState } from 'react'
import { Plus, X, Zap, Radio, Clock, TrendingUp, TrendingDown, Minus, Target, BarChart2, Package, Trash2, Settings } from 'lucide-react'
import { useKillZone } from '../hooks/useKillZone'
import { useTheme } from '../hooks/useTheme'
import { useJournal } from '../hooks/useJournal'
import { useBuilds } from '../hooks/useBuilds'
import { useAllMastery } from '../hooks/useMastery'
import { useKeyLevels, type KeyLevel } from '../hooks/useKeyLevels'
import { useSettings, POINT_VALUES } from '../hooks/useSettings'
import { getSynergiesFor } from '../data/concepts'
import { concepts } from '../data/concepts'
import { FOMC_2026, WEEKLY_SCHEDULE } from '../data/calendarData'
import { INSTRUMENTS } from '../data/instruments'
import { EmptyState } from '../components/EmptyState'
import type { Instrument } from '../types'

// ── Upcoming trading days (today + next 4 trading days) ───────────────────────
function getUpcomingDays() {
  const result: { date: Date; dateStr: string; dayName: string; events: string[]; isFOMC: boolean; isToday: boolean }[] = []
  const now = new Date()

  let offset = 0
  while (result.length < 5 && offset < 14) {
    const d = new Date(now)
    d.setDate(now.getDate() + offset)
    const dow = d.getDay()
    if (dow >= 1 && dow <= 5) {
      const dayName = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][dow]
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const sched = WEEKLY_SCHEDULE.find(s => s.day === dayName)
      result.push({
        date: d,
        dateStr: ds,
        dayName,
        events: sched?.events ?? [],
        isFOMC: FOMC_2026.some(f => f.date === ds),
        isToday: offset === 0 && dow >= 1 && dow <= 5,
      })
    }
    offset++
  }
  return result
}

function getStreak(entries: ReturnType<typeof useJournal>['entries']): { count: number; type: 'W' | 'L' | null } {
  if (!entries.length) return { count: 0, type: null }
  const t = entries[0].result === 'win' ? 'W' : entries[0].result === 'loss' ? 'L' : null
  if (!t) return { count: 0, type: null }
  let count = 0
  for (const e of entries) {
    if ((e.result === 'win') === (t === 'W')) count++
    else break
  }
  return { count, type: t }
}

// ── Key Levels section ────────────────────────────────────────────────────────
function KeyLevelsPanel() {
  const { levels, add, remove, clear } = useKeyLevels()
  const [inst, setInst] = useState<Instrument>('NQ')
  const [label, setLabel] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType]   = useState<KeyLevel['type']>('neutral')

  const submit = () => {
    if (!label.trim() || !price.trim()) return
    add(inst, { label: label.trim(), price: price.trim(), type })
    setLabel(''); setPrice('')
  }

  const typeConfig: Record<KeyLevel['type'], { label: string; active: string; dot: string }> = {
    resistance: { label: 'R', active: 'bg-red-500/15 border-red-500/40 text-red-300', dot: 'bg-red-400' },
    support:    { label: 'S', active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', dot: 'bg-emerald-400' },
    neutral:    { label: 'N', active: 'bg-[var(--surface-hover)] border-[var(--border-strong)] text-[var(--text)]', dot: 'bg-[var(--border-strong)]' },
  }

  const currentLevels = levels[inst] ?? []

  return (
    <div className="tl-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Target size={13} className="text-amber-400" />
          <span className="text-[13px] font-bold text-[var(--text)] whitespace-nowrap">Key Levels</span>
        </div>
        {/* Wraps: six instrument pills on one row overflowed the card (and the
            page) on narrower desktop widths. */}
        <div className="tl-chiprow flex gap-1 flex-wrap justify-end">
          {INSTRUMENTS.map(i => (
            <button key={i}
              onClick={() => setInst(i)}
              className={`tl-chip px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${inst === i ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)]'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="flex gap-2 flex-wrap">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Label (e.g. PWH)"
          className="flex-1 min-w-[90px] bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-[12px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-all"
        />
        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Price"
          className="w-28 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-[12px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-all"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
        <div className="flex gap-1">
          {(['resistance', 'support', 'neutral'] as const).map(t => (
            <button key={t}
              onClick={() => setType(t)}
              className={`tl-touch-sq w-8 h-8 flex items-center justify-center rounded-xl border text-[10px] font-bold transition-all ${type === t ? typeConfig[t].active : 'border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--border)]'}`}
            >
              {typeConfig[t].label}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={!label.trim() || !price.trim()}
          className="tl-tap-h flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-amber-500/35 bg-amber-500/12 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/22 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {/* Level list */}
      {currentLevels.length === 0 ? (
        /* Inline: this sits inside the Key Levels card, directly under the form
           that fills it, so it stays compact and needs no action button — the
           thing to do next is already on screen. */
        <EmptyState
          size="inline"
          icon={<Target size={18} />}
          title={`No levels set for ${inst}`}
          description="Add the highs, lows and gaps you are watching so they are in front of you at the open."
        />
      ) : (
        <div className="space-y-1.5">
          {currentLevels.map(lv => (
            <div key={lv.id} className="flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeConfig[lv.type].dot}`} />
              <span className="text-[12px] font-semibold text-[var(--text-dim)] flex-1">{lv.label}</span>
              <span className="text-[12px] font-bold text-[var(--text)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lv.price}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-lg ${
                lv.type === 'resistance' ? 'text-red-400 bg-red-500/10' : lv.type === 'support' ? 'text-emerald-400 bg-emerald-500/10' : 'text-[var(--text-dim)] bg-[var(--surface-2)]'
              }`}>{typeConfig[lv.type].label}</span>
              <button onClick={() => remove(inst, lv.id)} className="w-5 h-5 flex items-center justify-center text-[var(--text-faint)] hover:text-red-400 transition-colors flex-shrink-0">
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => clear(inst)}
            className="flex items-center gap-1 text-[10px] text-[var(--text-faint)] hover:text-red-400 transition-colors mt-1"
          >
            <Trash2 size={10} /> Clear {inst}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Home Page ────────────────────────────────────────────────────────────
export function Home({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { time, active, next, timeLeft, timeToNext, timeToMacro, nextMacro } = useKillZone()
  // Zone hues are inline-styled, so the light theme needs the darker twin.
  const { theme } = useTheme()
  const zoneText = (z: { textColor: string; textColorLight: string }) =>
    theme === 'light' ? z.textColorLight : z.textColor
  const { entries, wins, total, winRate, totalPoints } = useJournal()
  const { builds } = useBuilds()
  const masteryData = useAllMastery()
  const { settings } = useSettings()

  const recentEntries = entries.slice(0, 10)
  const streak = getStreak(entries)
  const upcomingDays = getUpcomingDays()

  const mastered   = concepts.filter(c => (masteryData[c.id] ?? 0) === 5).length
  const proficient = concepts.filter(c => (masteryData[c.id] ?? 0) >= 4).length
  const started    = concepts.filter(c => (masteryData[c.id] ?? 0) > 0).length
  const avgMastery = concepts.reduce((s, c) => s + (masteryData[c.id] ?? 0), 0) / concepts.length

  const latestBuild = builds[builds.length - 1]
  const latestBuildSynergies = latestBuild ? getSynergiesFor(latestBuild.conceptIds).length : 0

  const losses = entries.filter(e => e.result === 'loss').length

  const greetingHour = parseInt(time.display.split(':')[0], 10)
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'

  const todayFull = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date())

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">

        {/* ── Greeting ── */}
        <div className="flex items-end justify-between gap-4 flex-wrap tl-page-head">
          <div>
            <div className="tl-eyebrow mb-1.5">{todayFull} · New York</div>
            <h1 className="tl-title">{greeting}, trader.</h1>
          </div>
          <div className="flex items-center gap-2 tl-card px-4 py-2.5">
            <Clock size={13} className="text-[var(--text-dim)]" />
            <span className="text-[16px] font-bold text-[var(--text)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{time.display}</span>
            <span className="text-[10px] text-[var(--text-faint)] font-semibold">NY</span>
          </div>
        </div>

        {/* ── Top grid: Kill Zone + Events ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Kill Zone card */}
          <div className="tl-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Radio size={13} className="text-[var(--text-dim)]" />
              <span className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Kill Zones</span>
            </div>

            {/* Active zone */}
            {active ? (
              <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: active.color + '50', background: active.bgColor }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: active.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: zoneText(active) }}>Active Now</span>
                </div>
                <p className="text-[15px] font-bold text-[var(--text)]">{active.name}</p>
                {timeLeft && <p className="text-[11px] mt-0.5" style={{ color: zoneText(active) }}>ends in {timeLeft}</p>}
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] px-3.5 py-3 bg-[var(--surface)]">
                <p className="text-[12px] text-[var(--text-faint)]">No active kill zone</p>
              </div>
            )}

            {/* Next zone */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold">Next Zone</p>
                <p className="text-[13px] font-bold text-[var(--text)] mt-0.5">{next.zone.name}</p>
              </div>
              <span className="text-[12px] font-bold text-[var(--text-dim)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeToNext}</span>
            </div>

            {/* Next macro */}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
              <div>
                <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold">Next Macro</p>
                <p className="text-[13px] font-bold text-amber-300 mt-0.5">{nextMacro.name} EST</p>
              </div>
              <span className="text-[12px] font-bold text-amber-400/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeToMacro}</span>
            </div>
          </div>

          {/* This week's events */}
          <div className="md:col-span-2 tl-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-red-400" />
              <span className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Upcoming Red Events</span>
            </div>
            <div className="space-y-2">
              {upcomingDays.map(({ dayName, dateStr, events, isFOMC, isToday }) => (
                <div key={dateStr} className={`rounded-xl border px-3.5 py-2.5 ${isToday ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[11px] font-bold ${isToday ? 'text-amber-300' : 'text-[var(--text-dim)]'}`}>
                      {isToday ? `Today · ${dayName}` : dayName}
                    </span>
                    <span className="text-[10px] text-[var(--text-faint)]">{new Date(dateStr + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {isFOMC && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full ml-auto">FOMC</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {events.map(ev => (
                      <div key={ev} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-red-500/60 flex-shrink-0" />
                        <span className="text-[11px] text-[var(--text-dim)]">{ev}</span>
                      </div>
                    ))}
                    {events.length === 0 && <span className="text-[10px] text-[var(--text-faint)]">No major events scheduled</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Middle grid: Recent Performance + Key Levels ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Recent P&L */}
          <div className="tl-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 size={13} className="text-blue-400" />
                <span className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Recent Performance</span>
              </div>
              {total > 0 && (
                <button onClick={() => onNavigate?.('journal')} className="text-[10px] text-[var(--text-faint)] hover:text-blue-400 transition-colors font-semibold">
                  View all →
                </button>
              )}
            </div>

            {total === 0 ? (
              <div className="text-center py-6">
                <p className="text-[12px] text-[var(--text-faint)]">No trades logged yet</p>
                <button onClick={() => onNavigate?.('journal')} className="tl-tap text-[11px] text-amber-400 hover:underline mt-1 mx-auto flex items-center justify-center">
                  Go to Journal →
                </button>
              </div>
            ) : (
              <>
                {/* Trade pills */}
                <div className="flex flex-wrap gap-1.5">
                  {recentEntries.map(e => {
                    const pts = e.points
                    const dollarVal = pts !== null ? Math.abs(pts) * POINT_VALUES[e.instrument] : null
                    return (
                      <div
                        key={e.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-bold
                          ${e.result === 'win' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                          : e.result === 'loss' ? 'bg-red-500/10 border-red-500/25 text-red-300'
                          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-dim)]'}`}
                      >
                        {e.result === 'win' ? <TrendingUp size={9} /> : e.result === 'loss' ? <TrendingDown size={9} /> : <Minus size={9} />}
                        {pts !== null
                          ? `${pts >= 0 ? '+' : ''}${pts}pt${dollarVal ? ` ($${dollarVal >= 1000 ? (dollarVal/1000).toFixed(1)+'k' : dollarVal})` : ''}`
                          : e.result === 'win' ? 'W' : e.result === 'loss' ? 'L' : 'BE'}
                      </div>
                    )
                  })}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[var(--border)]">
                  {[
                    { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400' },
                    { label: 'W / L',   value: `${wins}/${losses}`, color: 'text-[var(--text-dim)]' },
                    { label: 'Pts',     value: totalPoints >= 0 ? `+${totalPoints}` : `${totalPoints}`, color: totalPoints >= 0 ? 'text-emerald-400' : 'text-red-400', mono: true },
                    { label: 'Streak',  value: streak.type ? `${streak.count}${streak.type}` : '—', color: streak.type === 'W' ? 'text-emerald-400' : streak.type === 'L' ? 'text-red-400' : 'text-[var(--text-dim)]' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{s.label}</p>
                      <p className={`text-[13px] font-bold mt-0.5 ${s.color}`} style={{ fontFamily: s.mono ? "'JetBrains Mono', monospace" : undefined }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Key Levels */}
          <KeyLevelsPanel />
        </div>

        {/* ── Bottom grid: Mastery + Build ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Mastery progress */}
          <div className="tl-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={13} className="text-purple-400" />
                <span className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Mastery Progress</span>
              </div>
              <button onClick={() => onNavigate?.('builder')} className="tl-hit text-[10px] text-[var(--text-faint)] hover:text-purple-400 transition-colors font-semibold">
                View overview →
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-[var(--surface-2)]">
              {[
                { count: mastered,              color: 'bg-amber-400' },
                { count: proficient - mastered, color: 'bg-emerald-500' },
                { count: started - proficient,  color: 'bg-yellow-500' },
              ].map((seg, i) => seg.count > 0 ? (
                <div key={i} className={`${seg.color} transition-all duration-700`} style={{ flex: seg.count }} />
              ) : null)}
              <div className="bg-[var(--surface-2)] flex-1" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { val: mastered,               label: 'Mastered',  color: 'text-amber-300' },
                { val: proficient - mastered,  label: 'Proficient', color: 'text-emerald-400' },
                { val: started - proficient,   label: 'Learning',  color: 'text-yellow-400' },
                { val: concepts.length - started, label: 'Not yet', color: 'text-[var(--text-faint)]' },
              ].map(s => (
                <div key={s.label} className="text-center min-w-0">
                  <p className={`text-[18px] font-bold leading-none ${s.color}`}>{s.val}</p>
                  {/* Four columns leave ~67px each on a phone. "Proficient" at the
                      lifted mobile size plus wide tracking exceeds that, so the
                      tracking is dropped below md rather than clipping the word. */}
                  <p className="text-[10px] text-[var(--text-faint)] mt-1 uppercase tracking-normal md:tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[var(--text-faint)] text-center border-t border-[var(--border)] pt-3">
              Avg mastery: <span className="text-[var(--text-dim)] font-semibold">{avgMastery.toFixed(1)}</span> / 5.0 across {concepts.length} concepts
            </p>
          </div>

          {/* Latest build */}
          <div className="tl-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={13} className="text-amber-400" />
                <span className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Latest Build</span>
              </div>
              <button onClick={() => onNavigate?.('builds')} className="tl-hit text-[10px] text-[var(--text-faint)] hover:text-amber-400 transition-colors font-semibold">
                All builds →
              </button>
            </div>

            {!latestBuild ? (
              <div className="text-center py-6">
                <p className="text-[12px] text-[var(--text-faint)]">No builds saved yet</p>
                <button onClick={() => onNavigate?.('builder')} className="tl-tap text-[11px] text-amber-400 hover:underline mt-1 mx-auto flex items-center justify-center">
                  Open Builder →
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {latestBuild.instrument}
                    </span>
                    <span className="text-[11px] text-[var(--text-faint)]">{new Date(latestBuild.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-[16px] font-bold text-[var(--text)]">{latestBuild.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Concepts',  value: latestBuild.conceptIds.length },
                    { label: 'Synergies', value: latestBuildSynergies },
                  ].map(s => (
                    <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-center">
                      <p className="text-[18px] font-bold text-[var(--text)]">{s.value}</p>
                      <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {latestBuild.notes && (
                  <p className="text-[11px] text-[var(--text-dim)] leading-relaxed line-clamp-2">{latestBuild.notes}</p>
                )}

                <button
                  onClick={() => onNavigate?.('builder')}
                  className="w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 text-amber-300 text-[12px] font-semibold hover:bg-amber-500/15 transition-all"
                >
                  Load in Builder →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Account snapshot */}
        <div className="tl-card px-5 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold">Account Size</p>
              <p className="text-[14px] font-bold text-[var(--text)] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${settings.accountSize.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold">Risk / Trade</p>
              <p className="text-[14px] font-bold text-[var(--text)] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {settings.riskPercent}% · ${(settings.accountSize * settings.riskPercent / 100).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold">Default Instrument</p>
              <p className="text-[14px] font-bold text-amber-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {settings.defaultInstrument}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-faint)] flex items-center gap-1">Adjust in Settings <Settings size={10} strokeWidth={2} /></p>
        </div>

      </div>
    </div>
  )
}
