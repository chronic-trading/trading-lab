import { useState } from 'react'
import {
  Plus, Trash2, Save, TrendingUp, TrendingDown, Minus,
  Calculator, CalendarDays, Target, BookOpen, Clock, X,
} from 'lucide-react'
import { useRules } from '../hooks/useRules'
import { useKeyLevels } from '../hooks/useKeyLevels'
import type { Instrument } from '../types'

// ── Types ────────────────────────────────────────────────────────────────────
type Bias = 'bullish' | 'bearish' | 'neutral'
type KZ = 'asian' | 'london' | 'ny-am' | 'ny-pm'
type QPhase = 'Q1' | 'Q2' | 'Q3' | 'Q4'

interface SessionPlan {
  id: string
  date: string
  instrument: Instrument
  weeklyBias: Bias
  dailyBias: Bias
  weeklyPhase: QPhase
  dailyPhase: QPhase
  reasoning: string
  keyLevels: string[]
  drawOnLiquidity: string
  killZones: KZ[]
  maxTrades: number
  avoid: string
  notes: string
  createdAt: string
}

const PLAN_KEY = 'trading-lab-plans'
const loadPlans = (): SessionPlan[] => {
  try { return JSON.parse(localStorage.getItem(PLAN_KEY) ?? '[]') } catch { return [] }
}
const savePlans = (p: SessionPlan[]) => localStorage.setItem(PLAN_KEY, JSON.stringify(p))

// ── Futures specs ─────────────────────────────────────────────────────────────
const SPECS: Record<Instrument, { name: string; pointValue: number; tickSize: number; tickValue: number }> = {
  NQ: { name: 'NQ Nasdaq', pointValue: 20,  tickSize: 0.25, tickValue: 5     },
  ES: { name: 'ES S&P 500', pointValue: 50,  tickSize: 0.25, tickValue: 12.50 },
  GC: { name: 'GC Gold',    pointValue: 100, tickSize: 0.10, tickValue: 10    },
  SI: { name: 'SI Silver',  pointValue: 50,  tickSize: 0.005, tickValue: 25   },
  EURUSD: { name: 'EUR/USD', pointValue: 10, tickSize: 0.0001, tickValue: 1 },
  GBPUSD: { name: 'GBP/USD', pointValue: 10, tickSize: 0.0001, tickValue: 1 },
  USDJPY: { name: 'USD/JPY', pointValue:  9, tickSize: 0.001,  tickValue: 1 },
  GBPJPY: { name: 'GBP/JPY', pointValue:  9, tickSize: 0.001,  tickValue: 1 },
  AUDUSD: { name: 'AUD/USD', pointValue: 10, tickSize: 0.0001, tickValue: 1 },
  NZDUSD: { name: 'NZD/USD', pointValue: 10, tickSize: 0.0001, tickValue: 1 },
  USDCAD: { name: 'USD/CAD', pointValue: 10, tickSize: 0.0001, tickValue: 1 },
  USDCHF: { name: 'USD/CHF', pointValue: 10, tickSize: 0.0001, tickValue: 1 },
}

// ── Sub-components ────────────────────────────────────────────────────────────
const BiasBtn = ({ label, value, current, onChange, icon: Icon, color }: {
  label: string; value: Bias; current: Bias; onChange: (b: Bias) => void
  icon: React.ElementType; color: string
}) => (
  <button
    onClick={() => onChange(value)}
    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-[11px] font-semibold transition-all
      ${current === value ? color : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'}`}
  >
    <Icon size={16} />
    {label}
  </button>
)

const QBtn = ({ phase, current, onChange }: { phase: QPhase; current: QPhase; onChange: (q: QPhase) => void }) => {
  const desc = { Q1: 'Accum', Q2: 'Manip', Q3: 'Distrib', Q4: 'Rebal' }
  return (
    <button
      onClick={() => onChange(phase)}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[10px] font-bold transition-all
        ${current === phase ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
    >
      <span className="text-[12px]">{phase}</span>
      <span className="opacity-60">{desc[phase]}</span>
    </button>
  )
}

const KZBtn = ({ id, label, current, onChange }: { id: KZ; label: string; current: KZ[]; onChange: (k: KZ[]) => void }) => {
  const on = current.includes(id)
  return (
    <button
      onClick={() => onChange(on ? current.filter(x => x !== id) : [...current, id])}
      className={`flex-1 py-2 rounded-xl border text-[11px] font-semibold transition-all
        ${on ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
    >
      {label}
    </button>
  )
}

// ── Calculator ────────────────────────────────────────────────────────────────
function RiskCalc({ defaultInstrument }: { defaultInstrument: Instrument }) {
  const [inst,    setInst]    = useState<Instrument>(defaultInstrument)
  const [account, setAccount] = useState('50000')
  const [riskPct, setRiskPct] = useState('1')
  const [stopPts, setStopPts] = useState('10')

  const spec        = SPECS[inst]
  const acct        = parseFloat(account) || 0
  const pct         = parseFloat(riskPct) || 0
  const stop        = parseFloat(stopPts) || 0
  const dollarRisk  = acct * (pct / 100)
  const stopDollars = stop * spec.pointValue
  const contracts   = stopDollars > 0 ? Math.floor(dollarRisk / stopDollars) : 0
  const actualRisk  = contracts * stopDollars
  const twoR        = actualRisk * 2
  const threeR      = actualRisk * 3

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div className="space-y-4">
      {/* Instrument */}
      <div className="grid grid-cols-4 gap-1.5">
        {(['EURUSD','GBPUSD','USDJPY','GBPJPY','AUDUSD','NZDUSD'] as Instrument[]).map(i => (
          <button
            key={i}
            onClick={() => setInst(i)}
            className={`py-2 rounded-xl border text-[11px] font-bold transition-all
              ${inst === i ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'border-slate-800 text-slate-600 hover:border-slate-600'}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {i}
          </button>
        ))}
      </div>

      {/* Spec info */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl px-3 py-2 flex items-center gap-4">
        <span className="text-[11px] text-slate-500">{spec.name}</span>
        <span className="text-[11px] text-slate-600">·</span>
        <span className="text-[11px] text-slate-400">${spec.pointValue}/pt</span>
        <span className="text-[11px] text-slate-600">·</span>
        <span className="text-[11px] text-slate-400">${spec.tickValue}/tick</span>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        {[
          { label: 'Account Balance', value: account, set: setAccount, prefix: '$', placeholder: '50000' },
          { label: 'Risk %',          value: riskPct, set: setRiskPct, prefix: '%', placeholder: '1'     },
          { label: 'Stop (points)',   value: stopPts, set: setStopPts, prefix: 'pts', placeholder: '10'  },
        ].map(({ label, value, set, prefix, placeholder }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500">{label}</label>
            <div className="relative">
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-[13px] text-slate-100 placeholder-slate-700 focus:outline-none focus:border-slate-500 transition-colors pr-12"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-bold">{prefix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="bg-[#0d0d16] border border-slate-800/60 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
          <span className="text-[12px] text-slate-400">Dollar Risk</span>
          <span className="text-[14px] font-bold text-slate-100" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(dollarRisk)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-slate-400">Contracts</span>
          <span className={`text-[22px] font-black ${contracts > 0 ? 'text-amber-300' : 'text-slate-600'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {contracts}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Actual Risk ({contracts} contracts)</span>
          <span className="text-[12px] font-semibold text-red-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(actualRisk)}</span>
        </div>
        <div className="border-t border-slate-800/40 pt-3 grid grid-cols-2 gap-2">
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">2R Target</p>
            <p className="text-[14px] font-bold text-emerald-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(twoR)}</p>
          </div>
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">3R Target</p>
            <p className="text-[14px] font-bold text-amber-300 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(threeR)}</p>
          </div>
        </div>
        {stopPts && contracts === 0 && parseFloat(stopPts) > 0 && (
          <p className="text-[11px] text-slate-600 text-center">Your risk % is too low or stop too wide for 1 full contract</p>
        )}
      </div>
    </div>
  )
}

// ── Main Plan Page ────────────────────────────────────────────────────────────
export function Plan() {
  const { activeRules } = useRules()
  const [plans, setPlans] = useState<SessionPlan[]>(loadPlans)
  const [view, setView]   = useState<'plan' | 'calc' | 'history'>('plan')

  // Plan form state
  const today = new Date().toISOString().slice(0, 10)
  const [instrument, setInstrument] = useState<Instrument>('EURUSD')
  const [date,        setDate]       = useState(today)
  const [weeklyBias,  setWeeklyBias] = useState<Bias>('bullish')
  const [dailyBias,   setDailyBias]  = useState<Bias>('bullish')
  const [weeklyPhase, setWeeklyPhase]= useState<QPhase>('Q3')
  const [dailyPhase,  setDailyPhase] = useState<QPhase>('Q1')
  const [reasoning,   setReasoning]  = useState('')
  const [keyLevels,   setKeyLevels]  = useState<string[]>([''])
  const [dol,         setDol]        = useState('')
  const [killZones,   setKillZones]  = useState<KZ[]>(['ny-am'])
  const [maxTrades,   setMaxTrades]  = useState(2)
  const [avoid,       setAvoid]      = useState('')
  const [notes,       setNotes]      = useState('')
  const [saved,       setSaved]      = useState(false)

  const addLevel = () => setKeyLevels(p => [...p, ''])
  const updateLevel = (i: number, v: string) => setKeyLevels(p => p.map((x, j) => j === i ? v : x))
  const removeLevel = (i: number) => setKeyLevels(p => p.filter((_, j) => j !== i))

  const handleSave = () => {
    const plan: SessionPlan = {
      id: crypto.randomUUID(),
      date, instrument, weeklyBias, dailyBias, weeklyPhase, dailyPhase,
      reasoning, keyLevels: keyLevels.filter(Boolean), drawOnLiquidity: dol,
      killZones, maxTrades, avoid, notes,
      createdAt: new Date().toISOString(),
    }
    const updated = [plan, ...plans.filter(p => p.date !== date)]
    setPlans(updated)
    savePlans(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const biasColor = (b: Bias) => b === 'bullish' ? 'text-emerald-400' : b === 'bearish' ? 'text-red-400' : 'text-slate-400'

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row">

      {/* ── Left: Form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 border-r border-slate-800/50">

        {/* Sub-nav */}
        <div className="border-b border-slate-800/50 bg-[#06060d]">
          <div className="max-w-3xl mx-auto px-5 md:px-8 flex items-center">
            {([
              ['plan',    'Session Plan', CalendarDays ],
              ['calc',    'Risk Calc',    Calculator   ],
              ['history', 'Past Plans',  BookOpen     ],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setView(id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-[12px] font-semibold border-b-2 transition-all
                  ${view === id ? 'border-amber-400 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 md:px-8 py-6">

          {/* SESSION PLAN */}
          {view === 'plan' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-[15px] font-bold text-white">Today's Session Plan</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-1.5 text-[12px] text-slate-200 focus:outline-none focus:border-slate-600 transition-all" />
                  <div className="flex gap-1.5 flex-wrap">
                    {(['EURUSD','GBPUSD','USDJPY','GBPJPY','AUDUSD','NZDUSD'] as Instrument[]).map(i => (
                      <button key={i} onClick={() => setInstrument(i)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all
                          ${instrument === i ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'border-slate-800 text-slate-600 hover:border-slate-600'}`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>{i}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quarterly phases */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekly Phase</label>
                  <div className="flex gap-1.5">{(['Q1','Q2','Q3','Q4'] as QPhase[]).map(q => <QBtn key={q} phase={q} current={weeklyPhase} onChange={setWeeklyPhase} />)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daily Phase</label>
                  <div className="flex gap-1.5">{(['Q1','Q2','Q3','Q4'] as QPhase[]).map(q => <QBtn key={q} phase={q} current={dailyPhase} onChange={setDailyPhase} />)}</div>
                </div>
              </div>

              {/* Bias */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekly Bias</label>
                  <div className="flex gap-1.5">
                    <BiasBtn label="Bullish" value="bullish" current={weeklyBias} onChange={setWeeklyBias} icon={TrendingUp} color="border-emerald-500/45 bg-emerald-500/10 text-emerald-300" />
                    <BiasBtn label="Bearish" value="bearish" current={weeklyBias} onChange={setWeeklyBias} icon={TrendingDown} color="border-red-500/45 bg-red-500/10 text-red-300" />
                    <BiasBtn label="Neutral" value="neutral" current={weeklyBias} onChange={setWeeklyBias} icon={Minus} color="border-slate-500/45 bg-slate-700/20 text-slate-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daily Bias</label>
                  <div className="flex gap-1.5">
                    <BiasBtn label="Bullish" value="bullish" current={dailyBias} onChange={setDailyBias} icon={TrendingUp} color="border-emerald-500/45 bg-emerald-500/10 text-emerald-300" />
                    <BiasBtn label="Bearish" value="bearish" current={dailyBias} onChange={setDailyBias} icon={TrendingDown} color="border-red-500/45 bg-red-500/10 text-red-300" />
                    <BiasBtn label="Neutral" value="neutral" current={dailyBias} onChange={setDailyBias} icon={Minus} color="border-slate-500/45 bg-slate-700/20 text-slate-300" />
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bias Reasoning</label>
                <textarea value={reasoning} onChange={e => setReasoning(e.target.value)}
                  placeholder="Why are you bullish or bearish? What HTF context supports this? What happened this week?"
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-[12.5px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors resize-none" />
              </div>

              {/* Key levels */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Key Levels to Mark</label>
                  <button onClick={addLevel} className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-amber-400 transition-colors">
                    <Plus size={10} /> Add level
                  </button>
                </div>
                <div className="space-y-1.5">
                  {keyLevels.map((lvl, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={lvl} onChange={e => updateLevel(i, e.target.value)}
                        placeholder={`e.g. PDH 22,450 / EQH at 22,380 / Asian High`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-[12px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors" />
                      {keyLevels.length > 1 && (
                        <button onClick={() => removeLevel(i)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* DOL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Target size={11} className="text-amber-400" />
                  Draw on Liquidity (DOL)
                </label>
                <input value={dol} onChange={e => setDol(e.target.value)}
                  placeholder="e.g. BSL at 22,480 — prior week high sitting above"
                  className="w-full bg-slate-900 border border-amber-500/25 rounded-xl px-3.5 py-2.5 text-[12.5px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>

              {/* Kill zones */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={11} className="text-emerald-400" />
                  Kill Zones I'm Trading
                </label>
                <div className="flex gap-1.5">
                  {([['asian','Asian'],['london','London'],['ny-am','NY AM'],['ny-pm','NY PM']] as [KZ,string][]).map(([id,lbl]) => (
                    <KZBtn key={id} id={id} label={lbl} current={killZones} onChange={setKillZones} />
                  ))}
                </div>
              </div>

              {/* Max trades */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Max Trades Today</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => setMaxTrades(n)}
                      className={`flex-1 py-2 rounded-xl border text-[12px] font-bold transition-all
                        ${maxTrades === n ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-800 text-slate-600 hover:border-slate-600'}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >{n}</button>
                  ))}
                </div>
              </div>

              {/* Avoid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today I Will NOT</label>
                <textarea value={avoid} onChange={e => setAvoid(e.target.value)}
                  placeholder="e.g. No trades before NY AM · No chasing · No trading during news events"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-[12.5px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors resize-none" />
              </div>

              {/* Active rules reminder */}
              {activeRules.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800/40 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2.5">Your Active Rules</p>
                  <div className="space-y-1.5">
                    {activeRules.map(r => (
                      <div key={r.id} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-600 mt-2 flex-shrink-0" />
                        <p className="text-[12px] text-slate-400 leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Additional Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Anything else you want to remember going into this session..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-[12.5px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors resize-none" />
              </div>

              <button onClick={handleSave}
                className={`w-full py-3 rounded-2xl border text-[13px] font-bold transition-all flex items-center justify-center gap-2
                  ${saved
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  }`}>
                <Save size={14} />
                {saved ? 'Plan Saved ✓' : 'Save Today\'s Plan'}
              </button>
            </div>
          )}

          {/* CALCULATOR */}
          {view === 'calc' && (
            <div className="max-w-md mx-auto">
              <h2 className="text-[16px] font-bold text-white mb-5">Position Size Calculator</h2>
              <RiskCalc defaultInstrument={instrument} />
            </div>
          )}

          {/* PAST PLANS */}
          {view === 'history' && (
            <div className="space-y-3">
              <h2 className="text-[16px] font-bold text-white">Past Plans</h2>
              {plans.length === 0 ? (
                <p className="text-[12px] text-slate-600 py-8 text-center">No saved plans yet. Fill out today\'s session plan and save it.</p>
              ) : (
                plans.map(p => (
                  <div key={p.id} className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-amber-400 font-mono">{p.instrument}</span>
                        <span className="text-[13px] font-semibold text-slate-200">
                          {new Date(p.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`text-[11px] font-semibold ${biasColor(p.dailyBias)}`}>
                          {p.dailyBias.charAt(0).toUpperCase() + p.dailyBias.slice(1)}
                        </span>
                      </div>
                      <button onClick={() => { setPlans(pl => { const u = pl.filter(x => x.id !== p.id); savePlans(u); return u }) }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                    {p.drawOnLiquidity && (
                      <div className="flex items-start gap-2 bg-amber-500/6 border border-amber-500/15 rounded-xl px-3 py-2">
                        <Target size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[11.5px] text-amber-200/70">{p.drawOnLiquidity}</p>
                      </div>
                    )}
                    {p.reasoning && <p className="text-[11.5px] text-slate-400 leading-relaxed">{p.reasoning}</p>}
                    {p.keyLevels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.keyLevels.map((l, i) => <span key={i} className="text-[10px] text-slate-500 bg-slate-800 border border-slate-700/40 rounded-lg px-2 py-0.5">{l}</span>)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── Right: Summary card ──────────────────────────────────── */}
      <div className="hidden md:block w-[280px] flex-shrink-0 bg-[#06060d] p-5 space-y-4 overflow-y-auto border-l border-slate-800/50">
        <h3 className="text-[13px] font-bold text-white">Today's Summary</h3>
        <div className="bg-[#0d0d16] border border-slate-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Instrument</span>
            <span className="text-[12px] font-bold text-amber-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{instrument}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Daily Bias</span>
            <span className={`text-[12px] font-bold capitalize ${biasColor(dailyBias)}`}>{dailyBias}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Weekly Bias</span>
            <span className={`text-[12px] font-bold capitalize ${biasColor(weeklyBias)}`}>{weeklyBias}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Daily Phase</span>
            <span className="text-[12px] font-bold text-amber-400">{dailyPhase}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Max Trades</span>
            <span className="text-[12px] font-bold text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{maxTrades}</span>
          </div>
          {dol && (
            <div className="pt-2 border-t border-slate-800/40">
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">DOL</p>
              <p className="text-[11.5px] text-amber-200/80 leading-relaxed">{dol}</p>
            </div>
          )}
          {avoid && (
            <div className="pt-2 border-t border-slate-800/40">
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mb-1">Avoid</p>
              <p className="text-[11.5px] text-red-300/70 leading-relaxed">{avoid}</p>
            </div>
          )}
        </div>

        {/* Kill zones today */}
        {killZones.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Trading Today</p>
            <div className="space-y-1">
              {killZones.map(kz => {
                const labels: Record<KZ, string> = { asian: 'Asian 7–9 PM', london: 'London 2–5 AM', 'ny-am': 'NY AM 8:30–11 AM', 'ny-pm': 'NY PM 1:30–4 PM' }
                return (
                  <div key={kz} className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-emerald-300/80">{labels[kz]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-700 leading-relaxed pt-2">
          Saved plans appear in "Past Plans" — review them alongside your journal to spot patterns in your pre-session thinking vs. actual results.
        </div>

        {/* Key Levels */}
        <KeyLevelsWidget currentInstrument={instrument} />
      </div>
    </div>
  )
}

// ── Key Levels Widget ─────────────────────────────────────────────────────────
function KeyLevelsWidget({ currentInstrument }: { currentInstrument: Instrument }) {
  const { levels, add, remove, clear } = useKeyLevels()
  const [inst, setInst]   = useState<Instrument>(currentInstrument)
  const [label, setLabel] = useState('')
  const [price, setPrice] = useState('')
  const [type,  setType]  = useState<'resistance' | 'support' | 'neutral'>('neutral')

  const submit = () => {
    if (!label.trim() || !price.trim()) return
    add(inst, { label: label.trim(), price: price.trim(), type })
    setLabel(''); setPrice('')
  }

  const typeConfig = {
    resistance: { label: 'R', dot: 'bg-red-400',     active: 'bg-red-500/15 border-red-500/35 text-red-300'         },
    support:    { label: 'S', dot: 'bg-emerald-400', active: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' },
    neutral:    { label: 'N', dot: 'bg-slate-500',   active: 'bg-slate-700 border-slate-600 text-slate-200'          },
  }

  const current = levels[inst] ?? []

  return (
    <div className="border-t border-slate-800/50 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target size={11} className="text-amber-400" />
          <span className="text-[11px] font-bold text-white">Key Levels</span>
        </div>
        <div className="flex gap-1">
          {(['EURUSD','GBPUSD','USDJPY','GBPJPY','AUDUSD','NZDUSD'] as Instrument[]).map(i => (
            <button key={i} onClick={() => setInst(i)}
              className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${inst === i ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'border-slate-800 text-slate-600 hover:text-slate-400'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>{i}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="flex gap-1.5">
        <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Label" className="flex-1 bg-slate-900/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all" />
        <input value={price} onChange={e => setPrice(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Price" className="w-20 bg-slate-900/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
      </div>
      <div className="flex gap-1.5 items-center">
        {(['resistance', 'support', 'neutral'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-1 rounded-xl border text-[10px] font-bold transition-all ${type === t ? typeConfig[t].active : 'border-slate-800 text-slate-700 hover:border-slate-700'}`}>
            {typeConfig[t].label}
          </button>
        ))}
        <button onClick={submit} disabled={!label.trim() || !price.trim()}
          className="px-2.5 py-1 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-bold disabled:opacity-30 hover:bg-amber-500/20 transition-all">
          <Plus size={9} />
        </button>
      </div>

      {/* Level list */}
      <div className="space-y-1">
        {current.length === 0
          ? <p className="text-[10px] text-slate-700 text-center py-1">No levels for {inst}</p>
          : current.map(lv => (
            <div key={lv.id} className="flex items-center gap-2 bg-slate-900/30 border border-slate-800/40 rounded-xl px-2.5 py-1.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeConfig[lv.type].dot}`} />
              <span className="text-[11px] font-semibold text-slate-300 flex-1 truncate">{lv.label}</span>
              <span className="text-[11px] text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lv.price}</span>
              <button onClick={() => remove(inst, lv.id)} className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                <X size={9} />
              </button>
            </div>
          ))
        }
        {current.length > 0 && (
          <button onClick={() => clear(inst)} className="text-[10px] text-slate-700 hover:text-red-400 transition-colors w-full text-center pt-0.5">
            clear {inst}
          </button>
        )}
      </div>
    </div>
  )
}

