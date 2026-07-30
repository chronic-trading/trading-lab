import { Gauge, Check, TrendingUp } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

/**
 * Dev-only style preview — the editorial design system on one page.
 *
 * Most of the app sits behind auth, which makes visual checks during a restyle
 * awkward: you cannot see a card or a page header without signing in. This
 * renders the primitives (display type, page head, cards, figures, controls)
 * against both themes so a change can be judged immediately.
 *
 * Mounted only when import.meta.env.DEV is true, so it is impossible to reach
 * in a production build — see main.tsx.
 */
export function StylePreview() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        <div className="flex items-end justify-between gap-4 tl-page-head">
          <div>
            <div className="tl-eyebrow mb-1.5">Design system</div>
            <h1 className="tl-title">The editorial layer.</h1>
            <p className="text-[13px] text-[var(--text-dim)] mt-2 max-w-md leading-relaxed">
              Every primitive the restyle is built from, in the current theme.
            </p>
          </div>
          <button onClick={toggle}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-[12px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all">
            Theme: {theme}
          </button>
        </div>

        {/* Type scale */}
        <section className="space-y-3">
          <div className="tl-eyebrow">Type</div>
          <p className="tl-title">Score it before you risk it.</p>
          <p className="text-[13px] text-[var(--text)] max-w-lg leading-relaxed">
            Body copy is Inter at 13px — the app is data-dense, and a display serif
            loses to it badly at this size. The serif is reserved for titles and the
            single hero figure on a page.
          </p>
          <p className="text-[13px] text-[var(--text-dim)] max-w-lg leading-relaxed">
            Dim tier, for supporting copy that should recede without failing contrast.
          </p>
          <p className="text-[11px] text-[var(--text-faint)]">Faint tier — hints and metadata only.</p>
        </section>

        {/* Cards + the grade hero */}
        <section className="space-y-3">
          <div className="tl-eyebrow">Cards</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="tl-card p-6 text-center md:col-span-1">
              <p className="tl-display leading-none" style={{ fontSize: '68px', color: 'var(--green)' }}>A+</p>
              <p className="text-[11px] text-[var(--text-dim)] mt-1.5 uppercase tracking-[0.2em] font-semibold">
                Score <span className="tl-figure text-[var(--text)]">92</span> / 100
              </p>
              <p className="tl-display text-[21px] text-[var(--text)] mt-5">Take the trade.</p>
              <p className="text-[12px] text-[var(--text-dim)] leading-relaxed mt-2">
                Every essential factor is present and the risk is defined.
              </p>
            </div>

            <div className="tl-card p-5 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Confluence</span>
                <span className="text-[10px] text-[var(--text-faint)] font-semibold">3/4 checked</span>
              </div>
              {[
                { label: 'HTF bias aligned', on: true },
                { label: 'Liquidity swept before entry', on: true },
                { label: 'FVG / order block at entry', on: true },
                { label: 'Entry inside the kill zone', on: false },
              ].map(f => (
                <div key={f.label}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    f.on ? 'border-transparent bg-[var(--green)]' : 'border-[var(--border-strong)]'
                  }`}>
                    {f.on && <Check size={13} className="text-[var(--surface)]" strokeWidth={3} />}
                  </span>
                  <span className={`text-[13px] ${f.on ? 'text-[var(--text)] font-medium' : 'text-[var(--text-dim)]'}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Figures */}
        <section className="space-y-3">
          <div className="tl-eyebrow">Figures</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: 'Win rate', v: '58.3%', c: 'var(--green)' },
              { k: 'Avg R',    v: '+1.84', c: 'var(--green)' },
              { k: 'Drawdown', v: '-4.2%', c: 'var(--red)'   },
              { k: 'Trades',   v: '127',   c: 'var(--text)'  },
            ].map(s => (
              <div key={s.k} className="tl-card p-4">
                <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold">{s.k}</p>
                <p className="tl-figure text-[24px] font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Controls */}
        <section className="space-y-3">
          <div className="tl-eyebrow">Controls</div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] text-[#2c2720]"
              style={{ background: 'var(--accent)' }}>
              <Gauge size={15} /> Primary action
            </button>
            <button className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[13px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all">
              Secondary
            </button>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
              <TrendingUp size={12} /> Long
            </span>
            <input placeholder="Price"
              className="tl-figure w-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-[12px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)]" />
          </div>
        </section>

        <section className="space-y-3">
          <div className="tl-eyebrow">Surfaces</div>
          <div className="flex flex-wrap gap-3">
            {['--bg', '--bg-elev', '--surface', '--surface-2', '--surface-hover'].map(t => (
              <div key={t} className="rounded-xl border border-[var(--border)] px-4 py-3" style={{ background: `var(${t})` }}>
                <span className="text-[11px] font-mono text-[var(--text-dim)]">{t}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
