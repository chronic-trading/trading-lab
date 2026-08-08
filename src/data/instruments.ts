import type { Instrument } from '../types'

/**
 * The instruments this app trades, in the order they should be offered.
 *
 * Futures lead because that is what the app actually teaches: all 52 concepts in
 * concepts.ts are tagged ['NQ','ES','GC','SI'], and every prop firm in
 * propData.ts is a futures firm. Three separate pickers had each hardcoded their
 * own forex-only copy of this list, so the backtester and the key-level tool
 * could not select NQ at all on a futures product. One list now feeds them all.
 */
export const INSTRUMENTS: Instrument[] = [
  'NQ', 'ES', 'GC', 'SI',
  'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'NZDUSD',
]

/** Just the futures contracts — the app's primary market. */
export const FUTURES: Instrument[] = ['NQ', 'ES', 'GC', 'SI']

/**
 * Instruments the bundled replay dataset covers. The fetch script
 * (scripts/fetch-market-data.mjs) writes one file per entry here, so this and
 * that script must stay in step — anything listed without a data file just
 * fails to load in the Replay tab.
 */
export const REPLAY_INSTRUMENTS: Instrument[] = ['NQ', 'ES', 'GC', 'SI']

/** Display label — the raw ticker is right for futures, so this is a passthrough
 *  today, but it gives the UI one place to hang "NQ (Nasdaq)" style labels. */
export const INSTRUMENT_LABEL: Partial<Record<Instrument, string>> = {
  NQ: 'NQ', ES: 'ES', GC: 'GC', SI: 'SI',
}
