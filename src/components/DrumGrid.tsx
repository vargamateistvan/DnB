import type { CSSProperties } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, MACHINE_TRACKS } from '../machines'
import type { KitId } from '../types'

type Popover = { trackId: string; stepIdx: number; x: number; y: number }

const BTN_SIZE = 28

function useBtnSize(): number {
  const [size, setSize] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 34 : BTN_SIZE))
  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? 34 : BTN_SIZE)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

// TR-808 velocity → color  (deep red → orange → amber → near-white)
function velColor(v: number): string {
  if (v <= 0.35) {
    const t = v / 0.35
    return `rgb(${Math.round(160 + 80 * t)}, ${Math.round(20 + 50 * t)}, 0)`
  }
  if (v <= 0.65) {
    const t = (v - 0.35) / 0.30
    return `rgb(${Math.round(240 + 10 * t)}, ${Math.round(70 + 96 * t)}, ${Math.round(30 * t)})`
  }
  const t = (v - 0.65) / 0.35
  return `rgb(255, ${Math.round(166 + 82 * t)}, ${Math.round(30 + 194 * t)})`
}

function buildStepCss(
  kitId: KitId,
  isActive: boolean,
  isCurrent: boolean,
  isBeat1: boolean,
  velocity: number,
  activeColor: string,
  inactiveColor: string,
  beatColor: string,
): CSSProperties {
  const isPlaying = isCurrent && isActive

  // TR-808: tiny dot → large velocity-colored circle, scale punch on hit
  if (kitId === 'tr808') {
    if (!isActive) {
      return {
        backgroundColor: isCurrent ? '#5a3200' : '#2e1800',
        borderRadius: '50%', border: 'none', boxShadow: 'none',
        transform: 'scale(0.22)',
        transition: 'transform 120ms ease, background-color 60ms',
      }
    }
    const color = velColor(velocity)
    const scale = isPlaying ? Math.min(1.12, 0.55 + velocity * 0.55) : 0.45 + velocity * 0.50
    const glow = isPlaying ? 10 + Math.round(velocity * 12) : Math.round(velocity * 14)
    return {
      backgroundColor: color, borderRadius: '50%', border: 'none',
      boxShadow: `0 0 ${glow}px ${color}99`,
      transform: `scale(${scale.toFixed(3)})`,
      transition: isPlaying ? 'transform 35ms ease-out' : 'transform 120ms ease, background-color 60ms, box-shadow 60ms',
      ...(isCurrent && !isPlaying ? { outline: '2px solid rgba(255,255,255,0.75)', outlineOffset: '3px' } : {}),
    }
  }

  // TR-909: dark rect with red LED stripe at top when active
  if (kitId === 'tr909') {
    const darkBg = isBeat1 ? '#525050' : '#4a4848'
    if (!isActive) {
      return {
        backgroundColor: isCurrent ? '#5a3830' : darkBg,
        border: 'none', boxShadow: 'none',
        borderRadius: '3px',
        transition: 'background-color 60ms',
      }
    }
    return {
      background: isPlaying
        ? activeColor
        : `linear-gradient(to bottom, ${activeColor} 0, ${activeColor} 5px, #4a4848 5px)`,
      border: 'none', boxShadow: isPlaying ? `0 0 10px ${activeColor}99` : 'none',
      borderRadius: '3px',
      transition: 'background 60ms, box-shadow 60ms',
      ...(isCurrent && !isPlaying ? { outline: `2px solid ${activeColor}aa`, outlineOffset: '1px' } : {}),
    }
  }

  // TR-606: variable-size circles, scale punch on hit
  if (kitId === 'tr606') {
    if (!isActive) {
      return {
        backgroundColor: isCurrent ? '#6a6a66' : '#545450',
        borderRadius: '50%', border: 'none', boxShadow: 'none',
        transform: 'scale(0.22)',
        transition: 'transform 120ms ease, background-color 60ms',
      }
    }
    const scale = isPlaying ? 1.08 : 0.88
    return {
      backgroundColor: activeColor,
      borderRadius: '50%', border: 'none',
      boxShadow: `0 0 ${isPlaying ? 14 : 8}px ${activeColor}99`,
      transform: `scale(${scale})`,
      transition: isPlaying ? 'transform 35ms ease-out' : 'transform 120ms ease, background-color 60ms, box-shadow 60ms',
      ...(isCurrent && !isPlaying ? { outline: '2px solid rgba(255,255,255,0.75)', outlineOffset: '3px' } : {}),
    }
  }

  // TR-707: circles on olive grid, scale punch on hit
  if (kitId === 'tr707') {
    if (!isActive) {
      return {
        backgroundColor: isCurrent ? 'rgba(192,72,8,0.18)' : 'transparent',
        borderRadius: '50%',
        border: `2px solid ${isCurrent ? 'rgba(192,72,8,0.7)' : 'rgba(0,0,0,0.28)'}`,
        boxShadow: 'none',
        transition: 'background-color 60ms, border-color 60ms',
      }
    }
    return {
      backgroundColor: isPlaying ? activeColor : '#111',
      borderRadius: '50%', border: 'none',
      boxShadow: isPlaying ? `0 0 12px ${activeColor}99` : 'none',
      transform: isPlaying ? 'scale(1.1)' : 'scale(1)',
      transition: isPlaying ? 'transform 35ms ease-out' : 'transform 120ms ease, background-color 60ms',
      ...(isCurrent && !isPlaying ? { outline: '2px solid rgba(192,72,8,0.9)', outlineOffset: '2px' } : {}),
    }
  }

  // Default
  const bg = isActive ? activeColor : isBeat1 ? beatColor : inactiveColor
  const shadow = [
    isActive
      ? `0 0 8px ${activeColor}90, 0 0 2px ${activeColor}, inset 0 0 6px ${activeColor}30`
      : `inset 0 2px 3px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.06)`,
    isCurrent ? `0 0 0 2px rgba(255,255,255,0.7)` : '',
  ].filter(Boolean).join(', ')
  return {
    backgroundColor: bg,
    border: `1px solid ${isActive ? activeColor : isBeat1 ? beatColor : inactiveColor}`,
    boxShadow: shadow, borderRadius: '3px',
    transform: isPlaying ? 'scale(1.08)' : 'scale(1)',
    transition: isPlaying ? 'transform 35ms ease-out' : 'background-color 60ms, box-shadow 60ms, transform 120ms ease',
  }
}

const HARDWARE_NAMES: Record<KitId, string> = {
  tr808: 'RHYTHM COMPOSER',
  tr909: 'RHYTHM COMPOSER',
  tr606: 'DRUMATIX',
  tr707: 'RHYTHM COMPOSER',
  tb303: 'BASS LINE',
  sh101: 'SH-101',
}

interface Props {
  kitId: KitId
  onPadTrigger: (trackId: string) => void
}

export function DrumGrid({ kitId, onPadTrigger }: Props) {
  const btnSize = useBtnSize()
  const tracks = useSequencerStore((s) => s.tracks)
  const currentStep = useSequencerStore((s) => s.currentStep)
  const isPlaying = useSequencerStore((s) => s.isPlaying)
  const toggleStep = useSequencerStore((s) => s.toggleStep)
  const setStepVelocity = useSequencerStore((s) => s.setStepVelocity)
  const setStepProbability = useSequencerStore((s) => s.setStepProbability)
  const toggleMute = useSequencerStore((s) => s.toggleMute)
  const addTrack = useSequencerStore((s) => s.addTrack)
  const removeTrack = useSequencerStore((s) => s.removeTrack)
  const trackKits = useSequencerStore((s) => s.trackKits)

  const [popover, setPopover] = useState<Popover | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popover) return
    const handler = (e: PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopover(null)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [popover])

  const theme = MACHINE_THEMES[kitId]
  const machineTrackDefs = MACHINE_TRACKS[kitId]

  const machineTids = new Set<string>(machineTrackDefs.map((t) => t.id))
  const visibleTracks = tracks.filter((t) => machineTids.has(t.id) || t.custom)

  const maxStepCount = Math.max(...visibleTracks.map((t) => t.steps.length), 16)
  const groups: number[][] = []
  for (let i = 0; i < maxStepCount; i += 4) groups.push([i, i + 1, i + 2, i + 3])

  const stepNumColor = theme.textDim
  const stepNumBeatColor = theme.accent

  return (
    <div className="flex-1 overflow-x-auto relative" style={{ background: theme.bg }}>
      <div className="px-4 py-2" style={{ minWidth: 'max-content' }}>
      {/* TR-707 grid lines */}
      {theme.gridLines && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(0,0,0,0.22) 31px, rgba(0,0,0,0.22) 32px),
              repeating-linear-gradient(to right,  transparent 0px, transparent 31px, rgba(0,0,0,0.22) 31px, rgba(0,0,0,0.22) 32px)
            `,
          }}
        />
      )}

      {/* Beat numbers row — top */}
      <div className={`flex gap-1.5 mb-1 ${(kitId === 'tr808' || kitId === 'tr606' || kitId === 'tr707' || kitId === 'tr909') ? 'pl-[48px]' : 'pl-[82px]'}`}>
        {groups.map((group, gi) => (
          <div key={gi} className="flex gap-0.5">
            {group.map((stepIdx) => (
              <div
                key={stepIdx}
                className="text-center font-mono tabular-nums select-none"
                style={{
                  width: `${btnSize}px`,
                  fontSize: '9px',
                  color: stepIdx % 4 === 0 ? stepNumBeatColor : stepNumColor,
                  fontWeight: stepIdx % 4 === 0 ? 'bold' : 'normal',
                  opacity: stepIdx % 4 === 0 ? 0.85 : 0.35,
                }}
              >
                {stepIdx % 4 === 0 ? String(stepIdx / 4 + 1) : '·'}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {visibleTracks.map((track) => {
          const effectiveKit: KitId = (trackKits[track.id] as KitId) ?? kitId
          const trackTheme = MACHINE_THEMES[effectiveKit]
          const machineDef = MACHINE_TRACKS[effectiveKit].find((m) => m.id === track.id)
          const displayLabel = machineDef?.label ?? track.label

          const is808label = effectiveKit === 'tr808' || effectiveKit === 'tr606' || effectiveKit === 'tr707' || effectiveKit === 'tr909'

          const stepCount = track.steps.length
          const trackGroups: number[][] = []
          for (let i = 0; i < stepCount; i += 4) trackGroups.push([i, i + 1, i + 2, i + 3])

          return (
            <div key={track.id} className="group flex items-center gap-1.5">
              {/* Remove button */}
              <button
                onClick={() => removeTrack(track.id)}
                className={`shrink-0 w-4 h-4 rounded-full font-mono text-[10px] leading-none
                  ${track.custom ? 'cursor-pointer' : 'invisible pointer-events-none'}`}
                style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666' }}
                title="Remove track"
              >×</button>

              {/* Pad label */}
              <button
                onMouseDown={() => onPadTrigger(track.id)}
                onContextMenu={(e) => { e.preventDefault(); toggleMute(track.id) }}
                title="Click: preview  ·  Right-click: mute"
                className={`shrink-0 font-mono font-bold border transition-all active:scale-95 ${is808label ? 'text-[9px]' : 'w-14 py-1 text-xs tracking-wider'}`}
                style={{
                  borderRadius: '3px',
                  background: track.muted ? 'transparent' : trackTheme.labelBg,
                  borderColor: track.muted ? trackTheme.border : trackTheme.labelBg,
                  color: track.muted ? trackTheme.textDim : trackTheme.labelText,
                  fontFamily: trackTheme.font,
                  opacity: track.muted ? 0.45 : 1,
                  boxShadow: track.muted ? 'none' : `0 0 4px ${trackTheme.accent}40`,
                  ...(is808label ? {
                    width: '20px',
                    height: `${btnSize}px`,
                    writingMode: 'vertical-rl' as const,
                    transform: 'rotate(180deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    letterSpacing: '0.05em',
                  } : {}),
                }}
              >{displayLabel}</button>

              {/* Steps */}
              <div className="flex gap-1.5 flex-1">
                {trackGroups.map((group, gi) => (
                  <div key={gi} className="flex gap-0.5">
                    {group.map((stepIdx) => {
                      const step = track.steps[stepIdx]
                      const isActive = step?.active ?? false
                      const isCurrent = isPlaying && (currentStep % stepCount) === stepIdx
                      const isBeat1 = stepIdx % 4 === 0
                      const velocity = step?.velocity ?? 0.85

                      const css = buildStepCss(
                        effectiveKit, isActive, isCurrent, isBeat1,
                        velocity,
                        trackTheme.stepActive, trackTheme.stepInactive, trackTheme.stepBeat
                      )

                      const prob = step?.probability
                      return (
                        <button
                          key={stepIdx}
                          onClick={() => toggleStep(track.id, stepIdx)}
                          onContextMenu={(e) => {
                            if (!isActive) return
                            e.preventDefault()
                            setPopover({ trackId: track.id, stepIdx, x: e.clientX, y: e.clientY })
                          }}
                          className="relative select-none"
                          style={{
                            width: `${btnSize}px`,
                            height: `${btnSize}px`,
                            opacity: track.muted ? 0.25 : 1,
                            cursor: 'pointer',
                            ...css,
                          }}
                        >
                          {isActive && prob !== undefined && prob < 1 && (
                            <span
                              className="absolute inset-0 flex items-end justify-center pointer-events-none"
                              style={{ fontSize: '6px', color: 'rgba(255,255,255,0.8)', paddingBottom: '2px', lineHeight: 1 }}
                            >{Math.round(prob * 100)}%</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Add track below */}
              <button
                onClick={() => addTrack(track.id)}
                title="Add track below"
                className="shrink-0 w-5 h-5 font-mono text-xs leading-none opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all"
                style={{ border: `1px solid ${trackTheme.border}`, borderRadius: '3px', color: trackTheme.textDim, background: 'transparent' }}
              >+</button>
            </div>
          )
        })}
      </div>

      </div>{/* end min-width scroll wrapper */}

      {/* Step editor popover */}
      {popover && (() => {
        const pt = tracks.find((t) => t.id === popover.trackId)
        const ps = pt?.steps[popover.stepIdx]
        if (!pt || !ps) return null
        const vel  = Math.round(ps.velocity * 100)
        const prob = Math.round((ps.probability ?? 1) * 100)
        return (
          <div
            ref={popoverRef}
            className="fixed z-50 flex flex-col gap-2.5 p-3"
            style={{
              left: popover.x, top: popover.y,
              transform: 'translate(-50%, 8px)',
              background: '#1c1c1c', border: '1px solid #333',
              borderRadius: '5px', minWidth: '170px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {[
              { label: 'VELOCITY', value: vel,  onChange: (v: number) => setStepVelocity(pt.id, popover.stepIdx, v / 100) },
              { label: 'PROB %',   value: prob, onChange: (v: number) => setStepProbability(pt.id, popover.stepIdx, v / 100) },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase w-16 shrink-0" style={{ color: '#555' }}>{label}</span>
                <input
                  type="range" min={0} max={100} value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="flex-1" style={{ accentColor: '#fff' }}
                />
                <span className="font-mono text-[9px] w-7 text-right shrink-0 tabular-nums" style={{ color: '#ccc' }}>{value}%</span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Machine name watermark */}
      <div
        className="absolute bottom-2 right-4 select-none pointer-events-none flex flex-col items-end"
        style={{ color: theme.logoColor, opacity: 0.15 }}
      >
        <span className="font-mono font-bold tracking-widest" style={{ fontSize: '10px', letterSpacing: '0.2em' }}>
          {HARDWARE_NAMES[kitId]}
        </span>
        <span className="font-mono font-black tracking-wider" style={{ fontSize: '20px', letterSpacing: '0.08em', lineHeight: 1 }}>
          {kitId.toUpperCase().replace('TR', 'TR-').replace('TB', 'TB-').replace('SH', 'SH-')}
        </span>
      </div>
    </div>
  )
}
