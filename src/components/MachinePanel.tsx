import { useState } from 'react'
import type React from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, isBassLine } from '../machines'
import { MachineControls } from './MachineControls'
import { DrumGrid } from './DrumGrid'
import { PianoRollGrid } from './PianoRollGrid'
import type { KitId } from '../types'

const KIT_LABELS: Record<KitId, string> = {
  tr808: 'TR-808', tr909: 'TR-909', tr606: 'TR-606',
  tr707: 'TR-707', tb303: 'TB-303', sh101: 'SH-101',
}

interface MachineInfoData {
  fullName: string
  year: number
  type: string
  specs: string[]
  knownFor: string
}

const MACHINE_INFO: Record<KitId, MachineInfoData> = {
  tr808: {
    fullName: 'Roland TR-808 Rhythm Composer',
    year: 1980,
    type: 'Analog Drum Machine',
    specs: ['12 analog voices', 'Programmable 32-step sequencer', 'Accent & shuffle control', 'Trigger/gate outputs'],
    knownFor: 'Hip-hop, trap, electro — defining the booming kick and snappy clap heard on countless records.',
  },
  tr909: {
    fullName: 'Roland TR-909 Rhythm Composer',
    year: 1983,
    type: 'Analog / PCM Drum Machine',
    specs: ['9 voices — analog kick, snare & hi-hats', 'PCM cymbals & claps', 'MIDI in/out/thru', 'Accent, shuffle, flam'],
    knownFor: 'House & techno — the punchy kick and crisp snare that built dance music.',
  },
  tr606: {
    fullName: 'Roland TR-606 Drumatix',
    year: 1981,
    type: 'Analog Drum Machine',
    specs: ['7 fully analog voices', 'DIN sync (cassette tape)', 'Designed as TB-303 companion', 'Compact desktop form'],
    knownFor: 'Electro, post-punk, EBM — raw, lo-fi analog textures.',
  },
  tr707: {
    fullName: 'Roland TR-707 Rhythm Composer',
    year: 1984,
    type: 'PCM Drum Machine',
    specs: ['16 digital PCM voices', 'MIDI in/out/thru', 'External floppy disk storage', 'Velocity sensitive pads'],
    knownFor: '80s pop, R&B and new wave — bright, punchy digital sounds.',
  },
  tb303: {
    fullName: 'Roland TB-303 Bass Line',
    year: 1981,
    type: 'Monophonic Bass Synthesizer',
    specs: ['1 VCO — sawtooth or square wave', 'Resonant 18 dB lowpass filter', 'Filter envelope with accent', 'Built-in step sequencer'],
    knownFor: 'Acid house & techno — the signature squelching resonance that launched an entire genre.',
  },
  sh101: {
    fullName: 'Roland SH-101 Synthesizer',
    year: 1982,
    type: 'Monophonic Analog Synthesizer',
    specs: ['1 VCO with sub-oscillator', '24 dB lowpass filter (LPF)', 'LFO with multiple shapes', 'Built-in arpeggiator & sequencer'],
    knownFor: 'New wave, synth-pop and acid house — warm leads and driving basslines.',
  },
}

function MachineTooltip({ kitId }: { readonly kitId: KitId }) {
  const theme = MACHINE_THEMES[kitId]
  const info  = MACHINE_INFO[kitId]

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: '28px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '4px',
        padding: '10px 12px',
        minWidth: '230px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="mb-0.5"
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.08em',
          color: theme.accent,
        }}
      >
        {info.fullName}
      </div>
      <div className="font-mono text-[9px] mb-2.5" style={{ color: theme.textDim }}>
        {info.year} · {info.type}
      </div>
      <div className="flex flex-col gap-1 mb-2.5">
        {info.specs.map((spec) => (
          <div key={spec} className="flex items-start gap-1.5 font-mono text-[9px]" style={{ color: theme.text }}>
            <span style={{ color: theme.accent, flexShrink: 0 }}>·</span>
            {spec}
          </div>
        ))}
      </div>
      <div
        className="font-mono text-[9px] leading-relaxed"
        style={{ color: theme.textDim, borderTop: `1px solid ${theme.border}`, paddingTop: '7px' }}
      >
        {info.knownFor}
      </div>
    </div>
  )
}

interface Props {
  readonly kitId: KitId
  readonly onPadTrigger: (trackId: string) => void
  readonly onPlay: () => void
  readonly onStop: () => void
  readonly hideControls?: boolean
  readonly isDragOver?: boolean
  readonly onMachineDragStart?: () => void
  readonly onMachineDragOver?: (e: React.DragEvent) => void
  readonly onMachineDragLeave?: () => void
  readonly onMachineDrop?: () => void
  readonly onMachineDragEnd?: () => void
}

export function MachinePanel({ kitId, onPadTrigger, onPlay, onStop, hideControls, isDragOver, onMachineDragStart, onMachineDragOver, onMachineDragLeave, onMachineDrop, onMachineDragEnd }: Props) {
  const mutedKits = useSequencerStore((s) => s.mutedKits)
  const toggleMachineKitMute = useSequencerStore((s) => s.toggleMachineKitMute)
  const theme = MACHINE_THEMES[kitId]
  const isBass = isBassLine(kitId)
  const isMuted = mutedKits.includes(kitId)
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div
      className="flex flex-col shrink-0 border-b"
      draggable={!!onMachineDragStart}
      onDragStart={onMachineDragStart}
      onDragOver={onMachineDragOver}
      onDragLeave={onMachineDragLeave}
      onDrop={onMachineDrop}
      onDragEnd={onMachineDragEnd}
      style={{
        borderColor: theme.border,
        opacity: isMuted ? 0.45 : 1,
        borderTop: isDragOver ? `2px solid ${theme.accent}` : undefined,
      }}
    >
      {/* Main content row: label strip + grid */}
      <div className="flex">
        {/* Label strip: machine name + mute button */}
        <div
          className="shrink-0 flex flex-col items-center justify-between py-2 relative cursor-grab active:cursor-grabbing"
          style={{ width: '20px', background: theme.surface, borderRight: `1px solid ${theme.border}` }}
        >
          <button
            onClick={() => toggleMachineKitMute(kitId)}
            title={isMuted ? 'Unmute machine' : 'Mute machine'}
            className="select-none transition-colors flex items-center justify-center"
            style={{ color: isMuted ? '#ef4444' : theme.textDim }}
          >
            {isMuted ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.63 3.63a1 1 0 0 0 0 1.41L7.29 8.7 7 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l4 4a1 1 0 0 0 1.7-.71v-2.58l4.18 4.18a1 1 0 0 0 1.41-1.41L5.05 3.63a1 1 0 0 0-1.42 0ZM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53A8.93 8.93 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71Zm-7-8-1.88 1.88L12 7.76V4a1 1 0 0 0-1.7-.71l-.74.74L12 6.56V4Z"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <span
            className="select-none whitespace-nowrap cursor-default"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              color: theme.accent,
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.1em',
            }}
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            {KIT_LABELS[kitId]}
          </span>
          {showInfo && <MachineTooltip kitId={kitId} />}
        </div>

        {/* Grid */}
        {isBass
          ? <PianoRollGrid kitId={kitId} onPadTrigger={onPadTrigger} />
          : <DrumGrid kitId={kitId} onPadTrigger={onPadTrigger} />
        }
      </div>

      {!hideControls && <MachineControls kitId={kitId} onPlay={onPlay} onStop={onStop} />}
    </div>
  )
}
