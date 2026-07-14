import type { Concept } from '../types'

export const concepts: Concept[] = [

  // ─── BASIC ───────────────────────────────────────────────────────────────

  {
    id: 'market-structure',
    name: 'Market Structure (BOS / CHoCH)',
    shortName: 'Market Structure',
    tier: 'basic',
    category: 'structure',
    description:
      'The backbone of every ICT read. Break of Structure (BOS) confirms continuation — price takes out a prior swing high/low in the direction of trend. Change of Character (CHoCH) signals a potential reversal — price violates the most recent opposing swing, suggesting smart money is shifting direction.',
    howToUse:
      'Mark your swing highs and lows on the relevant timeframe. A BOS tells you to stay in trend direction. A CHoCH tells you to start looking for the opposing PD array to load into.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['BOS', 'CHoCH', 'swing', 'trend', 'reversal'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'Structure and liquidity define each other — BOS happens because liquidity above/below was taken.' },
      { conceptId: 'fvg', strength: 2, note: 'After a BOS, price often leaves an FVG that becomes the first draw back into.' },
      { conceptId: 'order-block', strength: 2, note: 'The last OB before a BOS is the key retracement level.' },
      { conceptId: 'daily-bias', strength: 2, note: 'HTF market structure sets the bias for intraday reads.' },
      { conceptId: 'displacement', strength: 2, note: 'Displacement is what causes a valid BOS/CHoCH.' },
    ],
  },
  {
    id: 'liquidity',
    name: 'Liquidity (BSL / SSL)',
    shortName: 'Liquidity',
    tier: 'basic',
    category: 'liquidity',
    description:
      'Price is a hunt for liquidity. Buy-Side Liquidity (BSL) rests above swing highs and equal highs — where retail buy-stop orders cluster. Sell-Side Liquidity (SSL) rests below swing lows and equal lows — where retail sell-stop orders cluster. Smart money needs this liquidity to fill institutional-sized positions.',
    howToUse:
      'Identify where stops are resting. If you\'re bullish, look for SSL to be swept first before the real move up. On NQ especially, equal highs and lows get taken with precision before reversals.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['BSL', 'SSL', 'stops', 'sweep', 'equal highs', 'equal lows'],
    synergies: [
      { conceptId: 'market-structure', strength: 3, note: 'Liquidity raids are what form BOS and CHoCH — they\'re inseparable.' },
      { conceptId: 'inducement', strength: 3, note: 'Inducement IS liquidity being used as a trap before the real move.' },
      { conceptId: 'judas-swing', strength: 3, note: 'Judas swing hunts one side of liquidity to deliver into the other.' },
      { conceptId: 'order-block', strength: 2, note: 'Price sweeps liquidity then returns to an OB to reverse from.' },
      { conceptId: 'amd', strength: 2, note: 'Manipulation phase of AMD is specifically a liquidity raid.' },
    ],
  },
  {
    id: 'equal-highs-lows',
    name: 'Equal Highs & Lows (EQH / EQL)',
    shortName: 'EQH / EQL',
    tier: 'basic',
    category: 'liquidity',
    description:
      'When price forms two or more highs (or lows) at the same level, a pool of resting orders builds directly above (buy stops) or below (sell stops). These are magnets. The algorithm targets equal highs and lows with high precision because the liquidity density there is predictable — retail traders see "double top / double bottom" and enter early, placing their stops right where smart money needs to go.',
    howToUse:
      'Mark any area where price has tagged the same level twice or more. Above equal highs = BSL target. Below equal lows = SSL target. On NQ especially, EQH/EQL formed overnight or in the prior session are primary targets for the NY AM kill zone. Don\'t fade them — let price take them and then look for the reversal from a PD array on the other side.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['EQH', 'EQL', 'double top', 'double bottom', 'buy stops', 'sell stops', 'BSL', 'SSL'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'EQH/EQL are the most visible and traded form of liquidity — they\'re the same concept at a specific price structure.' },
      { conceptId: 'inducement', strength: 3, note: 'EQH/EQL are the classic inducement setup — retail sees the pattern, enters, and gets stopped out.' },
      { conceptId: 'market-structure', strength: 2, note: 'A BOS through EQH/EQL is the cleanest, most telegraphed structural break in ICT.' },
      { conceptId: 'judas-swing', strength: 2, note: 'Judas swings frequently run straight into EQH or EQL before reversing.' },
      { conceptId: 'engineered-liquidity', strength: 3, note: 'EQH/EQL are the most common form of engineered liquidity — deliberately created to build stop orders.' },
    ],
  },
  {
    id: 'fvg',
    name: 'Fair Value Gap (FVG)',
    shortName: 'FVG',
    tier: 'basic',
    category: 'entry',
    description:
      'A three-candle pattern where the wicks of candle 1 and candle 3 don\'t overlap, leaving an imbalance in price. This gap represents price delivering too fast for the market to reach fair value — institutions leave orders there. Price frequently returns to fill (or partially fill) FVGs before continuing.',
    howToUse:
      'Mark the gap between candle 1\'s wick and candle 3\'s wick. On NQ and ES, look for FVGs on the 1m–15m that align with higher timeframe PD arrays. The first or second revisit is usually the cleanest entry.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['imbalance', 'gap', 'three candle', 'rebalance', 'IFVG'],
    synergies: [
      { conceptId: 'displacement', strength: 3, note: 'Displacement creates FVGs — no displacement, no clean FVG.' },
      { conceptId: 'order-block', strength: 3, note: 'OB + FVG overlap is one of the highest-probability entry confluences in ICT.' },
      { conceptId: 'silver-bullet', strength: 3, note: 'Silver Bullet is entirely built around entering FVGs in specific time windows.' },
      { conceptId: 'market-structure', strength: 2, note: 'Post-BOS FVG is the first retrace target in trend continuation.' },
      { conceptId: 'kill-zones', strength: 2, note: 'FVGs formed during kill zones carry more weight than random session FVGs.' },
    ],
  },
  {
    id: 'order-block',
    name: 'Order Block (OB)',
    shortName: 'Order Block',
    tier: 'basic',
    category: 'entry',
    description:
      'The last opposing candle (or series of candles) before a significant displacement move. This is where institutional orders were placed. When price returns to this zone, unfilled orders are still waiting — creating a high-probability reaction. Bullish OB = last bearish candle before a strong move up. Bearish OB = last bullish candle before a strong move down.',
    howToUse:
      'Find the last opposing candle before displacement, mark its high to low (or body). On NQ, use 15m/1H OBs for the bigger plays and 1m/5m OBs for precision entries within the zone.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['OB', 'institutional', 'supply', 'demand', 'origin'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'OB + FVG overlap = optimal entry zone. One of the cleanest confluences.' },
      { conceptId: 'displacement', strength: 3, note: 'Displacement after the OB validates it. No displacement = not a clean OB.' },
      { conceptId: 'liquidity', strength: 2, note: 'Price sweeps liquidity then returns to the OB — classic delivery.' },
      { conceptId: 'breaker-block', strength: 2, note: 'A failed OB becomes a Breaker Block — know which one you\'re trading.' },
      { conceptId: 'kill-zones', strength: 2, note: 'OBs hit during kill zones have far higher reaction probability.' },
    ],
  },
  {
    id: 'premium-discount',
    name: 'Premium & Discount',
    shortName: 'Premium / Discount',
    tier: 'basic',
    category: 'structure',
    description:
      'Every range has a 50% equilibrium (EQ). Above EQ is premium — where you look to sell. Below EQ is discount — where you look to buy. Smart money buys in discount, sells in premium. This filters which PD arrays you should be trading from and which ones to ignore.',
    howToUse:
      'Identify the relevant swing high and low. Mark the 50% level. If price is in premium and you\'re bullish, wait for a deeper retrace into discount before entering. Never chase entries in premium when looking to buy.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['equilibrium', 'EQ', 'optimal', 'retracement', 'fib'],
    synergies: [
      { conceptId: 'order-block', strength: 3, note: 'OBs in discount (for buys) or premium (for sells) are the highest quality.' },
      { conceptId: 'ote', strength: 3, note: 'OTE is the premium/discount concept applied to a specific fib zone (0.62–0.79).' },
      { conceptId: 'fvg', strength: 2, note: 'FVGs in the discount of a bullish range = strongest retrace targets.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Daily bias tells you which side of premium/discount to be shopping from.' },
    ],
  },

  {
    id: 'swing-highs-lows',
    name: 'Swing Highs & Lows',
    shortName: 'Swing H&L',
    tier: 'basic',
    category: 'structure',
    description:
      'The raw building blocks of all market structure. A swing high is a candle with lower highs on both sides — it marks a point where price was rejected upward. A swing low is a candle with higher lows on both sides — a point where price was rejected downward. ICT distinguishes internal swings (small, lower-timeframe) from external swings (large, higher-timeframe). Every concept in ICT starts with correctly reading these.',
    howToUse:
      'On your chart, mark every swing high and low that stands out on your trading timeframe. Internal swings are smaller moves within a trend; external swings are the major highs and lows that define the bigger picture. Liquidity rests at all of them. Practice identifying them before doing anything else — everything else depends on this.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['swing', 'internal', 'external', 'MSH', 'MSL', 'highs', 'lows'],
    synergies: [
      { conceptId: 'market-structure', strength: 3, note: 'BOS and CHoCH are defined by the breaking of swing highs and lows — they\'re the same concept.' },
      { conceptId: 'liquidity', strength: 3, note: 'Liquidity (BSL/SSL) rests directly at swing highs and lows — they define each other.' },
      { conceptId: 'equal-highs-lows', strength: 2, note: 'EQH/EQL are a specific pattern of swing highs/lows — multiple swings at the exact same price.' },
      { conceptId: 'draw-on-liquidity', strength: 2, note: 'Swings mark where liquidity pools are — the DOL is almost always at a significant swing.' },
      { conceptId: 'fvg', strength: 2, note: 'FVGs form when a swing breaks with displacement — the swing break and the FVG are the same event.' },
    ],
  },
  {
    id: 'draw-on-liquidity',
    name: 'Draw on Liquidity (DOL)',
    shortName: 'Draw on Liq.',
    tier: 'basic',
    category: 'liquidity',
    description:
      'Every candle on every timeframe is moving either toward or away from the next liquidity pool. The Draw on Liquidity is price\'s current destination — the specific pool of stops, EQH/EQL, prior high/low, or IPDA level that the algorithm is delivering toward. Without identifying the DOL before a trade, you are entering without knowing where price is going. The DOL is your take-profit target before you even enter.',
    howToUse:
      'Before every session and before every trade, state your DOL explicitly: "Price is drawn to the BSL at 22,450." Mark it on your chart. Every entry you take must be pointed at delivering to that level. If price reaches the DOL cleanly without offering a setup, there is no trade — the move happened without you. Never enter a trade without a defined DOL.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['DOL', 'draw', 'target', 'destination', 'liquidity pool', 'take profit'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'The DOL IS the next liquidity pool — they describe the same thing from different angles.' },
      { conceptId: 'daily-bias', strength: 3, note: 'Bias tells you the direction; DOL tells you the specific target. Both are required before trading.' },
      { conceptId: 'ipda', strength: 3, note: 'IPDA defines the macro DOL — the algorithmic draw that price is delivering toward over 20/40/60 days.' },
      { conceptId: 'equal-highs-lows', strength: 2, note: 'EQH/EQL are the most common intraday DOL — the algorithm is almost always drawn to them.' },
      { conceptId: 'swing-highs-lows', strength: 2, note: 'Significant swings mark where liquidity sits — the DOL is always at a meaningful swing.' },
      { conceptId: 'prev-day-week-hl', strength: 3, note: 'Previous day/week highs and lows are among the most frequently targeted DOL on any given day.' },
    ],
  },
  {
    id: 'prev-day-week-hl',
    name: 'Previous Day / Week High & Low',
    shortName: 'PDH / PDL / PWH / PWL',
    tier: 'basic',
    category: 'liquidity',
    description:
      'The high and low of the previous trading day (PDH/PDL) and the previous trading week (PWH/PWL) are among the most consistently targeted liquidity levels in futures markets. Stop orders accumulate above these levels (BSL) and below them (SSL). The algorithm frequently targets one of these four levels during the NY AM kill zone as the intraday draw, before delivering to the real higher-timeframe target.',
    howToUse:
      'Before each session, mark the prior day\'s high and low with horizontal lines labeled PDH and PDL. On Mondays, also mark the prior week\'s high and low (PWH/PWL). Determine which one aligns with your daily bias — that is your first intraday DOL. On most NQ and ES trading days, at least one of these four levels will be interacted with before the session closes.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['PDH', 'PDL', 'PWH', 'PWL', 'prior day', 'prior week', 'reference level'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'PDH/PDL/PWH/PWL are the most consistently traded liquidity pools in futures — same concept, defined timeframes.' },
      { conceptId: 'draw-on-liquidity', strength: 3, note: 'On most trading days, the first intraday DOL IS the prior day\'s high or low.' },
      { conceptId: 'daily-bias', strength: 3, note: 'Bias determines whether PDH (bullish target) or PDL (bearish target) is the current draw.' },
      { conceptId: 'equal-highs-lows', strength: 2, note: 'When the current day tags the same level as PDH or PDL, it creates a high-priority EQH/EQL.' },
      { conceptId: 'opening-gaps', strength: 2, note: 'Opening gaps are measured relative to the prior day\'s close, which is near the PDH or PDL.' },
      { conceptId: 'market-structure', strength: 2, note: 'Breaking through PDH or PDL with displacement is one of the cleanest BOS signals available.' },
    ],
  },
  {
    id: 'mtfa',
    name: 'Multi-Timeframe Analysis (MTFA)',
    shortName: 'MTFA',
    tier: 'basic',
    category: 'structure',
    description:
      'The discipline of reading price across multiple timeframes simultaneously — starting from the highest timeframe to establish the narrative, working down through intermediate frames to identify structure and PD arrays, then using lower timeframes for precision entry. HTF sets the narrative. ITF sets the setup. LTF sets the entry. A trade that aligns across all three timeframes is the highest-probability setup in ICT methodology.',
    howToUse:
      'Top-down approach: Daily chart sets bias and identifies the macro draw. 4H or 1H identifies the intermediate structure and the most relevant PD arrays. 15m or 5m identifies the setup formation. 1m refines the precise entry. Every trade should make sense at every timeframe. If the 1m entry looks clean but contradicts the daily structure, skip the trade.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['top-down', 'HTF', 'LTF', 'timeframe', 'daily', '4H', '15m', '1m', 'alignment'],
    synergies: [
      { conceptId: 'market-structure', strength: 3, note: 'MTFA is the practice of reading market structure across timeframes — structure IS the core of MTFA.' },
      { conceptId: 'daily-bias', strength: 3, note: 'Daily bias cannot be set without MTFA — you must go higher timeframe to determine intraday direction.' },
      { conceptId: 'draw-on-liquidity', strength: 2, note: 'Each timeframe has its own DOL — MTFA helps you identify which one to trade toward.' },
      { conceptId: 'premium-discount', strength: 2, note: 'Premium/discount exists on every timeframe — MTFA stacks multiple P/D contexts for higher-probability entries.' },
      { conceptId: 'order-block', strength: 2, note: 'HTF OBs take priority over LTF OBs — MTFA determines which OB level is actually significant.' },
      { conceptId: 'fvg', strength: 2, note: 'HTF FVGs contain entire LTF setups within them — MTFA reveals this nesting relationship.' },
    ],
  },

  // ─── INTERMEDIATE ─────────────────────────────────────────────────────────

  {
    id: 'displacement',
    name: 'Displacement',
    shortName: 'Displacement',
    tier: 'intermediate',
    category: 'structure',
    description:
      'A strong, impulsive price move that breaks structure with authority — characterized by large candles, minimal overlap, and the creation of FVGs. Displacement is the fingerprint of institutional participation. Without it, you don\'t have a valid BOS, a real OB, or a reliable FVG.',
    howToUse:
      'After a liquidity sweep or at a key session open, watch for a sudden explosive move. That\'s displacement. Mark the FVGs it creates, identify the OB that preceded it, and prepare for price to retrace into that zone.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['impulse', 'expansion', 'institutional', 'velocity'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'Displacement is what creates the FVG — they always come together.' },
      { conceptId: 'order-block', strength: 3, note: 'The OB before displacement is the validated entry zone on retrace.' },
      { conceptId: 'market-structure', strength: 3, note: 'Valid BOS requires displacement — without it, it\'s a weak break.' },
      { conceptId: 'kill-zones', strength: 2, note: 'Displacement in a kill zone is the highest-conviction signal.' },
      { conceptId: 'liquidity', strength: 2, note: 'Displacement typically happens after a liquidity sweep.' },
    ],
  },
  {
    id: 'inducement',
    name: 'Inducement (IDM)',
    shortName: 'Inducement',
    tier: 'intermediate',
    category: 'liquidity',
    description:
      'A deliberate price move designed to trick retail traders into entering prematurely, building liquidity that institutions will sweep before the real move. It\'s a smaller high/low that forms before price takes out the real liquidity pool. Recognizing IDM separates traders who get stopped out from those who get filled at the real entry.',
    howToUse:
      'Look for a small swing that forms after you\'ve identified your trade direction. That\'s the inducement — retail will enter there, setting their stops just beyond it. Wait for price to sweep IDM, then look for your entry model off the next PD array.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['IDM', 'trap', 'fake', 'retail', 'stop hunt'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'IDM is a liquidity raid on a smaller scale — same concept, smaller pool.' },
      { conceptId: 'order-block', strength: 2, note: 'After IDM is swept, the next OB is typically the real entry.' },
      { conceptId: 'equal-highs-lows', strength: 3, note: 'EQH/EQL are the classic inducement setup — retail sees the pattern, enters, and gets stopped out.' },
      { conceptId: 'market-maker-buy', strength: 2, note: 'IDM is a structured part of the market maker model delivery sequence.' },
      { conceptId: 'market-maker-sell', strength: 2, note: 'IDM is a structured part of the market maker model delivery sequence.' },
    ],
  },
  {
    id: 'rejection-block',
    name: 'Rejection Block',
    shortName: 'Rejection Block',
    tier: 'intermediate',
    category: 'entry',
    description:
      'A candle with a long wick showing price was forcefully rejected from a level. The body of the candle is the order block zone; the wick is evidence of institutional absorption — they were selling into the buys (bearish rejection) or buying into the sells (bullish rejection). Unlike a standard order block, the rejection block shows real-time evidence of the fight at that level.',
    howToUse:
      'Identify a candle with a wick at least 2–3x the size of its body at a key PD array. Mark the body of that candle as the rejection block zone. On retest, price entering the body is your entry signal. Combine with an FVG or OB within the zone for precision.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['wick', 'rejection', 'pin bar', 'absorption', 'institutional'],
    synergies: [
      { conceptId: 'order-block', strength: 3, note: 'Rejection block and OB often coexist — the OB is the origin zone, the wick confirms it.' },
      { conceptId: 'fvg', strength: 2, note: 'The body of a rejection block frequently contains an FVG from the rapid directional move.' },
      { conceptId: 'liquidity', strength: 2, note: 'Rejection blocks form at liquidity levels — the wick is price reaching the pool and reversing.' },
      { conceptId: 'displacement', strength: 2, note: 'A strong rejection block followed by displacement is one of the cleanest entry confluences.' },
      { conceptId: 'key-opens', strength: 2, note: 'Rejection blocks at key open levels carry extra institutional significance.' },
    ],
  },
  {
    id: 'breaker-block',
    name: 'Breaker Block',
    shortName: 'Breaker Block',
    tier: 'intermediate',
    category: 'entry',
    description:
      'A failed Order Block — one that price breaks through rather than holding. When a bearish OB fails to hold price (price blows through it), it becomes a bullish Breaker Block on the return. The logic: the orders that were there got filled, the block flips function. These are often cleaner entries than standard OBs because they\'ve been tested.',
    howToUse:
      'Identify an OB that price has already run through. When price returns to that zone from the other side, it\'s now a Breaker. Look for precise entry within the breaker zone aligned with your bias.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['failed OB', 'flip', 'breaker', 'support becomes resistance'],
    synergies: [
      { conceptId: 'order-block', strength: 3, note: 'Breaker is a direct evolution of the OB concept — can\'t use one without knowing the other.' },
      { conceptId: 'market-structure', strength: 2, note: 'Breakers typically align with CHoCH levels — the zone price broke through to change structure.' },
      { conceptId: 'fvg', strength: 2, note: 'Breaker zone often overlaps with an FVG from the breakout candle.' },
    ],
  },
  {
    id: 'mitigation-block',
    name: 'Mitigation Block',
    shortName: 'Mitigation Block',
    tier: 'intermediate',
    category: 'entry',
    description:
      'An area where institutional orders were partially filled during an impulse move but not fully mitigated. Price returns to this zone so remaining orders can be filled before the move continues. Similar to an OB but the context is that the move has already started — this is a continuation entry on the pullback.',
    howToUse:
      'After an initial displacement, mark the consolidation or opposing candle cluster within the move. When price pulls back into this area, the remaining orders get filled and price continues. Best used in trending markets for continuation entries.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['mitigation', 'continuation', 'partial fill', 'pullback'],
    synergies: [
      { conceptId: 'order-block', strength: 2, note: 'Mitigation blocks share the same logic as OBs but in a continuation context.' },
      { conceptId: 'displacement', strength: 2, note: 'The initial displacement creates the mitigation block on the pullback.' },
      { conceptId: 'fvg', strength: 2, note: 'Mitigation block and FVG overlap in continuation moves is a high-confidence zone.' },
    ],
  },
  {
    id: 'kill-zones',
    name: 'Kill Zones',
    shortName: 'Kill Zones',
    tier: 'intermediate',
    category: 'timing',
    description:
      'Specific time windows during which the algorithm delivers the most significant price moves. Asian Kill Zone (7–9 PM EST): range formation. London Kill Zone (2–5 AM EST): London initiates major moves. NY AM Kill Zone (8:30–11 AM EST): highest volatility, most reliable on NQ/ES. NY PM Kill Zone (1:30–4 PM EST): afternoon continuation or reversal.',
    howToUse:
      'Only take high-conviction setups within kill zones. Outside these windows, price is often choppy. For NQ/ES, NY AM is your primary window. For Gold, London and NY AM both produce clean setups.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['London', 'New York', 'Asian', 'session', 'timing', 'algorithm'],
    synergies: [
      { conceptId: 'silver-bullet', strength: 3, note: 'Silver Bullet is a kill zone sub-model — it runs inside NY AM and PM.' },
      { conceptId: 'amd', strength: 3, note: 'AMD plays out across kill zones: accumulation in Asia, manipulation in London, distribution in NY.' },
      { conceptId: 'fvg', strength: 2, note: 'FVGs formed during kill zones are the most reliable.' },
      { conceptId: 'order-block', strength: 2, note: 'OBs hit during kill zones have highest reaction probability.' },
      { conceptId: 'judas-swing', strength: 2, note: 'Judas typically runs at the open of London or NY AM kill zone.' },
    ],
  },
  {
    id: 'key-opens',
    name: 'Key Opens',
    shortName: 'Key Opens',
    tier: 'intermediate',
    category: 'timing',
    description:
      'Specific price levels where a new time period begins — the algorithm anchors to these prices. Key opens: Midnight Open (00:00 EST), New York Open (9:30 AM EST), London Open (2:00 AM EST), Asian Open (6:00 PM EST), and weekly/monthly opens. These levels act as magnets, reference points for premium/discount, and origins for measuring session ranges. Price frequently returns to key opens before moving in the intended direction.',
    howToUse:
      'Mark these price levels as horizontal lines before each session. The Midnight Open (MO) is especially critical — it divides premium from discount for the daily range. If price is above the MO and your bias is bullish, you\'re in premium and should wait for a pullback. On NQ/ES, the 9:30 AM NY Open is a precise level the algorithm revisits within the first 30 minutes.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['midnight open', 'NY open', 'London open', 'Asian open', 'MO', 'reference level'],
    synergies: [
      { conceptId: 'kill-zones', strength: 3, note: 'Key opens define the start of each kill zone — the price at that moment is the reference for the entire session.' },
      { conceptId: 'daily-bias', strength: 3, note: 'Midnight Open splits premium from discount — it\'s essential for daily bias framing.' },
      { conceptId: 'judas-swing', strength: 2, note: 'Judas swings frequently originate from key open levels, using them as the anchor for the false move.' },
      { conceptId: 'premium-discount', strength: 2, note: 'Key opens give you a reference price to define premium (above) and discount (below) within the session.' },
      { conceptId: 'opening-gaps', strength: 3, note: 'Opening gaps are defined by the difference between a key open price and the prior session\'s close.' },
    ],
  },
  {
    id: 'amd',
    name: 'Power of 3 (AMD)',
    shortName: 'AMD',
    tier: 'intermediate',
    category: 'model',
    description:
      'Accumulation, Manipulation, Distribution — the three phases of institutional price delivery that repeat on every timeframe. Accumulation: price consolidates as institutions build positions. Manipulation: price runs stops in the opposite direction (Judas Swing), trapping retail. Distribution: price moves in the intended direction, delivering to the draw on liquidity.',
    howToUse:
      'Apply this framework to the daily candle: accumulation in Asia session, manipulation in London (Judas Swing taking one side\'s liquidity), distribution in NY AM. Then apply it fractally to the 15m/5m within each session.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['accumulation', 'manipulation', 'distribution', 'Power of 3', 'PO3'],
    synergies: [
      { conceptId: 'judas-swing', strength: 3, note: 'Judas IS the manipulation phase of AMD — they\'re the same thing at different scales.' },
      { conceptId: 'kill-zones', strength: 3, note: 'Each AMD phase maps to a kill zone — can\'t use AMD without kill zone awareness.' },
      { conceptId: 'liquidity', strength: 2, note: 'Manipulation phase sweeps liquidity — always identify which pool is getting hunted.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Daily bias tells you which direction AMD will ultimately distribute into.' },
    ],
  },
  {
    id: 'ote',
    name: 'Optimal Trade Entry (OTE)',
    shortName: 'OTE',
    tier: 'intermediate',
    category: 'entry',
    description:
      'A specific Fibonacci retracement zone (0.62–0.79, with 0.705 as the sweet spot) that represents where institutions re-enter after an initial impulse. Applied to a swing high to swing low (or vice versa), the OTE zone is where price retraces to reload before continuing. It\'s premium/discount refined into a precise entry window.',
    howToUse:
      'After displacement and a confirmed BOS, swing the Fibonacci from the origin of the move to the endpoint. Look for price to pull back into the 0.62–0.79 zone. Combine with an OB or FVG within that zone for precision entry.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['fibonacci', 'retracement', 'OTE', '0.62', '0.79', '0.705'],
    synergies: [
      { conceptId: 'premium-discount', strength: 3, note: 'OTE is the precision version of premium/discount — same concept, fib-defined zone.' },
      { conceptId: 'order-block', strength: 3, note: 'OTE zone containing an OB = the ideal entry setup.' },
      { conceptId: 'fvg', strength: 2, note: 'FVG within the OTE zone gives you a tight, defined entry.' },
      { conceptId: 'kill-zones', strength: 2, note: 'OTE entries during kill zones have the best follow-through.' },
    ],
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Levels & Extensions',
    shortName: 'Fibonacci',
    tier: 'intermediate',
    category: 'entry',
    description:
      'ICT\'s fib framework extends beyond OTE entries. Retracement levels: 0.5 (equilibrium), 0.62–0.79 (OTE entry zone). Extension/projection levels for targets: -0.27 (first liquidity target), -0.62 (intermediate target), -1.0 (full range extension — "par"), -1.27 and -1.62 (extended targets). These levels define where price is drawn to after entry and are used to set realistic take-profit targets aligned with institutional delivery.',
    howToUse:
      'Swing fib from the origin of a move to its high/low. Use 0.62–0.79 for entries (OTE). Then project the extension levels (-0.27, -0.62, -1.0) as your TP targets — these are where the next pool of liquidity sits. On NQ, the -0.62 extension frequently aligns with a prior EQH/EQL, confirming it as the algorithmic target.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['fib', 'fibonacci', 'extension', 'retracement', '0.5', '-0.27', '-0.62', '-1.0', 'target'],
    synergies: [
      { conceptId: 'ote', strength: 3, note: 'OTE is the fib entry zone — Fibonacci just extends it to include projection targets.' },
      { conceptId: 'premium-discount', strength: 3, note: 'Fib 0.5 is the equilibrium that defines premium and discount — the same level.' },
      { conceptId: 'liquidity', strength: 2, note: 'Extension targets (-0.27, -0.62, -1.0) almost always align with liquidity pools.' },
      { conceptId: 'equal-highs-lows', strength: 2, note: 'Fib extension targets frequently land directly on EQH/EQL, confirming the draw.' },
      { conceptId: 'ipda', strength: 2, note: 'IPDA draw on liquidity often aligns with key fib extensions from the current range.' },
    ],
  },
  {
    id: 'opening-gaps',
    name: 'Opening Gaps (NWOG / NDOG)',
    shortName: 'Opening Gaps',
    tier: 'intermediate',
    category: 'structure',
    description:
      'New Day Opening Gap (NDOG): the gap between the previous day\'s 4 PM close and the midnight open — price frequently returns to fill this before the daily move. New Week Opening Gap (NWOG): the gap between Friday\'s close and Monday\'s open — one of the most reliable weekly magnets. These gaps represent unfilled orders across sessions and the algorithm is programmed to deliver back to these levels.',
    howToUse:
      'Mark Friday\'s close (NWOG) and the previous day\'s 4 PM close (NDOG) as boxes on your chart. Price will typically fill the gap at some point in the session — often early in the NY AM kill zone. Use them as targets rather than entries. If your bias is bullish and the NDOG is below current price, expect a Judas down to fill it before the real move up.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['NDOG', 'NWOG', 'gap', 'opening gap', 'weekly gap', 'daily gap', 'fill'],
    synergies: [
      { conceptId: 'key-opens', strength: 3, note: 'Opening gaps are defined by key open prices — they\'re the same concept viewed as a range rather than a level.' },
      { conceptId: 'fvg', strength: 2, note: 'Opening gaps and FVGs share the same logic — imbalance that price is drawn to fill.' },
      { conceptId: 'daily-bias', strength: 2, note: 'NDOG fill often happens at the start of the session before the real directional move — factor it into daily planning.' },
      { conceptId: 'judas-swing', strength: 2, note: 'Judas swings frequently target an NDOG or NWOG as the manipulation destination before reversing.' },
      { conceptId: 'kill-zones', strength: 2, note: 'Opening gaps are most reliably filled during the NY AM kill zone — the algorithm\'s cleanup window.' },
    ],
  },
  {
    id: 'data-highs-lows',
    name: 'Data Highs & Lows',
    shortName: 'Data H&L',
    tier: 'intermediate',
    category: 'liquidity',
    description:
      'The highs and lows formed during and immediately after high-impact economic releases — NFP, CPI, FOMC, PMI, GDP. These levels become significant liquidity pools because enormous retail volume flows in around these events, creating well-defined stop clusters. On NQ and ES especially, the news candle high/low is almost always revisited and swept before the real directional move follows through.',
    howToUse:
      'Mark the high and low of the candle(s) formed during the news release. These become your data liquidity levels. If price spikes up on NFP (NQ), mark that spike high — it\'s BSL. The real trade is often the reversal after that spike gets faded, or the continuation once the data level is swept and price finds an OB to launch from. Treat data levels the same as any other liquidity pool.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['NFP', 'CPI', 'FOMC', 'news', 'economic data', 'data candle', 'spike'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'Data highs and lows are the highest-volume liquidity pools — same concept, news-event origin.' },
      { conceptId: 'kill-zones', strength: 2, note: 'High-impact data drops during NY AM kill zone — the kill zone amplifies the liquidity at data levels.' },
      { conceptId: 'equal-highs-lows', strength: 2, note: 'Data levels that get retested form EQH/EQL, stacking liquidity twice over.' },
      { conceptId: 'market-structure', strength: 2, note: 'A data high/low being swept often causes a BOS or CHoCH — they\'re structural reference points.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Major data events can invalidate or confirm daily bias — they must be factored into pre-session planning.' },
    ],
  },

  {
    id: 'volume-imbalance',
    name: 'Volume Imbalance (VI)',
    shortName: 'Volume Imbalance',
    tier: 'intermediate',
    category: 'entry',
    description:
      'A two-candle pattern where the body (open-to-close) of candle 1 and the body of candle 2 do not overlap, leaving a gap between closes and opens. Unlike an FVG — which requires three candles and measures wick-to-wick — a Volume Imbalance is purely about candle bodies. It marks a level where price transacted heavily but left no body overlap, indicating institutional urgency. Price frequently returns to fill the body gap before continuing.',
    howToUse:
      'Identify two adjacent candles whose bodies don\'t overlap. Mark the gap between the close of the first candle and the open of the second. Use it to refine entries within a larger FVG or OB zone — a VI sitting inside a wider zone gives you the precise level where price reacts most sharply. On NQ and ES, VIs inside a displacement move are often the first fill target on any pullback.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['VI', 'volume imbalance', 'body gap', 'two candle', 'imbalance'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'VI and FVG both mark imbalances — a VI often lives inside a larger FVG and gets filled first before the full gap closes.' },
      { conceptId: 'displacement', strength: 3, note: 'Displacement creates VIs on every candle in the sequence — aggressive institutional moves are chains of body gaps.' },
      { conceptId: 'order-block', strength: 2, note: 'A VI at the edge of an OB zone tightens the entry — price entering the VI within the OB is the precision level.' },
      { conceptId: 'consequent-encroachment', strength: 2, note: 'CE and VI both refine wide zones; a VI near the CE of an FVG creates the tightest possible entry within the zone.' },
    ],
  },
  {
    id: 'ifvg',
    name: 'Inversion FVG (IFVG)',
    shortName: 'IFVG',
    tier: 'intermediate',
    category: 'entry',
    description:
      'When price fully trades through a Fair Value Gap — closing candles on the other side — that gap inverts and acts as an opposing PD array. A bullish FVG that price closes below becomes bearish resistance on the return; a bearish FVG that price closes above becomes bullish support. IFVGs are often stronger than fresh FVGs because they\'ve been price-confirmed: the original imbalance was fully absorbed and institutional intent has flipped.',
    howToUse:
      'Mark any FVG that price has fully traded through. When price returns to that zone from the opposite direction, treat it as an IFVG — now acting as opposing PD array. A rejection wick or 1m CHoCH at the IFVG confirms the flip is active. IFVGs aligned with HTF structure and a kill zone are the most reliable. Don\'t confuse a partial FVG fill with an inversion — the full gap must be closed for the zone to flip.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['IFVG', 'inversion FVG', 'flipped FVG', 'inverse FVG', 'polarity flip'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'IFVG is a direct evolution of the FVG — every IFVG was a standard FVG that got fully filled and flipped.' },
      { conceptId: 'breaker-block', strength: 3, note: 'IFVG and Breaker Block share the same flip logic — Breaker is the OB version, IFVG is the gap version.' },
      { conceptId: 'market-structure', strength: 2, note: 'An FVG that fails and inverts often coincides with a CHoCH — the structural break and the IFVG are frequently the same event.' },
      { conceptId: 'displacement', strength: 2, note: 'The candle that fills an FVG and creates an IFVG must close through the full gap with momentum — weak drifts through do not produce reliable IFVGs.' },
    ],
  },
  {
    id: 'dealing-range',
    name: 'Dealing Range (DR)',
    shortName: 'Dealing Range',
    tier: 'intermediate',
    category: 'structure',
    description:
      'A defined swing-high to swing-low range that acts as the analytical container for a trade setup. Its high and low represent 100% and 0% of the range; the midpoint is equilibrium (50%). Every PD array — OBs, FVGs, mitigation blocks — is evaluated relative to whether it sits in discount (below 50%, source of buys) or premium (above 50%, source of sells). Choosing which swing points define the dealing range is one of the most critical — and most frequently wrong — decisions in ICT analysis. Dealing ranges nest fractally: every timeframe has its own.',
    howToUse:
      'Identify the most recent significant swing high and swing low on your trading timeframe. Mark the range with a box, label 50% as equilibrium, and 62%–79% as the OTE zone. For intraday NQ/ES analysis, the dealing range is typically the prior day\'s high to low, or the current session\'s range once established. Every PD array inside the range is only valid from discount (for buys) or premium (for sells) — an OB in premium is a sell zone, not a buy, regardless of direction. MTFA is the practice of stacking dealing ranges across timeframes.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['dealing range', 'DR', 'range', 'analytical range', 'container', 'swing range'],
    synergies: [
      { conceptId: 'premium-discount', strength: 3, note: 'The dealing range IS the framework that makes premium/discount possible — you cannot apply P/D without first defining the range.' },
      { conceptId: 'ote', strength: 3, note: 'OTE (0.62–0.79) is a fib zone within the dealing range — the range defines where those levels sit.' },
      { conceptId: 'mtfa', strength: 3, note: 'MTFA is the practice of stacking and aligning multiple dealing ranges simultaneously across timeframes.' },
      { conceptId: 'order-block', strength: 2, note: 'OBs only have full context within their dealing range — the same OB means different things in discount vs. premium.' },
      { conceptId: 'market-structure', strength: 2, note: 'BOS and CHoCH events define the edges of new dealing ranges — each structural shift creates a new container.' },
      { conceptId: 'fibonacci', strength: 2, note: 'The fib tool maps the dealing range\'s internal structure — 0.5, 0.62, and 0.79 are all points within it.' },
    ],
  },
  {
    id: 'nmog',
    name: 'New Month Opening Gap (NMOG)',
    shortName: 'NMOG',
    tier: 'intermediate',
    category: 'structure',
    description:
      'The price gap between the last trading day of a calendar month\'s close and the first trading day of the new month\'s open. Like the NWOG but at the monthly scale, the NMOG represents unfilled institutional orders across the month transition. The algorithm prioritizes filling NMOGs — often within the first 1–3 trading days — before committing to the monthly direction. On indices and Gold, NMOGs are especially reliable because of the large position-closing and rebalancing activity at month-end.',
    howToUse:
      'On the first trading day of each month, draw a box between the prior month\'s last close and the current day\'s midnight open. Label it NMOG. If your bias is bullish and the NMOG is below current price, expect a pullback to fill it before the real monthly move begins. Don\'t enter long at a premium price with an unfilled NMOG below — it\'s a magnet. The NMOG fill often serves as the first week\'s Judas before the true monthly delivery takes over.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['NMOG', 'new month opening gap', 'monthly gap', 'month open', 'month close', 'gap fill'],
    synergies: [
      { conceptId: 'opening-gaps', strength: 3, note: 'NMOG is the monthly version of NDOG/NWOG — the same gap logic applied at the larger timeframe.' },
      { conceptId: 'draw-on-liquidity', strength: 2, note: 'An unfilled NMOG is a macro DOL at the start of the month — price must return to address it.' },
      { conceptId: 'daily-bias', strength: 2, note: 'NMOG location relative to current price (above or below) is a key input for daily bias in the first week of the month.' },
      { conceptId: 'ipda', strength: 2, note: 'IPDA 20-day lookback periods frequently begin or end near monthly opens — NMOG and IPDA reference levels often coincide.' },
      { conceptId: 'judas-swing', strength: 2, note: 'The early-month Judas frequently targets the NMOG as its manipulation destination before the real monthly move.' },
    ],
  },
  {
    id: 'prev-month-hl',
    name: 'Previous Month High & Low (PMH / PML)',
    shortName: 'PMH / PML',
    tier: 'intermediate',
    category: 'liquidity',
    description:
      'The high and low of the prior calendar month — major liquidity pools at the monthly timeframe. Stop orders from all traders who entered during the prior month cluster above the PMH (BSL) and below the PML (SSL). The algorithm frequently targets PMH or PML as the macro draw for multi-day delivery, especially in the first two weeks of a new month. On Gold in particular, PMH and PML are among the most reliable macro targets session to session.',
    howToUse:
      'On the first trading day of each month, mark the prior month\'s high and low as labeled horizontal lines. Determine which aligns with your weekly and daily bias — that level is your macro draw. Intraday setups in the direction of the PMH (bullish month) or PML (bearish month) carry higher follow-through because the macro draw is supporting them. On NQ/ES, price often trends toward one of these levels throughout the first two weeks before reversing.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['PMH', 'PML', 'prior month high', 'prior month low', 'monthly liquidity', 'macro level'],
    synergies: [
      { conceptId: 'prev-day-week-hl', strength: 3, note: 'PMH/PML extends the same liquidity logic as PDH/PDL and PWH/PWL to the monthly timeframe — the hierarchy is day → week → month.' },
      { conceptId: 'liquidity', strength: 3, note: 'PMH/PML are the highest intraday liquidity pools — BSL above PMH and SSL below PML are macro stop clusters.' },
      { conceptId: 'draw-on-liquidity', strength: 3, note: 'PMH/PML are the macro DOL for multi-day delivery — every intraday setup in the first two weeks of a month should be checked against them.' },
      { conceptId: 'ipda', strength: 2, note: 'IPDA 20/40/60 day periods frequently align with PMH/PML levels — they confirm each other as the macro target.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Monthly draw (PMH or PML) directly informs daily bias — if price is trending toward PMH, bias stays bullish until it\'s reached.' },
    ],
  },

  // ─── ADVANCED ─────────────────────────────────────────────────────────────

  {
    id: 'judas-swing',
    name: 'Judas Swing',
    shortName: 'Judas Swing',
    tier: 'advanced',
    category: 'liquidity',
    description:
      'The opening manipulation move — a false directional push at the start of a session designed to trap retail traders and collect liquidity before the real move. If the daily bias is bullish, the Judas Swing will push price down first, running SSL, then reverse and deliver price up. Named after the betrayal concept — it looks like the real move but it\'s a trap.',
    howToUse:
      'At London or NY AM open, identify your daily bias. Watch for price to move against bias first. When it sweeps SSL (bullish day) or BSL (bearish day) and shows signs of reversal (CHoCH on low TF), that\'s your Judas. Enter on the reversal with the real direction.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['false move', 'trap', 'open', 'reversal', 'fake breakout'],
    synergies: [
      { conceptId: 'amd', strength: 3, note: 'Judas Swing is the manipulation phase of AMD — same concept named differently.' },
      { conceptId: 'daily-bias', strength: 3, note: 'You need daily bias to know which direction the Judas runs against.' },
      { conceptId: 'liquidity', strength: 3, note: 'Judas specifically hunts one side of liquidity to fuel the real move.' },
      { conceptId: 'kill-zones', strength: 2, note: 'Judas runs at the open of London or NY AM kill zone.' },
      { conceptId: 'market-structure', strength: 2, note: 'After Judas runs, watch for CHoCH on low TF to confirm the reversal.' },
    ],
  },
  {
    id: 'daily-bias',
    name: 'Daily / Weekly Bias',
    shortName: 'Daily Bias',
    tier: 'advanced',
    category: 'bias',
    description:
      'The directional narrative for the trading day (or week), determined by analyzing higher timeframe structure, liquidity pools, and the previous session\'s action. Bias tells you which side of the market you\'re shopping from — bullish bias means you only look for buys; bearish bias means only sells. Trading without a clear bias is gambling.',
    howToUse:
      'Before the session, analyze: Where is liquidity? What\'s the HTF structure? What happened in Asia? Where did the previous day close? The answers build your bias. Once set, only take setups in that direction and ignore setups against it.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['direction', 'HTF', 'narrative', 'bullish', 'bearish', 'planning'],
    synergies: [
      { conceptId: 'market-structure', strength: 3, note: 'HTF market structure is the primary input for daily bias.' },
      { conceptId: 'judas-swing', strength: 3, note: 'Knowing bias lets you identify the Judas as the counter-direction manipulation.' },
      { conceptId: 'ipda', strength: 3, note: 'IPDA gives you the draw on liquidity that defines the bias target.' },
      { conceptId: 'amd', strength: 2, note: 'Bias determines which direction AMD will ultimately distribute into.' },
      { conceptId: 'kill-zones', strength: 2, note: 'Bias filters which kill zone setups to take.' },
    ],
  },
  {
    id: 'silver-bullet',
    name: 'Silver Bullet',
    shortName: 'Silver Bullet',
    tier: 'advanced',
    category: 'model',
    description:
      'A time-based entry model that targets FVGs formed within specific algorithm windows. Three Silver Bullet windows: 3–4 AM EST (London), 10–11 AM EST (NY AM), 2–3 PM EST (NY PM). Within each window, look for price to create a displacement and FVG, then retrace into it. One trade per window — disciplined and precise.',
    howToUse:
      'Set alarms for each Silver Bullet window. During the window, watch for a displacement that creates an FVG. Wait for price to pull back into that FVG. Enter with confirmation (low TF CHoCH within FVG). Stop below the FVG low (buys) or above FVG high (sells). One and done per window.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['time-based', 'FVG', 'algorithm window', 'precision', 'one trade'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'Silver Bullet is literally an FVG model — the FVG is the entire entry mechanism.' },
      { conceptId: 'kill-zones', strength: 3, note: 'Silver Bullet windows fall inside kill zones — they\'re the precision sub-window.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Silver Bullet FVGs should align with daily bias direction.' },
      { conceptId: 'displacement', strength: 2, note: 'The FVG must be created by displacement within the window to be valid.' },
      { conceptId: 'ict-macros', strength: 2, note: 'ICT Macros define exact time ranges; Silver Bullet windows overlap with key macro times.' },
    ],
  },
  {
    id: 'ict-macros',
    name: 'ICT Macros',
    shortName: 'ICT Macros',
    tier: 'advanced',
    category: 'timing',
    description:
      'Algorithmic time windows during which the market is programmed to deliver price to a specific level. Key macro times (EST): 2:33–3:00 AM, 4:03–4:30 AM, 8:50–9:10 AM, 9:50–10:10 AM, 10:50–11:10 AM, 11:50 AM–12:10 PM, 1:10–1:40 PM, 3:15–3:45 PM. During these windows, price has a high probability of running to the nearest FVG or liquidity pool.',
    howToUse:
      'Mark these times on your chart. In the minutes leading into a macro window, identify the nearest FVG or liquidity level. Price often delivers there during the macro. Particularly powerful on NQ and ES where the algorithm is most transparent.',
    instruments: ['NQ', 'ES'],
    tags: ['macro', 'algorithm', 'time', 'delivery', 'window'],
    synergies: [
      { conceptId: 'silver-bullet', strength: 3, note: 'Silver Bullet windows are built on macro time awareness — they overlap directly.' },
      { conceptId: 'fvg', strength: 3, note: 'Macros deliver price to FVGs — the FVG is almost always the target of the macro.' },
      { conceptId: 'kill-zones', strength: 2, note: 'Macros sit inside kill zones — they\'re the precision timing within the window.' },
      { conceptId: 'liquidity', strength: 2, note: 'If no FVG is nearby, the macro will target the nearest liquidity pool.' },
    ],
  },
  {
    id: 'ipda',
    name: 'IPDA (Interbank Price Delivery Algorithm)',
    shortName: 'IPDA',
    tier: 'advanced',
    category: 'bias',
    description:
      'The institutional algorithm that determines where price is drawn to on a macro level. IPDA uses 20, 40, and 60 trading day lookback periods to identify the liquidity pools that are the draw on liquidity (DOL). Price is always in the process of delivering from one pool to the next. Knowing the IPDA draw tells you the destination before price gets there.',
    howToUse:
      'Count back 20, 40, and 60 trading days on the daily chart. Mark the highs and lows of those periods — these are your IPDA liquidity levels. The nearest untouched level in the direction of your bias is the draw on liquidity. All your intraday entries are in service of delivering to that level.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['algorithm', 'draw on liquidity', 'DOL', '20 day', '40 day', '60 day'],
    synergies: [
      { conceptId: 'daily-bias', strength: 3, note: 'IPDA defines the target the daily bias is moving toward — they work as one system.' },
      { conceptId: 'liquidity', strength: 3, note: 'IPDA liquidity pools are the highest timeframe liquidity levels.' },
      { conceptId: 'quarterly-theory', strength: 2, note: 'Quarterly Theory and IPDA both frame the macro direction — they confirm each other.' },
      { conceptId: 'market-structure', strength: 2, note: 'HTF market structure organizes the path between IPDA levels.' },
    ],
  },
  {
    id: 'market-maker-buy',
    name: 'Market Maker Buy Model',
    shortName: 'MM Buy Model',
    tier: 'advanced',
    category: 'model',
    description:
      'The complete bullish institutional delivery model: (1) Smart money accumulates below a key level, (2) price is manipulated down, taking out SSL (Judas), (3) CHoCH forms as smart money absorbs all sell orders, (4) displacement up through a key high with FVG creation, (5) OTE retracement into discount, (6) price delivers to the BSL target above.',
    howToUse:
      'This is your full-picture framework for bullish days. Step through each phase sequentially. Don\'t enter on step 2 — that\'s the trap. Enter on step 5 (OTE retrace after BOS) with stops below the CHoCH low. The phases don\'t always complete cleanly — bias and context determine which phase you\'re in.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['model', 'framework', 'bullish', 'delivery', 'full model'],
    synergies: [
      { conceptId: 'market-maker-sell', strength: 2, note: 'Understanding the sell model makes the buy model completely clear — they\'re mirror images.' },
      { conceptId: 'amd', strength: 3, note: 'AMD is the simplified version of the market maker model — same phases, different framing.' },
      { conceptId: 'inducement', strength: 2, note: 'IDM is built into the manipulation phase of the buy model.' },
      { conceptId: 'ote', strength: 3, note: 'OTE is the entry point in phase 5 of the buy model.' },
      { conceptId: 'liquidity', strength: 3, note: 'Every phase of the buy model revolves around specific liquidity pools.' },
    ],
  },
  {
    id: 'market-maker-sell',
    name: 'Market Maker Sell Model',
    shortName: 'MM Sell Model',
    tier: 'advanced',
    category: 'model',
    description:
      'The complete bearish institutional delivery model: (1) Smart money distributes above a key level, (2) price is manipulated up, taking out BSL (Judas), (3) CHoCH forms as smart money absorbs all buy orders, (4) displacement down through a key low with FVG creation, (5) OTE retracement into premium, (6) price delivers to the SSL target below.',
    howToUse:
      'Mirror of the buy model applied to bearish setups. Identify which phase the current market is in and position accordingly. The manipulation phase (step 2) is where most retail traders get long — you\'re waiting for their stops to fuel the real move down.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['model', 'framework', 'bearish', 'delivery', 'full model'],
    synergies: [
      { conceptId: 'market-maker-buy', strength: 2, note: 'Buy and sell models are mirror images — master one and you\'ve mastered both.' },
      { conceptId: 'amd', strength: 3, note: 'AMD is the simplified version of the sell model — manipulation then distribution.' },
      { conceptId: 'judas-swing', strength: 3, note: 'Judas IS the manipulation phase of the sell model.' },
      { conceptId: 'ote', strength: 3, note: 'OTE in premium is the entry point in phase 5 of the sell model.' },
      { conceptId: 'liquidity', strength: 3, note: 'BSL gets hunted in phase 2; SSL is the final delivery target.' },
    ],
  },
  {
    id: 'quarterly-theory',
    name: 'Quarterly Theory',
    shortName: 'Quarterly Theory',
    tier: 'advanced',
    category: 'bias',
    description:
      'The fractal application of AMD across time. Each year, quarter, month, week, and day has four phases: Q1 = Accumulation, Q2 = Manipulation/Judas, Q3 = Distribution/trending, Q4 = Rebalancing/consolidation. The algorithm delivers price fractally — the same pattern repeats from yearly down to minute charts.',
    howToUse:
      'Identify which quarterly phase the market is in at multiple timeframes. If the daily chart is in Q2 (manipulation), expect a Judas to run before the real move. If the weekly is in Q3 (distribution), look for continuation setups rather than reversals. Combine quarterly context with IPDA levels for the highest conviction reads.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['quarterly', 'fractal', 'Q1', 'Q2', 'Q3', 'Q4', 'time', 'phases'],
    synergies: [
      { conceptId: 'amd', strength: 3, note: 'Quarterly Theory is AMD applied to calendar time — same framework, different scale.' },
      { conceptId: 'ipda', strength: 2, note: 'Quarterly phase tells you the delivery mode; IPDA tells you the destination.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Monthly and weekly quarterly phase directly informs daily bias.' },
      { conceptId: 'kill-zones', strength: 2, note: 'Q1/Q2/Q3/Q4 within the trading day map directly to kill zone sequence.' },
    ],
  },
  {
    id: 'engineered-liquidity',
    name: 'Engineered Liquidity',
    shortName: 'Engineered Liq.',
    tier: 'advanced',
    category: 'liquidity',
    description:
      'The deliberate, algorithmic construction of liquidity pools before a major directional move. Smart money doesn\'t find liquidity passively — it engineers it. Price consolidates in a tight range or forms a pattern specifically to encourage retail entry and stop placement. Once sufficient liquidity is built above and below, the algorithm sweeps one side to fuel the move in the other direction.',
    howToUse:
      'Recognize consolidation as accumulation of liquidity, not random chop. Ask: what pattern is forming that will attract retail orders? Where are they placing their stops? Once you identify the engineered range, wait for the sweep of one side, then look for a CHoCH + displacement + OB/FVG entry in the opposite direction. The longer the consolidation, the more violent the resulting move.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['consolidation', 'range', 'accumulation', 'manipulation', 'algorithm', 'trap', 'liquidity engineering'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'Engineered liquidity is the macro version of standard liquidity — the mechanism is the same, the scale is larger.' },
      { conceptId: 'amd', strength: 3, note: 'Accumulation phase of AMD IS engineered liquidity — the range is being built deliberately.' },
      { conceptId: 'market-maker-buy', strength: 3, note: 'MM buy model begins with engineered liquidity in the accumulation phase.' },
      { conceptId: 'market-maker-sell', strength: 3, note: 'MM sell model begins with engineered liquidity in the distribution setup phase.' },
      { conceptId: 'equal-highs-lows', strength: 3, note: 'Engineered liquidity almost always produces EQH/EQL as the pool being built.' },
      { conceptId: 'inducement', strength: 2, note: 'Inducement is engineered liquidity on a smaller, intraday scale — same intent, smaller footprint.' },
      { conceptId: 'quarterly-theory', strength: 2, note: 'Q1 (accumulation) IS the engineering of liquidity — they describe the same phase with different vocabulary.' },
    ],
  },
  {
    id: 'turtle-soup',
    name: 'Turtle Soup',
    shortName: 'Turtle Soup',
    tier: 'advanced',
    category: 'liquidity',
    description:
      'ICT\'s reversal pattern that exploits the old "Turtle Trading" breakout system. When retail traders see obvious equal highs or equal lows, they place buy-stop orders just above (or sell-stop orders just below) expecting a breakout continuation. Turtle Soup is the deliberate sweep of those breakout stops — price briefly violates the level, traps the breakout traders, collects their stops as fuel, then reverses violently in the opposite direction. The sharper and more obvious the level, the more powerful the Turtle Soup reversal.',
    howToUse:
      'Identify obvious EQH or EQL that retail would treat as breakout levels. Watch for price to briefly exceed the level — often just a wick or a one-candle violation. The moment of reversal (confirmed by a low-TF CHoCH) is your entry signal. Target the opposing liquidity pool as your DOL. Turtle Soup setups at the open of London or NY AM kill zone are the highest probability.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['turtle soup', 'trap', 'spring', 'false breakout', 'sweep and reverse', 'stop hunt'],
    synergies: [
      { conceptId: 'equal-highs-lows', strength: 3, note: 'Turtle Soup IS the deliberate sweep of EQH/EQL — cannot exist without them.' },
      { conceptId: 'liquidity', strength: 3, note: 'Turtle Soup is a liquidity hunt mechanism — the sweep collects stops to fuel the real move.' },
      { conceptId: 'market-structure', strength: 2, note: 'A successful Turtle Soup creates a CHoCH — the sweep is the manipulation, the CHoCH is the confirmation.' },
      { conceptId: 'judas-swing', strength: 2, note: 'Judas Swing is Turtle Soup applied at the session scale — the same trap mechanic, different timeframe.' },
      { conceptId: 'engineered-liquidity', strength: 2, note: 'EQH/EQL that Turtle Soup targets are frequently engineered — the algorithm builds the trap before springing it.' },
      { conceptId: 'prev-day-week-hl', strength: 2, note: 'Prior day/week highs and lows are classic Turtle Soup targets — obvious levels retail treats as breakout points.' },
    ],
  },
  {
    id: 'asian-range',
    name: 'Asian Range',
    shortName: 'Asian Range',
    tier: 'advanced',
    category: 'timing',
    description:
      'The price range established during the Asian session (approximately 6:00 PM to 2:00 AM NY time). This range is not random — it is the Accumulation phase of the AMD model for the full trading day. BSL rests above the Asian high; SSL rests below the Asian low. One of these two levels will almost always be swept during London or NY AM as the Judas Swing. The size of the Asian range also provides context for the expected volatility of the full session.',
    howToUse:
      'Before London opens, mark the Asian session high and low with horizontal lines. Label them "Asian High" (BSL above) and "Asian Low" (SSL below). In a bullish day, expect the algorithm to sweep the Asian low (Judas) before delivering up through and above the Asian high. In a bearish day, the reverse. Use the range width to set realistic expectations for NY AM movement.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['Asian session', 'Asian high', 'Asian low', 'overnight range', 'session range', '6PM-2AM'],
    synergies: [
      { conceptId: 'amd', strength: 3, note: 'The Asian Range IS the Accumulation phase of AMD — they describe the same thing at the session level.' },
      { conceptId: 'kill-zones', strength: 3, note: 'Asian Kill Zone creates the range; London and NY AM kill zones then interact with its high/low.' },
      { conceptId: 'judas-swing', strength: 3, note: 'Judas Swing almost always sweeps one extreme of the Asian Range before the real move begins.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Knowing which end of the Asian Range will be swept IS the daily bias read for many traders.' },
      { conceptId: 'liquidity', strength: 2, note: 'Asian Range high and low ARE BSL/SSL for the trading day — first intraday liquidity pools.' },
      { conceptId: 'opening-gaps', strength: 2, note: 'Asian range often creates or reinforces opening gaps relative to the prior day\'s close.' },
    ],
  },
  {
    id: 'consequent-encroachment',
    name: 'Consequent Encroachment (CE)',
    shortName: 'CE',
    tier: 'advanced',
    category: 'entry',
    description:
      'The exact 50% midpoint of any Fair Value Gap, Order Block, or dealing range. CE is the point of maximum institutional interest within a PD array — where the algorithm most frequently delivers before reversing or continuing. Entering at the CE rather than at the edge of a zone dramatically improves risk-to-reward, because your stop stays at the full zone boundary while your entry is at the tightest, most precise level within it.',
    howToUse:
      'Mark the midpoint of any FVG or OB you plan to trade. This is your CE — set a limit order here or wait for price to reach this level and show a reaction (rejection wick, 1m CHoCH). Your stop goes beyond the full zone boundary, not just beyond the CE. The CE entry on a valid FVG or OB gives you the smallest stop with the same zone invalidation level. This is how you achieve 5R+ on entries that most traders take as 2R.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['CE', '50%', 'midpoint', 'consequent encroachment', 'precision', 'limit order', 'FVG midpoint'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'CE of a FVG is where price reacts most sharply — the midpoint of an FVG is the highest-probability entry within it.' },
      { conceptId: 'order-block', strength: 3, note: 'CE of an OB turns a wide zone into a precise limit entry — dramatically improves the risk-to-reward.' },
      { conceptId: 'ote', strength: 2, note: 'OTE and CE both refine wide zones into precise entries — CE operates within a single PD array, OTE across the full swing.' },
      { conceptId: 'premium-discount', strength: 2, note: 'CE is premium/discount applied at the micro level — the 50% of the specific zone rather than the full range.' },
      { conceptId: 'mitigation-block', strength: 2, note: 'CE of a mitigation block narrows continuation entries to the exact midpoint of the zone.' },
      { conceptId: 'rejection-block', strength: 2, note: 'The CE of a rejection block body is often the tightest entry within the zone with the cleanest R:R.' },
    ],
  },
  {
    id: 'cisd',
    name: 'Change in State of Delivery (CISD)',
    shortName: 'CISD',
    tier: 'advanced',
    category: 'entry',
    description:
      'Change in State of Delivery — the moment the algorithm shifts from one directional delivery to another, confirmed by a candle closing through a recent swing point with momentum. On the 1m chart, a CISD is your entry trigger: after all HTF confluence is in place (PD array, kill zone, DOL), the CISD is the lowest-timeframe confirmation that delivery has actually flipped. A bullish CISD: a 1m candle closes above the most recent 1m swing high after SSL was swept. Bearish CISD: closes below the most recent swing low after BSL was swept.',
    howToUse:
      'Set up all HTF confluence first (4H/1H OB or FVG, daily bias, kill zone, DOL identified). Drop to 1m. Wait for a liquidity sweep (SSL for longs, BSL for shorts). The CISD is the first candle that closes above the most recent 1m swing high (bullish) or below the most recent 1m swing low (bearish). This candle IS the entry signal. Stop goes below the sweep wick. Target is the nearest opposing liquidity. CISD without HTF confluence is noise — always qualify it top-down.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['CISD', 'delivery', 'state change', '1m', 'trigger', 'flip', 'CHoCH', 'entry confirmation'],
    synergies: [
      { conceptId: 'market-structure', strength: 3, note: 'CISD is a micro-CHoCH — the structural shift on the 1m that confirms the larger timeframe intent.' },
      { conceptId: 'rejection-block', strength: 3, note: 'The CISD candle often forms directly on or within a rejection block — two confirmations stacked.' },
      { conceptId: 'displacement', strength: 3, note: 'CISD IS a form of displacement — the delivery-change candle must close through the swing with momentum.' },
      { conceptId: 'liquidity', strength: 2, note: 'CISD only has meaning after a liquidity sweep — the sweep creates the conditions for the delivery flip.' },
      { conceptId: 'kill-zones', strength: 2, note: 'CISD within a kill zone (10AM–11AM, 2PM–3PM) is highest probability — time + delivery confirmation.' },
      { conceptId: 'silver-bullet', strength: 2, note: 'Silver Bullet entries are often triggered by a CISD within the 10–11AM window.' },
    ],
  },
  {
    id: 'iofed',
    name: 'ICT Entry Drill (IOFED)',
    shortName: 'IOFED',
    tier: 'advanced',
    category: 'model',
    description:
      'The Institutional Order Flow Entry Drill — ICT\'s formal 3-step entry confirmation sequence. Step 1: a Change of Character (CHoCH) on the entry timeframe confirms a structural shift in the intended direction. Step 2: Inducement is built and swept, confirming smart money has absorbed retail positions. Step 3: The resulting displacement creates an Order Block or FVG which is then entered on the retest. Every step must complete in sequence — no shortcuts.',
    howToUse:
      'Wait for a CHoCH on your entry timeframe (1m or 5m) — this is your trigger to start the sequence. Identify the inducement level that forms after the CHoCH. Wait for that inducement to be swept. After the sweep, displacement should create an OB or FVG. Enter the retest of that OB/FVG. If any step is missing or unclear, there is no trade. The IOFED makes impulsive entries structurally impossible.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['IOFED', 'entry drill', 'CHoCH', 'inducement', 'order block', 'sequence', 'confirmation', '3 step'],
    synergies: [
      { conceptId: 'market-structure', strength: 3, note: 'CHoCH is step 1 of IOFED — without structural confirmation, the drill never starts.' },
      { conceptId: 'inducement', strength: 3, note: 'Step 2 of IOFED is the inducement sweep — it is mandatory confirmation that smart money has positioned.' },
      { conceptId: 'order-block', strength: 3, note: 'Step 3 of IOFED is the OB retest — the entry is always from a PD array, never chased.' },
      { conceptId: 'fvg', strength: 2, note: 'An FVG can replace the OB as the step 3 entry zone — whichever is created by the post-IDM displacement.' },
      { conceptId: 'displacement', strength: 2, note: 'Displacement after the inducement sweep creates the step 3 PD array — no displacement means no valid entry zone.' },
      { conceptId: 'market-maker-buy', strength: 2, note: 'IOFED is the entry mechanism that executes within the OTE phase of the MM buy model.' },
      { conceptId: 'market-maker-sell', strength: 2, note: 'IOFED is the entry mechanism that executes within the OTE phase of the MM sell model.' },
    ],
  },
  {
    id: 'bpr',
    name: 'Balanced Price Range (BPR)',
    shortName: 'BPR',
    tier: 'advanced',
    category: 'entry',
    description:
      'The overlap zone created when a bullish Fair Value Gap and a bearish Fair Value Gap share the same price area. The overlap represents true equilibrium — both sides of the market have inefficiencies that cancel out, creating a concentrated reaction zone where institutional buy and sell orders are stacked on top of each other. Price respects the BPR with precision because of this dual-order density. The midpoint (CE of the BPR) is the highest-probability reaction level within it.',
    howToUse:
      'Identify a bullish FVG and a bearish FVG that overlap at any portion. Mark only the overlap as the BPR box. Treat the midpoint (CE) as your primary entry level — set a limit there or wait for a rejection wick at that level. BPRs form most commonly after displacement moves where price gaps in one direction and then creates an opposing gap on the immediate pullback. Combine with kill zone timing and HTF structure alignment for maximum conviction.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['BPR', 'balanced price range', 'overlapping FVG', 'equilibrium zone', 'CE', 'dual gap'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'BPR is two overlapping FVGs — it cannot exist without at least two valid FVGs sharing price real estate.' },
      { conceptId: 'consequent-encroachment', strength: 3, note: 'CE of the BPR overlap is the tightest possible setup in ICT — midpoint of an already-narrow confluence zone.' },
      { conceptId: 'displacement', strength: 2, note: 'BPRs most commonly form when opposing displacements leave overlapping gaps — fast moves in both directions creating the dual-gap overlap.' },
      { conceptId: 'volume-imbalance', strength: 2, note: 'A Volume Imbalance within the BPR overlap stacks three layers of imbalance in the same area — extremely high-reaction zone.' },
      { conceptId: 'order-block', strength: 2, note: 'An OB that overlaps with a BPR creates one of the most confluent PD arrays possible — three zones (OB, bullish FVG, bearish FVG) in the same price.' },
      { conceptId: 'premium-discount', strength: 2, note: 'BPR acts as a micro-equilibrium zone — discount within a premium area, or premium within a discount area, depending on context.' },
    ],
  },
  {
    id: 'liquidity-void',
    name: 'Liquidity Void',
    shortName: 'Liquidity Void',
    tier: 'advanced',
    category: 'structure',
    description:
      'An area of extreme one-directional price delivery where consecutive candles share no wick-to-wick overlap — not even between wicks. A Liquidity Void is more aggressive than a standard FVG or displacement: it spans multiple candles in the same direction with zero retracement, indicating institutional urgency at a scale that bypasses normal price delivery. Because the area was never traded at any level, the algorithm is programmed to return and fill the entire void before price can sustain a move in the opposite direction.',
    howToUse:
      'Identify a run of consecutive candles all in one direction with no wick-to-wick overlap between any of them. Mark the full range as a Liquidity Void box. This zone WILL be filled — treat it as an obligation, not a possibility. Use the void as a target when you\'re positioned before it\'s filled, or as a high-probability entry zone on the first return. Enter at the top of the void on bearish fills or the bottom on bullish fills, targeting the full fill. First fills of liquidity voids are among the cleanest high-R setups in the methodology.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['liquidity void', 'void', 'price void', 'one-sided delivery', 'extreme imbalance', 'must fill'],
    synergies: [
      { conceptId: 'fvg', strength: 3, note: 'A Liquidity Void is a stack of nested FVGs — the entire non-overlapping sequence contains multiple FVGs compressed together.' },
      { conceptId: 'displacement', strength: 3, note: 'Liquidity Voids are created by extreme displacement — they\'re the most aggressive expression of institutional velocity in the methodology.' },
      { conceptId: 'volume-imbalance', strength: 2, note: 'A Liquidity Void contains multiple Volume Imbalances stacked consecutively — filling the void fills all of them at once.' },
      { conceptId: 'draw-on-liquidity', strength: 2, note: 'An unfilled Liquidity Void is always a DOL — the algorithm is unconditionally drawn back to fill what it skipped.' },
      { conceptId: 'market-structure', strength: 2, note: 'Liquidity Voids almost always cross structural levels — a BOS through a Void is the most impulsive structural break possible.' },
    ],
  },
  {
    id: 'london-close-model',
    name: 'London Close Model',
    shortName: 'London Close',
    tier: 'advanced',
    category: 'model',
    description:
      'ICT\'s reversal setup that runs during the London close window (10:00–11:00 AM EST). At this time, London traders square positions and the algorithm frequently reverses the AM direction before the afternoon session. The model: (1) Price establishes an AM high or low during the London/NY overlap (8:30–10 AM), (2) at the London close window, price sweeps that AM extreme — collecting BSL or SSL, (3) a CHoCH and FVG form on the reversal, (4) the NY PM session delivers to the opposing AM extreme. This model explains the classic structure of trending AM, reversing PM days on NQ and ES.',
    howToUse:
      'After the NY AM kill zone, mark the session high and low. When 10:00 AM arrives, watch for price to briefly exceed one of those levels and reverse — that\'s the London close sweep. The FVG created on the reversal is your entry. Target the opposing AM extreme as your DOL for the afternoon. This model is most reliable on Tuesdays and Thursdays and least reliable on Mondays and Fridays. Daily bias determines which AM extreme gets swept — bullish days sweep the AM low before the PM run up; bearish days sweep the AM high.',
    instruments: ['NQ', 'ES'],
    tags: ['London close', '10AM model', 'AM reversal', 'afternoon reversal', 'session close', 'PM setup'],
    synergies: [
      { conceptId: 'silver-bullet', strength: 3, note: 'The 10–11 AM Silver Bullet window IS the London Close model entry window — they describe the same setup from different angles.' },
      { conceptId: 'kill-zones', strength: 3, note: 'London Close model is defined by the 10–11 AM kill zone boundary — timing is the entire trigger mechanism.' },
      { conceptId: 'amd', strength: 2, note: 'The London close sweep is the Manipulation phase of the PM AMD cycle — it sets up the afternoon Distribution.' },
      { conceptId: 'judas-swing', strength: 2, note: 'The London close sweep of the AM extreme is a micro Judas — a false continuation that sets up the PM reversal.' },
      { conceptId: 'fvg', strength: 2, note: 'The reversal off the London close sweep creates the entry FVG — that specific FVG formed at the 10 AM reversal is the trade.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Daily bias determines whether the London close sweep targets the AM high (bearish day) or AM low (bullish day).' },
    ],
  },

  // ─── EXPANSION SET (2026-07-14) ────────────────────────────────────────────
  {
    id: 'smt-divergence',
    name: 'SMT Divergence',
    shortName: 'SMT Divergence',
    tier: 'advanced',
    category: 'bias',
    description:
      'Smart Money Technique divergence. Correlated instruments — ES & NQ, EUR & GBP, GC & SI — are delivered by the same algorithm and should move in lockstep. When one makes a higher high (or lower low) into a liquidity level and its pair FAILS to confirm, that non-confirmation exposes smart money\'s hand: the asset that could not make the new extreme is the weak one, and the divergence prints right at the reversal.',
    howToUse:
      'Overlay a correlated pair (NQ against ES is the cleanest on index futures). At a key BSL/SSL level, check whether both instruments swept liquidity or only one. If NQ makes a higher high but ES makes a lower high, that bearish SMT is your reversal signal — trade short in the direction of the non-confirming asset. SMT is confirmation, not an entry: pair it with a CHoCH and an FVG to time the trade.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['SMT', 'divergence', 'correlation', 'smart money technique', 'ES NQ', 'confirmation'],
    synergies: [
      { conceptId: 'liquidity', strength: 3, note: 'SMT prints when one asset sweeps a liquidity pool and its correlated pair refuses to — the divergence is a liquidity story.' },
      { conceptId: 'turtle-soup', strength: 3, note: 'A Turtle Soup sweep confirmed by SMT divergence on the correlated pair is one of the highest-conviction reversals in ICT.' },
      { conceptId: 'market-structure', strength: 2, note: 'SMT flags the reversal; the following CHoCH confirms structure has actually shifted.' },
      { conceptId: 'judas-swing', strength: 2, note: 'The Judas swing on one index frequently fails to be confirmed by its pair — that failure is the SMT.' },
      { conceptId: 'daily-bias', strength: 2, note: 'SMT at a HTF PD array is a powerful tell for the day\'s true directional bias.' },
    ],
  },
  {
    id: 'unicorn-model',
    name: 'Unicorn Model (Breaker + FVG)',
    shortName: 'Unicorn Model',
    tier: 'advanced',
    category: 'model',
    description:
      'The Unicorn is a Breaker Block that overlaps a Fair Value Gap in the exact same price zone. When a breaker (a failed order block that price has reclaimed) sits on top of an unfilled FVG, two independent PD arrays confirm the same level — a rare, A+ confluence. The overlap zone is defended aggressively because institutional orders sit there for two reasons at once.',
    howToUse:
      'After a liquidity sweep and displacement, identify the breaker block formed by the failed swing. Then look for an FVG left by that same displacement leg. Where the breaker and FVG overlap is the Unicorn entry — enter on the first tap of the overlap, stop beyond the breaker origin, and target the opposing liquidity. Best taken during a kill zone with SMT confirmation.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['unicorn', 'breaker', 'FVG', 'overlap', 'confluence', 'A+ setup'],
    synergies: [
      { conceptId: 'breaker-block', strength: 3, note: 'The breaker is half of the Unicorn — no breaker, no unicorn.' },
      { conceptId: 'fvg', strength: 3, note: 'The FVG overlapping the breaker is the other half — the overlap itself is the edge.' },
      { conceptId: 'displacement', strength: 2, note: 'The same displacement leg that forms the breaker leaves the FVG — displacement is what creates both.' },
      { conceptId: 'smt-divergence', strength: 2, note: 'A Unicorn confirmed by SMT on the correlated pair is about as high-conviction as an entry gets.' },
      { conceptId: 'market-structure', strength: 2, note: 'The Unicorn forms on the CHoCH leg — structure context tells you which direction the overlap defends.' },
    ],
  },
  {
    id: 'standard-deviation',
    name: 'Standard Deviation Projections',
    shortName: 'Std Dev Projections',
    tier: 'advanced',
    category: 'model',
    description:
      'A targeting tool. Once a liquidity sweep and displacement create a manipulation leg, that leg can be projected forward in standard-deviation multiples (-1, -2, -2.5, -4 SD) to forecast where price is drawn. The algorithm delivers price in measured, symmetrical legs, so the SD projections off the CE of the setup mark the liquidity the move is reaching for.',
    howToUse:
      'Measure from the swing origin to the Consequent Encroachment (50%) of the FVG or setup. Project standard-deviation extensions in the trade direction. The -2 and -2.5 SD levels are the most common terminus for an intraday leg; -4 SD marks an exhaustion draw. Use these as profit targets and to confirm whether a resting liquidity pool aligns with a natural projection.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['standard deviation', 'projection', 'targets', 'symmetry', 'measured move', 'SD'],
    synergies: [
      { conceptId: 'consequent-encroachment', strength: 3, note: 'SD projections are anchored to the CE of the setup — the 50% level is the pivot the deviations extend from.' },
      { conceptId: 'draw-on-liquidity', strength: 3, note: 'When an SD projection lands exactly on a resting liquidity pool, that pool becomes the highest-probability draw.' },
      { conceptId: 'displacement', strength: 2, note: 'The displacement leg is what you measure — no clean impulse, no reliable projection.' },
      { conceptId: 'fvg', strength: 2, note: 'The FVG defines the leg being projected; its CE is the anchor for the deviations.' },
      { conceptId: 'quarterly-theory', strength: 1, note: 'SD legs often align with quarterly-theory expansion phases — the projection times as well as targets.' },
    ],
  },
  {
    id: 'propulsion-block',
    name: 'Propulsion Block',
    shortName: 'Propulsion Block',
    tier: 'intermediate',
    category: 'entry',
    description:
      'An order block that forms inside the range of a prior order block and pushes price further in the original OB\'s direction. When price returns to an OB and, instead of reversing cleanly, builds a fresh OB nested within it before continuing, that nested block is the Propulsion Block — it reinforces the parent OB and offers a tighter, later re-entry with a smaller stop.',
    howToUse:
      'Mark your primary OB. On the retracement into it, watch for a smaller opposing candle that forms within the OB\'s range and then displaces onward — that is the propulsion block. Enter from the propulsion block rather than the full OB for a tighter stop and better R. It is a continuation tool, not a reversal tool.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['propulsion', 'order block', 'nested', 'continuation', 're-entry', 'PD array'],
    synergies: [
      { conceptId: 'order-block', strength: 3, note: 'A propulsion block is an OB nested inside another OB — it only exists in relation to its parent.' },
      { conceptId: 'displacement', strength: 2, note: 'The propulsion block is validated by the displacement that leaves it — same rule as any OB.' },
      { conceptId: 'fvg', strength: 2, note: 'Propulsion blocks frequently pair with a small FVG from the same continuation leg for a tighter entry.' },
      { conceptId: 'mitigation-block', strength: 2, note: 'Know the difference: a mitigation block re-tests a failed move; a propulsion block reinforces a working one.' },
      { conceptId: 'market-structure', strength: 1, note: 'Propulsion blocks form mid-trend after a BOS — structure tells you the continuation is valid.' },
    ],
  },
  {
    id: 'power-of-three',
    name: 'Power of Three (PO3)',
    shortName: 'Power of Three',
    tier: 'intermediate',
    category: 'model',
    description:
      'The accumulation → manipulation → distribution cycle compressed into a single candle (daily or weekly). The candle opens near one extreme (accumulation), wicks against the true direction to grab liquidity (manipulation — the "Judas" leg), then expands and closes toward the opposite extreme (distribution). Where AMD describes the intraday session framework, PO3 is the same logic read on one higher-timeframe candle.',
    howToUse:
      'On the daily candle, treat the open as the reference. Expect the open to be manipulated AGAINST the intended close first: on a bullish day, price typically dips below the open to sweep sell-side before expanding up. Use midnight/8:30 opens to frame accumulation, wait for the manipulation sweep, then position toward the projected close. Bias determines which side gets manipulated.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['power of three', 'PO3', 'accumulation', 'manipulation', 'distribution', 'daily candle'],
    synergies: [
      { conceptId: 'amd', strength: 3, note: 'PO3 and AMD are the same three-phase logic — AMD across a session, PO3 within one HTF candle.' },
      { conceptId: 'judas-swing', strength: 3, note: 'The manipulation leg of PO3 IS the Judas swing — the false move against the true daily direction.' },
      { conceptId: 'key-opens', strength: 2, note: 'The candle open (midnight, 8:30) is the accumulation reference PO3 is measured from.' },
      { conceptId: 'daily-bias', strength: 2, note: 'Daily bias tells you which extreme is accumulation and which is the distribution target.' },
      { conceptId: 'quarterly-theory', strength: 2, note: 'Quarterly theory nests PO3 — each quarter of the candle plays its own accumulation/manipulation/distribution role.' },
    ],
  },
  {
    id: 'vacuum-block',
    name: 'Vacuum Block',
    shortName: 'Vacuum Block',
    tier: 'advanced',
    category: 'entry',
    description:
      'The price void left by a runaway open-to-open gap — most often a news-driven or session-open gap where price jumps with no traded liquidity in between. Unlike a normal FVG (formed by three-candle displacement inside a session), a Vacuum Block is created by an actual gap in delivery. The market treats it as an obligation and is drawn back to fill the vacuum.',
    howToUse:
      'Mark the gap from the prior close/last traded level to the reopen. Treat the unfilled vacuum as a magnet — a draw on liquidity. On the return, the edge of the vacuum block often provides a clean reversal or continuation entry as the gap rebalances. Vacuum blocks around high-impact news require the algorithm to eventually revisit the untraded prices.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['vacuum block', 'runaway gap', 'news gap', 'rebalance', 'draw', 'must fill'],
    synergies: [
      { conceptId: 'opening-gaps', strength: 3, note: 'A vacuum block is an opening gap in its most aggressive form — the same rebalancing logic on a runaway move.' },
      { conceptId: 'liquidity-void', strength: 2, note: 'Both are must-fill voids; the vacuum block is created by an actual gap rather than one-sided candle delivery.' },
      { conceptId: 'draw-on-liquidity', strength: 2, note: 'An unfilled vacuum block is unconditionally a DOL — the algorithm is drawn to revisit untraded prices.' },
      { conceptId: 'displacement', strength: 2, note: 'The velocity that creates the vacuum is extreme displacement — the fill often displaces just as hard.' },
      { conceptId: 'fvg', strength: 1, note: 'Read the vacuum block like a large FVG: consequent encroachment and edges act as the same reaction levels.' },
    ],
  },
  {
    id: 'reference-levels',
    name: 'Institutional Reference Levels',
    shortName: 'Reference Levels',
    tier: 'intermediate',
    category: 'structure',
    description:
      'The round-number "banking" levels institutions reference — the 00, 20, 50, 80 handles and their .50 midpoints on index futures. Liquidity clusters and reactions concentrate around these levels because they are the coordinates algorithms and desks anchor to. They are not a standalone signal but a lens that sharpens every other PD array landing near them.',
    howToUse:
      'Note the nearest quarter levels (e.g. NQ 20050, 20080, 20100). When a PD array — an OB, FVG, or breaker — lands on or near a reference level, treat that confluence as higher quality. Equal highs/lows and session opens that sit on reference levels are especially clean liquidity. Use them to refine targets and stop placement, never in isolation.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['reference levels', 'quarter levels', 'round numbers', 'banking levels', 'handles', 'confluence'],
    synergies: [
      { conceptId: 'liquidity', strength: 2, note: 'Stops pool at round numbers — reference levels mark where engineered liquidity naturally builds.' },
      { conceptId: 'premium-discount', strength: 2, note: 'A reference level that coincides with range equilibrium is a high-confidence pivot for premium/discount reads.' },
      { conceptId: 'order-block', strength: 2, note: 'An OB sitting on a reference level is materially higher quality than one in open air.' },
      { conceptId: 'key-opens', strength: 2, note: 'Session opens landing on a reference level compound the significance of both.' },
      { conceptId: 'consequent-encroachment', strength: 1, note: 'When a PD array\'s CE aligns with a reference level, the reaction zone tightens to a precise price.' },
    ],
  },
  {
    id: 'lrlr-hrlr',
    name: 'Low / High Resistance Liquidity Runs',
    shortName: 'LRLR / HRLR',
    tier: 'intermediate',
    category: 'liquidity',
    description:
      'A read on the QUALITY of the path to a draw on liquidity. A Low Resistance Liquidity Run (LRLR) has a clean path — few opposing order blocks or FVGs between price and the target — so the algorithm runs to it easily. A High Resistance Liquidity Run (HRLR) is a messy path littered with opposing PD arrays, so the run stalls, chops, and often fails. The distinction tells you which liquidity targets to trust.',
    howToUse:
      'Before targeting a liquidity pool, inspect the space between price and that pool. If it is clean (LRLR), take the target with confidence and hold for the full run. If opposing arrays clutter the path (HRLR), expect a grind — reduce size, tighten targets, or stand aside. LRLR toward a HTF draw during a kill zone is the ideal trend day condition.',
    instruments: ['NQ', 'ES', 'GC', 'SI'],
    tags: ['LRLR', 'HRLR', 'low resistance', 'high resistance', 'liquidity run', 'path'],
    synergies: [
      { conceptId: 'draw-on-liquidity', strength: 3, note: 'LRLR/HRLR grades the path to the DOL — they answer "how cleanly will price reach the draw?"' },
      { conceptId: 'liquidity', strength: 3, note: 'The run targets a liquidity pool; resistance level tells you how reliably it gets there.' },
      { conceptId: 'engineered-liquidity', strength: 2, note: 'Engineered liquidity at the end of a low-resistance path is a prime trend-day target.' },
      { conceptId: 'market-structure', strength: 2, note: 'A clean LRLR usually accompanies a fresh BOS with no opposing structure in the way.' },
      { conceptId: 'fvg', strength: 1, note: 'Unfilled opposing FVGs in the path are exactly what turns an LRLR into an HRLR.' },
    ],
  },
]

export const getConceptById = (id: string) => concepts.find(c => c.id === id)

export const getSynergiesFor = (conceptIds: string[]) => {
  const synergyMap = new Map<string, { strength: number; notes: string[]; conceptA: string; conceptB: string }>()

  for (const id of conceptIds) {
    const concept = getConceptById(id)
    if (!concept) continue

    for (const syn of concept.synergies) {
      if (!conceptIds.includes(syn.conceptId)) continue
      const key = [id, syn.conceptId].sort().join('--')
      if (!synergyMap.has(key)) {
        synergyMap.set(key, {
          strength: syn.strength,
          notes: [syn.note],
          conceptA: id,
          conceptB: syn.conceptId,
        })
      }
    }
  }

  return Array.from(synergyMap.values()).sort((a, b) => b.strength - a.strength)
}
