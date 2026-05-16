import { useRef, useCallback, useEffect } from 'react'

interface Props {
  value: number
  label: string
  color?: string
  trackColor?: string
  bodyColor?: string
  labelColor?: string
  size?: number
  onChange: (v: number) => void
}

export function KnobControl({
  value,
  label,
  color = '#ff6b35',
  trackColor = '#33333380',
  bodyColor = '#1a1a2e',
  labelColor,
  size = 44,
  onChange,
}: Props) {
  const dragRef    = useRef<{ startY: number; startVal: number } | null>(null)
  const valueRef   = useRef(value)
  const onChangeRef = useRef(onChange)
  useEffect(() => { valueRef.current = value }, [value])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const angle = -135 + value * 270
  const rad = (angle * Math.PI) / 180
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const ix = cx + r * Math.sin(rad)
  const iy = cy - r * Math.cos(rad)

  function arcPath(endAngle: number) {
    const startRad = (-135 * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + r * Math.sin(startRad)
    const y1 = cy - r * Math.cos(startRad)
    const x2 = cx + r * Math.sin(endRad)
    const y2 = cy - r * Math.cos(endRad)
    const largeArc = endAngle - (-135) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startVal: valueRef.current }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = (dragRef.current.startY - ev.clientY) / 120
      onChangeRef.current(Math.max(0, Math.min(1, dragRef.current.startVal + delta)))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    dragRef.current = { startY: e.touches[0].clientY, startVal: valueRef.current }
    const onMove = (ev: TouchEvent) => {
      if (!dragRef.current) return
      const delta = (dragRef.current.startY - ev.touches[0].clientY) / 120
      onChangeRef.current(Math.max(0, Math.min(1, dragRef.current.startVal + delta)))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }, [])

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <svg width={size} height={size} className="cursor-ns-resize" onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
        <path d={arcPath(135)} stroke={trackColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={arcPath(angle)} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r * 0.7} fill={bodyColor} stroke={trackColor} strokeWidth="1.5" />
        <line x1={cx} y1={cy} x2={ix} y2={iy} stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span
        className="font-mono text-[9px] uppercase tracking-wider"
        style={{ color: labelColor ?? '#66666699' }}
      >
        {label}
      </span>
    </div>
  )
}
