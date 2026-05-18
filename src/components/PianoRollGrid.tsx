import { useMemo, useState, useEffect } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, MACHINE_TRACKS } from '../machines'
import type { KitId } from '../types'

const NOTES_2OCT: string[] = [
  'B3','A#3','A3','G#3','G3','F#3','F3','E3','D#3','D3','C#3','C3',
  'B2','A#2','A2','G#2','G2','F#2','F2','E2','D#2','D2','C#2','C2',
]
const NOTES_1OCT: string[] = [
  'B2','A#2','A2','G#2','G2','F#2','F2','E2','D#2','D2','C#2','C2',
]

const BTN_BASE = 28  // px — desktop cell size
const GAP = 2        // px — gap between cells
const GRP = 6        // px — gap between beat groups

function useBtnSize(): number {
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 34 : BTN_BASE
  )
  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? 34 : BTN_BASE)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

// Equilateral ▲ centered in a square cell: height = (√3/2)×width ≈ 86.6%, vertical pad ≈ 6.7%
const TRIANGLE = 'polygon(50% 6.7%, 0% 93.3%, 100% 93.3%)'


const KIT_NAMES: Record<KitId, string> = {
  sh101: 'SH-101', tb303: 'TB-303', tr808: 'TR-808',
  tr909: 'TR-909', tr606: 'TR-606', tr707: 'TR-707',
}

interface Props {
  kitId: KitId
  onPadTrigger: (_trackId: string) => void
}

export function PianoRollGrid({ kitId }: Props) {
  const btnSize     = useBtnSize()
  const tracks      = useSequencerStore((s) => s.tracks)
  const currentStep = useSequencerStore((s) => s.currentStep)
  const isPlaying   = useSequencerStore((s) => s.isPlaying)
  const toggleStep  = useSequencerStore((s) => s.toggleStep)
  const setStepNote = useSequencerStore((s) => s.setStepNote)

  const machineParams = useSequencerStore((s) => s.machineParams)

  const theme       = MACHINE_THEMES[kitId]
  const bassTrackId = MACHINE_TRACKS[kitId][0].id
  const bassTrack   = tracks.find((t) => t.id === bassTrackId)
  const isTb303     = kitId === 'tb303'
  const tb303Square = isTb303 && machineParams.tb303.waveform === 'square'

  const trackStepCount = bassTrack?.steps.length ?? 16
  const groups: number[][] = []
  for (let i = 0; i < trackStepCount; i += 4) groups.push([i, i + 1, i + 2, i + 3])

  if (!bassTrack) return null

  // Show 2 octaves only when active notes require it (any note in octave 3+)
  const NOTES = useMemo(() => {
    const needs2Oct = bassTrack.steps.some((s) => {
      if (!s.active) return false
      const oct = parseInt((s.note ?? 'C2').match(/\d+/)?.[0] ?? '2')
      return oct >= 3
    })
    return needs2Oct ? NOTES_2OCT : NOTES_1OCT
  }, [bassTrack.steps])

  return (
    <div
      className="flex-1 relative overflow-auto px-4 py-4"
      style={{ background: theme.bg }}
    >
      {/* Beat number row */}
      <div className="flex mb-1" style={{ paddingLeft: `${btnSize + GRP}px`, gap: `${GRP}px` }}>
        {groups.map((group, gi) => (
          <div key={gi} className="flex" style={{ gap: `${GAP}px` }}>
            {group.map((stepIdx) => (
              <div
                key={stepIdx}
                className="text-center font-mono tabular-nums select-none"
                style={{
                  width: `${btnSize}px`,
                  fontSize: '9px',
                  color: stepIdx % 4 === 0 ? theme.accent : theme.textDim,
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

      {/* Grid rows */}
      <div className="flex flex-col" style={{ gap: `${GAP}px` }}>
        {NOTES.map((rowNote, rowIdx) => {
          const isSharp   = rowNote.includes('#')
          const isOctaveC = rowNote.startsWith('C') && !isSharp

          // ── Note label chip colours (TB-303 vs SH-101) ──────────────────
          let chipBg: string
          let chipColor: string
          if (isTb303) {
            chipBg    = isSharp ? '#111' : 'rgba(255,255,255,0.55)'
            chipColor = isSharp ? '#fff' : '#222'
          } else {
            chipBg    = isSharp ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)'
            chipColor = isSharp ? '#fff' : 'rgba(255,255,255,0.7)'
          }
          const chipBorder = (isTb303 && !isSharp) ? '1px solid rgba(0,0,0,0.18)' : 'none'

          return (
            <div key={rowNote}>
              {/* Octave separator above C notes */}
              {isOctaveC && rowIdx > 0 && (
                <div className="mb-2" style={{ height: '1px', background: isTb303 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)' }} />
              )}

              <div className="flex items-center" style={{ gap: `${GRP}px` }}>
                {/* Note label chip */}
                <div
                  className="shrink-0 flex items-center justify-center select-none font-mono"
                  style={{
                    width: `${btnSize}px`,
                    height: `${btnSize}px`,
                    background: chipBg,
                    border: chipBorder,
                    borderRadius: '2px',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: chipColor,
                  }}
                >
                  <span>{rowNote.replace(/\d/, '')}</span>
                  {!isTb303 && (
                    <span style={{ fontSize: '7px', opacity: 0.6, marginLeft: '1px' }}>
                      {rowNote.match(/\d/)?.[0]}
                    </span>
                  )}
                </div>

                {/* Step cells in groups of 4 */}
                {groups.map((group, gi) => (
                  <div key={gi} className="flex" style={{ gap: `${GAP}px` }}>
                    {group.map((stepIdx) => {
                      const step      = bassTrack.steps[stepIdx]
                      const stepNote  = step?.note ?? 'C2'
                      const isActive  = (step?.active ?? false) && stepNote === rowNote
                      const isOtherNote = (step?.active ?? false) && stepNote !== rowNote
                      const isCurrent = isPlaying && (currentStep % trackStepCount) === stepIdx
                      const isBeat1   = stepIdx % 4 === 0

                      const isHit = isCurrent && isActive

                      const clickHandler = () => {
                        const active = step?.active ?? false
                        const note   = step?.note ?? 'C2'
                        if (!active) {
                          toggleStep(bassTrackId, stepIdx)
                          setStepNote(bassTrackId, stepIdx, rowNote)
                        } else if (note === rowNote) {
                          toggleStep(bassTrackId, stepIdx)
                        } else {
                          setStepNote(bassTrackId, stepIdx, rowNote)
                        }
                      }
                      const clickTitle = isActive ? 'Click: deactivate'
                        : isOtherNote ? `Move note to ${rowNote}`
                        : `Activate at ${rowNote}`

                      // ── TB-303: triangles or squares based on waveform ────
                      if (isTb303) {
                        const clipPath = tb303Square ? undefined : TRIANGLE
                        const borderRadius = tb303Square ? '1px' : undefined

                        let scale: number
                        if (isHit)            scale = 1.05
                        else if (isActive)    scale = 0.80
                        else if (isOtherNote) scale = 0.42
                        else                  scale = 0.42

                        let color: string
                        if (isActive)         color = isSharp ? '#111' : 'rgba(255,255,255,0.82)'
                        else if (isOtherNote) color = isSharp ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.44)'
                        else if (isBeat1)     color = isSharp ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.38)'
                        else                  color = isSharp ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.20)'
                        if (isCurrent && !isActive) color = isSharp ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.35)'

                        return (
                          <button
                            key={stepIdx}
                            onClick={clickHandler}
                            title={clickTitle}
                            className="select-none shrink-0"
                            style={{
                              width: `${btnSize}px`,
                              height: `${btnSize}px`,
                              clipPath,
                              borderRadius,
                              backgroundColor: color,
                              border: 'none',
                              transform: `scale(${scale})`,
                              transition: isHit
                                ? 'transform 35ms ease-out'
                                : 'transform 120ms ease, background-color 80ms',
                              cursor: 'pointer',
                            }}
                          />
                        )
                      }

                      // ── SH-101: LED dot-matrix cells ─────────────────────
                      let cellBg = isBeat1 ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.38)'
                      if (isCurrent && !isActive) cellBg = 'rgba(255,255,255,0.12)'

                      const activeStyle = isActive ? {
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.88) 1.5px, transparent 1.5px)`,
                        backgroundSize: '5px 5px',
                        backgroundColor: `${theme.stepActive}22`,
                        boxShadow: isHit
                          ? `0 0 14px ${theme.stepActive}cc`
                          : `0 0 6px ${theme.stepActive}60`,
                        transform: isHit ? 'scale(1.1)' : 'scale(1)',
                        transition: isHit
                          ? 'transform 35ms ease-out, box-shadow 35ms'
                          : 'transform 140ms ease, box-shadow 140ms',
                      } : {
                        backgroundColor: cellBg,
                        backgroundImage: 'none',
                        boxShadow: isCurrent ? `inset 0 0 0 1px rgba(255,255,255,0.3)` : 'none',
                      }

                      const otherNoteHint = isOtherNote
                        ? { boxShadow: `inset 0 0 0 1px ${theme.stepActive}60` }
                        : {}

                      return (
                        <button
                          key={stepIdx}
                          onClick={clickHandler}
                          title={clickTitle}
                          className="select-none shrink-0 transition-all"
                          style={{
                            width: `${btnSize}px`,
                            height: `${btnSize}px`,
                            borderRadius: '2px',
                            border: 'none',
                            cursor: 'pointer',
                            ...activeStyle,
                            ...otherNoteHint,
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Machine name watermark — bottom right */}
      <div
        className="absolute bottom-3 right-5 font-mono font-bold tracking-widest select-none pointer-events-none"
        style={{
          fontSize: '22px',
          color: theme.accent,
          opacity: isTb303 ? 0.10 : 0.25,
          letterSpacing: '0.15em',
        }}
      >
        {KIT_NAMES[kitId]}
      </div>
    </div>
  )
}
