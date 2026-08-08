import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import {
  FlaskConical, Package, Beaker, Network,
  LayoutTemplate, BookOpen, LineChart, StickyNote,
  Shield, ClipboardCheck, Brain, CalendarDays, Settings, LogOut, BarChart2, Building2,
  ShieldAlert, Smile, GraduationCap, Crosshair, Grid3X3, X,
  Gamepad2, Layers, Sun, Moon, Gauge, LayoutDashboard, Search,
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
import { PageSkeleton, ChartSkeleton } from './components/Skeleton'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineBanner } from './components/OfflineBanner'
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
// Loaded on first ⌘K rather than with the shell — it pulls the concept dataset
// in to make concepts searchable, which is a big chunk to pay for up front.
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })))
import type { Command } from './components/CommandPalette'
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

/** Search aliases for the command palette — see the keywords note where used. */
const TAB_ALIASES: Partial<Record<Tab, string>> = {
  home:      'today dashboard overview sessions',
  builder:   'build model setup concepts',
  grader:    'grade score confluence trade',
  map:       'concept map graph network',
  review:    'spaced repetition mastery drill flashcards',
  journal:   'trades log analytics equity',
  backtest:  'replay backtest practice bar by bar',
  recap:     'montage share export csv',
  playbook:  'lessons setups course learn',
  plan:      'session plan risk checklist',
  chart:     'key levels price',
  calendar:  'economic news events red folder',
  templates: 'starter presets models',
  builds:    'saved builds my builds',
  arcade:    'game practice tape reading',
}

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

type MobileTool = { label: string; Icon: React.ElementType; color: string; onClick: () => void }

// Mobile bottom nav.
//
// This sheet is the *only* menu on mobile. Pages and utility tools used to live
// in two separate ones — pages under this More button, tools under a ⋮ in the
// top-right corner — so "where is Notes?" had two places to look and no way to
// tell which. Worse, the top-right corner is the hardest point on a phone to
// reach one-handed, and Search existed only there and on ⌘K, so on a touch
// device it was unreachable entirely. Everything now hangs off the thumb.
function MobileBottomNav({
  tab, setTab, tools, onSearch,
}: {
  tab: Tab
  setTab: (t: Tab) => void
  tools: MobileTool[]
  onSearch: () => void
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const primary   = tabs.filter(t => MOBILE_PRIMARY.includes(t.id))
  const secondary = tabs.filter(t => !MOBILE_PRIMARY.includes(t.id))
  const moreActive = secondary.some(t => t.id === tab)

  return (
    <>
      {/* Bottom bar */}
      {/* Warm charcoal, matching the dark theme's surfaces. These were cold
          blue-blacks (#06060d / #08080f) chosen against the old cold palette;
          left alone they now read blue against the warm app behind them. The
          bar stays dark-locked in both themes by design — it's chrome, not a
          surface — so the values are literals rather than tokens. */}
      <nav className="tl-darkchrome md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d0b09]/95 backdrop-blur-md border-t border-white/8"
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
          /* The scrim was fully transparent, so the sheet had nothing to sit
             against and the page behind it stayed at full contrast. */
          className="tl-scrim-in md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMoreOpen(false)}>
          <div
            className="tl-sheet-in tl-darkchrome absolute inset-x-0 bg-[#16130f] border-t border-white/8 p-4 pb-2 shadow-2xl"
            style={{ bottom: `calc(56px + env(safe-area-inset-bottom))` }}
            onClick={e => e.stopPropagation()}>
            {/* Grouped the same way as the desktop sidebar, so the two navs
                teach the same map of the app rather than two different ones. */}
            <div className="max-h-[62vh] overflow-y-auto pb-2 space-y-3">
              {/* Search leads: it reaches any tab or tool in one tap, and it had
                  no mobile affordance at all before — ⌘K needs a keyboard. */}
              <button
                onClick={() => { onSearch(); setMoreOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3.5 min-h-[44px] rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 active:border-white/25 active:text-white transition-all">
                <Search size={16} />
                <span className="text-[13px] font-semibold">Search everything</span>
              </button>

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
                                : 'border-white/8 bg-white/[0.04] text-slate-400 active:text-slate-200 active:border-white/20'
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

              {/* Utility tools — modals and external links rather than tabs, so
                  they get their own group instead of sitting among the pages. */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 mb-2 px-1">Tools</p>
                <div className="grid grid-cols-4 gap-2">
                  {tools.map(({ label, Icon, color, onClick }) => (
                    <button key={label}
                      onClick={() => { onClick(); setMoreOpen(false) }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-white/8 bg-white/[0.04] text-slate-400 active:text-slate-200 active:border-white/20 transition-all">
                      <Icon size={17} className={color} />
                      <span className="text-[10px] font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Shown briefly while a code-split tab's JS loads.
/**
 * Full-screen boot state, for session restore and the login chunk. This markup
 * was duplicated verbatim in two places; one copy means they cannot drift.
 * role="status" so the wait is announced rather than being a silent blank.
 */
function BootSplash() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg)] gap-3" role="status" aria-live="polite">
      <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      <span className="text-[13px] text-[var(--text-dim)] font-medium">Loading…</span>
    </div>
  )
}

/**
 * The column width each page centres its content in. The skeleton has to match
 * the page it is standing in for, or the header and first cards jump sideways
 * the moment the real page arrives — which is more distracting than the spinner
 * this replaced. Pages absent from this map get the default.
 */
const PAGE_WIDTH: Partial<Record<Tab, string>> = {
  home: 'max-w-6xl', templates: 'max-w-6xl', grader: 'max-w-6xl',
  journal: 'max-w-5xl', calendar: 'max-w-5xl',
  plan: 'max-w-3xl',
  review: 'max-w-2xl',
}

/** Tabs that are one large canvas rather than a column of cards. */
const CHART_TABS: Tab[] = ['backtest', 'chart']

function PageFallback({ tab }: { tab: Tab }) {
  if (CHART_TABS.includes(tab)) return <ChartSkeleton />
  // Review is a single flashcard, not a feed; Map and Arcade are canvases with
  // no stats strip. Anything else gets the standard header + stats + cards.
  const bare = tab === 'map' || tab === 'arcade'
  return (
    <PageSkeleton
      maxWidth={PAGE_WIDTH[tab] ?? 'max-w-5xl'}
      stats={bare ? 0 : 3}
      cards={tab === 'review' ? 1 : 3}
    />
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

/** How long to wait for the first data sync before opening the app anyway. */
const SYNC_TIMEOUT_MS = 8000

function RootApp() {
  const { user, loading: authLoading, signOut, attach: attachAuth } = useAuth()
  const [synced, setSynced] = useState(false)
  const [view,   setView]   = useState<View>('landing')
  const prevUserRef = useRef(user)

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setSynced(true); return }
    if (authLoading) return
    if (!user) { setSynced(true); return }

    // Offline there is nothing to sync with, and every request would fail
    // slowly. Local data is already complete, so open the app immediately.
    if (navigator.onLine === false) { setSynced(true); return }

    // Backstop for the case this gate did not previously cover: online, but the
    // server unreachable. useAuth races its own timeout for exactly this reason
    // — a paused Supabase project (which this one has done) or a captive portal
    // leaves the request neither resolving nor rejecting, and without a race
    // `finally` never runs and the app sits on the boot splash indefinitely.
    // The sync is best-effort anyway: local data is the source of truth here.
    const timeout = new Promise<void>(resolve => setTimeout(resolve, SYNC_TIMEOUT_MS))

    Promise.race([
      import('./lib/dataSync').then(({ syncOnLogin }) => syncOnLogin(user.id)),
      timeout,
    ])
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

  // Boot: session restore and the first data sync. A skeleton would be wrong
  // here — there is no layout yet to hold a place for, and this is the one
  // moment the app has nothing at all to show.
  if (authLoading || !synced) return <BootSplash />

  if (view === 'login') {
    return (
      <Suspense fallback={<BootSplash />}>
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
  const [paletteOpen,   setPaletteOpen]   = useState(false)
  const [focusConcept,  setFocusConcept]  = useState<string | null>(null)
  const { loadSharedBuild }             = useBuilds()
  const { theme, toggle }               = useTheme()

  // Browser tab reads the current tool ("Journal — Trading Lab"), so multiple
  // open tabs and the history menu are tellable apart.
  useEffect(() => {
    const label = tabs.find(t => t.id === tab)?.label
    document.title = label ? `${label} — Trading Lab` : 'Trading Lab'
  }, [tab])

  // ⌘K / Ctrl-K opens the palette from anywhere. Ignored while typing so the
  // shortcut can't hijack a keystroke inside the journal's notes field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return
      const el = document.activeElement
      const typing = el instanceof HTMLElement &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing && !paletteOpen) return
      e.preventDefault()
      setPaletteOpen(o => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen])

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

  // Every destination and utility as one searchable list. Concepts are added
  // lazily by the palette itself — see conceptCommands below.
  const commands: Command[] = [
    ...tabs.map(t => ({
      id: `go:${t.id}`,
      label: t.label,
      section: 'Go to',
      // The sidebar labels are deliberately terse ("Map", "Levels"), which makes
      // them poor search targets on their own — nobody types "map" looking for
      // the concept graph. These are the words people actually reach for.
      keywords: `${TAB_ALIASES[t.id] ?? ''} ${parentOf(t.id).id !== t.id ? tabMeta(parentOf(t.id).id).label : ''}`,
      Icon: t.Icon,
      run: () => setTab(t.id),
    })),
    { id: 'tool:notes',    label: 'Session notes',   section: 'Tools', Icon: StickyNote,  run: () => setNotesOpen(true) },
    { id: 'tool:rules',    label: 'Trading rules',   section: 'Tools', Icon: Shield,      run: () => setRulesOpen(true) },
    { id: 'tool:quiz',     label: 'Concept quiz',    section: 'Tools', Icon: Brain,       run: () => setQuizOpen(true) },
    { id: 'tool:guard',    label: 'Drawdown guard',  section: 'Tools', Icon: ShieldAlert, run: () => setDrawdownOpen(true) },
    { id: 'tool:mindset',  label: 'Mindset check',   section: 'Tools', Icon: Smile,       run: () => setMindsetOpen(true) },
    { id: 'tool:props',    label: 'Prop firm compare', section: 'Tools', Icon: Building2, run: () => setPropsOpen(true) },
    { id: 'tool:settings', label: 'Settings',        section: 'Tools', Icon: Settings,    run: () => setSettingsOpen(true) },
    {
      id: 'tool:theme',
      label: theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode',
      section: 'Tools', keywords: 'theme appearance dark light',
      Icon: theme === 'light' ? Moon : Sun,
      run: toggle,
    },
  ]

  const handleLoadBuild = (build: Build) => {
    setLoadedBuild(build)
    setTab('builder')
  }

  return (
    /* reducedMotion="user" makes every motion component in the app honour the
       OS "reduce motion" setting. index.css already had a
       prefers-reduced-motion block, but that only governs CSS transitions and
       animations — framer-motion writes inline transforms from JS, so all
       sixteen animated files ignored it and still played at full amplitude for
       users who had explicitly asked for less. Transforms are dropped and
       opacity fades are kept, which is the documented behaviour and the right
       trade: the interface stays legible without the movement. */
    <MotionConfig reducedMotion="user">
    {/* h-screen is 100vh, which on iOS Safari means the height with the address
        bar hidden — so the app is taller than the visible area and the bottom of
        every page sits under the browser chrome. h-[100dvh] tracks the viewport
        as that bar collapses. Both classes are kept: a browser without dvh drops
        the invalid declaration and falls back to 100vh. */}
    <div className="flex flex-col h-screen h-[100dvh] bg-[var(--bg)] overflow-hidden">
      {/* tl-safe-top/x: with viewport-fit=cover the page now extends under the
          notch and the rounded corners, so the header has to inset itself or the
          logo sits behind the camera cutout on an iPhone. */}
      <header className="tl-safe-top tl-safe-x relative flex-shrink-0 bg-[var(--bg-elev)] border-b border-[var(--border)] shadow-[0_6px_20px_-14px_rgba(74,58,28,0.22)] z-20">
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
            {/* The search affordance carries the shortcut, so ⌘K is discoverable
                rather than something you have to already know about. */}
            <button onClick={() => setPaletteOpen(true)} title="Search (⌘K)"
              className="flex items-center gap-2 text-[11px] font-semibold pl-2.5 pr-2 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-all">
              <Search size={12} />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden lg:inline text-[10px] font-semibold border border-[var(--border)] rounded-md px-1 py-px leading-none">⌘K</kbd>
            </button>
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

          {/* No mobile utility menu here any more. It used to be a ⋮ in this
              corner — the furthest point from a right thumb, and a second place
              to hunt for things. Tools now live in the bottom nav's More sheet
              alongside the pages. */}
        </div>

        {/* Compact clock row — used below 1560px, where the full clock can't share
            the header row with the logo + utility buttons. */}
        <div className="min-[1560px]:hidden flex items-center px-4 pb-2 pt-0.5 gap-2">
          <KillZoneClockCompact />
        </div>

      </header>

      {/* Directly under the header so it is the first thing read, and outside
          the scroll area so it cannot be scrolled away while still true. */}
      <OfflineBanner />

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
        {/* tl-main-pad: the bottom nav is 56px PLUS the home-indicator inset,
            which is only non-zero now that viewport-fit=cover is set. A flat
            pb-14 left the last row of content behind the indicator on an
            iPhone. Scoped to phones in CSS — an inline style would out-specify
            md:pb-0 and pad the desktop layout too. */}
        {/* No key/animation here: the inner <div key={tab}> below already
            carries .animate-tab-in, and the effect on [tab] already resets
            scroll. Keying this element too would remount the whole subtree —
            Suspense boundary included — and run a second, nested entrance. */}
        <main ref={mainRef} className="tl-main-pad flex-1 flex flex-col overflow-hidden md:pb-0">

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
        {/* Per-tab boundary. The only one was at the root, so a single lazy
            chunk failing to fetch — a tunnel, a lift, patchy signal — replaced
            the entire app with a full-screen error and took the nav and every
            other working tab with it. Scoped here, a failed page stays a failed
            page: the shell survives and you can switch tabs or retry. The
            wrapper is already keyed on `tab`, so navigating away resets it. */}
        <ErrorBoundary scope="tab" label={tabMeta(tab).label}>
        <Suspense fallback={<PageFallback tab={tab} />}>
        {tab === 'home'      && <Home      onNavigate={t => setTab(t as Tab)} />}
        {tab === 'builder'   && <Builder   initialBuild={loadedBuild} />}
        {tab === 'grader'    && <TradeGrader />}
        {tab === 'chart'     && <Chart />}
        {tab === 'map'       && <ConceptMap focusConceptId={focusConcept} />}
        {tab === 'review'    && <Review />}
        {tab === 'plan'      && <Plan />}
        {tab === 'journal'   && <Journal />}
        {tab === 'calendar'  && <Calendar />}
        {tab === 'templates' && <Templates onLoad={handleLoadBuild} />}
        {tab === 'builds'    && <MyBuilds  onLoadBuild={handleLoadBuild} onNavigate={t => setTab(t as Tab)} />}
        {tab === 'recap'     && <RecapPage />}
        {tab === 'playbook'  && <Playbook />}
        {tab === 'backtest'  && <BacktestPage />}
        {tab === 'arcade'    && <Arcade />}
        </Suspense>
        </ErrorBoundary>
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

      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette open onClose={() => setPaletteOpen(false)} commands={commands}
            onSelectConcept={id => { setFocusConcept(id); setTab('map') }} />
        </Suspense>
      )}

      {/* Mobile bottom nav */}
      {/* Same tools the desktop header exposes, in the same order, so the two
          layouts teach one map of the app rather than two. */}
      <MobileBottomNav
        tab={tab}
        setTab={setTab}
        onSearch={() => setPaletteOpen(true)}
        tools={[
          { label: 'Guard',    Icon: ShieldAlert, color: 'text-orange-400',        onClick: () => setDrawdownOpen(true) },
          { label: 'Mindset',  Icon: Smile,       color: 'text-violet-400',        onClick: () => setMindsetOpen(true)  },
          { label: 'Props',    Icon: Building2,   color: 'text-emerald-400',       onClick: () => setPropsOpen(true)    },
          { label: 'Quiz',     Icon: Brain,       color: 'text-purple-400',        onClick: () => setQuizOpen(true)     },
          { label: 'Rules',    Icon: Shield,      color: 'text-red-400',           onClick: () => setRulesOpen(true)    },
          { label: 'Notes',    Icon: StickyNote,  color: 'text-amber-400',         onClick: () => setNotesOpen(true)    },
          { label: 'Settings', Icon: Settings,    color: 'text-[var(--text-dim)]', onClick: () => setSettingsOpen(true) },
          { label: 'Trainer',  Icon: Crosshair,   color: 'text-cyan-400',          onClick: () => window.open('https://chronic-trading.github.io/ict-replay/', '_blank') },
          { label: 'Glossary', Icon: BookOpen,    color: 'text-teal-400',          onClick: () => window.open('https://chronic-trading.github.io/ict-glossary/', '_blank') },
          { label: theme === 'light' ? 'Dark' : 'Light', Icon: theme === 'light' ? Moon : Sun, color: 'text-[var(--accent-ink)]', onClick: toggle },
          ...(signOut ? [{ label: 'Sign out', Icon: LogOut, color: 'text-red-400', onClick: signOut }] : []),
        ]}
      />

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
            {/* Already inside a scrolling panel with its own heading, so this
                one skips the page head's stats strip. */}
            <Suspense fallback={<PageSkeleton maxWidth="max-w-5xl" stats={0} cards={4} />}>
              <PropFirms />
            </Suspense>
          </div>
        </div>
      )}

    </div>
    </MotionConfig>
  )
}
