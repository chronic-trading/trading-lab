import html2canvas from 'html2canvas'
import type { Trade } from './csvParser'
import { calcStats } from './csvParser'
import type { ThemeConfig } from './themes'

const W = 1280
const H = 720
const FPS = 30

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }
function clamp(v: number, min = 0, max = 1) { return Math.max(min, Math.min(max, v)) }

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function fmt$(pnl: number) {
  const abs = Math.abs(pnl)
  const sign = pnl >= 0 ? '+' : '-'
  if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}K`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`
  return `${sign}$${abs.toFixed(2)}`
}

// ─── Background ───────────────────────────────────────────────────────────────

function drawBg(ctx: CanvasRenderingContext2D, theme: ThemeConfig, pulse = 0) {
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8)
  const [r, g2, b] = hexToRgb(theme.bgBase)
  const [r2, g3, b2] = hexToRgb(theme.bgSecondary)
  const p = 0.08 + pulse * 0.04
  g.addColorStop(0, `rgba(${r2},${g3},${b2},1)`)
  g.addColorStop(1, `rgba(${r},${g2},${b},1)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Accent orb top-left
  const orb = ctx.createRadialGradient(0, 0, 0, 0, 0, 600)
  try {
    const [ar, ag, ab] = hexToRgb(theme.accent)
    orb.addColorStop(0, `rgba(${ar},${ag},${ab},${p})`)
    orb.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = orb
    ctx.fillRect(0, 0, W, H)
  } catch { /* skip */ }
}

// ─── Equity curve on canvas ──────────────────────────────────────────────────

function drawEquityCurve(
  ctx: CanvasRenderingContext2D,
  trades: Trade[],
  x: number, y: number, w: number, h: number,
  progress: number,
  theme: ThemeConfig
) {
  const cum = trades.reduce<number[]>((acc, t) => {
    acc.push((acc[acc.length - 1] ?? 0) + t.pnl)
    return acc
  }, [])
  const points = [0, ...cum]
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const pts = points.map((v, i) => ({
    x: x + (i / (points.length - 1)) * w,
    y: y + h - ((v - min) / range) * h,
  }))

  const drawTo = Math.max(2, Math.ceil(progress * pts.length))
  const visiblePts = pts.slice(0, drawTo)
  const finalPnl = cum[cum.length - 1] ?? 0
  const lineColor = finalPnl >= 0 ? theme.profit : theme.loss

  // Area
  ctx.beginPath()
  visiblePts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.lineTo(visiblePts[visiblePts.length - 1].x, y + h)
  ctx.lineTo(pts[0].x, y + h)
  ctx.closePath()
  try {
    const ag = ctx.createLinearGradient(x, y, x, y + h)
    const [r, g2, b] = hexToRgb(lineColor)
    ag.addColorStop(0, `rgba(${r},${g2},${b},0.25)`)
    ag.addColorStop(1, `rgba(${r},${g2},${b},0)`)
    ctx.fillStyle = ag
    ctx.fill()
  } catch { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill() }

  // Line
  ctx.beginPath()
  visiblePts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = lineColor
  ctx.shadowBlur = 6
  ctx.stroke()
  ctx.shadowBlur = 0

  // End dot
  if (visiblePts.length > 1) {
    const last = visiblePts[visiblePts.length - 1]
    ctx.beginPath()
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = lineColor
    ctx.shadowColor = lineColor
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

// ─── Intro frame ─────────────────────────────────────────────────────────────

function drawIntro(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  stats: ReturnType<typeof calcStats>,
  label: string,
  t: number
) {
  const alpha = clamp(t * 3)
  const slideY = (1 - easeOut(clamp(t * 2))) * 30

  ctx.globalAlpha = alpha

  // "TRADE RECAP" label
  ctx.font = '600 13px "JetBrains Mono", monospace'
  ctx.fillStyle = theme.textMuted
  ctx.textAlign = 'center'
  ctx.letterSpacing = '0.3em'
  ctx.fillText('TRADE RECAP', W / 2, H / 2 - 90 + slideY)
  ctx.letterSpacing = '0'

  // Title
  ctx.font = `900 72px "Inter", sans-serif`
  ctx.fillStyle = theme.textPrimary
  ctx.fillText(label, W / 2, H / 2 - 20 + slideY)

  // P&L
  const pnlColor = stats.totalPnl >= 0 ? theme.profit : theme.loss
  ctx.shadowColor = pnlColor
  ctx.shadowBlur = 24
  ctx.font = `900 56px "JetBrains Mono", monospace`
  ctx.fillStyle = pnlColor
  ctx.fillText(fmt$(stats.totalPnl), W / 2, H / 2 + 52 + slideY)
  ctx.shadowBlur = 0

  // Sub stats
  ctx.font = `500 14px "Inter", sans-serif`
  ctx.fillStyle = theme.textSecondary
  ctx.fillText(
    `${stats.wins}W  /  ${stats.losses}L  ·  ${(stats.wins + stats.losses)} trades  ·  ${stats.winRate.toFixed(0)}% win rate`,
    W / 2, H / 2 + 96 + slideY
  )

  ctx.globalAlpha = 1
}

// ─── Card frame ──────────────────────────────────────────────────────────────

function drawCardFrame(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  trade: Trade,
  cardImage: HTMLCanvasElement,
  t: number,
  pulse: number
) {
  const isWin = trade.isWin
  const pnlColor = isWin ? theme.profit : theme.loss

  // Ghost symbol text behind
  ctx.globalAlpha = 0.04 + pulse * 0.02
  ctx.font = `900 240px "Inter", sans-serif`
  ctx.fillStyle = pnlColor
  ctx.textAlign = 'center'
  ctx.fillText(trade.symbol, W / 2, H / 2 + 80)
  ctx.globalAlpha = 1

  // Flash overlay at start
  const flashT = clamp(1 - t * 6)
  if (flashT > 0) {
    ctx.globalAlpha = flashT * 0.35
    ctx.fillStyle = pnlColor
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1
  }

  // Card image — slide in from bottom
  const slideT = clamp(t * 2.5)
  const cardH = Math.round((cardImage.width / cardImage.width) * cardImage.height)
  const scale = Math.min((H * 0.82) / cardImage.height, (W * 0.38) / cardImage.width)
  const cw = cardImage.width * scale
  const ch = cardImage.height * scale
  const cx = (W - cw) / 2
  const cy = (H - ch) / 2 + (1 - easeOut(slideT)) * 80

  // Glow behind card
  const gr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 320)
  try {
    const [r, g2, b] = hexToRgb(pnlColor)
    gr.addColorStop(0, `rgba(${r},${g2},${b},0.12)`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gr
    ctx.fillRect(0, 0, W, H)
  } catch { /* skip */ }

  ctx.globalAlpha = easeOut(clamp(t * 3))
  ctx.drawImage(cardImage, cx, cy, cw, ch)
  ctx.globalAlpha = 1

  // P&L text below card
  const textAlpha = clamp((t - 0.2) * 3)
  ctx.globalAlpha = textAlpha
  ctx.shadowColor = pnlColor
  ctx.shadowBlur = 16
  ctx.font = `900 32px "JetBrains Mono", monospace`
  ctx.fillStyle = pnlColor
  ctx.textAlign = 'center'
  ctx.fillText(fmt$(trade.pnl), W / 2, cy + ch + 36)
  ctx.shadowBlur = 0
  ctx.font = `500 14px "Inter", sans-serif`
  ctx.fillStyle = theme.textMuted
  ctx.fillText(`${trade.symbol}  ·  ${trade.isWin ? '+' : ''}${trade.pnlPercent.toFixed(2)}%`, W / 2, cy + ch + 58)
  ctx.globalAlpha = 1
  void cardH
}

// ─── Outro frame ─────────────────────────────────────────────────────────────

function drawOutro(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  trades: Trade[],
  stats: ReturnType<typeof calcStats>,
  t: number
) {
  const fadeIn = clamp(t * 2.5)
  const pnlColor = stats.totalPnl >= 0 ? theme.profit : theme.loss
  const winRateColor = stats.winRate >= 60 ? theme.profit : stats.winRate >= 45 ? '#f59e0b' : theme.loss

  // Title
  ctx.globalAlpha = fadeIn
  ctx.font = '600 11px "JetBrains Mono", monospace'
  ctx.fillStyle = theme.textMuted
  ctx.textAlign = 'center'
  ctx.letterSpacing = '0.3em'
  ctx.fillText('FINAL SUMMARY', W / 2, 80)
  ctx.letterSpacing = '0'

  // P&L
  ctx.shadowColor = pnlColor
  ctx.shadowBlur = 28
  ctx.font = '900 64px "JetBrains Mono", monospace'
  ctx.fillStyle = pnlColor
  ctx.fillText(fmt$(stats.totalPnl), W / 2, 148)
  ctx.shadowBlur = 0

  // Stats row
  const statItems = [
    { label: 'WIN RATE', value: `${stats.winRate.toFixed(0)}%`, color: winRateColor },
    { label: 'AVG WIN', value: fmt$(stats.avgWin), color: theme.profit },
    { label: 'AVG LOSS', value: fmt$(stats.avgLoss), color: theme.loss },
    { label: 'PROFIT FACTOR', value: isFinite(stats.profitFactor) ? `${stats.profitFactor.toFixed(2)}x` : '∞', color: theme.profit },
  ]
  const boxW = 180, boxH = 64, gap = 20
  const totalW = statItems.length * boxW + (statItems.length - 1) * gap
  const startX = (W - totalW) / 2

  statItems.forEach((s, i) => {
    const bx = startX + i * (boxW + gap)
    const by = 176
    const alpha2 = clamp((t - i * 0.08) * 3)
    ctx.globalAlpha = Math.min(fadeIn, alpha2)

    try {
      const [r, g2, b] = hexToRgb(s.color)
      roundRect(ctx, bx, by, boxW, boxH, 10)
      ctx.fillStyle = `rgba(${r},${g2},${b},0.08)`
      ctx.fill()
      roundRect(ctx, bx, by, boxW, boxH, 10)
      ctx.strokeStyle = `rgba(${r},${g2},${b},0.25)`
      ctx.lineWidth = 1
      ctx.stroke()
    } catch { /* skip */ }

    ctx.font = '600 9px "JetBrains Mono", monospace'
    ctx.fillStyle = theme.textMuted
    ctx.textAlign = 'center'
    ctx.fillText(s.label, bx + boxW / 2, by + 18)

    ctx.shadowColor = s.color
    ctx.shadowBlur = 8
    ctx.font = '800 22px "JetBrains Mono", monospace'
    ctx.fillStyle = s.color
    ctx.fillText(s.value, bx + boxW / 2, by + 46)
    ctx.shadowBlur = 0
  })

  // Equity curve
  const curveT = clamp((t - 0.3) * 2)
  ctx.globalAlpha = Math.min(fadeIn, clamp((t - 0.25) * 3))
  if (trades.length >= 2) {
    drawEquityCurve(ctx, trades, 120, 280, W - 240, 150, curveT, theme)
  }

  // Watermark
  ctx.globalAlpha = clamp((t - 0.7) * 4) * 0.35
  ctx.font = '500 12px "JetBrains Mono", monospace'
  ctx.fillStyle = theme.textMuted
  ctx.textAlign = 'center'
  ctx.fillText('Generated with Trade Recap', W / 2, H - 32)

  ctx.globalAlpha = 1
}

// ─── MP4 via WebCodecs (Chrome 94+, Safari 16.4+, Edge 94+) ─────────────────

async function generateMp4Montage(options: {
  trades: Trade[]
  cardElements: HTMLElement[]
  theme: ThemeConfig
  label: string
  onProgress: (pct: number) => void
}): Promise<void> {
  const { trades, cardElements, theme, label, onProgress } = options
  const stats = calcStats(trades)

  onProgress(0.02)

  // Capture card images
  const cardImages: HTMLCanvasElement[] = []
  for (let i = 0; i < cardElements.length; i++) {
    const img = await html2canvas(cardElements[i], {
      backgroundColor: null, scale: 1.5, logging: false, useCORS: true,
    })
    cardImages.push(img)
    onProgress(0.02 + 0.15 * ((i + 1) / cardElements.length))
  }

  onProgress(0.17)

  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer')
  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: W, height: H },
    fastStart: 'in-memory',
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? {}),
    error: (e) => { throw e },
  })

  encoder.configure({
    codec: 'avc1.42001f',
    width: W, height: H,
    bitrate: 8_000_000,
    framerate: FPS,
  })

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const INTRO_F  = Math.round(FPS * 2.5)
  const PER_CARD_F = Math.round(FPS * 1.8)
  const OUTRO_F  = Math.round(FPS * 4)
  const TOTAL_F  = INTRO_F + cardImages.length * PER_CARD_F + OUTRO_F

  let pulse = 0, pulseDir = 1

  for (let frame = 0; frame < TOTAL_F; frame++) {
    pulse += pulseDir * 0.02
    if (pulse > 1 || pulse < 0) pulseDir *= -1

    drawBg(ctx, theme, pulse)

    if (frame < INTRO_F) {
      drawIntro(ctx, theme, stats, label, frame / INTRO_F)
    } else if (frame < INTRO_F + cardImages.length * PER_CARD_F) {
      const cf = frame - INTRO_F
      const idx = Math.floor(cf / PER_CARD_F)
      const localT = (cf % PER_CARD_F) / PER_CARD_F
      if (idx < cardImages.length) drawCardFrame(ctx, theme, trades[idx], cardImages[idx], localT, pulse)
    } else {
      drawOutro(ctx, theme, trades, stats, (frame - INTRO_F - cardImages.length * PER_CARD_F) / OUTRO_F)
    }

    // Throttle if encoder queue is backing up
    if (encoder.encodeQueueSize > 12) {
      await new Promise(r => setTimeout(r, 0))
    }

    const timestamp = Math.round((frame / FPS) * 1_000_000)
    const vf = new VideoFrame(canvas, { timestamp })
    encoder.encode(vf, { keyFrame: frame % 30 === 0 })
    vf.close()

    if (frame % 6 === 0) {
      onProgress(0.17 + 0.78 * (frame / TOTAL_F))
      await new Promise(r => setTimeout(r, 0))
    }
  }

  await encoder.flush()
  muxer.finalize()

  const blob = new Blob([target.buffer], { type: 'video/mp4' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trade-recap-${Date.now()}.mp4`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  onProgress(1)
}

// ─── Capability detection ─────────────────────────────────────────────────────
// Lives in ./videoCapability so callers can probe support without loading this
// module's html2canvas/mp4-muxer payload. Re-exported here to keep the old
// import path working.
export { videoCapability } from './videoCapability'
import { videoCapability } from './videoCapability'

/** @deprecated kept for App.tsx compat */
export function canUseWebM(): boolean {
  return videoCapability() !== 'none'
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateVideoMontage(options: {
  trades: Trade[]
  cardElements: HTMLElement[]
  theme: ThemeConfig
  label: string
  onProgress: (pct: number) => void
}): Promise<void> {
  const cap = videoCapability()
  if (cap === 'mp4') return generateMp4Montage(options)
  if (cap === 'webm') { /* fall through to WebM path below */ }
  else throw new Error('Video export is not supported in this browser. Use the Play Slideshow feature instead.')


  const { trades, cardElements, theme, label, onProgress } = options
  const stats = calcStats(trades)

  onProgress(0.02)

  // Capture card images
  const cardImages: HTMLCanvasElement[] = []
  for (let i = 0; i < cardElements.length; i++) {
    const img = await html2canvas(cardElements[i], {
      backgroundColor: null,
      scale: 1.5,
      logging: false,
      useCORS: true,
    })
    cardImages.push(img)
    onProgress(0.02 + 0.18 * ((i + 1) / cardElements.length))
  }

  onProgress(0.2)

  // Canvas setup
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // MediaRecorder setup
  const stream = canvas.captureStream(FPS)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4'

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = (e) => reject(new Error(`MediaRecorder error: ${JSON.stringify(e)}`))
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trade-recap-${Date.now()}.webm`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      onProgress(1)
      resolve()
    }

    const INTRO_F = Math.round(FPS * 2.5)
    const PER_CARD_F = Math.round(FPS * 1.8)
    const OUTRO_F = Math.round(FPS * 4)
    const TOTAL_F = INTRO_F + cardImages.length * PER_CARD_F + OUTRO_F

    let frame = 0
    let pulse = 0
    let pulseDir = 1

    recorder.start(100)

    const loop = setInterval(() => {
      pulse += pulseDir * 0.02
      if (pulse > 1 || pulse < 0) pulseDir *= -1

      drawBg(ctx, theme, pulse)

      if (frame < INTRO_F) {
        drawIntro(ctx, theme, stats, label, frame / INTRO_F)
      } else if (frame < INTRO_F + cardImages.length * PER_CARD_F) {
        const cf = frame - INTRO_F
        const idx = Math.floor(cf / PER_CARD_F)
        const localT = (cf % PER_CARD_F) / PER_CARD_F
        if (idx < cardImages.length) {
          drawCardFrame(ctx, theme, trades[idx], cardImages[idx], localT, pulse)
        }
      } else {
        const outroT = (frame - INTRO_F - cardImages.length * PER_CARD_F) / OUTRO_F
        drawOutro(ctx, theme, trades, stats, outroT)
      }

      onProgress(0.2 + 0.78 * (frame / TOTAL_F))
      frame++

      if (frame >= TOTAL_F) {
        clearInterval(loop)
        recorder.stop()
      }
    }, 1000 / FPS)
  })
}
