import type { ReactNode } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, MACHINE_TRACKS } from '../machines'
import { KnobControl } from './KnobControl'
import type { KitId } from '../types'

interface RandomBtnProps {
  readonly onClick: () => void
  readonly accent: string
  readonly border: string
  readonly textDim: string
}

function RandomBtn({ onClick, accent, border, textDim }: RandomBtnProps) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-all self-end mb-1"
      style={{ border: `1px solid ${border}`, borderRadius: '3px', color: textDim, background: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textDim }}
    >
      RND
    </button>
  )
}

export function MachineControls({ kitId }: { readonly kitId?: KitId }) {
  const primaryKit = useSequencerStore((s) => s.kit)
  const kit = kitId ?? primaryKit
  const params = useSequencerStore((s) => s.machineParams)
  const tracks = useSequencerStore((s) => s.tracks)
  const setMachineParam = useSequencerStore((s) => s.setMachineParam)
  const setVolume = useSequencerStore((s) => s.setVolume)
  const randomize = useSequencerStore((s) => s.randomize)
  const theme = MACHINE_THEMES[kit]

  const accent = theme.accent
  const bgR = Number.parseInt(theme.bg.slice(1, 3), 16)
  const bgG = Number.parseInt(theme.bg.slice(3, 5), 16)
  const bgB = Number.parseInt(theme.bg.slice(5, 7), 16)
  const isDark = (bgR * 0.299 + bgG * 0.587 + bgB * 0.114) < 128
  const trackColor = isDark ? '#44444480' : '#88888880'
  const bodyColor = theme.panel
  const labelColor = theme.textDim

  function knob(value: number, label: string, size: number, onChange: (v: number) => void) {
    return (
      <KnobControl
        value={value} label={label} color={accent}
        trackColor={trackColor} bodyColor={bodyColor} labelColor={labelColor}
        size={size} onChange={onChange}
      />
    )
  }

  function divider() {
    return <div className="self-stretch w-px mx-1 opacity-40" style={{ background: theme.border }} />
  }

  // Per-instrument rotary level knobs (used by TR-808, TR-909, TR-606)
  const rotaryLevels = MACHINE_TRACKS[kit].map((trackDef) => {
    const track = tracks.find((t) => t.id === trackDef.id)
    if (!track) return null
    return (
      <div key={trackDef.id}>
        {knob(track.volume, trackDef.label, 34, (v) => setVolume(track.id, v))}
      </div>
    )
  })

  // ── SH-101 — vertical faders matching real hardware layout ──────────────────
  if (kit === 'sh101') {
    const p = params.sh101
    const bassTrack = tracks.find((t) => t.id === 'bass')

    function vfader(value: number, label: string, onChange: (v: number) => void) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[8px] tabular-nums" style={{ color: labelColor }}>
            {Math.round(value * 100)}
          </span>
          <input
            type="range" min={0} max={1} step={0.01} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-14 cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: accent }}
          />
          <span className="font-mono text-[8px] font-bold uppercase text-center" style={{ color: labelColor, maxWidth: '32px', lineHeight: 1.1 }}>
            {label}
          </span>
        </div>
      )
    }

    function section(title: string, children: ReactNode) {
      return (
        <div className="flex flex-col items-center gap-1 px-3 py-2" style={{ border: `1px solid ${theme.border}`, borderRadius: '3px' }}>
          <span className="font-mono text-[8px] uppercase tracking-widest mb-1" style={{ color: labelColor }}>{title}</span>
          <div className="flex items-end gap-3">{children}</div>
        </div>
      )
    }

    return (
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-2 border-t flex-wrap"
        style={{ background: theme.panel, borderColor: theme.border }}
      >
        <div className="flex flex-col gap-1 self-center">
          {bassTrack && knob(bassTrack.volume, 'LEVEL', 36, (v) => setVolume('bass', v))}
        </div>

        {divider()}

        {section('MOD',
          <>{vfader(p.portamento, 'RATE', (v) => setMachineParam('sh101', 'portamento', v))}</>
        )}

        {section('SOURCE MIXER',
          <>
            <WaveToggle
              options={['~', '/']} values={['pulse', 'sawtooth']}
              current={p.waveform} accent={accent} labelColor={labelColor} border={theme.border}
              onChange={(w) => setMachineParam('sh101', 'waveform', w as 'pulse' | 'sawtooth')}
            />
            {vfader(p.subOsc, 'SUB OSC', (v) => setMachineParam('sh101', 'subOsc', v))}
          </>
        )}

        {section('VCF',
          <>
            {vfader(p.vcfFreq, 'FREQ', (v) => setMachineParam('sh101', 'vcfFreq', v))}
            {vfader(p.vcfRes,  'RES',  (v) => setMachineParam('sh101', 'vcfRes',  v))}
            {vfader(p.vcfEnv,  'ENV',  (v) => setMachineParam('sh101', 'vcfEnv',  v))}
            {vfader(p.vcfMod,  'MOD',  (v) => setMachineParam('sh101', 'vcfMod',  v))}
          </>
        )}

        {divider()}
        <RandomBtn onClick={() => randomize(kit)} accent={accent} border={theme.border} textDim={labelColor} />
      </div>
    )
  }

  // ── TB-303 ──────────────────────────────────────────────────────────────────
  if (kit === 'tb303') {
    const p = params.tb303
    const bassTrack = tracks.find((t) => t.id === 'bass')
    const panelBg = '#111'
    const panelBorder = '#2a2a2a'
    const panelLabel = '#888'
    const panelAccent = '#fff'
    const knobTrack = '#33333380'
    const knobBody = '#222'

    function tb303knob(value: number, label: string, onChange: (v: number) => void) {
      return (
        <KnobControl
          value={value} label={label} color={panelAccent}
          trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
          size={44} onChange={onChange}
        />
      )
    }

    return (
      <div className="shrink-0 border-t" style={{ background: panelBg, borderColor: panelBorder }}>
        <div className="flex items-end gap-6 px-6 py-3">
          {/* RANDOM + LEVEL */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: panelLabel }}>RANDOM</span>
            <RandomBtn onClick={() => randomize(kit)} accent={panelAccent} border={panelBorder} textDim={panelLabel} />
            {bassTrack && (
              <KnobControl
                value={bassTrack.volume} label="LEVEL" color={panelAccent}
                trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
                size={36} onChange={(v) => setVolume('bass', v)}
              />
            )}
          </div>

          <div className="w-px self-stretch opacity-30" style={{ background: panelBorder }} />

          {/* Filter knobs */}
          {tb303knob(p.cutoff,    'CUT OFF FREQ', (v) => setMachineParam('tb303', 'cutoff',    v))}
          {tb303knob(p.resonance, 'RESONANCE',    (v) => setMachineParam('tb303', 'resonance', v))}
          {tb303knob(p.envMod,    'ENV MOD',      (v) => setMachineParam('tb303', 'envMod',    v))}
          {tb303knob(p.decay,     'DECAY',        (v) => setMachineParam('tb303', 'decay',     v))}
          {tb303knob(p.accent,    'ACCENT',       (v) => setMachineParam('tb303', 'accent',    v))}

          <div className="w-px self-stretch opacity-30" style={{ background: panelBorder }} />

          {/* WAVEFORM */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: panelLabel }}>WAVEFORM</span>
            <WaveToggle
              options={['SAW', 'SQR']} values={['sawtooth', 'square']}
              current={p.waveform} accent={panelAccent} labelColor={panelLabel} border={panelBorder}
              onChange={(w) => setMachineParam('tb303', 'waveform', w as 'sawtooth' | 'square')}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── TR-808 — rotary level knobs + global params ───────────────────────────
  if (kit === 'tr808') {
    const p = params.tr808
    return (
      <div className="shrink-0 border-t" style={{ background: theme.panel, borderColor: theme.border }}>
        <div className="flex items-end gap-3 px-6 pt-2 pb-0 border-b" style={{ borderColor: theme.border }}>
          {rotaryLevels}
          {divider()}
          {knob(p.accentLevel, 'ACCENT',  44, (v) => setMachineParam('tr808', 'accentLevel', v))}
          {knob(p.shuffle,     'SHUFFLE', 44, (v) => setMachineParam('tr808', 'shuffle',     v))}
          {divider()}
          <div className="self-end mb-1"><RandomBtn onClick={() => randomize(kit)} accent={accent} border={theme.border} textDim={labelColor} /></div>
        </div>
        <div className="flex justify-start px-6 py-1">
          <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: labelColor }}>
            LEVEL CONTROLS
          </span>
        </div>
      </div>
    )
  }

  // ── TR-909 ────────────────────────────────────────────────────────────────
  if (kit === 'tr909') {
    const p = params.tr909
    const panelBg = '#c8c4bc'
    const panelBorder = '#9a9890'
    const panelLabel = '#555'
    const panelAccent = '#c83000'
    const knobTrack = '#88888880'
    const knobBody = '#888884'

    return (
      <div className="shrink-0 border-t" style={{ background: panelBg, borderColor: panelBorder }}>
        {/* Orange step number strip */}
        <div className="flex px-6" style={{ background: panelAccent }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="flex-1 text-center font-mono font-bold select-none"
              style={{ fontSize: '10px', color: '#fff', padding: '2px 0' }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="flex items-end gap-3 px-6 py-3">
          {MACHINE_TRACKS.tr909.map((trackDef) => {
            const track = tracks.find((t) => t.id === trackDef.id)
            if (!track) return null
            return (
              <div key={trackDef.id}>
                <KnobControl
                  value={track.volume} label={trackDef.label} color={panelAccent}
                  trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
                  size={36} onChange={(v) => setVolume(track.id, v)}
                />
              </div>
            )
          })}

          <div className="w-px self-stretch opacity-40" style={{ background: panelBorder }} />

          <KnobControl
            value={p.accentLevel} label="ACCENT" color={panelAccent}
            trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
            size={44} onChange={(v) => setMachineParam('tr909', 'accentLevel', v)}
          />
          <KnobControl
            value={p.shuffle} label="SHUFFLE" color={panelAccent}
            trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
            size={44} onChange={(v) => setMachineParam('tr909', 'shuffle', v)}
          />

          <div className="w-px self-stretch opacity-40" style={{ background: panelBorder }} />

          <div className="self-end mb-1">
            <RandomBtn onClick={() => randomize(kit)} accent={panelAccent} border={panelBorder} textDim={panelLabel} />
          </div>
        </div>
      </div>
    )
  }

  // ── TR-606 ────────────────────────────────────────────────────────────────
  if (kit === 'tr606') {
    const p = params.tr606
    const panelBg = '#1a1a1a'
    const panelBorder = '#2e2e2e'
    const panelLabel = '#666'
    const panelAccent = '#cc2200'
    const knobTrack = '#33333380'
    const knobBody = '#222'

    return (
      <div className="shrink-0 border-t" style={{ background: panelBg, borderColor: panelBorder }}>
        <div className="flex items-end gap-4 px-6 py-3">
          {MACHINE_TRACKS.tr606.map((trackDef) => {
            const track = tracks.find((t) => t.id === trackDef.id)
            if (!track) return null
            return (
              <div key={trackDef.id}>
                <KnobControl
                  value={track.volume} label={trackDef.label} color={panelAccent}
                  trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
                  size={36} onChange={(v) => setVolume(track.id, v)}
                />
              </div>
            )
          })}

          <div className="w-px self-stretch opacity-30" style={{ background: panelBorder }} />

          <KnobControl
            value={p.accentLevel} label="ACCENT" color={panelAccent}
            trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
            size={44} onChange={(v) => setMachineParam('tr606', 'accentLevel', v)}
          />

          <div className="w-px self-stretch opacity-30" style={{ background: panelBorder }} />

          <div className="self-end mb-1">
            <RandomBtn onClick={() => randomize(kit)} accent={panelAccent} border={panelBorder} textDim={panelLabel} />
          </div>
        </div>
      </div>
    )
  }

  // ── TR-707 ───────────────────────────────────────────────────────────────
  if (kit === 'tr707') {
    const p = params.tr707
    const panelBg = '#d4d0bc'
    const panelBorder = '#aaa890'
    const panelLabel = '#555'
    const panelAccent = '#c04808'
    const knobTrack = '#aaa89080'
    const knobBody = '#c8c4b0'

    return (
      <div className="shrink-0 border-t" style={{ background: panelBg, borderColor: panelBorder }}>
        {/* Orange step number strip */}
        <div className="flex px-6" style={{ background: panelAccent }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="flex-1 text-center font-mono font-bold select-none"
              style={{ fontSize: '10px', color: '#fff', padding: '2px 0' }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="flex items-end gap-3 px-6 py-3">
          {/* Per-instrument faders */}
          {MACHINE_TRACKS.tr707.map((trackDef) => {
            const track = tracks.find((t) => t.id === trackDef.id)
            if (!track) return null
            return (
              <div key={trackDef.id} className="flex flex-col items-center gap-1">
                <span className="font-mono text-[9px] tabular-nums" style={{ color: panelLabel }}>
                  {Math.round(track.volume * 100)}
                </span>
                <input
                  type="range" min={0} max={1} step={0.01} value={track.volume}
                  onChange={(e) => setVolume(track.id, Number(e.target.value))}
                  className="h-16"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: panelAccent, cursor: 'pointer' }}
                />
                <span className="font-mono text-[9px] font-bold" style={{ color: panelLabel }}>
                  {trackDef.label}
                </span>
              </div>
            )
          })}

          <div className="w-px self-stretch opacity-40" style={{ background: panelBorder }} />

          <KnobControl
            value={p.accentLevel} label="ACCENT" color={panelAccent}
            trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
            size={44} onChange={(v) => setMachineParam('tr707', 'accentLevel', v)}
          />

          <div className="w-px self-stretch opacity-40" style={{ background: panelBorder }} />

          <div className="self-end mb-1">
            <RandomBtn onClick={() => randomize(kit)} accent={panelAccent} border={panelBorder} textDim={panelLabel} />
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ── WaveToggle ────────────────────────────────────────────────────────────────

interface WaveToggleProps {
  readonly options: readonly string[]
  readonly values: readonly string[]
  readonly current: string
  readonly accent: string
  readonly labelColor: string
  readonly border: string
  readonly onChange: (v: string) => void
}

function WaveToggle({ options, values, current, accent, labelColor, border, onChange }: WaveToggleProps) {
  const accentText = accent === '#fff' ? '#000' : '#fff'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex overflow-hidden" style={{ border: `1px solid ${border}`, borderRadius: '3px' }}>
        {options.map((label, i) => (
          <button
            key={label}
            onClick={() => onChange(values[i])}
            className="px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase transition-all"
            style={{
              background: current === values[i] ? accent : 'transparent',
              borderLeft: i > 0 ? `1px solid ${border}` : 'none',
              color: current === values[i] ? accentText : accent,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: labelColor }}>
        WAVEFORM
      </span>
    </div>
  )
}
