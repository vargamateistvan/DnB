import type { CSSProperties } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, MACHINE_TRACKS } from '../machines'
import { KnobControl } from './KnobControl'
import type { KitId } from '../types'

// ── Step button style per machine ─────────────────────────────────────────────
interface StepStyle {
  width: number
  height: number
  borderRadius: string
}

const STEP_STYLE: Record<string, StepStyle> = {
  circle:   { width: 28, height: 28, borderRadius: '50%' },
  square:   { width: 28, height: 28, borderRadius: '3px' },
  rect:     { width: 30, height: 18, borderRadius: '2px' },
  triangle: { width: 28, height: 28, borderRadius: '4px' },
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
  shape: string,
  isActive: boolean,
  isCurrent: boolean,
  isBeat1: boolean,
  velocity: number,
  activeColor: string,
  inactiveColor: string,
  beatColor: string
): CSSProperties {
  const s = STEP_STYLE[shape] ?? STEP_STYLE.square

  // TR-808: tiny dot → large velocity-colored circle
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
    const scale = 0.45 + velocity * 0.50
    const glow = Math.round(velocity * 14)
    return {
      backgroundColor: color, borderRadius: '50%', border: 'none',
      boxShadow: `0 0 ${glow}px ${color}99`,
      transform: `scale(${scale.toFixed(3)})`,
      transition: 'transform 120ms ease, background-color 60ms, box-shadow 60ms',
      ...(isCurrent ? { outline: '2px solid rgba(255,255,255,0.75)', outlineOffset: '3px' } : {}),
    }
  }

  // TR-909: dark rect with red LED stripe at top when active
  if (kitId === 'tr909') {
    const darkBg = isBeat1 ? '#525050' : '#4a4848'
    if (!isActive) {
      return {
        backgroundColor: isCurrent ? '#5a3830' : darkBg,
        border: 'none', boxShadow: 'none',
        borderRadius: s.borderRadius,
        transition: 'background-color 60ms',
      }
    }
    return {
      background: `linear-gradient(to bottom, ${activeColor} 0, ${activeColor} 5px, #4a4848 5px)`,
      border: 'none', boxShadow: 'none',
      borderRadius: s.borderRadius,
      transition: 'background 60ms',
      ...(isCurrent ? { outline: `2px solid ${activeColor}aa`, outlineOffset: '1px' } : {}),
    }
  }

  // TR-606: variable-size circles (no velocity — uniform red)
  if (kitId === 'tr606') {
    if (!isActive) {
      return {
        backgroundColor: isCurrent ? '#6a6a66' : '#545450',
        borderRadius: '50%', border: 'none', boxShadow: 'none',
        transform: 'scale(0.22)',
        transition: 'transform 120ms ease, background-color 60ms',
      }
    }
    return {
      backgroundColor: activeColor,
      borderRadius: '50%', border: 'none',
      boxShadow: `0 0 8px ${activeColor}99`,
      transform: 'scale(0.88)',
      transition: 'transform 120ms ease, background-color 60ms, box-shadow 60ms',
      ...(isCurrent ? { outline: '2px solid rgba(255,255,255,0.75)', outlineOffset: '3px' } : {}),
    }
  }

  // TR-707: circles on olive grid — inactive show a subtle ring, active = filled black
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
      backgroundColor: '#111',
      borderRadius: '50%', border: 'none', boxShadow: 'none',
      ...(isCurrent ? { outline: '2px solid rgba(192,72,8,0.9)', outlineOffset: '2px' } : {}),
      transition: 'background-color 60ms',
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
    boxShadow: shadow, borderRadius: s.borderRadius,
    transition: 'background-color 60ms, box-shadow 60ms',
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
  const tracks = useSequencerStore((s) => s.tracks)
  const currentStep = useSequencerStore((s) => s.currentStep)
  const isPlaying = useSequencerStore((s) => s.isPlaying)
  const toggleStep = useSequencerStore((s) => s.toggleStep)
  const toggleMute = useSequencerStore((s) => s.toggleMute)
  const setVolume = useSequencerStore((s) => s.setVolume)
  const addTrack = useSequencerStore((s) => s.addTrack)
  const removeTrack = useSequencerStore((s) => s.removeTrack)
  const setTrackStepCount = useSequencerStore((s) => s.setTrackStepCount)
  const trackKits = useSequencerStore((s) => s.trackKits)

  const theme = MACHINE_THEMES[kitId]
  const machineTrackDefs = MACHINE_TRACKS[kitId]

  const machineTids = new Set<string>(machineTrackDefs.map((t) => t.id))
  const visibleTracks = tracks.filter((t) => machineTids.has(t.id) || t.custom)

  const maxStepCount = Math.max(...visibleTracks.map((t) => t.steps.length), 16)
  const groups: number[][] = []
  for (let i = 0; i < maxStepCount; i += 4) groups.push([i, i + 1, i + 2, i + 3])

  const shape = theme.buttonShape
  const beatW = STEP_STYLE[shape]?.width ?? 30

  const stepNumColor = theme.textDim
  const stepNumBeatColor = theme.accent

  return (
    <div className="flex-1 px-4 py-2 relative" style={{ background: theme.bg }}>
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
                  width: `${beatW}px`,
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

          const trackShape = trackTheme.buttonShape
          const btnSize = STEP_STYLE[trackShape] ?? STEP_STYLE.square

          const is808label = effectiveKit === 'tr808' || effectiveKit === 'tr606' || effectiveKit === 'tr707' || effectiveKit === 'tr909'

          const trackStepCount = track.steps.length
          const trackGroups: number[][] = []
          for (let i = 0; i < trackStepCount; i += 4) trackGroups.push([i, i + 1, i + 2, i + 3])

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
                    height: `${btnSize.height}px`,
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
                      const isCurrent = isPlaying && (currentStep % trackStepCount) === stepIdx
                      const isBeat1 = stepIdx % 4 === 0
                      const velocity = step?.velocity ?? 0.85

                      const css = buildStepCss(
                        effectiveKit, trackShape, isActive, isCurrent, isBeat1,
                        velocity,
                        trackTheme.stepActive, trackTheme.stepInactive, trackTheme.stepBeat
                      )

                      return (
                        <button
                          key={stepIdx}
                          onClick={() => toggleStep(track.id, stepIdx)}
                          className="relative select-none"
                          style={{
                            width: `${btnSize.width}px`,
                            height: `${btnSize.height}px`,
                            opacity: track.muted ? 0.25 : 1,
                            cursor: 'pointer',
                            ...css,
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Volume knob */}
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <KnobControl
                  value={track.volume} label="VOL" color={trackTheme.accent} size={28}
                  trackColor={trackTheme.border} bodyColor={trackTheme.panel} labelColor={trackTheme.textDim}
                  onChange={(v) => setVolume(track.id, v)}
                />
              </div>

              {/* Per-track step count */}
              <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {([16, 32, 64] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setTrackStepCount(track.id, n)}
                    className="font-mono text-[9px] font-bold w-5 h-5"
                    style={{
                      background: trackStepCount === n ? trackTheme.accent : 'transparent',
                      border: `1px solid ${trackStepCount === n ? trackTheme.accent : trackTheme.border}`,
                      borderRadius: '2px',
                      color: trackStepCount === n ? '#000' : trackTheme.textDim,
                    }}
                  >{n}</button>
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
