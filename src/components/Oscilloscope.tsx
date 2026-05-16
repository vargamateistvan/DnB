import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

interface Props {
  readonly width: number
  readonly height: number
  readonly color?: string
  readonly dimColor?: string
}

export function Oscilloscope({ width, height, color = '#22c55e', dimColor = '#1a1a1a' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const waveform = new Tone.Waveform(1024)
    Tone.getDestination().connect(waveform)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    let rafId = 0

    const draw = () => {
      const values = waveform.getValue() as Float32Array
      const w = width
      const h = height

      ctx.clearRect(0, 0, w, h)

      // center line
      ctx.beginPath()
      ctx.strokeStyle = dimColor
      ctx.lineWidth = 0.5
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      // waveform
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'

      for (let i = 0; i < values.length; i++) {
        const x = (i / (values.length - 1)) * w
        const y = ((values[i] + 1) / 2) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      try { Tone.getDestination().disconnect(waveform) } catch { /* ignore */ }
      waveform.dispose()
    }
  }, [width, height, color, dimColor])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
        borderRadius: '2px',
        border: '1px solid #222',
        background: '#0a0a0a',
      }}
    />
  )
}
