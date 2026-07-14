import { useState, useEffect, useRef } from 'react'
import { FlaskConical, ArrowRight, ExternalLink, TrendingUp, Brain, Target } from 'lucide-react'

const WHOP_URL = import.meta.env.VITE_WHOP_BUY_URL as string | undefined

// Set your Whop price here to show it on the pricing card (e.g. '$97').
// Leave empty to show the offer terms without a number and send buyers to Whop.
const PRICE = (import.meta.env.VITE_PRICE as string | undefined) ?? ''

interface Props {
  isAuthenticated?: boolean
  onSignIn?: () => void
  onLaunch?: () => void
}

// ── Concept map data ──────────────────────────────────────────────────────────
const MAP_NODES = [
  { x: 600, y: 300, r: 22, label: 'Liquidity',        color: '#34d399' },
  { x: 350, y: 200, r: 18, label: 'Market Structure',  color: '#34d399' },
  { x: 870, y: 240, r: 17, label: 'FVG',               color: '#34d399' },
  { x: 460, y: 390, r: 17, label: 'Order Block',       color: '#60a5fa' },
  { x: 760, y: 390, r: 16, label: 'Premium/Disc.',     color: '#60a5fa' },
  { x: 200, y: 320, r: 15, label: 'Swing H&L',         color: '#34d399' },
  { x: 310, y: 470, r: 15, label: 'Draw on Liq.',      color: '#f59e0b' },
  { x: 680, y: 480, r: 15, label: 'Displacement',      color: '#60a5fa' },
  { x: 500, y: 140, r: 15, label: 'AMD',               color: '#c084fc' },
  { x: 130, y: 180, r: 14, label: 'MTFA',              color: '#c084fc' },
  { x: 900, y: 380, r: 14, label: 'OTE',               color: '#f59e0b' },
  { x: 840, y: 120, r: 14, label: 'Kill Zones',        color: '#c084fc' },
  { x: 440, y: 540, r: 13, label: 'Inducement',        color: '#60a5fa' },
  { x: 720, y: 560, r: 13, label: 'Breaker Block',     color: '#60a5fa' },
  { x: 180, y: 460, r: 13, label: 'DOL',               color: '#f59e0b' },
  { x: 980, y: 280, r: 12, label: 'EQH / EQL',         color: '#34d399' },
  { x: 600, y: 160, r: 12, label: 'Key Opens',         color: '#c084fc' },
  { x: 290, y: 580, r: 12, label: 'PDH / PDL',         color: '#34d399' },
  { x: 820, y: 490, r: 11, label: 'Mitigation',        color: '#60a5fa' },
  { x: 100, y: 370, r: 11, label: 'NWOG',              color: '#f59e0b' },
]
const MAP_EDGES = [
  [0,1],[0,2],[0,4],[0,6],[0,7],
  [1,3],[1,5],[1,8],[1,9],
  [2,4],[2,10],[2,15],
  [3,6],[3,7],[3,12],
  [4,7],[4,10],
  [5,6],[5,14],[5,19],
  [6,14],[6,17],
  [7,12],[7,13],[7,18],
  [8,11],[8,16],[8,0],
  [9,14],[9,19],
  [10,13],[10,18],
  [11,16],[11,0],
  [12,17],[13,18],
]

function ConceptMapBg({ opacity = 0.09 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 1100 680" className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice" style={{ opacity }} aria-hidden>
      {/* Single group that slowly drifts across the screen */}
      <g style={{ animation: 'map-drift 55s ease-in-out infinite' }}>
        {MAP_EDGES.map(([a, b], i) => {
          const na = MAP_NODES[a], nb = MAP_NODES[b]
          return (
            <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="rgba(255,255,255,0.5)" strokeWidth="1"
              style={{ animation: `edge-shimmer ${3 + (i % 7) * 0.4}s ease-in-out infinite`, animationDelay: `${(i * 0.18) % 3}s` }}
            />
          )
        })}
        {MAP_NODES.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r + 9} fill={n.color} fillOpacity="0"
              stroke={n.color} strokeWidth="1.5" strokeOpacity="0.15"
              style={{ animation: `ring-breathe ${2.8 + i * 0.11}s ease-in-out infinite`, animationDelay: `${(i * 0.22) % 2.5}s` }}
            />
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity="0.3"
              stroke={n.color} strokeWidth="1.5" strokeOpacity="0.85"
              style={{ animation: `node-breathe ${2.5 + i * 0.13}s ease-in-out infinite`, animationDelay: `${(i * 0.19) % 2}s` }}
            />
            <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fill="white"
              fontSize="9" fontFamily="system-ui" fontWeight="600" fillOpacity="0.8">
              {n.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────
const TOOLS = [
  { emoji: '🎯', name: 'Trade Grader',      desc: 'Score any setup against 13 weighted ICT confluences and your own saved system. Get a letter grade, the missing essentials, and a position-size suggestion — before you risk a dollar.', color: '#f59e0b', tag: 'New' },
  { emoji: '🏗️', name: 'Strategy Builder',  desc: 'Stack ICT/SMC concepts into a living trading system. Real-time synergy detection shows you how your setups connect.', color: '#f59e0b', tag: 'Build' },
  { emoji: '📈', name: 'Live Chart',         desc: 'Full TradingView integration. Concept-specific drawing guides keep you aligned with the methodology on every timeframe.', color: '#60a5fa', tag: 'Execute' },
  { emoji: '🧠', name: 'Synergy Map',        desc: 'Interactive network of 50+ concepts. See the full ICT framework as a living map — hover any node to trace connections.', color: '#c084fc', tag: 'Study' },
  { emoji: '📓', name: 'Trade Journal',      desc: 'Log trades with R-multiples, win rate, and streak tracking. Find the patterns in your performance over time.', color: '#34d399', tag: 'Track' },
  { emoji: '📅', name: 'Session Planner',    desc: 'Plan kill zones, macros, and FOMC like a pro. Never get caught off-guard by a news candle or session transition.', color: '#fb923c', tag: 'Plan' },
  { emoji: '📊', name: 'Trade Recap',        desc: 'Upload any broker CSV and get stunning visual trade cards, weekly montages, and one-click video export.', color: '#f472b6', tag: 'Review'   },
  { emoji: '🏦', name: 'Prop Firm Compare',  desc: '9 futures prop firms scored and ranked. Filter by EOD drawdown, news trading, live accounts, and more.',   color: '#34d399', tag: 'Research' },
  { emoji: '🛡️', name: 'Drawdown Guard',     desc: 'Set your daily loss limit and profit target. A live danger meter turns red as you approach your max — so you stop before you blow the account.', color: '#f97316', tag: 'Protect' },
  { emoji: '🧘', name: 'Mindset Check',      desc: 'Rate your emotional state before the session and log a note. Track how your mindset correlates with your trading results over time.', color: '#a78bfa', tag: 'Focus' },
]

const STEPS = [
  { n: '01', title: 'Get Your License',  body: 'Buy on Whop. Your key unlocks everything — all thirteen tools, cross-device sync, lifetime access. No subscriptions.',        icon: Target },
  { n: '02', title: 'Build Your System', body: 'Open the Builder. Stack your concepts, watch synergies fire, and lock in a playbook you actually understand.',             icon: Brain },
  { n: '03', title: 'Execute & Review',  body: 'Trade with a plan. Log every entry. Recap each week with visual trade cards. Watch your edge compound over time.',        icon: TrendingUp },
]

const FEATURE_COLS = [
  {
    heading: 'Edge-Building',
    color: '#f59e0b',
    items: ['50+ ICT / SMC concepts mapped', 'Real-time synergy detection', 'Full concept dependency graph', 'Mastery quiz & self-testing', 'Strategy template library'],
  },
  {
    heading: 'Execution',
    color: '#60a5fa',
    items: ['Kill zone & macro clock', 'Live TradingView chart embed', 'Pre-market session notes', 'Daily & weekly planning tools', 'Trading rules checklist', 'Drawdown guard & daily limits', 'Mindset check-in tracker'],
  },
  {
    heading: 'Review',
    color: '#34d399',
    items: ['Journal with R-multiple tracking', 'Win rate & streak analytics', 'CSV broker import', 'Visual trade-card recap', 'One-click video montage export'],
  },
]

const PILLS = [
  { label: 'Market Structure', color: '#34d399' },
  { label: 'Liquidity',        color: '#34d399' },
  { label: 'FVG',              color: '#34d399' },
  { label: 'Order Block',      color: '#60a5fa' },
  { label: 'AMD Cycle',        color: '#c084fc' },
  { label: 'Kill Zones',       color: '#c084fc' },
  { label: 'Displacement',     color: '#60a5fa' },
  { label: 'OTE',              color: '#f59e0b' },
  { label: 'Premium/Discount', color: '#60a5fa' },
  { label: 'Inducement',       color: '#60a5fa' },
  { label: 'Breaker Block',    color: '#60a5fa' },
  { label: 'DOL',              color: '#f59e0b' },
  { label: 'MTFA',             color: '#c084fc' },
  { label: 'EQH / EQL',        color: '#34d399' },
  { label: 'NWOG',             color: '#f59e0b' },
  { label: 'Mitigation',       color: '#60a5fa' },
  { label: 'PDH / PDL',        color: '#34d399' },
  { label: 'Swing H&L',        color: '#34d399' },
]

// ── Who it's for ──────────────────────────────────────────────────────────────
const PERSONAS = [
  { emoji: '📚', title: 'The self-taught ICT trader', color: '#c084fc',
    body: "You've watched every mentorship video but your notes live in twelve Discord bookmarks. This turns scattered knowledge into one connected, testable system." },
  { emoji: '🏦', title: 'The prop-firm challenger', color: '#34d399',
    body: 'Passing an eval is a discipline game. Kill-zone timing, a drawdown guard, and a setup grader keep you from the one impulsive trade that blows the account.' },
  { emoji: '📈', title: 'The trader who journals', color: '#60a5fa',
    body: 'You already know review is the edge. Equity curve, kill-zone win rates, R-multiples, and shareable recaps make the review actually happen every week.' },
]

// ── The old way vs Trading Lab ────────────────────────────────────────────────
const COMPARISON = [
  { old: 'Notes scattered across Discord, PDFs, and screenshots', now: 'One connected map of 50+ ICT concepts and their synergies' },
  { old: 'Guessing whether a setup is actually A+ or just tempting', now: 'A weighted confluence grade with the missing essentials called out' },
  { old: 'A spreadsheet journal you stopped updating in week two', now: 'Fast logging with equity curve, R-multiples, and kill-zone stats' },
  { old: 'Missing the kill zone because you lost track of time', now: 'A live NY-time clock for every kill zone, macro, and red-folder event' },
  { old: 'Re-buying the same course concepts on three platforms', now: 'One license, every tool, lifetime access, synced across devices' },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is this a signals or alerts service?',
    a: 'No — and that\'s the point. Trading Lab gives you no signals, no calls, and no "trust me" entries. It\'s a system-building, grading, and review platform that makes YOUR reads sharper. You stay the trader.' },
  { q: 'Do I need to be advanced at ICT already?',
    a: 'No. The concept map, playbook lessons, and mastery quiz start from the six basics and build up. If you already know the framework, the Builder, Grader, and journal analytics go as deep as you want.' },
  { q: 'One-time payment or a subscription?',
    a: 'One license unlocks every tool with lifetime access and free updates — no recurring subscription. Your progress syncs across all your devices.' },
  { q: 'Which markets and instruments does it cover?',
    a: 'It\'s built for ICT / SMC on futures (NQ, ES, GC, SI) and the major forex pairs, with kill-zone timing tuned to the New York session. The concepts apply to any market the methodology is traded on.' },
  { q: 'Does it work on my phone?',
    a: 'Yes. Every tool is built mobile-first and feels native on a phone, so you can build, grade, and journal from anywhere — the same login works across web and mobile.' },
  { q: 'Is my data private?',
    a: 'Your builds and journal are yours. Analytics are privacy-first with no ad tracking, and your trading data syncs only to your own account.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button onClick={() => setOpen(o => !o)}
      className="w-full text-left rounded-2xl p-5 transition-all"
      style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[14px] font-bold text-white">{q}</span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-lg border border-amber-500/25 bg-amber-500/8 flex items-center justify-center text-amber-400 text-[15px] leading-none transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? '240px' : '0px', opacity: open ? 1 : 0 }}>
        <p className="text-[13px] text-slate-500 leading-relaxed mt-3">{a}</p>
      </div>
    </button>
  )
}

// ── Terminal boot sequence ────────────────────────────────────────────────────
const BOOT_LINES = [
  { text: 'TRADING LAB  /  SYSTEM INITIALIZING',          type: 'header'  },
  { text: '─────────────────────────────────────────────', type: 'divider' },
  { text: '▸  market structure analysis ........  LOADED', type: 'item'    },
  { text: '▸  liquidity zone mapping ...........  LOADED', type: 'item'    },
  { text: '▸  fvg + order block engine .........  LOADED', type: 'item'    },
  { text: '▸  amd cycle framework ..............  LOADED', type: 'item'    },
  { text: '▸  kill zone scheduler ..............  LOADED', type: 'item'    },
  { text: '▸  trade journal + analytics ........  LOADED', type: 'item'    },
  { text: '▸  synergy detection engine .........  LOADED', type: 'item'    },
  { text: '▸  recap + video export engine ......  LOADED', type: 'item'    },
  { text: '▸  drawdown guard ...................  LOADED', type: 'item'    },
  { text: '▸  mindset check-in tracker .........  LOADED', type: 'item'    },
  { text: '─────────────────────────────────────────────', type: 'divider' },
  { text: '✓  ALL SYSTEMS ONLINE — YOUR EDGE IS LIVE',    type: 'success'  },
]

function Terminal() {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        BOOT_LINES.forEach((_, i) => {
          setTimeout(() => setCount(i + 1), i * 280)
        })
        observer.disconnect()
      }
    }, { threshold: 0.35 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative rounded-2xl overflow-hidden mx-auto"
      style={{ background: '#080810', border: '1px solid rgba(245,158,11,0.15)', maxWidth: '680px',
        boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 0 120px rgba(245,158,11,0.04), inset 0 1px 0 rgba(255,255,255,0.04)' }}>

      {/* Terminal top bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/60"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-3 text-[10px] text-slate-600 font-mono tracking-widest uppercase">tradinglab — bash</span>
      </div>

      {/* Terminal body */}
      <div className="px-6 py-6 min-h-[320px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {BOOT_LINES.slice(0, count).map((line, i) => (
          <div key={i} className="leading-relaxed"
            style={{
              fontSize: 'clamp(11px, 2.2vw, 13px)',
              color: line.type === 'header'  ? '#f59e0b'
                   : line.type === 'success' ? '#34d399'
                   : line.type === 'divider' ? 'rgba(255,255,255,0.08)'
                   : 'rgba(148,163,184,0.7)',
              fontWeight: line.type === 'header' || line.type === 'success' ? 700 : 400,
              marginBottom: line.type === 'divider' ? '4px' : '2px',
              letterSpacing: line.type === 'header' || line.type === 'success' ? '0.1em' : '0.04em',
              textShadow: line.type === 'success' ? '0 0 20px rgba(52,211,153,0.5)' : line.type === 'header' ? '0 0 20px rgba(245,158,11,0.4)' : 'none',
            }}>
            {line.text}
            {/* "LOADED" in green */}
            {line.type === 'item' && (
              <span style={{ color: '#34d399', fontWeight: 600 }}></span>
            )}
          </div>
        ))}
        {/* Blinking cursor */}
        {count > 0 && count < BOOT_LINES.length && (
          <span className="inline-block w-2 h-3.5 ml-0.5 animate-pulse"
            style={{ background: '#f59e0b', verticalAlign: 'middle', opacity: 0.8 }} />
        )}
      </div>

      {/* Ambient glow lines */}
      <div className="absolute bottom-0 inset-x-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)' }} />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Landing({ isAuthenticated, onSignIn, onLaunch }: Props) {
  const [visible, setVisible] = useState(false)
  const heroMapRef = useRef<HTMLDivElement>(null)
  const ctaMapRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 40); return () => clearTimeout(t) }, [])

  // The marketing landing is designed dark — lock it regardless of the app theme,
  // then restore the user's chosen theme when they enter the product.
  useEffect(() => {
    const html = document.documentElement
    const prev = html.getAttribute('data-theme') ?? 'light'
    html.setAttribute('data-theme', 'dark')
    return () => html.setAttribute('data-theme', prev)
  }, [])

  // Scroll parallax — each map container moves at 20% of scroll speed
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (heroMapRef.current) heroMapRef.current.style.transform = `translateY(${y * 0.18}px)`
      if (ctaMapRef.current) {
        const rect = ctaMapRef.current.parentElement?.getBoundingClientRect()
        const offset = rect ? (window.scrollY + rect.top) : 0
        ctaMapRef.current.style.transform = `translateY(${(y - offset) * 0.18}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const anim = (delay: number) => ({
    className: `transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`,
    style: { transitionDelay: `${delay}ms` },
  })

  const handleCTA = isAuthenticated ? onLaunch : onSignIn
  const ctaLabel  = isAuthenticated ? 'Launch Trading Lab' : 'Sign In with License Key'

  return (
    <div className="min-h-screen bg-[#05050a] text-white overflow-x-hidden">

      {/* ── CSS Animations ────────────────────────────────────────── */}
      <style>{`
        @keyframes node-breathe {
          0%,100% { fill-opacity:0.28; stroke-opacity:0.8; }
          50%      { fill-opacity:0.52; stroke-opacity:1; }
        }
        @keyframes ring-breathe {
          0%,100% { stroke-opacity:0.12; }
          50%      { stroke-opacity:0.38; }
        }
        @keyframes edge-shimmer {
          0%,100% { stroke-opacity:0.4; }
          50%      { stroke-opacity:0.75; }
        }
        @keyframes gradient-pan {
          0%   { background-position:0% 50%; }
          50%  { background-position:100% 50%; }
          100% { background-position:0% 50%; }
        }
        @keyframes orb-float {
          0%,100% { transform:translateY(0px) scale(1); }
          50%      { transform:translateY(-18px) scale(1.04); }
        }
        @keyframes orb-float-2 {
          0%,100% { transform:translateY(0px) scale(1); }
          50%      { transform:translateY(14px) scale(0.97); }
        }
        @keyframes badge-glow {
          0%,100% { box-shadow:0 0 10px rgba(245,158,11,0.2); }
          50%      { box-shadow:0 0 22px rgba(245,158,11,0.5); }
        }
        @keyframes cta-pulse {
          0%,100% { box-shadow:0 0 50px rgba(245,158,11,0.22),0 4px 20px rgba(245,158,11,0.14); }
          50%      { box-shadow:0 0 80px rgba(245,158,11,0.38),0 8px 32px rgba(245,158,11,0.22); }
        }
        @keyframes map-drift {
          0%   { transform:translate(0px,0px); }
          18%  { transform:translate(-55px,-38px); }
          36%  { transform:translate(-20px,-75px); }
          54%  { transform:translate(48px,-55px); }
          72%  { transform:translate(30px,-18px); }
          88%  { transform:translate(-22px,8px); }
          100% { transform:translate(0px,0px); }
        }
        @keyframes line-grow {
          from { transform:scaleX(0); }
          to   { transform:scaleX(1); }
        }
        .animate-gradient-pan {
          background-size:200% 200%;
          animation:gradient-pan 5s ease infinite;
        }
        .animate-cta-pulse { animation:cta-pulse 3s ease-in-out infinite; }
        .animate-badge-glow { animation:badge-glow 2.5s ease-in-out infinite; }
        /* Force classic margin centering on all max-w containers.
           Tailwind v4 compiles mx-auto to margin-inline:auto which can
           mis-render in certain flex/grid parent contexts. */
        [class*="max-w-"] {
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/50 bg-[#05050a]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/35 flex items-center justify-center"
              style={{ boxShadow: '0 0 12px rgba(245,158,11,0.2)' }}>
              <FlaskConical size={13} className="text-amber-400" />
            </div>
            <span className="text-[13px] font-black tracking-widest text-white">TRADING LAB</span>
            <span className="hidden sm:block text-[10px] text-slate-700 font-bold tracking-[0.15em] uppercase ml-1">a Chronic Trading tool</span>
          </div>
          <div className="flex items-center gap-3">
            {WHOP_URL && !isAuthenticated && (
              <a href={WHOP_URL} target="_blank" rel="noopener noreferrer"
                className="hidden sm:block text-[12px] font-semibold text-slate-500 hover:text-slate-300 transition-colors">
                Get Access
              </a>
            )}
            {isAuthenticated ? (
              <button onClick={onLaunch}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0800' }}>
                Launch Lab <ArrowRight size={13} />
              </button>
            ) : (
              <button onClick={onSignIn}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/35 bg-amber-500/8 text-amber-300 text-[12.5px] font-bold hover:bg-amber-500/18 hover:border-amber-400/50 transition-all">
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-14 pb-28 px-5 text-center overflow-hidden">

        {/* Concept map — parallax wrapper */}
        <div ref={heroMapRef} className="absolute inset-0 will-change-transform">
          <ConceptMapBg opacity={0.22} />
        </div>

        {/* Fade: visible at top & bottom edges, dark in the middle where text lives */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(5,5,10,0.05) 0%, rgba(5,5,10,0.94) 30%, rgba(5,5,10,0.94) 70%, rgba(5,5,10,0.05) 100%)' }} />

        {/* Floating amber orb */}
        <div className="absolute pointer-events-none"
          style={{ top: '18%', left: '12%', width: '280px', height: '280px',
            background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
            animation: 'orb-float 7s ease-in-out infinite', borderRadius: '50%' }} />

        {/* Floating blue orb */}
        <div className="absolute pointer-events-none"
          style={{ bottom: '22%', right: '8%', width: '240px', height: '240px',
            background: 'radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 70%)',
            animation: 'orb-float-2 9s ease-in-out infinite', borderRadius: '50%' }} />

        {/* Floating purple orb */}
        <div className="absolute pointer-events-none"
          style={{ top: '40%', right: '15%', width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(192,132,252,0.08) 0%, transparent 70%)',
            animation: 'orb-float 11s ease-in-out infinite 2s', borderRadius: '50%' }} />

        {/* Top amber line */}
        <div className="absolute top-14 inset-x-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }} />

        <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center">

          {/* Badge */}
          <div {...anim(0)} className={`${anim(0).className} mb-8`} style={anim(0).style}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/8 animate-badge-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: '0 0 8px #f59e0b' }} />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-amber-400/85">a Chronic Trading tool</span>
            </div>
          </div>

          {/* Headline */}
          <div {...anim(80)} className={`${anim(80).className} mb-5 w-full`} style={anim(80).style}>
            <h1 className="font-black leading-[0.88] tracking-tight select-none text-center"
              style={{ fontSize: 'clamp(50px, 10vw, 94px)', letterSpacing: '-3px' }}>
              <span className="text-white">The Professional</span><br />
              <span className="animate-gradient-pan" style={{
                background: 'linear-gradient(125deg, #fbbf24 0%, #f59e0b 20%, #fde68a 50%, #f59e0b 80%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Trading System.</span>
            </h1>
          </div>

          {/* Tagline */}
          <div {...anim(140)} className={`${anim(140).className} mb-4`} style={anim(140).style}>
            <p className="text-[13px] font-semibold tracking-[0.18em] uppercase text-slate-500 text-center">
              ICT · SMC · Futures · All in One Platform
            </p>
          </div>

          {/* Sub */}
          <div {...anim(200)} className={`${anim(200).className} mb-11`} style={anim(200).style}>
            <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-center"
              style={{ fontSize: 'clamp(15px, 2vw, 18px)' }}>
              Thirteen precision-built tools for ICT and SMC traders.<br className="hidden sm:block" />
              Build your system. Grade every setup. Journal your edge.
            </p>
          </div>

          {/* CTAs */}
          <div {...anim(270)} className={`${anim(270).className} flex flex-col sm:flex-row items-center justify-center gap-3 mb-16`} style={anim(270).style}>
            <button onClick={handleCTA}
              className="group flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-[15px] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] animate-cta-pulse"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0800' }}>
              {ctaLabel}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {WHOP_URL && !isAuthenticated && (
              <a href={WHOP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold text-[14px] border border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-white hover:bg-slate-800/30 transition-all">
                Get Access on Whop <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* Stats */}
          <div {...anim(350)} className={`${anim(350).className} flex items-center justify-center`} style={anim(350).style}>
            {[
              { val: '50+', sub: 'ICT Concepts' },
              { val: '13',  sub: 'Pro Tools'    },
              { val: '1',   sub: 'Platform'     },
            ].map((s, i) => (
              <div key={s.sub} className="flex items-stretch">
                {i > 0 && <div className="w-px bg-slate-800/80 self-stretch mx-12 md:mx-20" />}
                <div className="text-center">
                  <p className="font-black text-white leading-none"
                    style={{ fontSize: 'clamp(28px,5.5vw,44px)', fontFamily: "'JetBrains Mono',monospace",
                      textShadow: '0 0 35px rgba(245,158,11,0.45)' }}>{s.val}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-[0.22em] mt-2">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`absolute bottom-7 left-1/2 -translate-x-1/2 transition-opacity duration-1000 ${visible ? 'opacity-20' : 'opacity-0'}`}
          style={{ transitionDelay: '1000ms' }}>
          <div className="w-px h-12 bg-gradient-to-b from-slate-400 to-transparent animate-pulse mx-auto" />
        </div>
      </section>

      {/* ── Concept pill strip ───────────────────────────────────────── */}
      <div className="relative border-y border-slate-800/50 py-5 overflow-hidden"
        style={{ background: 'linear-gradient(90deg,#05050a 0%,rgba(245,158,11,0.02) 50%,#05050a 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg,#05050a,transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(270deg,#05050a,transparent)' }} />
        <div className="flex items-center gap-2.5 px-8 flex-wrap justify-center">
          {PILLS.map(p => (
            <span key={p.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-semibold tracking-[0.07em] uppercase whitespace-nowrap"
              style={{ color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}25` }}>
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: p.color, opacity: 0.7 }} />
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── The Foundation ────────────────────────────────────────── */}
      <section className="px-5 pb-28 border-t border-slate-800/30">
        <div className="max-w-5xl mx-auto pt-24">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">The Foundation</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              What separates consistent traders.
            </h2>
          </div>
          {/* Single large card — same dark style as The Process */}
          <div className="relative group rounded-2xl p-10 md:p-14 overflow-hidden text-center"
            style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 inset-x-0 h-[1px] opacity-50"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.04), transparent 65%)' }} />
            <div className="relative max-w-2xl mx-auto">
              <p className="font-black leading-[0.9] mb-6 text-center"
                style={{ fontSize: 'clamp(28px,5.5vw,52px)', letterSpacing: '-2px' }}>
                <span className="text-slate-400">Most traders fail because</span><br />
                <span className="text-white">they </span>
                <span style={{ background: 'linear-gradient(125deg,#fbbf24,#f59e0b 45%,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>react.</span>
              </p>
              <p className="font-black leading-[0.9] mb-10 text-center"
                style={{ fontSize: 'clamp(28px,5.5vw,52px)', letterSpacing: '-2px' }}>
                <span className="text-white">ICT traders </span>
                <span style={{ color: '#34d399', textShadow: '0 0 30px rgba(52,211,153,0.4)' }}>anticipate.</span>
              </p>
              <div className="h-px max-w-[120px] mx-auto mb-10"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.35), transparent)' }} />
              <p className="text-[14.5px] text-slate-500 leading-relaxed max-w-lg mx-auto">
                The Trading Lab is where you build the mental models, the system, and the review process that separates consistently profitable traders from everyone else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="px-5 pb-28 border-t border-slate-800/30">
        <div className="max-w-5xl mx-auto pt-24">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">The process</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              From setup to edge in three steps.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="relative group rounded-2xl p-7 text-center overflow-hidden"
                  style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="absolute top-0 inset-x-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.05), transparent 70%)' }} />
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-[11px] w-[22px] h-px bg-gradient-to-r from-slate-700/80 to-transparent z-10" />
                  )}
                  {/* Step number */}
                  <p className="font-black leading-none mb-5 text-center"
                    style={{ fontSize: '44px', fontFamily: "'JetBrains Mono',monospace",
                      background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.06))',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {s.n}
                  </p>
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                      <Icon size={16} className="text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">{s.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Tools ─────────────────────────────────────────────────── */}
      <section className="px-5 pb-28 border-t border-slate-800/30">
        <div className="max-w-5xl mx-auto pt-24">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">What's inside</p>
            <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              Every tool you need. Nothing you don't.
            </h2>
            <p className="text-[14px] text-slate-500 max-w-sm mx-auto">Thirteen precision-built tools in one dark, focused platform.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map(t => (
              <div key={t.name}
                className="group relative rounded-2xl p-6 overflow-hidden transition-all duration-300 cursor-default hover:-translate-y-2 text-center flex flex-col items-center"
                style={{ background: 'rgba(6,6,12,0.98)', border: `1px solid rgba(255,255,255,0.055)` }}>
                <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl opacity-35 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg,transparent,${t.color},transparent)` }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 90% 55% at 50% 0%,${t.color}0c,transparent 70%)` }} />
                <span className="text-[34px] leading-none mb-3 transition-transform duration-300 group-hover:scale-110">{t.emoji}</span>
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full mb-4"
                  style={{ color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}25` }}>
                  {t.tag}
                </span>
                <h3 className="text-[14px] font-bold text-white mb-2">{t.name}</h3>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">{t.desc}</p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color, opacity: 0.7 }} />
                  <div className="h-px w-10" style={{ background: `linear-gradient(90deg,${t.color}50,transparent)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ──────────────────────────────────────────── */}
      <section className="px-5 pb-28 border-t border-slate-800/30">
        <div className="max-w-5xl mx-auto pt-24">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">Who it's for</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              Built for the trader who's serious.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PERSONAS.map(p => (
              <div key={p.title} className="relative rounded-2xl p-7 overflow-hidden text-center flex flex-col items-center"
                style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: `linear-gradient(90deg,transparent,${p.color}55,transparent)` }} />
                <span className="text-[34px] leading-none mb-4">{p.emoji}</span>
                <h3 className="text-[15px] font-bold text-white mb-3">{p.title}</h3>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The old way vs Trading Lab ─────────────────────────────── */}
      <section className="px-5 pb-28 border-t border-slate-800/30">
        <div className="max-w-4xl mx-auto pt-24">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">The difference</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              Stop duct-taping your process together.
            </h2>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-2 text-[10px] font-black uppercase tracking-[0.16em]">
              <div className="px-5 md:px-7 py-4 text-slate-600 border-b border-slate-800/50">The old way</div>
              <div className="px-5 md:px-7 py-4 text-amber-400 border-b border-l border-slate-800/50 bg-amber-500/[0.03]">With Trading Lab</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} className="grid grid-cols-2">
                <div className={`px-5 md:px-7 py-4 flex items-start gap-2.5 ${i < COMPARISON.length - 1 ? 'border-b border-slate-800/40' : ''}`}>
                  <span className="text-slate-700 mt-0.5 flex-shrink-0">✕</span>
                  <span className="text-[12.5px] text-slate-500 leading-snug">{row.old}</span>
                </div>
                <div className={`px-5 md:px-7 py-4 flex items-start gap-2.5 border-l border-slate-800/40 bg-amber-500/[0.02] ${i < COMPARISON.length - 1 ? 'border-b border-slate-800/40' : ''}`}>
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-[12.5px] text-slate-300 leading-snug">{row.now}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pull quote numbers ────────────────────────────────────── */}
      <section className="relative px-5 py-24 border-t border-slate-800/30 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-12">By the numbers</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { val: '50+', label: 'Mapped Concepts', color: '#34d399' },
              { val: '13',  label: 'Pro Tools',        color: '#f59e0b' },
              { val: '∞',   label: 'Synergy Links',    color: '#c084fc' },
              { val: '1',   label: 'Platform',         color: '#60a5fa' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <p className="font-black leading-none mb-2"
                  style={{ fontSize: 'clamp(36px,6vw,52px)', fontFamily: "'JetBrains Mono',monospace",
                    color: s.color, textShadow: `0 0 30px ${s.color}55` }}>
                  {s.val}
                </p>
                <p className="text-[11px] text-slate-600 uppercase tracking-[0.2em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Everything included — horizontal stacked cards ────────── */}
      <section className="relative px-5 py-28 border-t border-slate-800/30 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(245,158,11,0.03) 0%, transparent 70%)' }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">Everything included</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              Built for the serious trader.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURE_COLS.map(col => (
              <div key={col.heading} className="relative rounded-2xl p-7 overflow-hidden text-center flex flex-col items-center"
                style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute top-0 inset-x-0 h-[1px]"
                  style={{ background: `linear-gradient(90deg,transparent,${col.color}55,transparent)` }} />
                <div className="w-[2px] h-8 rounded-full mb-4" style={{ background: col.color, opacity: 0.7 }} />
                <p className="text-[11px] font-black tracking-[0.22em] uppercase mb-5" style={{ color: col.color }}>{col.heading}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {col.items.map(item => (
                    <span key={item}
                      className="px-3 py-1 rounded-lg text-[11.5px] font-medium text-slate-400"
                      style={{ background: `${col.color}0d`, border: `1px solid ${col.color}22` }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── System boot terminal ──────────────────────────────────── */}
      <section className="relative px-5 py-28 border-t border-slate-800/30 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 80% at 50% 50%, rgba(52,211,153,0.03) 0%, transparent 70%)' }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">Under the hood</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              Everything loads. Every time.
            </h2>
          </div>
          <Terminal />
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section className="relative px-5 py-28 border-t border-slate-800/30 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 40%, rgba(245,158,11,0.05) 0%, transparent 70%)' }} />
        <div className="relative max-w-lg mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">One license</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              Everything. Forever.
            </h2>
          </div>

          <div className="relative rounded-3xl p-8 md:p-10 overflow-hidden"
            style={{ background: 'rgba(8,8,15,0.98)', border: '1px solid rgba(245,158,11,0.22)', boxShadow: '0 0 60px rgba(245,158,11,0.08)' }}>
            <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.7),transparent)' }} />

            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-[13px] font-black tracking-widest text-white uppercase">Trading Lab</p>
                <p className="text-[11px] text-slate-600 tracking-[0.12em] uppercase mt-0.5">Full access</p>
              </div>
              <div className="text-right">
                {PRICE ? (
                  <p className="font-black text-white leading-none" style={{ fontSize: '40px', fontFamily: "'JetBrains Mono',monospace" }}>{PRICE}</p>
                ) : (
                  <p className="font-black text-amber-400 leading-none" style={{ fontSize: '22px' }}>One-time</p>
                )}
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mt-1.5">Lifetime · no subscription</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-8">
              {[
                'All 13 professional tools unlocked',
                '50+ ICT / SMC concepts, mapped & testable',
                'The new Trade Grader + full journal analytics',
                'Cross-device sync — web and mobile',
                'Lifetime access with free updates',
                'No signals. No subscription. Your system, your calls.',
              ].map(item => (
                <div key={item} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-[11px] mt-0.5">✓</span>
                  <span className="text-[13px] text-slate-300 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            <button onClick={handleCTA}
              className="group w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-[15px] transition-all hover:scale-[1.02] active:scale-[0.98] animate-cta-pulse"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0800' }}>
              {ctaLabel}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {WHOP_URL && !isAuthenticated && (
              <a href={WHOP_URL} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 text-[12.5px] font-semibold text-slate-500 hover:text-amber-300 transition-colors">
                See full details on Whop <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="px-5 py-28 border-t border-slate-800/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-3">Questions</p>
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-1px' }}>
              Everything you're wondering.
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-slate-800/50" style={{ minHeight: '600px' }}>
        {/* Concept map — parallax wrapper */}
        <div ref={ctaMapRef} className="absolute inset-0 will-change-transform">
          <ConceptMapBg opacity={0.22} />
        </div>

        {/* Fade: visible at top & bottom, dark center */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(5,5,10,0.05) 0%, rgba(5,5,10,0.92) 28%, rgba(5,5,10,0.92) 72%, rgba(5,5,10,0.05) 100%)' }} />
        {/* Amber bloom from below */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245,158,11,0.12) 0%, transparent 65%)' }} />
        {/* Top amber line */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />

        <div className="relative z-10 max-w-3xl mx-auto px-5 py-32 flex flex-col items-center text-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/6 mb-10 animate-badge-glow">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: '0 0 6px #f59e0b' }} />
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-amber-400/80">
              {isAuthenticated ? "You're In" : 'Get Started Today'}
            </span>
          </div>

          <h2 className="font-black text-white mb-8 w-full"
            style={{ fontSize: 'clamp(44px, 8.5vw, 82px)', lineHeight: 0.88, letterSpacing: '-3px' }}>
            {isAuthenticated ? (
              <>Your lab<br />
              <span className="animate-gradient-pan" style={{
                background: 'linear-gradient(125deg,#fbbf24,#f59e0b 40%,#fde68a,#f59e0b 80%,#fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>is waiting.</span></>
            ) : (
              <>Trade smarter.<br />
              <span className="animate-gradient-pan" style={{
                background: 'linear-gradient(125deg,#fbbf24,#f59e0b 40%,#fde68a,#f59e0b 80%,#fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Starting now.</span></>
            )}
          </h2>

          <p className="text-[15px] text-slate-400 max-w-xs mx-auto mb-14 leading-relaxed">
            {isAuthenticated
              ? 'Jump back in. Your builds, journal, and plans are waiting.'
              : 'One license. Every tool. Syncs across all your devices forever.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <button onClick={handleCTA}
              className="group flex items-center gap-3 rounded-2xl font-bold text-[16px] transition-all hover:scale-[1.03] active:scale-[0.97] animate-cta-pulse"
              style={{ padding: '1.1rem 3rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0800' }}>
              {ctaLabel}
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {WHOP_URL && !isAuthenticated && (
              <a href={WHOP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl font-semibold text-[14px] border border-slate-700/60 text-slate-400 hover:border-amber-500/35 hover:text-amber-300 hover:bg-amber-500/5 transition-all"
                style={{ padding: '1.1rem 2.2rem' }}>
                Get Access on Whop <ExternalLink size={13} />
              </a>
            )}
          </div>

          <p className="mt-16 text-[11px] text-slate-700 tracking-[0.22em] uppercase font-semibold">
            ICT · SMC · Futures · One Platform
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/30 px-5 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FlaskConical size={12} className="text-amber-500/40" />
            <span className="text-[11px] font-black tracking-widest text-slate-700 uppercase">Trading Lab</span>
            <span className="text-[10px] text-slate-800 mx-1">·</span>
            <span className="text-[10px] text-slate-800 tracking-[0.12em] uppercase">a Chronic Trading tool</span>
          </div>
          <p className="text-[11px] text-slate-800 tracking-[0.15em] uppercase">ICT · SMC · Futures</p>
        </div>
      </footer>
    </div>
  )
}
