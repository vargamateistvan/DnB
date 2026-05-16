import { useEffect, useRef } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import type { KitId } from '../types'

interface Props {
  readonly kitId: KitId
  readonly color: string
  readonly width: number
  readonly height: number
}

function generateOscillator(type: string, N: number, cycles = 3): Float32Array {
  const buf = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const phase = ((i / N) * cycles) % 1
    if (type === 'sawtooth')                         buf[i] = phase * 2 - 1
    else if (type === 'square' || type === 'pulse')  buf[i] = phase < 0.5 ? 1 : -1
    else                                             buf[i] = Math.sin(phase * Math.PI * 2)
  }
  return buf
}

function applyLowpass(input: Float32Array, cutoffNorm: number, resonanceNorm: number): Float32Array {
  const output = new Float32Array(input.length)
  const fc    = Math.max(0.002, Math.min(0.499, Math.pow(Math.max(0.01, cutoffNorm), 1.5) * 0.48))
  const q     = 0.5 + resonanceNorm * 14
  const omega = 2 * Math.PI * fc
  const sinO  = Math.sin(omega)
  const cosO  = Math.cos(omega)
  const alpha = sinO / (2 * q)
  const b0 = (1 - cosO) / 2, b1 = 1 - cosO, b2 = (1 - cosO) / 2
  const a0 = 1 + alpha, a1 = -2 * cosO, a2 = 1 - alpha
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i]
    const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
    const safe = Number.isFinite(y0) ? y0 : 0
    output[i] = safe
    x2 = x1; x1 = x0
    y2 = y1; y1 = safe
  }
  return output
}

function percussiveWave(N: number, decay: number, accent: number): Float32Array {
  const buf = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const t = i / N
    const env = Math.exp(-t * 6 / Math.max(0.05, decay))
    buf[i] = (1 + accent * 0.5) * env * Math.sin(t * Math.PI * 2 * 10 * (1 - t * 0.6))
  }
  return buf
}

function renderSamples(ctx: CanvasRenderingContext2D, samples: Float32Array, w: number, h: number, color: string) {
  let max = 0.0001
  for (const v of samples) if (Math.abs(v) > max) max = Math.abs(v)

  ctx.clearRect(0, 0, w, h)

  ctx.beginPath()
  ctx.strokeStyle = '#1e1e1e'
  ctx.lineWidth = 0.5
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  for (let i = 0; i < samples.length; i++) {
    const x = (i / (samples.length - 1)) * w
    const y = (0.5 - (samples[i] / max) * 0.45) * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

export function WaveformPreview({ kitId, color, width, height }: Props) {
  // Subscribe directly to store — guarantees re-render on every param change
  const params = useSequencerStore((s) => s.machineParams)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width  = width  * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const N = 512
    let samples: Float32Array

    if (kitId === 'tb303') {
      const p = params.tb303
      const raw = generateOscillator(p.waveform, N)
      samples = applyLowpass(raw, p.cutoff, p.resonance)
    } else if (kitId === 'sh101') {
      const p = params.sh101
      const raw = generateOscillator(p.waveform, N)
      const sub = generateOscillator(p.waveform, N, 1.5)
      const combined = new Float32Array(N)
      for (let i = 0; i < N; i++) combined[i] = raw[i] + sub[i] * p.subOsc * 0.5
      samples = applyLowpass(combined, p.vcfFreq, p.vcfRes)
    } else if (kitId === 'tr909') {
      const p = params.tr909
      samples = percussiveWave(N, p.bdDecay, p.accentLevel)
    } else {
      const accent = kitId === 'tr808' ? params.tr808.accentLevel
                   : kitId === 'tr606' ? params.tr606.accentLevel
                   : params.tr707.accentLevel
      samples = percussiveWave(N, 0.35, accent)
    }

    renderSamples(ctx, samples, width, height, color)
  }, [kitId, params, color, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`, height: `${height}px`,
        display: 'block', borderRadius: '2px',
        border: '1px solid #222', background: '#0a0a0a',
        alignSelf: 'center',
      }}
    />
  )
}
