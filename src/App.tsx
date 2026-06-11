import { useState, useEffect, useRef } from 'react'
import {
  FlaskConical, Package, Beaker, Network,
  LayoutTemplate, BookOpen, LineChart, StickyNote,
  Shield, ClipboardCheck, Brain, CalendarDays, Settings, LogOut, BarChart2, Building2,
  ShieldAlert, Smile, GraduationCap, Crosshair, Grid3X3, X, MoreVertical,
  Gamepad2,
} from 'lucide-react'
import { Landing }        from './pages/Landing'
import { Builder }        from './pages/Builder'
import { MyBuilds }       from './pages/MyBuilds'
import { ConceptMap }     from './pages/ConceptMap'
import { Templates }      from './pages/Templates'
import { Chart }          from './pages/Chart'
import { Journal }        from './pages/Journal'
import { Plan }           from './pages/Plan'
import { Calendar }       from './pages/Calendar'
import { RecapPage }      from './recap/RecapPage'
import { Playbook }       from './pages/Playbook'
import { BacktestPage }   from './pages/BacktestPage'
import { PropFirms }      from './pages/PropFirms'
import { Arcade }         from './pages/Arcade'
import { KillZoneClock, KillZoneClockCompact } from './components/KillZoneClock'
import { SessionNotes }   from './components/SessionNotes'
import { TradingRules }   from './components/TradingRules'
import { QuizModal }      from './components/QuizModal'
import { SettingsModal }  from './components/SettingsModal'
import { DrawdownGuard }  from './components/DrawdownGuard'
import { MindsetCheck }   from './components/MindsetCheck'
import { LoginScreen }    from './components/LoginScreen'
import { useBuilds }      from './hooks/useBuilds'
import { useAuth }        from './hooks/useAuth'
import { syncOnLogin }    from './lib/dataSync'
import type { Build }     from './types'

const SUPABASE_CONFIGURED = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

type Tab  = 'builder' | 'chart' | 'map' | 'plan' | 'journal' | 'calendar' | 'templates' | 'builds' | 'recap' | 'playbook' | 'backtest' | 'arcade'
type View = 'landing' | 'login' | 'app'

const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'builder',   label: 'Builder',   Icon: Beaker         },
  { id: 'chart',     label: 'Chart',     Icon: LineChart      },
  { id: 'map',       label: 'Map',       Icon: Network        },
  { id: 'plan',      label: 'Plan',      Icon: ClipboardCheck },
  { id: 'journal',   label: 'Journal',   Icon: BookOpen       },
  { id: 'calendar',  label: 'Calendar',  Icon: CalendarDays   },
  { id: 'templates', label: 'Templates', Icon: LayoutTemplate },
  { id: 'builds',    label: 'Builds',    Icon: Package        },
  { id: 'recap',     label: 'Recap',     Icon: BarChart2      },
  { id: 'playbook',  label: 'Playbook',  Icon: GraduationCap  },
  { id: 'backtest',  label: 'Replay',    Icon: Crosshair      },
  { id: 'arcade',    label: 'Arcade',    Icon: Gamepad2       },
]

// Primary tabs always visible on mobile bottom bar
const MOBILE_PRIMARY: Tab[] = ['builder', 'playbook', 'journal', 'chart']

// Mobile bottom nav
function MobileBottomNav({
  tab, setTab,
}: { tab: Tab; setTab: (t: Tab) => void }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const primary   = tabs.filter(t => MOBILE_PRIMARY.includes(t.id))
  const secondary = tabs.filter(t => !MOBILE_PRIMARY.includes(t.id))
  const moreActive = secondary.some(t => t.id === tab)

  return (
    <>
      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#06060d]/95 backdrop-blur-md border-t border-slate-800/60"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch">
          {primary.map(({ id, label, Icon }) => (
            <button key={id}
              onClick={() => { setTab(id); setMoreOpen(false) }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative ${
                tab === id && !moreOpen ? 'text-amber-400' : 'text-slate-600 active:text-slate-300'
              }`}>
              {tab === id && !moreOpen && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-full" />
              )}
              <Icon size={19} />
              <span className="text-[9px] font-bold tracking-wide">{label}</span>
            </button>
          ))}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative ${
              moreOpen || moreActive ? 'text-amber-400' : 'text-slate-600 active:text-slate-300'
            }`}>
            {(moreOpen || moreActive) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-full" />
            )}
            {moreOpen ? <X size={19} /> : <Grid3X3 size={19} />}
            <span className="text-[9px] font-bold tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-30"
          onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bg-[#08080f] border-t border-slate-800/60 p-4 pb-2 shadow-2xl"
            style={{ bottom: `calc(56px + env(safe-area-inset-bottom))` }}
            onClick={e => e.stopPropagation()}>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600 mb-3 px-1">All tabs</p>
            <div className="grid grid-cols-4 gap-2 pb-2">
              {secondary.map(({ id, label, Icon }) => (
                <button key={id}
                  onClick={() => { setTab(id); setMoreOpen(false) }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${
                    tab === id
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-slate-800/60 bg-slate-900/50 text-slate-500 active:text-slate-200 active:border-slate-600'
                  }`}>
                  <Icon size={17} />
                  <span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  return <RootApp />
}

function RootApp() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [synced, setSynced] = useState(false)
  const [view,   setView]   = useState<View>('landing')
  const prevUserRef = useRef(user)

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setSynced(true); return }
    if (authLoading) return
    if (!user) { setSynced(true); return }
    syncOnLogin(user.id).finally(() => setSynced(true))
  }, [user, authLoading])

  // After successful login → go straight to app
  // After sign-out → back to landing
  useEffect(() => {
    if (!prevUserRef.current && user) setView('app')
    if (prevUserRef.current && !user)  setView('landing')
    prevUserRef.current = user
  }, [user])

  if (authLoading || !synced) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#05050a] gap-3">
        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <span className="text-[13px] text-slate-500 font-medium">Loading…</span>
      </div>
    )
  }

  if (view === 'login') {
    return <LoginScreen onBack={() => setView('landing')} />
  }

  if (view === 'app' && user) {
    return (
      <AppShell
        signOut={() => { signOut(); setView('landing') }}
        userEmail={user.email}
      />
    )
  }

  // Landing — always shown first on every load
  return (
    <Landing
      isAuthenticated={!!user}
      onSignIn={() => setView('login')}
      onLaunch={user ? () => setView('app') : undefined}
    />
  )
}

function AppShell({ signOut, userEmail }: { signOut?: () => void; userEmail?: string }) {
  const [tab,          setTab]          = useState<Tab>('builder')
  const mainRef = useRef<HTMLElement>(null)
  const [loadedBuild,  setLoadedBuild]  = useState<Build | null>(null)
  const [notesOpen,     setNotesOpen]     = useState(false)
  const [rulesOpen,     setRulesOpen]     = useState(false)
  const [quizOpen,      setQuizOpen]      = useState(false)
  const [settingsOpen,  setSettingsOpen]  = useState(false)
  const [propsOpen,     setPropsOpen]     = useState(false)
  const [drawdownOpen,  setDrawdownOpen]  = useState(false)
  const [mindsetOpen,   setMindsetOpen]   = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const { loadSharedBuild }             = useBuilds()

  useEffect(() => {
    const shared = loadSharedBuild()
    if (shared) {
      setLoadedBuild(shared)
      setTab('builder')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      mainRef.current?.querySelectorAll('[class*="overflow-y"]').forEach(el => {
        (el as HTMLElement).scrollTop = 0
      })
    }, 0)
    return () => clearTimeout(timer)
  }, [tab])

  const handleLoadBuild = (build: Build) => {
    setLoadedBuild(build)
    setTab('builder')
  }

  return (
    <div className="flex flex-col h-screen bg-[#05050a] overflow-hidden">
      <header className="relative flex-shrink-0 bg-[#06060d] border-b border-slate-800/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="relative flex items-center px-4 md:px-6 h-12 md:h-16 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <FlaskConical size={13} className="text-amber-400 md:hidden" />
              <FlaskConical size={17} className="text-amber-400 hidden md:block" />
            </div>
            <div>
              <p className="text-[12px] md:text-[15px] font-black tracking-widest text-slate-100 leading-none">TRADING LAB</p>
              <p className="hidden md:block text-[9px] font-bold text-slate-600 tracking-[0.15em] mt-0.5">ICT · SMC · FUTURES</p>
            </div>
          </div>

          {/* Desktop: clock — flex-1 so it fills the middle without overlapping */}
          <div className="hidden md:flex flex-1 justify-center items-center min-w-0">
            <KillZoneClock />
          </div>

          {/* Desktop: full utility buttons */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setDrawdownOpen(true)}  title="Guard"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/8 transition-all"><ShieldAlert size={12} /><span className="hidden xl:inline">Guard</span></button>
            <button onClick={() => setMindsetOpen(true)}   title="Mindset"  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/8 transition-all"><Smile size={12} /><span className="hidden xl:inline">Mindset</span></button>
            <button onClick={() => setPropsOpen(true)}     title="Props"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all"><Building2 size={12} /><span className="hidden xl:inline">Props</span></button>
            <button onClick={() => setQuizOpen(true)}      title="Quiz"     className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-purple-500/40 hover:text-purple-400 hover:bg-purple-500/8 transition-all"><Brain size={12} /><span className="hidden xl:inline">Quiz</span></button>
            <button onClick={() => setRulesOpen(true)}     title="Rules"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"><Shield size={12} /><span className="hidden xl:inline">Rules</span></button>
            <button onClick={() => setNotesOpen(true)}     title="Notes"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/8 transition-all"><StickyNote size={12} /><span className="hidden xl:inline">Notes</span></button>
            <button onClick={() => setSettingsOpen(true)}  title="Settings" className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all"><Settings size={12} /><span className="hidden xl:inline">Settings</span></button>
            {signOut && (
              <button onClick={signOut} title={userEmail ?? 'Sign out'} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"><LogOut size={12} /><span className="hidden xl:inline">Sign out</span></button>
            )}
          </div>

          {/* Mobile: just the ⋮ tools button — clock gets its own row below */}
          <div className="flex md:hidden items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMobileToolsOpen(o => !o)}
              className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                mobileToolsOpen ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-slate-800 text-slate-500'
              }`}>
              {mobileToolsOpen ? <X size={14} /> : <MoreVertical size={14} />}
            </button>
          </div>
        </div>

        {/* Mobile tools sheet */}
        {mobileToolsOpen && (
          <div className="md:hidden border-t border-slate-800/40 bg-[#06060d] px-4 py-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Guard',    Icon: ShieldAlert, color: 'text-orange-400', onClick: () => { setDrawdownOpen(true);  setMobileToolsOpen(false) } },
                { label: 'Mindset',  Icon: Smile,       color: 'text-violet-400', onClick: () => { setMindsetOpen(true);   setMobileToolsOpen(false) } },
                { label: 'Props',    Icon: Building2,   color: 'text-emerald-400',onClick: () => { setPropsOpen(true);     setMobileToolsOpen(false) } },
                { label: 'Quiz',     Icon: Brain,       color: 'text-purple-400', onClick: () => { setQuizOpen(true);      setMobileToolsOpen(false) } },
                { label: 'Rules',    Icon: Shield,      color: 'text-red-400',    onClick: () => { setRulesOpen(true);     setMobileToolsOpen(false) } },
                { label: 'Notes',    Icon: StickyNote,  color: 'text-amber-400',  onClick: () => { setNotesOpen(true);     setMobileToolsOpen(false) } },
                { label: 'Settings', Icon: Settings,    color: 'text-slate-400',  onClick: () => { setSettingsOpen(true);  setMobileToolsOpen(false) } },
                ...(signOut ? [{ label: 'Sign out', Icon: LogOut, color: 'text-red-400', onClick: () => { signOut(); setMobileToolsOpen(false) } }] : []),
              ].map(({ label, Icon, color, onClick }) => (
                <button key={label} onClick={onClick}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border border-slate-800/60 bg-slate-900/40 transition-all active:border-slate-600">
                  <Icon size={16} className={color} />
                  <span className={`text-[9px] font-bold ${color}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Mobile compact clock row */}
        <div className="md:hidden flex items-center px-4 pb-2 pt-0.5 gap-2">
          <KillZoneClockCompact />
        </div>

        {/* Desktop tab nav */}
        <nav className="hidden md:flex border-t border-slate-800/40 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-shrink-0 flex-1 min-w-[46px] flex items-center justify-center gap-1.5 py-2.5 text-[11.5px] font-semibold relative transition-all duration-150 border-b-2 px-2
                ${tab === id ? 'text-slate-100 border-amber-400 bg-slate-800/20' : 'text-slate-600 border-transparent hover:text-slate-300 hover:bg-slate-800/10'}`}>
              <Icon size={12} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main content — extra bottom padding on mobile for the bottom nav */}
      <main ref={mainRef} className="flex-1 flex flex-col overflow-hidden md:pb-0 pb-14">
        {tab === 'builder'   && <Builder   initialBuild={loadedBuild} />}
        {tab === 'chart'     && <Chart />}
        {tab === 'map'       && <ConceptMap />}
        {tab === 'plan'      && <Plan />}
        {tab === 'journal'   && <Journal />}
        {tab === 'calendar'  && <Calendar />}
        {tab === 'templates' && <Templates onLoad={handleLoadBuild} />}
        {tab === 'builds'    && <MyBuilds  onLoadBuild={handleLoadBuild} />}
        {tab === 'recap'     && <RecapPage />}
        {tab === 'playbook'  && <Playbook />}
        {tab === 'backtest'  && <BacktestPage />}
        {tab === 'arcade'    && <Arcade />}
      </main>

      <SessionNotes  open={notesOpen}    onClose={() => setNotesOpen(false)} />
      <TradingRules  open={rulesOpen}    onClose={() => setRulesOpen(false)} />
      <QuizModal     open={quizOpen}     onClose={() => setQuizOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DrawdownGuard open={drawdownOpen} onClose={() => setDrawdownOpen(false)} />
      <MindsetCheck  open={mindsetOpen}  onClose={() => setMindsetOpen(false)} />

      {/* Mobile bottom nav */}
      <MobileBottomNav tab={tab} setTab={setTab} />

      {/* Prop Firms modal */}
      {propsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#05050a]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-emerald-400" />
              <span className="text-[13px] font-bold text-white">Prop Firm Compare</span>
            </div>
            <button onClick={() => setPropsOpen(false)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all">
              ✕ Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PropFirms />
          </div>
        </div>
      )}

    </div>
  )
}
