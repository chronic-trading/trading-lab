// Hand-crafted SVG diagrams for each ICT concept.
// viewBox 300×140. Candle spec: [x, openY, closeY, highY, lowY]
// bull = openY > closeY (price went up). Candle width = 20px.

type CS = [number, number, number, number, number]

interface Zone  { x:number;y:number;w:number;h:number;type:'amber'|'blue'|'green'|'red'|'purple'|'slate';label?:string }
interface Line  { x1:number;y1:number;x2:number;y2:number;color:string;dashed?:boolean;label?:string;lx?:number;ly?:number }
interface Arrow { x:number;y:number;dir:'up'|'down';color:string;label?:string }
interface Badge { x:number;y:number;text:string;bg:string;fg:string }
interface Scene { candles:CS[];zones?:Zone[];lines?:Line[];arrows?:Arrow[];badges?:Badge[] }

const ZC = {
  amber:  { fill:'rgba(245,158,11,0.13)',  stroke:'rgba(245,158,11,0.6)'   },
  blue:   { fill:'rgba(96,165,250,0.12)',  stroke:'rgba(96,165,250,0.55)'  },
  green:  { fill:'rgba(52,211,153,0.12)',  stroke:'rgba(52,211,153,0.55)'  },
  red:    { fill:'rgba(248,113,113,0.12)', stroke:'rgba(248,113,113,0.55)' },
  purple: { fill:'rgba(192,132,252,0.12)', stroke:'rgba(192,132,252,0.55)' },
  slate:  { fill:'rgba(100,116,139,0.10)', stroke:'rgba(100,116,139,0.4)'  },
}
const BULL = '#34d399'
const BEAR = '#f87171'
const W    = 20

// ── Scene definitions ─────────────────────────────────────────────────────────

const SCENES: Record<string, (dir:'long'|'short') => Scene> = {

  fvg(dir) {
    // Bullish: zone from C1.hy(79) to C3.ly(58) — C3.ly < C1.hy ✓
    // Bearish: zone from C1.ly(68) to C3.hy(90) — C3.hy > C1.ly ✓
    return dir === 'long' ? {
      candles: [
        [10,86,74,80,92],[36,76,88,72,94],
        [62,84,96,79,100],[88,98,24,20,103],[114,28,42,22,58],
        [140,44,34,29,50],[166,36,50,32,55],[192,52,68,48,72],[218,66,52,48,70],
      ],
      zones:  [{ x:88,y:58,w:152,h:21,type:'amber',label:'FVG' }],
      lines:  [
        { x1:88,y1:79,x2:240,y2:79,color:'rgba(245,158,11,0.4)',dashed:true },
        { x1:88,y1:58,x2:240,y2:58,color:'rgba(245,158,11,0.4)',dashed:true },
      ],
      arrows: [{ x:228,y:44,dir:'up',color:BULL,label:'ENTRY' }],
    } : {
      candles: [
        [10,90,78,86,95],[36,80,68,76,85],
        [62,64,56,60,68],[88,58,110,54,114],[114,104,92,90,110],
        [140,106,98,94,112],[166,100,90,86,104],[192,92,80,76,98],[218,82,96,78,100],
      ],
      zones:  [{ x:88,y:68,w:152,h:22,type:'amber',label:'FVG' }],
      lines:  [
        { x1:88,y1:68,x2:240,y2:68,color:'rgba(245,158,11,0.4)',dashed:true },
        { x1:88,y1:90,x2:240,y2:90,color:'rgba(245,158,11,0.4)',dashed:true },
      ],
      arrows: [{ x:228,y:102,dir:'down',color:BEAR,label:'ENTRY' }],
    }
  },

  'order-block'(dir) {
    return dir === 'short' ? {
      candles: [
        [10,95,75,68,102],[36,72,55,48,78],
        [62,53,36,29,58],[88,33,92,26,98],
        [114,88,105,82,110],[140,102,62,58,108],
        [166,60,42,34,65],[192,40,72,35,78],[218,70,95,65,100],
      ],
      zones:  [{ x:62,y:29,w:180,h:29,type:'blue',label:'OB' }],
      lines:  [
        { x1:62,y1:29,x2:242,y2:29,color:'rgba(96,165,250,0.4)',dashed:true },
        { x1:62,y1:58,x2:242,y2:58,color:'rgba(96,165,250,0.4)',dashed:true },
      ],
      arrows: [{ x:202,y:104,dir:'down',color:BEAR,label:'ENTRY' }],
    } : {
      candles: [
        [10,40,60,34,66],[36,57,75,50,82],
        [62,72,88,66,94],[88,92,32,25,98],
        [114,35,18,12,40],[140,20,56,16,60],
        [166,58,74,52,78],[192,75,55,48,80],[218,56,36,30,60],
      ],
      zones:  [{ x:62,y:66,w:180,h:28,type:'blue',label:'OB' }],
      lines:  [
        { x1:62,y1:66,x2:242,y2:66,color:'rgba(96,165,250,0.4)',dashed:true },
        { x1:62,y1:94,x2:242,y2:94,color:'rgba(96,165,250,0.4)',dashed:true },
      ],
      arrows: [{ x:202,y:44,dir:'up',color:BULL,label:'ENTRY' }],
    }
  },

  liquidity(dir) {
    return dir === 'long' ? {
      candles: [
        [10,78,55,50,84],[36,52,76,46,82],
        [62,73,56,50,79],[88,53,79,47,84],
        [114,77,58,53,82],[140,55,96,49,112],
        [166,108,65,60,113],[192,63,42,36,68],[218,40,25,20,45],
      ],
      zones:  [{ x:10,y:80,w:160,h:4,type:'red' }],
      lines:  [{ x1:10,y1:82,x2:152,y2:82,color:'rgba(248,113,113,0.6)',dashed:true,label:'Equal Lows',lx:14,ly:78 }],
      arrows: [{ x:176,y:54,dir:'up',color:BULL,label:'ENTRY' }],
      badges: [{ x:138,y:106,text:'SWEEP',bg:'rgba(248,113,113,0.2)',fg:'#f87171' }],
    } : {
      candles: [
        [10,42,62,36,68],[36,60,38,33,64],
        [62,40,60,35,66],[88,58,40,32,62],
        [114,42,60,36,65],[140,55,28,12,58],
        [166,16,55,11,58],[192,53,72,48,77],[218,70,90,66,95],
      ],
      zones:  [{ x:10,y:32,w:160,h:4,type:'red' }],
      lines:  [{ x1:10,y1:34,x2:152,y2:34,color:'rgba(248,113,113,0.6)',dashed:true,label:'Equal Highs',lx:14,ly:28 }],
      arrows: [{ x:176,y:66,dir:'down',color:BEAR,label:'ENTRY' }],
      badges: [{ x:138,y:20,text:'SWEEP',bg:'rgba(248,113,113,0.2)',fg:'#f87171' }],
    }
  },

  'market-structure'(dir) {
    return dir === 'short' ? {
      candles: [
        [10,78,50,43,84],[36,48,72,42,78],
        [62,69,56,52,74],[88,53,82,47,88],
        [114,79,65,60,84],[140,62,90,57,95],
        [166,87,68,62,92],[192,65,95,60,100],
      ],
      lines:  [{ x1:10,y1:88,x2:220,y2:88,color:'rgba(248,113,113,0.6)',dashed:true,label:'BOS ↓',lx:148,ly:83 }],
      arrows: [{ x:150,y:100,dir:'down',color:BEAR,label:'BOS ENTRY' }],
      badges: [
        { x:10,y:40,text:'LH',bg:'rgba(100,116,139,0.15)',fg:'#94a3b8' },
        { x:62,y:49,text:'LH',bg:'rgba(100,116,139,0.15)',fg:'#94a3b8' },
      ],
    } : {
      candles: [
        [10,55,82,49,88],[36,80,60,54,86],
        [62,62,80,56,86],[88,78,52,45,83],
        [114,54,72,48,78],[140,70,44,37,75],
        [166,46,62,40,66],[192,60,38,32,64],
      ],
      lines:  [{ x1:10,y1:52,x2:220,y2:52,color:'rgba(52,211,153,0.6)',dashed:true,label:'CHoCH ↑',lx:148,ly:47 }],
      arrows: [{ x:150,y:38,dir:'up',color:BULL,label:'CHoCH ENTRY' }],
      badges: [
        { x:10,y:86,text:'HL',bg:'rgba(100,116,139,0.15)',fg:'#94a3b8' },
        { x:62,y:84,text:'HL',bg:'rgba(100,116,139,0.15)',fg:'#94a3b8' },
      ],
    }
  },

  amd(dir) {
    return dir === 'long' ? {
      candles: [
        [10,65,60,57,70],[36,62,67,58,72],[62,66,62,60,70],
        [88,64,100,59,108],
        [114,106,72,66,110],[140,70,48,42,74],[166,50,32,26,54],[192,33,18,13,37],[218,19,8,4,23],
      ],
      zones: [
        { x:10,y:56,w:78,h:18,type:'slate',label:'A' },
        { x:88,y:58,w:26,h:52,type:'red',label:'M' },
        { x:114,y:6,w:130,h:68,type:'green',label:'D' },
      ],
      arrows: [{ x:124,y:60,dir:'up',color:BULL,label:'ENTRY' }],
    } : {
      candles: [
        [10,55,60,50,65],[36,58,53,50,62],[62,55,60,51,64],
        [88,58,20,14,62],
        [114,18,55,14,58],[140,52,72,48,76],[166,68,88,64,92],[192,85,102,80,108],[218,99,112,95,116],
      ],
      zones: [
        { x:10,y:48,w:78,h:18,type:'slate',label:'A' },
        { x:88,y:12,w:26,h:52,type:'green',label:'M' },
        { x:114,y:52,w:130,h:68,type:'red',label:'D' },
      ],
      arrows: [{ x:124,y:68,dir:'down',color:BEAR,label:'ENTRY' }],
    }
  },

  displacement(dir) {
    return dir === 'long' ? {
      candles: [
        [10,40,58,34,64],[36,55,72,48,78],[62,69,82,63,88],
        [88,86,12,5,92],
        [114,14,7,3,20],[140,8,4,2,12],[166,5,30,2,34],[192,33,20,16,37],[218,22,10,6,26],
      ],
      zones:  [{ x:62,y:20,w:180,h:43,type:'amber',label:'FVG' }],
      lines:  [
        { x1:62,y1:20,x2:242,y2:20,color:'rgba(245,158,11,0.4)',dashed:true },
        { x1:62,y1:63,x2:242,y2:63,color:'rgba(245,158,11,0.4)',dashed:true },
      ],
      arrows: [{ x:202,y:8,dir:'up',color:BULL,label:'ENTRY' }],
      badges: [{ x:88,y:3,text:'DISPLACEMENT',bg:'rgba(52,211,153,0.15)',fg:'#34d399' }],
    } : {
      candles: [
        [10,88,70,64,94],[36,72,55,48,78],[62,55,40,33,60],
        [88,36,110,30,116],
        [114,108,115,102,120],[140,113,120,108,124],[166,119,90,115,122],[192,88,100,84,106],[218,98,116,94,120],
      ],
      zones:  [{ x:62,y:60,w:180,h:42,type:'amber',label:'FVG' }],
      lines:  [
        { x1:62,y1:60,x2:242,y2:60,color:'rgba(245,158,11,0.4)',dashed:true },
        { x1:62,y1:102,x2:242,y2:102,color:'rgba(245,158,11,0.4)',dashed:true },
      ],
      arrows: [{ x:202,y:116,dir:'down',color:BEAR,label:'ENTRY' }],
      badges: [{ x:88,y:128,text:'DISPLACEMENT',bg:'rgba(248,113,113,0.15)',fg:'#f87171' }],
    }
  },

  'judas-swing'(dir) {
    return dir === 'short' ? {
      candles: [
        [10,72,58,65,78],[36,60,68,55,74],[62,66,60,62,72],
        [88,62,18,11,66],
        [114,20,68,16,72],[140,65,88,60,94],[166,85,102,80,108],[192,100,118,95,122],
      ],
      zones:  [{ x:88,y:10,w:26,h:52,type:'red',label:'Judas' }],
      lines:  [{ x1:10,y1:62,x2:220,y2:62,color:'rgba(248,113,113,0.4)',dashed:true,label:'BSL',lx:16,ly:57 }],
      arrows: [{ x:124,y:82,dir:'down',color:BEAR,label:'ENTRY' }],
    } : {
      candles: [
        [10,52,65,46,70],[36,63,55,57,68],[62,57,63,51,68],
        [88,61,105,57,112],
        [114,108,55,104,112],[140,57,36,52,62],[166,38,22,34,44],[192,24,12,20,28],
      ],
      zones:  [{ x:88,y:60,w:26,h:54,type:'green',label:'Judas' }],
      lines:  [{ x1:10,y1:65,x2:220,y2:65,color:'rgba(52,211,153,0.4)',dashed:true,label:'SSL',lx:16,ly:70 }],
      arrows: [{ x:124,y:46,dir:'up',color:BULL,label:'ENTRY' }],
    }
  },

  'premium-discount'(dir) {
    return {
      candles: dir === 'long' ? [
        [10,30,50,24,56],[36,48,65,42,70],[62,63,80,58,86],[88,78,95,72,100],[114,93,108,88,114],
        [140,106,80,102,112],[166,78,58,72,84],[192,56,38,50,62],[218,36,22,30,40],
      ] : [
        [10,95,75,89,100],[36,73,55,67,78],[62,53,35,47,58],[88,33,18,27,38],[114,22,45,16,50],
        [140,43,62,37,68],[166,60,78,55,84],[192,76,95,70,100],[218,93,110,87,114],
      ],
      zones: [
        { x:10,y:12,w:280,h:58,type:'red',label:'Premium' },
        { x:10,y:70,w:280,h:58,type:'green',label:'Discount' },
      ],
      lines: [{ x1:10,y1:70,x2:290,y2:70,color:'rgba(148,163,184,0.5)',dashed:true,label:'EQ 50%',lx:14,ly:66 }],
      arrows: dir === 'long'
        ? [{ x:150,y:62,dir:'up',color:BULL,label:'BUY DISCOUNT' }]
        : [{ x:150,y:18,dir:'down',color:BEAR,label:'SELL PREMIUM' }],
    }
  },

  'breaker-block'(dir) {
    return dir === 'short' ? {
      candles: [
        [10,95,72,88,100],[36,70,48,42,74],[62,46,28,22,52],
        [88,25,98,19,104],[114,95,110,90,115],
        [140,108,70,64,114],[166,68,48,42,74],[192,46,78,40,84],[218,75,98,70,102],
      ],
      zones: [{ x:10,y:22,w:220,h:80,type:'blue',label:'OB → Breaker' }],
      lines: [
        { x1:10,y1:22,x2:230,y2:22,color:'rgba(96,165,250,0.4)',dashed:true },
        { x1:10,y1:102,x2:230,y2:102,color:'rgba(96,165,250,0.4)',dashed:true },
      ],
      arrows: [{ x:202,y:90,dir:'down',color:BEAR,label:'ENTRY' }],
      badges: [{ x:92,y:116,text:'OB VIOLATED → BREAKER',bg:'rgba(248,113,113,0.15)',fg:'#f87171' }],
    } : {
      candles: [
        [10,30,52,24,58],[36,50,68,44,74],[62,66,88,60,94],
        [88,85,14,8,92],[114,16,10,4,22],
        [140,12,50,8,54],[166,52,68,46,72],[192,70,52,44,74],[218,54,36,30,58],
      ],
      zones: [{ x:62,y:60,w:200,h:34,type:'green',label:'OB → Breaker' }],
      lines: [
        { x1:62,y1:60,x2:262,y2:60,color:'rgba(52,211,153,0.5)',dashed:true },
        { x1:62,y1:94,x2:262,y2:94,color:'rgba(52,211,153,0.5)',dashed:true },
      ],
      arrows: [{ x:202,y:40,dir:'up',color:BULL,label:'ENTRY' }],
      badges: [{ x:92,y:116,text:'OB VIOLATED → BREAKER',bg:'rgba(52,211,153,0.15)',fg:'#34d399' }],
    }
  },

  ote(dir) {
    return dir === 'long' ? {
      candles: [
        [10,95,70,88,100],[36,68,48,42,74],[62,46,28,22,52],
        [88,26,50,20,55],[114,48,65,43,70],[140,63,75,58,80],
        [166,77,65,72,82],[192,67,44,40,72],[218,46,25,20,50],
      ],
      zones: [{ x:88,y:62,w:120,h:20,type:'purple',label:'OTE 62-79%' }],
      lines: [
        { x1:10,y1:95,x2:240,y2:95,color:'rgba(148,163,184,0.3)',dashed:true,label:'Swing Low',lx:14,ly:102 },
        { x1:62,y1:22,x2:240,y2:22,color:'rgba(148,163,184,0.3)',dashed:true,label:'Swing High',lx:14,ly:18 },
      ],
      arrows: [{ x:176,y:54,dir:'up',color:BULL,label:'ENTRY' }],
    } : {
      candles: [
        [10,18,42,12,48],[36,40,62,35,68],[62,60,85,55,92],
        [88,83,62,58,88],[114,64,48,42,68],[140,46,36,30,50],
        [166,34,48,28,52],[192,46,68,40,72],[218,66,90,62,96],
      ],
      zones: [{ x:88,y:30,w:120,h:22,type:'purple',label:'OTE 62-79%' }],
      lines: [
        { x1:10,y1:22,x2:240,y2:22,color:'rgba(148,163,184,0.3)',dashed:true,label:'Swing High',lx:14,ly:18 },
        { x1:62,y1:92,x2:240,y2:92,color:'rgba(148,163,184,0.3)',dashed:true,label:'Swing Low',lx:14,ly:88 },
      ],
      arrows: [{ x:176,y:60,dir:'down',color:BEAR,label:'ENTRY' }],
    }
  },

  'ict-macros'(dir) {
    return dir === 'short' ? {
      candles: [
        [10,55,65,48,70],[36,62,52,56,68],[62,50,60,44,64],
        [88,58,26,18,62],[114,24,60,20,64],
        [140,62,80,56,84],[166,78,96,72,100],[192,94,110,88,114],
      ],
      zones: [
        { x:82,y:12,w:130,h:116,type:'purple',label:'Macro Window' },
        { x:110,y:24,w:26,h:38,type:'amber',label:'FVG' },
      ],
      lines: [{ x1:10,y1:58,x2:220,y2:58,color:'rgba(248,113,113,0.4)',dashed:true,label:'BSL',lx:16,ly:53 }],
      arrows: [{ x:124,y:76,dir:'down',color:BEAR,label:'ENTRY' }],
      badges: [{ x:86,y:130,text:'10:10 EST',bg:'rgba(192,132,252,0.15)',fg:'#c084fc' }],
    } : {
      candles: [
        [10,65,55,59,70],[36,58,68,52,72],[62,65,55,59,70],
        [88,60,95,56,101],[114,98,60,54,102],
        [140,62,44,58,68],[166,46,30,42,52],[192,32,18,28,38],
      ],
      zones: [
        { x:82,y:12,w:130,h:116,type:'purple',label:'Macro Window' },
        { x:110,y:58,w:26,h:38,type:'amber',label:'FVG' },
      ],
      lines: [{ x1:10,y1:65,x2:220,y2:65,color:'rgba(52,211,153,0.4)',dashed:true,label:'SSL',lx:16,ly:70 }],
      arrows: [{ x:124,y:40,dir:'up',color:BULL,label:'ENTRY' }],
      badges: [{ x:86,y:130,text:'10:10 EST',bg:'rgba(192,132,252,0.15)',fg:'#c084fc' }],
    }
  },

  'kill-zones'(dir) {
    return dir === 'long' ? {
      candles: [
        [10,68,62,63,74],[36,64,70,60,76],[62,68,64,62,72],
        [88,66,96,62,104],[114,100,62,58,106],
        [140,60,44,38,65],[166,42,26,20,48],[192,28,15,11,33],
      ],
      zones: [
        { x:82,y:12,w:210,h:116,type:'amber',label:'NY AM Kill Zone' },
        { x:10,y:58,w:78,h:20,type:'slate',label:'Asia Range' },
      ],
      lines: [{ x1:10,y1:66,x2:220,y2:66,color:'rgba(148,163,184,0.4)',dashed:true }],
      arrows: [{ x:124,y:48,dir:'up',color:BULL,label:'ENTRY' }],
    } : {
      candles: [
        [10,52,58,47,64],[36,56,52,50,60],[62,54,58,50,62],
        [88,56,22,16,60],[114,24,62,18,66],
        [140,60,78,55,83],[166,76,94,70,98],[192,92,108,86,112],
      ],
      zones: [
        { x:82,y:12,w:210,h:116,type:'amber',label:'NY AM Kill Zone' },
        { x:10,y:46,w:78,h:18,type:'slate',label:'Asia Range' },
      ],
      lines: [{ x1:10,y1:56,x2:220,y2:56,color:'rgba(148,163,184,0.4)',dashed:true }],
      arrows: [{ x:124,y:76,dir:'down',color:BEAR,label:'ENTRY' }],
    }
  },

  // ── CISD (Change in State of Delivery) ──────────────────────────────────────
  cisd(dir) {
    return dir === 'long' ? {
      // SSL sweep → CISD candle closes above swing high → long
      candles: [
        // bearish pressure before sweep
        [10,32,48,27,52],[36,46,60,41,64],[62,58,72,53,76],
        [88,70,84,65,88],
        // sweep wick — long bearish candle breaks to new low (SSL taken)
        [114,82,110,80,122],
        // CISD candle — big bull close above the swing high
        [140,108,62,106,64],
        // continuation
        [166,64,44,38,66],[192,44,26,20,46],[218,27,12,8,28],
      ],
      zones: [
        { x:0,  y:75,w:130,h:10,type:'red',   label:'SSL'  },
        { x:130,y:54,w:130,h:22,type:'green',  label:'CISD zone' },
      ],
      lines: [
        { x1:0,y1:72,x2:260,y2:72,color:'rgba(248,113,113,0.5)',dashed:true,label:'Swing low', lx:2,ly:70 },
        { x1:114,y1:66,x2:260,y2:66,color:'rgba(52,211,153,0.5)',dashed:true,label:'Swing high',lx:118,ly:64 },
      ],
      arrows: [{ x:176,y:34,dir:'up',color:BULL,label:'ENTRY' }],
      badges: [
        { x:140,y:48,text:'CISD ↑',bg:'rgba(52,211,153,0.25)',fg:'#34d399' },
        { x:114,y:132,text:'SSL SWEPT',bg:'rgba(248,113,113,0.2)',fg:'#f87171' },
      ],
    } : {
      // BSL sweep → CISD candle closes below swing low → short
      candles: [
        // bullish pressure before sweep
        [10,108,92,88,113],[36,94,80,77,98],[62,82,68,65,86],
        [88,70,56,53,74],
        // sweep wick — big bull candle breaks to new high (BSL taken)
        [114,58,30,28,60],
        // CISD candle — big bear close below swing low
        [140,32,80,30,82],
        // continuation down
        [166,78,96,74,100],[192,94,110,90,114],[218,108,122,105,126],
      ],
      zones: [
        { x:0,  y:45,w:130,h:10,type:'green', label:'BSL'  },
        { x:130,y:60,w:130,h:22,type:'red',   label:'CISD zone' },
      ],
      lines: [
        { x1:0,y1:50,x2:260,y2:50,color:'rgba(52,211,153,0.5)',dashed:true,label:'Swing high',lx:2,ly:48 },
        { x1:114,y1:66,x2:260,y2:66,color:'rgba(248,113,113,0.5)',dashed:true,label:'Swing low',lx:118,ly:64 },
      ],
      arrows: [{ x:176,y:122,dir:'down',color:BEAR,label:'ENTRY' }],
      badges: [
        { x:140,y:72,text:'CISD ↓',bg:'rgba(248,113,113,0.25)',fg:'#f87171' },
        { x:114,y:18,text:'BSL SWEPT',bg:'rgba(52,211,153,0.2)',fg:'#34d399' },
      ],
    }
  },

  // ── Rejection Block (dedicated — not aliased) ─────────────────────────────
  'rejection-block-scene'(dir) {
    return dir === 'long' ? {
      // Long wick down = sell-side absorption (rejection block below)
      candles: [
        [10,55,72,50,78],[36,70,84,64,88],[62,82,72,68,88],
        // rejection candle: small body, massive bearish wick
        [88,75,70,68,112],
        // reaction back up from body zone
        [114,72,58,56,76],[140,60,44,38,62],
        [166,44,30,24,46],[192,30,16,10,32],[218,18,8,4,20],
      ],
      zones: [{ x:80,y:66,w:44,h:10,type:'amber',label:'RB BODY' }],
      lines: [
        { x1:80,y1:68,x2:260,y2:68,color:'rgba(245,158,11,0.5)',dashed:true,label:'Body high',lx:82,ly:66 },
        { x1:80,y1:76,x2:260,y2:76,color:'rgba(245,158,11,0.5)',dashed:true,label:'Body low',lx:82,ly:80 },
        { x1:98,y1:112,x2:98,y2:76,color:'rgba(248,113,113,0.6)',dashed:false },
      ],
      arrows: [{ x:155,y:18,dir:'up',color:BULL,label:'ENTRY' }],
      badges: [
        { x:88,y:121,text:'WICK = SSL SWEPT',bg:'rgba(248,113,113,0.2)',fg:'#f87171' },
        { x:114,y:48,text:'ENTRY AT CE',bg:'rgba(245,158,11,0.25)',fg:'#f59e0b' },
      ],
    } : {
      candles: [
        [10,85,68,62,90],[36,70,55,50,74],[62,57,70,52,74],
        // rejection candle: small body, massive bullish wick
        [88,65,70,28,72],
        // reaction back down from body zone
        [114,68,82,64,86],[140,80,96,75,100],
        [166,94,108,90,112],[192,106,120,102,124],[218,118,130,114,134],
      ],
      zones: [{ x:80,y:62,w:44,h:10,type:'amber',label:'RB BODY' }],
      lines: [
        { x1:80,y1:64,x2:260,y2:64,color:'rgba(245,158,11,0.5)',dashed:true,label:'Body high',lx:82,ly:62 },
        { x1:80,y1:72,x2:260,y2:72,color:'rgba(245,158,11,0.5)',dashed:true,label:'Body low',lx:82,ly:76 },
        { x1:98,y1:28,x2:98,y2:64,color:'rgba(52,211,153,0.6)',dashed:false },
      ],
      arrows: [{ x:155,y:130,dir:'down',color:BEAR,label:'ENTRY' }],
      badges: [
        { x:88,y:18,text:'WICK = BSL SWEPT',bg:'rgba(52,211,153,0.2)',fg:'#34d399' },
        { x:114,y:84,text:'ENTRY AT CE',bg:'rgba(245,158,11,0.25)',fg:'#f59e0b' },
      ],
    }
  },
}

// Aliases
SCENES['silver-bullet']        = SCENES['ict-macros']
SCENES['key-opens']            = SCENES['ict-macros']
SCENES['rejection-block']      = SCENES['rejection-block-scene']
SCENES['mitigation-block']     = SCENES['order-block']
SCENES['equal-highs-lows']     = SCENES['liquidity']
SCENES['inducement']           = SCENES['liquidity']
SCENES['engineered-liquidity'] = SCENES['liquidity']
SCENES['turtle-soup']          = SCENES['liquidity']
SCENES['swing-highs-lows']     = SCENES['market-structure']
SCENES['prev-day-week-hl']     = SCENES['market-structure']
SCENES['fibonacci']            = SCENES['ote']
SCENES['draw-on-liquidity']    = SCENES['premium-discount']
SCENES['ipda']                 = SCENES['premium-discount']
SCENES['data-highs-lows']      = SCENES['premium-discount']
SCENES['judas-swing']          = SCENES['judas-swing'] // already defined
SCENES['asian-range']          = SCENES['kill-zones']
SCENES['daily-bias']           = SCENES['kill-zones']
SCENES['mtfa']                 = SCENES['kill-zones']
SCENES['consequent-encroachment'] = SCENES['fvg']
SCENES['iofed']                = SCENES['fvg']
SCENES['opening-gaps']         = SCENES['judas-swing']

function defaultScene(dir: 'long'|'short'): Scene {
  return dir === 'long' ? {
    candles: [
      [10,98,78,91,104],[36,75,55,68,80],[62,52,68,46,74],
      [88,66,48,60,72],[114,45,28,38,50],[140,25,42,19,48],
      [166,40,22,34,46],[192,20,8,14,25],[218,9,3,3,14],
    ],
    zones:  [{ x:88,y:44,w:156,h:30,type:'green',label:'Support' }],
    arrows: [{ x:176,y:12,dir:'up',color:BULL,label:'ENTRY' }],
  } : {
    candles: [
      [10,22,42,16,48],[36,40,58,34,64],[62,56,40,50,62],
      [88,42,60,36,66],[114,58,80,52,85],[140,78,60,72,84],
      [166,62,82,56,88],[192,80,100,74,106],[218,98,114,92,118],
    ],
    zones:  [{ x:10,y:34,w:156,h:30,type:'red',label:'Resistance' }],
    arrows: [{ x:176,y:118,dir:'down',color:BEAR,label:'ENTRY' }],
  }
}

// ── Render helpers ────────────────────────────────────────────────────────────
function RenderCandle({ c, i }: { c: CS; i: number }) {
  const [x, oy, cy, hy, ly] = c
  const bull  = oy > cy
  const color = bull ? BULL : BEAR
  const bTop  = Math.min(oy, cy)
  const bH    = Math.max(Math.abs(oy - cy), 2.5)
  return (
    <g key={i}>
      <line x1={x+W/2} y1={hy} x2={x+W/2} y2={ly}
        stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.65} />
      <rect x={x} y={bTop} width={W} height={bH} rx={1.5}
        fill={bull ? color : `${color}22`} stroke={color} strokeWidth={1.5} opacity={0.95} />
    </g>
  )
}

function RenderArrow({ a }: { a: Arrow }) {
  const len = 20
  const y2  = a.dir === 'up' ? a.y + len : a.y - len
  const tip = a.dir === 'up'
    ? `M${a.x},${a.y} L${a.x-5},${a.y+8} L${a.x+5},${a.y+8}Z`
    : `M${a.x},${a.y} L${a.x-5},${a.y-8} L${a.x+5},${a.y-8}Z`
  return (
    <g>
      <line x1={a.x} y1={a.dir==='up'?a.y+8:a.y-8} x2={a.x} y2={y2}
        stroke={a.color} strokeWidth={2.5} />
      <path d={tip} fill={a.color} />
      {a.label && (
        <text x={a.x} y={a.dir==='up'? a.y+len+9 : a.y-len-4}
          textAnchor="middle" fill={a.color}
          fontSize={8.5} fontWeight={700} fontFamily="system-ui" letterSpacing={0.5}>
          {a.label}
        </text>
      )}
    </g>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function PlaybookDiagram({ conceptId, dir }: { conceptId: string; dir: 'long'|'short' }) {
  const fn    = SCENES[conceptId]
  const scene = fn ? fn(dir) : defaultScene(dir)
  const uid   = `z${conceptId.replace(/[^a-z]/g,'')}`

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]" style={{ background:'#05050c' }}>
      <style>{`
        @keyframes ${uid}p{0%,100%{opacity:.7}50%{opacity:1}}
        .${uid}z{animation:${uid}p 2.5s ease-in-out infinite}
      `}</style>
      <svg viewBox="0 0 300 140" className="w-full" style={{ display:'block' }}>
        {/* Subtle grid */}
        {[35,55,75,95,115].map(y => (
          <line key={y} x1={10} y1={y} x2={290} y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth={1} />
        ))}

        {/* Zones */}
        {scene.zones?.map((z, i) => {
          const c = ZC[z.type]
          return (
            <g key={i} className={`${uid}z`}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={3} fill={c.fill} stroke={c.stroke} strokeWidth={1} />
              {z.label && (
                <text x={z.x+z.w/2} y={z.y+z.h/2+3.5}
                  textAnchor="middle" fill={c.stroke}
                  fontSize={8} fontWeight={700} fontFamily="system-ui" letterSpacing={0.8}>
                  {z.label.toUpperCase()}
                </text>
              )}
            </g>
          )
        })}

        {/* Lines */}
        {scene.lines?.map((l, i) => (
          <g key={i}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.color} strokeWidth={1}
              strokeDasharray={l.dashed ? '4 3' : undefined} />
            {l.label && (
              <text x={l.lx ?? l.x1} y={l.ly ?? l.y1-3}
                fill={l.color} fontSize={7.5} fontWeight={700} fontFamily="system-ui">
                {l.label}
              </text>
            )}
          </g>
        ))}

        {/* Candles (on top of zones/lines) */}
        {scene.candles.map((c, i) => <RenderCandle key={i} c={c} i={i} />)}

        {/* Arrows */}
        {scene.arrows?.map((a, i) => <RenderArrow key={i} a={a} />)}

        {/* Badges */}
        {scene.badges?.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y-9} width={(b.text.length*5.4)+8} height={12} rx={3} fill={b.bg} />
            <text x={b.x+4} y={b.y} fill={b.fg} fontSize={7.5} fontWeight={700} fontFamily="system-ui" letterSpacing={0.4}>
              {b.text}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
