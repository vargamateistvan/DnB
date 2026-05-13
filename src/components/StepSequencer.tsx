import type { CSSProperties } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, MACHINE_TRACKS } from '../machines'
import { KnobControl } from './KnobControl'
import type { KitId } from '../types'

// ── Note cycle for bass sequencer ─────────────────────────────────────────────
const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const BASS_NOTES: string[] = []
for (const oct of [1, 2, 3]) for (const n of CHROMATIC) BASS_NOTES.push(`${n}${oct}`)

function nextBassNote(current: string): string {
  const idx = BASS_NOTES.indexOf(current)
  return BASS_NOTES[(idx + 1) % BASS_NOTES.length]
}

// ── Step button style per machine ─────────────────────────────────────────────
interface StepStyle {
  width: number
  height: number
  borderRadius: string
}

const STEP_STYLE: Record<string, StepStyle> = {
  circle:   { width: 30, height: 30, borderRadius: '50%' },
  square:   { width: 30, height: 30, borderRadius: '3px' },
  rect:     { width: 32, height: 20, borderRadius: '3px' },
  triangle: { width: 30, height: 30, borderRadius: '4px' },
}

function buildStepCss(
  shape: string,
  isActive: boolean,
  isCurrent: boolean,
  isBeat1: boolean,
  activeColor: string,
  inactiveColor: string,
  beatColor: string
): CSSProperties {
  const bg = isActive ? activeColor : isBeat1 ? beatColor : inactiveColor

  const shadow = [
    isActive
      ? `0 0 8px ${activeColor}90, 0 0 2px ${activeColor}, inset 0 0 6px ${activeColor}30`
      : `inset 0 2px 3px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.06)`,
    isCurrent ? `0 0 0 2px rgba(255,255,255,0.7)` : '',
  ].filter(Boolean).join(', ')

  const style: CSSProperties = {
    backgroundColor: bg,
    border: `1px solid ${isActive ? activeColor : isBeat1 ? beatColor : inactiveColor}`,
    boxShadow: shadow,
    transition: 'background-color 60ms, box-shadow 60ms',
  }
  const s = STEP_STYLE[shape] ?? STEP_STYLE.square
  return { ...style, borderRadius: s.borderRadius }
}

interface Props {
  onPadTrigger: (trackId: string) => void
}

export function StepSequencer({ onPadTrigger }: Props) {
  const tracks = useSequencerStore((s) => s.tracks)
  const currentStep = useSequencerStore((s) => s.currentStep)
  const stepCount = useSequencerStore((s) => s.stepCount)
  const isPlaying = useSequencerStore((s) => s.isPlaying)
  const toggleStep = useSequencerStore((s) => s.toggleStep)
  const setStepNote = useSequencerStore((s) => s.setStepNote)
  const toggleMute = useSequencerStore((s) => s.toggleMute)
  const setVolume = useSequencerStore((s) => s.setVolume)
  const addTrack = useSequencerStore((s) => s.addTrack)
  const removeTrack = useSequencerStore((s) => s.removeTrack)
  const kit = useSequencerStore((s) => s.kit)
  const trackKits = useSequencerStore((s) => s.trackKits)

  const globalTheme = MACHINE_THEMES[kit]
  const machineTrackDefs = MACHINE_TRACKS[kit]

  const machineTids = new Set<string>(machineTrackDefs.map((t) => t.id))
  const visibleTracks = tracks.filter((t) => machineTids.has(t.id) || t.custom)

  const groups: number[][] = []
  for (let i = 0; i < stepCount; i += 4) groups.push([i, i+1, i+2, i+3])

  return (
    <div className="flex-1 overflow-auto px-4 py-2 relative" style={{ background: globalTheme.bg }}>
      {/* TR-707 grid lines */}
      {globalTheme.gridLines && (
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 31px, ${globalTheme.border} 32px)`,
          }}
        />
      )}

      <div className="space-y-1">
        {visibleTracks.map((track) => {
          const effectiveKit: KitId = (trackKits[track.id] as KitId) ?? kit
          const theme = MACHINE_THEMES[effectiveKit]
          const machineDef = MACHINE_TRACKS[effectiveKit].find((m) => m.id === track.id)
          const displayLabel = machineDef?.label ?? track.label

          // Bass machines show note names inside drum-style buttons
          const isBass = effectiveKit === 'tb303' || effectiveKit === 'sh101'
          const shape = theme.buttonShape
          const btnSize = STEP_STYLE[shape] ?? STEP_STYLE.square

          // Compute text contrast for active note buttons
          const hex = theme.stepActive.replace('#', '')
          const eh = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
          const isActiveLightBg = (parseInt(eh.slice(0,2),16)*0.299 + parseInt(eh.slice(2,4),16)*0.587 + parseInt(eh.slice(4,6),16)*0.114) > 128
          const noteTextColor = isActiveLightBg ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.95)'

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

              {/* Pad label — click to preview, right-click to mute */}
              <button
                onMouseDown={() => onPadTrigger(track.id)}
                onContextMenu={(e) => { e.preventDefault(); toggleMute(track.id) }}
                className="w-14 shrink-0 py-1 font-mono text-xs font-bold tracking-wider border transition-all active:scale-95"
                title="Click: preview  ·  Right-click: mute"
                style={{
                  borderRadius: '3px',
                  background: track.muted ? 'transparent' : theme.labelBg,
                  borderColor: track.muted ? theme.border : theme.labelBg,
                  color: track.muted ? theme.textDim : theme.labelText,
                  fontFamily: theme.font,
                  opacity: track.muted ? 0.45 : 1,
                  boxShadow: track.muted ? 'none' : `0 0 6px ${theme.accent}30`,
                }}
              >{displayLabel}</button>

              {/* Steps */}
              <div className="flex gap-1.5 flex-1">
                {groups.map((group, gi) => (
                  <div key={gi} className="flex gap-0.5">
                    {group.map((stepIdx) => {
                      const step = track.steps[stepIdx]
                      const isActive = step?.active ?? false
                      const isCurrent = isPlaying && currentStep === stepIdx
                      const isBeat1 = stepIdx % 4 === 0

                      const css = buildStepCss(
                        shape, isActive, isCurrent, isBeat1,
                        theme.stepActive, theme.stepInactive, theme.stepBeat
                      )

                      if (isBass) {
                        const noteDisplay = step?.note ?? 'C2'
                        return (
                          <button
                            key={stepIdx}
                            onClick={() => {
                              if (isActive) {
                                setStepNote(track.id, stepIdx, nextBassNote(step?.note ?? 'C2'))
                              } else {
                                toggleStep(track.id, stepIdx)
                              }
                            }}
                            onDoubleClick={() => {
                              if (isActive) toggleStep(track.id, stepIdx)
                            }}
                            title={isActive ? 'Click: next note  ·  Dbl-click: deactivate' : 'Click: activate'}
                            className="relative flex items-center justify-center select-none"
                            style={{
                              width: `${btnSize.width}px`,
                              height: `${btnSize.height}px`,
                              opacity: track.muted ? 0.25 : 1,
                              cursor: 'pointer',
                              ...css,
                            }}
                          >
                            {isActive ? (
                              <span className="font-mono pointer-events-none" style={{
                                fontSize: '8px',
                                fontWeight: 700,
                                color: noteTextColor,
                                letterSpacing: '-0.02em',
                              }}>
                                {noteDisplay}
                              </span>
                            ) : (
                              <span style={{ fontSize: '10px', color: theme.textDim, opacity: 0.3 }}>·</span>
                            )}
                            {isCurrent && (
                              <span className="absolute inset-0 pointer-events-none"
                                style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.8)', borderRadius: css.borderRadius }} />
                            )}
                          </button>
                        )
                      }

                      // Drum step button
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
                        >
                          {/* Active indicator dot */}
                          {isActive && shape !== 'rect' && (
                            <span
                              className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none"
                            >
                              <span className="w-1 h-1 rounded-full block" style={{ background: 'rgba(255,255,255,0.5)' }} />
                            </span>
                          )}
                          {/* Playing highlight */}
                          {isCurrent && (
                            <span className="absolute inset-0 pointer-events-none"
                              style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.75)', borderRadius: css.borderRadius }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Volume knob */}
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <KnobControl
                  value={track.volume} label="VOL" color={theme.accent} size={28}
                  trackColor={theme.border} bodyColor={theme.panel} labelColor={theme.textDim}
                  onChange={(v) => setVolume(track.id, v)}
                />
              </div>

              {/* Add track below */}
              <button
                onClick={() => addTrack(track.id)}
                title="Add track below"
                className="shrink-0 w-5 h-5 font-mono text-xs leading-none opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all"
                style={{ border: `1px solid ${theme.border}`, borderRadius: '3px', color: theme.textDim, background: 'transparent' }}
              >+</button>
            </div>
          )
        })}
      </div>

      {/* Beat numbers row */}
      {(() => {
        const beatW = STEP_STYLE[globalTheme.buttonShape]?.width ?? 30
        return (
          <div className="flex gap-1.5 mt-1.5 pl-[82px]">
            {groups.map((group, gi) => (
              <div key={gi} className="flex gap-0.5">
                {group.map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className="text-center font-mono text-[9px] tabular-nums"
                    style={{
                      width: `${beatW}px`,
                      color: stepIdx % 8 === 0 ? globalTheme.accent : globalTheme.textDim,
                      fontWeight: stepIdx % 8 === 0 ? 'bold' : 'normal',
                      opacity: stepIdx % 8 === 0 ? 0.9 : 0.4,
                    }}
                  >
                    {stepIdx % 4 === 0 ? String(stepIdx / 4 + 1) : '·'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
