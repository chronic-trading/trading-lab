import { useMemo } from 'react'
import { ExternalLink, AlertCircle, Calendar as CalendarIcon, Clock, TrendingUp, Zap } from 'lucide-react'

// ── High-impact event definitions ────────────────────────────────────────────
interface EventDef {
  name: string
  shortName: string
  time: string     // EST
  schedule: string
  why: string
  impact: 'extreme' | 'high'
}

const RECURRING: EventDef[] = [
  {
    name: 'Non-Farm Payrolls (NFP)',
    shortName: 'NFP',
    time: '8:30 AM EST',
    schedule: 'First Friday of every month',
    why: 'The single biggest US economic release. Causes explosive moves on NQ and ES. Do not trade into this — be flat or positioned before it fires.',
    impact: 'extreme',
  },
  {
    name: 'Consumer Price Index (CPI)',
    shortName: 'CPI',
    time: '8:30 AM EST',
    schedule: 'Usually second or third Tuesday/Wednesday of the month',
    why: 'Core inflation reading that the Fed watches closely. Markets gap hard on surprise. Mark the spike high/low immediately — they become key data liquidity levels.',
    impact: 'extreme',
  },
  {
    name: 'FOMC Interest Rate Decision',
    shortName: 'FOMC',
    time: '2:00 PM EST (decision) · 2:30 PM (press conference)',
    schedule: '8 times per year (see schedule below)',
    why: 'Fed rate decisions produce the largest single-candle moves of the year. Both the decision at 2 PM and the press conference at 2:30 PM create violent price action. Avoid trading 30 minutes before and after.',
    impact: 'extreme',
  },
  {
    name: 'Producer Price Index (PPI)',
    shortName: 'PPI',
    time: '8:30 AM EST',
    schedule: 'Usually the day after CPI, mid-month',
    why: 'Inflation data from the producer side. Moves markets similarly to CPI but with slightly less volatility. Data H&L still forms — mark the spike.',
    impact: 'high',
  },
  {
    name: 'GDP (Gross Domestic Product)',
    shortName: 'GDP',
    time: '8:30 AM EST',
    schedule: 'Quarterly — last week of January, April, July, October',
    why: 'Quarterly economic output. Major markets mover, especially when the reading significantly surprises consensus. Mark the data candle high/low.',
    impact: 'high',
  },
  {
    name: 'Retail Sales',
    shortName: 'Retail Sales',
    time: '8:30 AM EST',
    schedule: 'Mid-month, usually second or third Wednesday',
    why: 'Consumer spending data. A weak reading can flip daily bias on the spot. Strong data fuels trend continuation. Factor into pre-session planning.',
    impact: 'high',
  },
  {
    name: 'ISM Manufacturing PMI',
    shortName: 'ISM Mfg',
    time: '10:00 AM EST',
    schedule: 'First business day of every month',
    why: 'Business activity snapshot. Comes after NFP week and sets the tone for the month. The 10 AM release falls exactly in the NY AM kill zone — watch for displacement.',
    impact: 'high',
  },
  {
    name: 'ISM Services PMI',
    shortName: 'ISM Svc',
    time: '10:00 AM EST',
    schedule: 'Third business day of every month',
    why: 'Services sector covers 80% of the US economy. A miss here hits NQ hard. Same kill zone timing as ISM Manufacturing.',
    impact: 'high',
  },
  {
    name: 'Initial Unemployment Claims',
    shortName: 'Claims',
    time: '8:30 AM EST',
    schedule: 'Every Thursday',
    why: 'Weekly labor market pulse. Usually lower impact but occasionally spikes hard when readings deviate significantly. Check Forex Factory each Thursday morning.',
    impact: 'high',
  },
  {
    name: 'JOLTS Job Openings',
    shortName: 'JOLTS',
    time: '10:00 AM EST',
    schedule: 'First Tuesday of the month',
    why: 'Fed watches this closely for labor market tightness. Can surprise markets significantly. Mark the data high/low same as any other red event.',
    impact: 'high',
  },
]

import { FOMC_2026, WEEKLY_SCHEDULE } from '../data/calendarData'

// ── Component ─────────────────────────────────────────────────────────────────
export function Calendar() {
  const today   = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const upcomingFOMC = useMemo(() =>
    FOMC_2026.filter(f => f.date >= todayStr).slice(0, 5)
  , [todayStr])

  const todayDay = today.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' })
  const todayEvents = WEEKLY_SCHEDULE.find(s => s.day === todayDay)

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[22px] font-bold text-[var(--text)] tracking-tight">Economic Calendar</h1>
            <p className="text-[13px] text-[var(--text-dim)] mt-1.5 leading-relaxed max-w-xl">
              Red folder (high-impact) events only. These are the releases that move markets hard — mark the data high/low immediately after each print.
            </p>
          </div>
          <a
            href="https://www.forexfactory.com/calendar?impact=5"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 flex-shrink-0 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/35 text-red-300 text-[13px] font-bold hover:bg-red-500/25 hover:border-red-400/50 transition-all"
          >
            <ExternalLink size={14} />
            Open Forex Factory
          </a>
        </div>

        {/* FF filter reminder */}
        <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-red-300">Filter Forex Factory to 🔴 High Impact Only</p>
            <p className="text-[12px] text-red-400/70 mt-1 leading-relaxed">
              On Forex Factory, click the filter icon → Impact → select only "High Impact" (red folder). This removes orange and yellow noise and shows only the events that actually move NQ and ES.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Upcoming FOMC */}
          <div className="col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <h2 className="text-[14px] font-bold text-[var(--text)]">Upcoming FOMC</h2>
            </div>
            <div className="space-y-2">
              {upcomingFOMC.map((f, i) => {
                const isPast = f.date < todayStr
                const isNext = !isPast && i === 0
                return (
                  <div key={f.date}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all
                      ${isNext ? 'bg-amber-500/10 border-amber-500/35' : 'bg-[var(--surface)] border-[var(--border)]'}`}
                  >
                    <div>
                      <p className={`text-[13px] font-bold ${isNext ? 'text-amber-300' : 'text-[var(--text)]'}`}>
                        {f.label}
                      </p>
                      <p className="text-[10px] text-[var(--text-faint)] mt-0.5">2:00 PM EST</p>
                    </div>
                    {isNext && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">NEXT</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Today's events */}
            {todayEvents && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={13} className="text-emerald-400" />
                  <h3 className="text-[13px] font-bold text-[var(--text)]">Today ({todayDay})</h3>
                </div>
                <div className="space-y-1.5">
                  {todayEvents.events.map(ev => (
                    <div key={ev} className="flex items-start gap-2 bg-emerald-500/6 border border-emerald-500/15 rounded-xl px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <p className="text-[12px] text-emerald-200/80 leading-relaxed">{ev}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly schedule */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon size={13} className="text-blue-400" />
                <h3 className="text-[13px] font-bold text-[var(--text)]">Weekly Pattern</h3>
              </div>
              <div className="space-y-1.5">
                {WEEKLY_SCHEDULE.map(day => (
                  <div key={day.day}
                    className={`rounded-xl border px-3 py-2 ${day.day === todayDay ? 'border-blue-500/30 bg-blue-500/6' : 'border-[var(--border)] bg-[var(--surface)]'}`}
                  >
                    <p className={`text-[11px] font-bold mb-1 ${day.day === todayDay ? 'text-blue-300' : 'text-[var(--text-dim)]'}`}>{day.day}</p>
                    {day.events.map(ev => (
                      <div key={ev} className="flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-red-500/70 mt-1.5 flex-shrink-0" />
                        <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">{ev}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event reference cards */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-red-400" />
              <h2 className="text-[14px] font-bold text-[var(--text)]">Red Folder Reference</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {RECURRING.map(ev => (
                <div key={ev.name}
                  className={`bg-[var(--surface)] border rounded-2xl p-4 space-y-2.5
                    ${ev.impact === 'extreme' ? 'border-red-500/30' : 'border-[var(--border)]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ev.impact === 'extreme' ? 'bg-red-500' : 'bg-orange-500/80'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${ev.impact === 'extreme' ? 'text-red-400' : 'text-orange-400'}`}>
                          {ev.impact === 'extreme' ? 'Extreme Impact' : 'High Impact'}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-[var(--text)] leading-snug">{ev.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={10} className="text-[var(--text-faint)] flex-shrink-0" />
                    <p className="text-[11px] text-[var(--text-dim)]">{ev.time}</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CalendarIcon size={10} className="text-[var(--text-faint)] mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">{ev.schedule}</p>
                  </div>
                  <p className="text-[12px] text-[var(--text-dim)] leading-relaxed border-t border-[var(--border)] pt-2.5">{ev.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
