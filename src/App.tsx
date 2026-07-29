import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import {
  FlaskConical, Package, Beaker, Network,
  LayoutTemplate, BookOpen, LineChart, StickyNote,
  Shield, ClipboardCheck, Brain, CalendarDays, Settings, LogOut, BarChart2, Building2,
  ShieldAlert, Smile, GraduationCap, Crosshair, Grid3X3, X, MoreVertical,
  Gamepad2, Layers, Sun, Moon, Gauge, LayoutDashboard,
} from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { Landing }        from './pages/Landing'
// Tab pages are code-split so the initial load (landing + shell) stays light —
// each tool's JS only downloads when the user actually opens that tab.
const Home         = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Builder      = lazy(() => import('./pages/Builder').then(m => ({ default: m.Builder })))
const MyBuilds     = lazy(() => import('./pages/MyBuilds').then(m => ({ default: m.MyBuilds })))
const ConceptMap   = lazy(() => import('./pages/ConceptMap').then(m => ({ default: m.ConceptMap })))
const Review       = lazy(() => import('./pages/Review').then(m => ({ default: m.Review })))
const Templates    = lazy(() => import('./pages/Templates').then(m => ({ default: m.Templates })))
const Chart        = lazy(() => import('./pages/Chart').then(m => ({ default: m.Chart })))
const Journal      = lazy(() => import('./pages/Journal').then(m => ({ default: m.Journal })))
const Plan         = lazy(() => import('./pages/Plan').then(m => ({ default: m.Plan })))
const Calendar     = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })))
const RecapPage    = lazy(() => import('./recap/RecapPage').then(m => ({ default: m.RecapPage })))
const Playbook     = lazy(() => import('./pages/Playbook').then(m => ({ default: m.Playbook })))
const BacktestPage = lazy(() => import('./pages/BacktestPage').then(m => ({ default: m.BacktestPage })))
const PropFirms    = lazy(() => import('./pages/PropFirms').then(m => ({ default: m.PropFirms })))
const Arcade       = lazy(() => import('./pages/Arcade').then(m => ({ default: m.Arcade })))
const TradeGrader  = lazy(() => import('./pages/TradeGrader').then(m => ({ default: m.TradeGrader })))
import { KillZoneClock, KillZoneClockCompact } from './components/KillZoneClock'
// SessionNotes and the modals below reach Supabase (directly or via a sync hook),
// so importing them here would pull the auth client into the entry chunk and put
// it back on the landing page's critical path. They only ever render inside the
// signed-in shell, so they load with it.
const SessionNotes = lazy(() => import('./components/SessionNotes').then(m => ({ default: m.SessionNotes })))
import { TradingRules }   from './components/TradingRules'
// QuizModal pulls in the full concept dataset — keep it out of the entry chunk
// (the landing would otherwise download all 52 concepts just to render a hero).
const QuizModal = lazy(() => import('./components/QuizModal').then(m => ({ default: m.QuizModal })))
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })))
import { DrawdownGuard }  from './components/DrawdownGuard'
import { MindsetCheck }   from './components/MindsetCheck'
// LoginScreen imports the Supabase client directly — the single biggest reason
// the client used to land in the entry chunk. It renders only once the visitor
// chooses to sign in, which is exactly when loading the client is warranted.
const LoginScreen = lazy(() => import('./components/LoginScreen').then(m => ({ default: m.LoginScreen })))
import { useBuilds }      from './hooks/useBuilds'
import { useAuth }        from './hooks/useAuth'
// dataSync reaches Supabase, so it is imported dynamically at the call site
// below — a static import here would pull the client back into the entry chunk
// that useAuth was just changed to keep it out of.
import type { Build }     from './types'

const SUPABASE_CONFIGURED = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

type Tab  = 'home' | 'builder' | 'grader' | 'map' | 'review' | 'journal' | 'backtest' | 'recap' | 'playbook' | 'plan' | 'chart' | 'calendar' | 'templates' | 'builds' | 'arcade'
type View = 'landing' | 'login' | 'app'

const tabs: { id: Tab; label: string; Icon: React.ElementType; badge?: string }[] = [
  // ── Showcase set (always visible on desktop; the build + signature tools) ──
  { id: 'home',      label: 'Today',     Icon: LayoutDashboard },  // command centre: sessions, events, stats
  { id: 'builder',   label: 'Builder',   Icon: Beaker         },  // build setups from concepts
  { id: 'grader',    label: 'Grader',    Icon: Gauge, badge: 'NEW' },  // score a setup's confluence
  { id: 'map',       label: 'Map',       Icon: Network        },  // interactive concept graph
  { id: 'review',    label: 'Review',    Icon: Layers         },  // spaced-repetition mastery
  { id: 'journal',   label: 'Journal',   Icon: BookOpen       },  // trades + analytics v2
  { id: 'backtest',  label: 'Replay',    Icon: Crosshair      },  // scored bar-by-bar practice
  { id: 'recap',     label: 'Recap',     Icon: BarChart2      },  // shareable trade montages
  { id: 'playbook',  label: 'Playbook',  Icon: GraduationCap  },  // the ICT lessons
  // ── Secondary (desktop "More" dropdown) — support + commodity tools ──
  { id: 'plan',      label: 'Plan',      Icon: ClipboardCheck },
  { id: 'chart',     label: 'Levels',    Icon: LineChart      },  // key levels (not full charting)
  { id: 'calendar',  label: 'Calendar',  Icon: CalendarDays   },
  { id: 'templates', label: 'Templates', Icon: LayoutTemplate },
  { id: 'builds',    label: 'Builds',    Icon: Package        },
  { id: 'arcade',    label: 'Arcade',    Icon: Gamepad2       },
]

/* ── Navigation model ────────────────────────────────────────────────────────
   Fifteen flat tabs meant nine competed for the bar and six were effectively
   undiscoverable behind "More". They are now grouped by what you are trying to
   do, and the six tools that are really facets of a bigger one became children
   of it: Builds and Templates belong to the Builder, Recap reads the Journal's
   trades, and Levels and Calendar are both things you set up while planning.
   A child is reached from its parent's sub-tab strip, so the sidebar lists ten
   destinations instead of fifteen while everything stays one or two clicks away.
   Tab ids are unchanged, so the pages themselves needed no edits.            */
type NavItem = { id: Tab; children?: Tab[] }
type NavGroup = { title: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  { title: '',         items: [{ id: 'home' }] },
  { title: 'Practice', items: [{ id: 'grader' }, { id: 'backtest' }, { id: 'review' }, { id: 'arcade' }] },
  { title: 'Build',    items: [{ id: 'builder', children: ['builds', 'templates'] }] },
  { title: 'Journal',  items: [{ id: 'journal', children: ['recap'] }] },
  { title: 'Learn',    items: [{ id: 'playbook' }, { id: 'map' }] },
  { title: 'Plan',     items: [{ id: 'plan', children: ['chart', 'calendar'] }] },
]

const tabMeta = (id: Tab) => tabs.find(t => t.id === id)!

/** The nav entry a tab is shown under — itself, or its parent if it's a child. */
function parentOf(tab: Tab): NavItem {
  for (const g of NAV_GROUPS)
    for (const item of g.items)
      if (item.id === tab || item.children?.includes(tab)) return item
  return { id: 'home' }
}

// Primary tabs always visible on mobile bottom bar (kept to 4 + More so the bar
// stays thumb-friendly — the rest live in the More sheet).
const MOBILE_PRIMARY: Tab[] = ['home', 'grader', 'builder', 'journal']

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
      <nav className="tl-darkchrome md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#06060d]/95 backdrop-blur-md border-t border-slate-800/60"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch">
          {primary.map(({ id, label, Icon, badge }) => (
            <button key={id}
              onClick={() => { setTab(id); setMoreOpen(false) }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative ${
                tab === id && !moreOpen ? 'text-amber-400' : 'text-slate-600 active:text-slate-300'
              }`}>
              {tab === id && !moreOpen && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-full" />
              )}
              <span className="relative">
                <Icon size={19} />
                {badge && <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: '0 0 5px #f59e0b' }} />}
              </span>
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
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
            <span className="text-[10px] font-bold tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-30"
          onClick={() => setMoreOpen(false)}>
          <div
            className="tl-darkchrome absolute inset-x-0 bg-[#08080f] border-t border-slate-800/60 p-4 pb-2 shadow-2xl"
            style={{ bottom: `calc(56px + env(safe-area-inset-bottom))` }}
            onClick={e => e.stopPropagation()}>
            {/* Grouped the same way as the desktop sidebar, so the two navs
                teach the same map of the app rather than two different ones. */}
            <div className="max-h-[58vh] overflow-y-auto pb-2 space-y-3">
              {NAV_GROUPS.map(group => {
                // Flatten parents with their children — on mobile there is no
                // sub-tab strip, so every destination must be reachable here.
                const ids = group.items.flatMap(i => [i.id, ...(i.children ?? [])])
                          .filter(id => !MOBILE_PRIMARY.includes(id))
                if (!ids.length) return null
                return (
                  <div key={group.title || 'root'}>
                    {group.title && (
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 mb-2 px-1">{group.title}</p>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {ids.map(id => {
                        const { label, Icon } = tabMeta(id)
                        return (
                          <button key={id}
                            onClick={() => { setTab(id); setMoreOpen(false) }}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${
                              tab === id
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                                : 'border-slate-800/60 bg-slate-900/50 text-slate-500 active:text-slate-200 active:border-slate-600'
                            }`}>
                            <Icon size={17} />
                            <span className="text-[10px] font-bold">{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Shown briefly while a code-split tab's JS loads.
function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center gap-3">
      <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      <span className="text-[13px] text-[var(--text-faint)] font-medium">Loading…</span>
    </div>
  )
}

export default function App() {
  // Checked here rather than inside RootApp so no hook is skipped by the branch.
  if (DEV_SHELL) return <AppShell />
  return <RootApp />
}

// Dev-only shell bypass at ?app. The whole app sits behind a licence key, so
// there is otherwise no way to open a tool locally (no Supabase env → no login).
// import.meta.env.DEV is the literal false in a production build, so this branch
// is dead code there and cannot be used to skip auth.
const DEV_SHELL =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('app')

function RootApp() {
  const { user, loading: authLoading, signOut, attach: attachAuth } = useAuth()
  const [synced, setSynced] = useState(false)
  const [view,   setView]   = useState<View>('landing')
  const prevUserRef = useRef(user)

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setSynced(true); return }
    if (authLoading) return
    if (!user) { setSynced(true); return }
    import('./lib/dataSync')
      .then(({ syncOnLogin }) => syncOnLogin(user.id))
      // Never strand the app on the loading spinner if the chunk or sync fails.
      .catch(() => {})
      .finally(() => setSynced(true))
  }, [user, authLoading])

  // After successful login → go straight to app
  // After sign-out → back to landing
  useEffect(() => {
    if (!prevUserRef.current && user) setView('app')
    if (prevUserRef.current && !user)  setView('landing')
    prevUserRef.current = user
  }, [user])

  // Landing and login keep the long SEO title from index.html; AppShell owns
  // the per-tool title while the app is open.
  useEffect(() => {
    if (view !== 'app') document.title = 'Trading Lab — ICT · SMC · Futures Workspace | Chronic Trading'
  }, [view])

  if (authLoading || !synced) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)] gap-3">
        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <span className="text-[13px] text-[var(--text-dim)] font-medium">Loading…</span>
      </div>
    )
  }

  if (view === 'login') {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-[var(--bg)] gap-3">
          <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-[13px] text-[var(--text-dim)] font-medium">Loading…</span>
        </div>
      }>
        <LoginScreen onBack={() => setView('landing')} />
      </Suspense>
    )
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
      // attachAuth before showing the login screen: a signed-out visitor never
      // loaded the Supabase client, so the session listener has to be started
      // here for a successful sign-in to actually navigate into the app.
      onSignIn={() => { attachAuth(); setView('login') }}
      onLaunch={user ? () => setView('app') : undefined}
    />
  )
}

function AppShell({ signOut, userEmail }: { signOut?: () => void; userEmail?: string }) {
  const [tab,          setTab]          = useState<Tab>('home')
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
  const { theme, toggle }               = useTheme()

  // Browser tab reads the current tool ("Journal — Trading Lab"), so multiple
  // open tabs and the history menu are tellable apart.
  useEffect(() => {
    const label = tabs.find(t => t.id === tab)?.label
    document.title = label ? `${label} — Trading Lab` : 'Trading Lab'
  }, [tab])

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
    <div className="flex flex-col h-screen bg-[var(--bg)] overflow-hidden">
      <header className="relative flex-shrink-0 bg-[var(--bg-elev)] border-b border-[var(--border)] shadow-[0_6px_20px_-14px_rgba(74,58,28,0.22)] z-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="relative flex items-center px-4 md:px-6 h-12 md:h-16 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/25">
              <FlaskConical size={13} className="text-white md:hidden" />
              <FlaskConical size={17} className="text-white hidden md:block" />
            </div>
            <div>
              <p className="text-[12px] md:text-[15px] font-black tracking-widest text-[var(--text)] leading-none">TRADING LAB</p>
              <p className="hidden md:block text-[10px] font-bold text-[var(--text-faint)] tracking-[0.15em] mt-0.5">ICT · SMC · FUTURES</p>
            </div>
          </div>

          {/* Desktop clock — only once it actually fits. The logo and the nine
              utility buttons leave the clock a slot of (viewport - 1150)px, and the
              clock needs 410px, so it only fits from ~1560px up. Below that it used
              to wrap: "Next Macro" broke onto four lines and clipped against the
              header edge. Anything narrower gets the compact clock row instead. */}
          <div className="hidden min-[1560px]:flex flex-1 justify-center items-center min-w-0">
            <KillZoneClock />
          </div>
          {/* Keeps the utility buttons right-aligned once the clock is hidden */}
          <div className="flex-1 min-[1560px]:hidden" />

          {/* Desktop: full utility buttons */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <a href="https://chronic-trading.github.io/ict-replay/" target="_blank" rel="noopener noreferrer" title="ICT Replay Trainer" className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/8 transition-all"><Crosshair size={12} /><span className="hidden xl:inline">Trainer</span></a>
            <a href="https://chronic-trading.github.io/ict-glossary/" target="_blank" rel="noopener noreferrer" title="ICT Glossary" className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-teal-500/40 hover:text-teal-400 hover:bg-teal-500/8 transition-all"><BookOpen size={12} /><span className="hidden xl:inline">Glossary</span></a>
            <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
            <button onClick={() => setDrawdownOpen(true)}  title="Guard"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/8 transition-all"><ShieldAlert size={12} /><span className="hidden xl:inline">Guard</span></button>
            <button onClick={() => setMindsetOpen(true)}   title="Mindset"  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/8 transition-all"><Smile size={12} /><span className="hidden xl:inline">Mindset</span></button>
            <button onClick={() => setPropsOpen(true)}     title="Props"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all"><Building2 size={12} /><span className="hidden xl:inline">Props</span></button>
            <button onClick={() => setQuizOpen(true)}      title="Quiz"     className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-purple-500/40 hover:text-purple-400 hover:bg-purple-500/8 transition-all"><Brain size={12} /><span className="hidden xl:inline">Quiz</span></button>
            <button onClick={() => setRulesOpen(true)}     title="Rules"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"><Shield size={12} /><span className="hidden xl:inline">Rules</span></button>
            <button onClick={() => setNotesOpen(true)}     title="Notes"    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/8 transition-all"><StickyNote size={12} /><span className="hidden xl:inline">Notes</span></button>
            <button onClick={toggle} title={theme === 'light' ? 'Switch to dark' : 'Switch to light'} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--accent-ring)] hover:text-[var(--accent-ink)] hover:bg-[var(--accent-soft)] transition-all">{theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}</button>
            <button onClick={() => setSettingsOpen(true)}  title="Settings" className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all"><Settings size={12} /><span className="hidden xl:inline">Settings</span></button>
            {signOut && (
              <button onClick={signOut} title={userEmail ?? 'Sign out'} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"><LogOut size={12} /><span className="hidden xl:inline">Sign out</span></button>
            )}
          </div>

          {/* Mobile: just the ⋮ tools button — clock gets its own row below */}
          <div className="flex md:hidden items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMobileToolsOpen(o => !o)}
              className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                mobileToolsOpen ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'border-[var(--border)] text-[var(--text-dim)]'
              }`}>
              {mobileToolsOpen ? <X size={14} /> : <MoreVertical size={14} />}
            </button>
          </div>
        </div>

        {/* Mobile tools sheet */}
        {mobileToolsOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-elev)] px-4 py-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Guard',    Icon: ShieldAlert, color: 'text-orange-400', onClick: () => { setDrawdownOpen(true);  setMobileToolsOpen(false) } },
                { label: 'Mindset',  Icon: Smile,       color: 'text-violet-400', onClick: () => { setMindsetOpen(true);   setMobileToolsOpen(false) } },
                { label: 'Props',    Icon: Building2,   color: 'text-emerald-400',onClick: () => { setPropsOpen(true);     setMobileToolsOpen(false) } },
                { label: 'Quiz',     Icon: Brain,       color: 'text-purple-400', onClick: () => { setQuizOpen(true);      setMobileToolsOpen(false) } },
                { label: 'Rules',    Icon: Shield,      color: 'text-red-400',    onClick: () => { setRulesOpen(true);     setMobileToolsOpen(false) } },
                { label: 'Notes',    Icon: StickyNote,  color: 'text-amber-400',  onClick: () => { setNotesOpen(true);     setMobileToolsOpen(false) } },
                { label: 'Settings', Icon: Settings,    color: 'text-[var(--text-dim)]',  onClick: () => { setSettingsOpen(true);  setMobileToolsOpen(false) } },
                { label: 'Trainer',  Icon: Crosshair,   color: 'text-cyan-400',   onClick: () => { window.open('https://chronic-trading.github.io/ict-replay/', '_blank');   setMobileToolsOpen(false) } },
                { label: 'Glossary', Icon: BookOpen,    color: 'text-teal-400',   onClick: () => { window.open('https://chronic-trading.github.io/ict-glossary/', '_blank'); setMobileToolsOpen(false) } },
                { label: theme === 'light' ? 'Dark' : 'Light', Icon: theme === 'light' ? Moon : Sun, color: 'text-[var(--accent-ink)]', onClick: () => { toggle(); setMobileToolsOpen(false) } },
                ...(signOut ? [{ label: 'Sign out', Icon: LogOut, color: 'text-red-400', onClick: () => { signOut(); setMobileToolsOpen(false) } }] : []),
              ].map(({ label, Icon, color, onClick }) => (
                <button key={label} onClick={onClick}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all active:border-[var(--border-strong)]">
                  <Icon size={16} className={color} />
                  <span className={`text-[10px] font-bold ${color}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Compact clock row — used below 1560px, where the full clock can't share
            the header row with the logo + utility buttons. */}
        <div className="min-[1560px]:hidden flex items-center px-4 pb-2 pt-0.5 gap-2">
          <KillZoneClockCompact />
        </div>

      </header>

      {/* Shell body — grouped sidebar on desktop, full-width content on mobile */}
      <div className="flex-1 flex overflow-hidden">

        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col flex-shrink-0 w-[188px] overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-elev)] py-3 px-2.5 gap-0.5">
          {NAV_GROUPS.map(group => (
            <div key={group.title || 'root'} className={group.title ? 'mt-3' : ''}>
              {group.title && (
                <p className="tl-eyebrow px-2.5 pb-1.5">{group.title}</p>
              )}
              {group.items.map(item => {
                const { label, Icon, badge } = tabMeta(item.id)
                // A parent stays lit while one of its children is open, so the
                // sidebar always shows where you are.
                const active = tab === item.id || !!item.children?.includes(tab)
                return (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl text-[12.5px] font-semibold transition-all relative
                      ${active
                        ? 'text-[var(--accent-ink)] bg-[var(--accent-soft)]'
                        : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                    <Icon size={14} className="flex-shrink-0" />
                    <span className="truncate">{label}</span>
                    {badge && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Main content — extra bottom padding on mobile for the bottom nav */}
        <main ref={mainRef} className="flex-1 flex flex-col overflow-hidden md:pb-0 pb-14">

          {/* Sub-tab strip — only for a destination that has children */}
          {(() => {
            const parent = parentOf(tab)
            if (!parent.children?.length) return null
            const siblings: Tab[] = [parent.id, ...parent.children]
            return (
              <div className="flex-shrink-0 flex items-center gap-1 px-4 md:px-6 pt-3 border-b border-[var(--border)]">
                {siblings.map(id => {
                  const { label, Icon } = tabMeta(id)
                  return (
                    <button key={id} onClick={() => setTab(id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold border-b-2 -mb-px transition-all
                        ${tab === id
                          ? 'text-[var(--accent-ink)] border-[var(--accent)]'
                          : 'text-[var(--text-dim)] border-transparent hover:text-[var(--text)]'}`}>
                      <Icon size={12} />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            )
          })()}

        <div key={tab} className="flex-1 flex flex-col overflow-hidden animate-tab-in">
        <Suspense fallback={<PageFallback />}>
        {tab === 'home'      && <Home      onNavigate={t => setTab(t as Tab)} />}
        {tab === 'builder'   && <Builder   initialBuild={loadedBuild} />}
        {tab === 'grader'    && <TradeGrader />}
        {tab === 'chart'     && <Chart />}
        {tab === 'map'       && <ConceptMap />}
        {tab === 'review'    && <Review />}
        {tab === 'plan'      && <Plan />}
        {tab === 'journal'   && <Journal />}
        {tab === 'calendar'  && <Calendar />}
        {tab === 'templates' && <Templates onLoad={handleLoadBuild} />}
        {tab === 'builds'    && <MyBuilds  onLoadBuild={handleLoadBuild} />}
        {tab === 'recap'     && <RecapPage />}
        {tab === 'playbook'  && <Playbook />}
        {tab === 'backtest'  && <BacktestPage />}
        {tab === 'arcade'    && <Arcade />}
        </Suspense>
        </div>
        </main>
      </div>

      {/* Mounted whether or not it's open: SessionNotes owns an AnimatePresence
          exit animation and persists the note from an effect, both of which are
          lost if the component is unmounted on close. The lazy import alone is
          what keeps it out of the entry chunk. */}
      <Suspense fallback={null}>
        <SessionNotes open={notesOpen} onClose={() => setNotesOpen(false)} />
      </Suspense>
      <TradingRules  open={rulesOpen}    onClose={() => setRulesOpen(false)} />
      {quizOpen && (
        <Suspense fallback={null}>
          <QuizModal open onClose={() => setQuizOpen(false)} />
        </Suspense>
      )}
      {/* Also always-mounted — SettingsModal animates on exit too. */}
      <Suspense fallback={null}>
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </Suspense>
      <DrawdownGuard open={drawdownOpen} onClose={() => setDrawdownOpen(false)} />
      <MindsetCheck  open={mindsetOpen}  onClose={() => setMindsetOpen(false)} />

      {/* Mobile bottom nav */}
      <MobileBottomNav tab={tab} setTab={setTab} />

      {/* Prop Firms modal */}
      {propsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-emerald-400" />
              <span className="text-[13px] font-bold text-[var(--text)]">Prop Firm Compare</span>
            </div>
            <button onClick={() => setPropsOpen(false)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all">
              <X size={12} strokeWidth={2.5} /> Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<PageFallback />}>
              <PropFirms />
            </Suspense>
          </div>
        </div>
      )}

    </div>
  )
}
