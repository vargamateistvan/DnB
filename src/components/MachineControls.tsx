import type React from 'react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, MACHINE_TRACKS } from '../machines'
import { KnobControl } from './KnobControl'
import { MACHINE_PRESETS } from '../presets'
import { WaveformPreview } from './WaveformPreview'
import type { KitId } from '../types'

// ── Bender ────────────────────────────────────────────────────────────────────

interface BenderProps {
  readonly value: number   // -1 … 1
  readonly accent: string
  readonly border: string
  readonly onChange: (v: number) => void
  readonly onRelease: () => void
}

function Bender({ value, accent, border, onChange, onRelease }: BenderProps) {
  const trackRef  = useRef<HTMLDivElement>(null)
  const dragging  = useRef(false)

  const TRACK_H = 80  // px

  const toValue = useCallback((clientY: number) => {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const rel  = (clientY - rect.top) / rect.height  // 0 = top, 1 = bottom
    return Math.max(-1, Math.min(1, 1 - rel * 2))     // 1 at top, -1 at bottom
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (dragging.current) onChange(toValue(e.clientY))
  }, [onChange, toValue])

  const onMouseUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    onRelease()
  }, [onMouseMove, onRelease])

  useEffect(() => () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove, onMouseUp])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragging.current = true
    onChange(toValue(e.clientY))
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Handle y-position: value=1 → 0%, value=0 → 50%, value=-1 → 100%
  const handleY = ((1 - value) / 2) * (TRACK_H - 18)  // px from top (handle h=18)

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <span className="font-mono text-[8px] tabular-nums" style={{ color: accent, opacity: 0.7 }}>
        {value > 0 ? `+${Math.round(value * 12)}` : Math.round(value * 12)}
      </span>
      <div
        ref={trackRef}
        className="relative select-none"
        style={{
          width: '22px', height: `${TRACK_H}px`,
          background: 'rgba(0,0,0,0.35)',
          border: `1px solid ${border}`,
          borderRadius: '4px',
          cursor: 'ns-resize',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Center groove */}
        <div className="absolute inset-x-0" style={{ top: '50%', height: '1px', background: `${accent}55` }} />
        {/* Fill between center and handle */}
        {value !== 0 && (
          <div className="absolute inset-x-1" style={{
            background: `${accent}40`,
            borderRadius: '2px',
            ...(value > 0
              ? { bottom: '50%', height: `${value * 50}%` }
              : { top: '50%',   height: `${-value * 50}%` }),
          }} />
        )}
        {/* Grip handle */}
        <div
          className="absolute inset-x-0.5"
          style={{
            height: '18px',
            top: `${handleY}px`,
            background: accent,
            borderRadius: '3px',
            boxShadow: value !== 0 ? `0 0 8px ${accent}88` : 'none',
            transition: dragging.current ? 'none' : 'top 120ms ease, box-shadow 80ms',
          }}
        />
      </div>
      <span className="font-mono text-[8px] font-bold uppercase" style={{ color: accent, opacity: 0.6 }}>BEND</span>
    </div>
  )
}


export function MachineControls({ kitId, onPlay, onStop }: { readonly kitId?: KitId; readonly onPlay?: () => void; readonly onStop?: () => void }) {
  const primaryKit = useSequencerStore((s) => s.kit)
  const kit = kitId ?? primaryKit
  const params = useSequencerStore((s) => s.machineParams)
  const tracks = useSequencerStore((s) => s.tracks)
  const setMachineParam = useSequencerStore((s) => s.setMachineParam)
  const setVolume = useSequencerStore((s) => s.setVolume)
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

  // ── SH-101 ──────────────────────────────────────────────────────────────────
  if (kit === 'sh101') {
    const p = params.sh101
    const bassTrack = tracks.find((t) => t.id === 'sh101_bass')

    function vfader(value: number, label: string, onChange: (v: number) => void) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[8px] tabular-nums" style={{ color: labelColor }}>
            {Math.round(value * 100)}
          </span>
          <input
            type="range" min={0} max={1} step={0.01} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
              writingMode: 'vertical-lr',
              direction: 'rtl',
              accentColor: accent,
              height: '56px',
              cursor: 'pointer',
            }}
          />
          <span
            className="font-mono text-[8px] font-bold uppercase text-center"
            style={{ color: labelColor, maxWidth: '34px', lineHeight: 1.1 }}
          >
            {label}
          </span>
        </div>
      )
    }

    function sh101Section(title: string, children: ReactNode) {
      return (
        <div
          className="flex flex-col items-center gap-1.5 px-3 py-2 shrink-0"
          style={{ border: `1px solid ${theme.border}`, borderRadius: '3px', background: 'rgba(0,0,0,0.15)' }}
        >
          <span
            className="font-mono text-[8px] uppercase tracking-widest"
            style={{ color: accent, opacity: 0.6 }}
          >
            {title}
          </span>
          <div className="flex items-end gap-3">{children}</div>
        </div>
      )
    }

    return (
      <div className="shrink-0 border-t overflow-x-auto" style={{ background: theme.panel, borderColor: theme.border }}>
        <div className="flex items-end gap-4 px-5 py-3" style={{ minWidth: 'max-content' }}>

          {/* Level knob */}
          <div className="shrink-0 pb-1">
            {bassTrack && knob(bassTrack.volume, 'LEVEL', 36, (v) => setVolume('sh101_bass', v))}
          </div>

          {/* Pitch bender */}
          <Bender
            value={p.pitchBend ?? 0}
            accent={accent}
            border={theme.border}
            onChange={(v) => setMachineParam('sh101', 'pitchBend', v)}
            onRelease={() => setMachineParam('sh101', 'pitchBend', 0)}
          />

          <div className="self-stretch w-px opacity-30" style={{ background: theme.border }} />

          {/* SOURCE: waveform + sub osc */}
          {sh101Section('SOURCE',
            <>
              <WaveToggle
                options={['PUL', 'SAW']} values={['pulse', 'sawtooth']}
                current={p.waveform} accent={accent} labelColor={labelColor} border={theme.border}
                onChange={(w) => setMachineParam('sh101', 'waveform', w as 'pulse' | 'sawtooth')}
              />
              {vfader(p.subOsc, 'SUB', (v) => setMachineParam('sh101', 'subOsc', v))}
            </>
          )}

          {/* PORTAMENTO */}
          {sh101Section('PORTA',
            <>{vfader(p.portamento, 'RATE', (v) => setMachineParam('sh101', 'portamento', v))}</>
          )}

          {/* VCF */}
          {sh101Section('VCF',
            <>
              {vfader(p.vcfFreq, 'FREQ', (v) => setMachineParam('sh101', 'vcfFreq', v))}
              {vfader(p.vcfRes,  'RES',  (v) => setMachineParam('sh101', 'vcfRes',  v))}
              {vfader(p.vcfEnv,  'ENV',  (v) => setMachineParam('sh101', 'vcfEnv',  v))}
              {vfader(p.vcfMod,  'MOD',  (v) => setMachineParam('sh101', 'vcfMod',  v))}
            </>
          )}

          {/* TUNE: detune fader + transpose buttons */}
          {sh101Section('TUNE',
            <>
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[8px] tabular-nums" style={{ color: labelColor }}>
                  {(() => { const ct = Math.round((p.detune - 0.5) * 100); return ct > 0 ? `+${ct}` : `${ct}` })()}ct
                </span>
                <input
                  type="range" min={0} max={1} step={0.01} value={p.detune}
                  onChange={(e) => setMachineParam('sh101', 'detune', Number(e.target.value))}
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: accent, height: '56px', cursor: 'pointer' }}
                />
                <span className="font-mono text-[8px] font-bold uppercase" style={{ color: labelColor }}>DET</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[9px] tabular-nums" style={{ color: accent }}>
                  {(p.transpose ?? 0) > 0 ? `+${p.transpose}` : `${p.transpose ?? 0}`}st
                </span>
                <div className="flex gap-1">
                  {[-12,-1,1,12].map((d) => (
                    <button key={d}
                      onClick={() => setMachineParam('sh101', 'transpose', Math.max(-12, Math.min(12, (p.transpose ?? 0) + d)))}
                      className="font-mono text-[9px] font-bold transition-colors"
                      style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.border}`, borderRadius: '2px', color: labelColor, padding: '2px 3px' }}
                    >{d > 0 ? `+${d}` : d}</button>
                  ))}
                </div>
                <span className="font-mono text-[8px] uppercase" style={{ color: labelColor }}>TRANSP</span>
              </div>
            </>
          )}

          <div className="self-stretch w-px opacity-30" style={{ background: theme.border }} />

          <PresetBar kitId="sh101" accent={accent} border={theme.border} labelColor={labelColor} onPlay={onPlay} onStop={onStop} />
        </div>
      </div>
    )
  }

  // ── TB-303 ──────────────────────────────────────────────────────────────────
  if (kit === 'tb303') {
    const p = params.tb303
    const bassTrack = tracks.find((t) => t.id === 'tb303_bass')
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
      <div className="shrink-0 border-t overflow-x-auto" style={{ background: panelBg, borderColor: panelBorder }}>
        <div className="flex items-end gap-6 px-6 py-3" style={{ minWidth: 'max-content' }}>
          {/* LEVEL */}
          <div className="flex flex-col gap-2">
            {bassTrack && (
              <KnobControl
                value={bassTrack.volume} label="LEVEL" color={panelAccent}
                trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
                size={36} onChange={(v) => setVolume('tb303_bass', v)}
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

          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: panelLabel }}>WAVEFORM</span>
            <WaveToggle
              options={['SAW', 'SQR']} values={['sawtooth', 'square']}
              current={p.waveform} accent={panelAccent} labelColor={panelLabel} border={panelBorder}
              onChange={(w) => setMachineParam('tb303', 'waveform', w as 'sawtooth' | 'square')}
            />
          </div>

          <div className="w-px self-stretch opacity-30" style={{ background: panelBorder }} />

          {/* Detune + Transpose */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: panelLabel }}>TUNE</span>
            <div className="flex items-end gap-3">
              <KnobControl
                value={p.detune} label="DETUNE" color={panelAccent}
                trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
                size={40} onChange={(v) => setMachineParam('tb303', 'detune', v)}
              />
              <div className="flex flex-col items-center gap-1 pb-1">
                <span className="font-mono text-[9px] tabular-nums" style={{ color: panelAccent }}>
                  {(p.transpose ?? 0) > 0 ? `+${p.transpose}` : `${p.transpose ?? 0}`}st
                </span>
                <div className="flex gap-1">
                  {[-12,-1,1,12].map((d) => (
                    <button key={d}
                      onClick={() => setMachineParam('tb303', 'transpose', Math.max(-12, Math.min(12, (p.transpose ?? 0) + d)))}
                      className="font-mono text-[9px] font-bold transition-colors"
                      style={{ background: '#1a1a1a', border: `1px solid ${panelBorder}`, borderRadius: '2px', color: panelLabel, padding: '2px 4px' }}
                    >{d > 0 ? `+${d}` : d}</button>
                  ))}
                </div>
                <span className="font-mono text-[8px] uppercase" style={{ color: panelLabel }}>TRANSP</span>
              </div>
            </div>
          </div>

          <div className="w-px self-stretch opacity-30" style={{ background: panelBorder }} />

          <PresetBar kitId="tb303" accent={panelAccent} border={panelBorder} labelColor={panelLabel} onPlay={onPlay} onStop={onStop} />
        </div>
      </div>
    )
  }

  // ── TR-808 — rotary level knobs + global params ───────────────────────────
  if (kit === 'tr808') {
    const p = params.tr808
    // ±1200 cents → display as semitone offset
    const kickSt  = Math.round((p.kickTune  - 0.5) * 24)
    const tomLoSt = Math.round((p.tomLoTune - 0.5) * 24)
    const tomHiSt = Math.round((p.tomHiTune - 0.5) * 24)
    function stLabel(st: number) { return st === 0 ? '0' : st > 0 ? `+${st}` : `${st}` }
    return (
      <div className="shrink-0 border-t overflow-x-auto" style={{ background: theme.panel, borderColor: theme.border }}>
        <div className="flex items-end gap-3 px-6 pt-2 pb-0 border-b" style={{ borderColor: theme.border, minWidth: 'max-content' }}>
          {rotaryLevels}
          {divider()}
          {knob(p.accentLevel, 'ACCENT',  44, (v) => setMachineParam('tr808', 'accentLevel', v))}
          {knob(p.shuffle,     'SHUFFLE', 44, (v) => setMachineParam('tr808', 'shuffle',     v))}
          {divider()}
          {/* Tuning knobs */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: labelColor }}>TUNING</span>
            <div className="flex items-end gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[8px] tabular-nums" style={{ color: accent }}>{stLabel(kickSt)}st</span>
                {knob(p.kickTune,  'BD TUNE', 36, (v) => setMachineParam('tr808', 'kickTune',  v))}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[8px] tabular-nums" style={{ color: accent }}>{stLabel(tomLoSt)}st</span>
                {knob(p.tomLoTune, 'LT TUNE', 36, (v) => setMachineParam('tr808', 'tomLoTune', v))}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[8px] tabular-nums" style={{ color: accent }}>{stLabel(tomHiSt)}st</span>
                {knob(p.tomHiTune, 'HT TUNE', 36, (v) => setMachineParam('tr808', 'tomHiTune', v))}
              </div>
            </div>
          </div>
          {divider()}
          <PresetBar kitId="tr808" accent={accent} border={theme.border} labelColor={labelColor} onPlay={onPlay} onStop={onStop} />
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

    function col(header: string, topKnob: ReactNode, botKnob?: ReactNode) {
      return (
        <div key={header} className="flex flex-col items-center gap-1" style={{ border: `1px solid ${panelBorder}`, borderRadius: '2px', padding: '4px 6px', background: 'rgba(0,0,0,0.06)' }}>
          <span className="font-mono font-bold uppercase select-none text-center leading-tight" style={{ fontSize: '8px', color: panelAccent, letterSpacing: '0.04em', minWidth: '52px' }}>{header}</span>
          {topKnob}
          {botKnob ?? <div style={{ height: '52px' }} />}
        </div>
      )
    }

    function k909(value: number, label: string, onChange: (v: number) => void) {
      return <KnobControl value={value} label={label} color={panelAccent} trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel} size={36} onChange={onChange} />
    }

    const bdTrack  = tracks.find((t) => t.id === 'tr909_kick')
    const sdTrack  = tracks.find((t) => t.id === 'tr909_snare')
    const ltTrack  = tracks.find((t) => t.id === 'tr909_tom_lo')
    const htTrack  = tracks.find((t) => t.id === 'tr909_tom_hi')
    const rimTrack = tracks.find((t) => t.id === 'tr909_rim')
    const clapTrack= tracks.find((t) => t.id === 'tr909_clap')
    const chTrack  = tracks.find((t) => t.id === 'tr909_hihat_closed')
    const ohTrack  = tracks.find((t) => t.id === 'tr909_hihat_open')
    const cymTrack = tracks.find((t) => t.id === 'tr909_cymbal')

    return (
      <div className="shrink-0 border-t overflow-x-auto" style={{ background: panelBg, borderColor: panelBorder }}>
        <div style={{ minWidth: 'max-content' }}>
        {/* Step number strip */}
        <div className="flex px-4" style={{ background: panelAccent }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="flex-1 text-center font-mono font-bold select-none" style={{ fontSize: '10px', color: '#fff', padding: '2px 0' }}>{i + 1}</div>
          ))}
        </div>

        <div className="flex items-start gap-2 px-4 py-3">
          {bdTrack  && col('BASS DRUM',  k909(bdTrack.volume,  'LEVEL', (v) => setVolume('tr909_kick',  v)), k909(p.bdDecay  ?? 0.4, 'DECAY',  (v) => setMachineParam('tr909','bdDecay',  v)))}
          {sdTrack  && col('SNARE DRUM', k909(sdTrack.volume,  'LEVEL', (v) => setVolume('tr909_snare', v)), k909(p.sdSnappy ?? 0.5, 'SNAPPY', (v) => setMachineParam('tr909','sdSnappy', v)))}
          {ltTrack  && col('LOW TOM',    k909(ltTrack.volume,  'LEVEL', (v) => setVolume('tr909_tom_lo',v)), k909(p.ltDecay  ?? 0.4, 'DECAY',  (v) => setMachineParam('tr909','ltDecay',  v)))}
          {htTrack  && col('HIGH TOM',   k909(htTrack.volume,  'LEVEL', (v) => setVolume('tr909_tom_hi',v)), k909(p.htDecay  ?? 0.4, 'DECAY',  (v) => setMachineParam('tr909','htDecay',  v)))}
          {rimTrack && col('RIM',        k909(rimTrack.volume, 'LEVEL', (v) => setVolume('tr909_rim',   v)))}
          {clapTrack&& col('CLAP',       k909(clapTrack.volume,'LEVEL', (v) => setVolume('tr909_clap',  v)))}
          {chTrack  && col('CLS/HH',     k909(chTrack.volume,  'LEVEL', (v) => setVolume('tr909_hihat_closed', v)))}
          {ohTrack  && col('OPN/HH',     k909(ohTrack.volume,  'LEVEL', (v) => setVolume('tr909_hihat_open',   v)), k909(p.ohDecay ?? 0.6, 'OH DEC', (v) => setMachineParam('tr909','ohDecay', v)))}
          {cymTrack && col('CYMBAL',     k909(cymTrack.volume, 'LEVEL', (v) => setVolume('tr909_cymbal', v)), k909(p.cymTune ?? 0.5, 'TUNE',   (v) => setMachineParam('tr909','cymTune', v)))}

          <div className="w-px self-stretch opacity-40 mx-1" style={{ background: panelBorder }} />

          <div className="flex flex-col gap-2 items-center">
            {k909(p.accentLevel, 'ACCENT',  (v) => setMachineParam('tr909','accentLevel', v))}
            {k909(p.shuffle,     'SHUFFLE', (v) => setMachineParam('tr909','shuffle',     v))}
          </div>

          <div className="w-px self-stretch opacity-40 mx-1" style={{ background: panelBorder }} />

          <PresetBar kitId="tr909" accent={panelAccent} border={panelBorder} labelColor={panelLabel} onPlay={onPlay} onStop={onStop} />
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
      <div className="shrink-0 border-t overflow-x-auto" style={{ background: panelBg, borderColor: panelBorder }}>
        <div className="flex items-end gap-4 px-6 py-3" style={{ minWidth: 'max-content' }}>
          {([
            { id: 'tr606_kick',         label: 'Bass Drum'   },
            { id: 'tr606_snare',        label: 'Snare Drum'  },
            { id: 'tr606_tom_lo',       label: 'L.H.Tom'     },
            { id: 'tr606_cymbal',       label: 'CYmbal'      },
            { id: 'tr606_hihat_open',   label: 'O.C.Hihat'   },
          ] as const).map(({ id, label }) => {
            const track = tracks.find((t) => t.id === id)
            if (!track) return null
            return (
              <div key={id}>
                <KnobControl
                  value={track.volume} label={label} color={panelAccent}
                  trackColor={knobTrack} bodyColor={knobBody} labelColor={panelLabel}
                  size={40} onChange={(v) => setVolume(id, v)}
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

          <PresetBar kitId="tr606" accent={panelAccent} border={panelBorder} labelColor={panelLabel} onPlay={onPlay} onStop={onStop} />
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

    return (
      <div className="shrink-0 border-t overflow-x-auto" style={{ background: panelBg, borderColor: panelBorder }}>
        <div style={{ minWidth: 'max-content' }}>
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
          {/* AC (Accent) fader */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[9px] tabular-nums" style={{ color: panelLabel }}>{Math.round(p.accentLevel * 100)}</span>
            <input type="range" min={0} max={1} step={0.01} value={p.accentLevel}
              onChange={(e) => setMachineParam('tr707','accentLevel', Number(e.target.value))}
              className="h-16" style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: panelAccent, cursor: 'pointer' }}
            />
            <span className="font-mono text-[9px] font-bold" style={{ color: panelAccent }}>AC</span>
          </div>

          <div className="w-px self-stretch opacity-40" style={{ background: panelBorder }} />

          {/* Per-instrument faders */}
          {([
            { id: 'tr707_kick',         label: 'BD'      },
            { id: 'tr707_snare',        label: 'SD'      },
            { id: 'tr707_tom_lo',       label: 'LT'      },
            { id: 'tr707_tom_hi',       label: 'HT'      },
            { id: 'tr707_rim',          label: 'RIM/COW' },
            { id: 'tr707_clap',         label: 'TAMB'    },
            { id: 'tr707_hihat_closed', label: 'CLS/HH'  },
            { id: 'tr707_hihat_open',   label: 'OPN/HH'  },
            { id: 'tr707_cymbal',       label: 'RIDE'    },
          ] as const).map(({ id, label }) => {
            const track = tracks.find((t) => t.id === id)
            if (!track) return null
            return (
              <div key={id} className="flex flex-col items-center gap-1">
                <span className="font-mono text-[9px] tabular-nums" style={{ color: panelLabel }}>
                  {Math.round(track.volume * 100)}
                </span>
                <input
                  type="range" min={0} max={1} step={0.01} value={track.volume}
                  onChange={(e) => setVolume(id, Number(e.target.value))}
                  className="h-16"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: panelAccent, cursor: 'pointer' }}
                />
                <span className="font-mono text-[9px] font-bold" style={{ color: panelLabel }}>{label}</span>
              </div>
            )
          })}

          <div className="w-px self-stretch opacity-40" style={{ background: panelBorder }} />

          <PresetBar kitId="tr707" accent={panelAccent} border={panelBorder} labelColor={panelLabel} onPlay={onPlay} onStop={onStop} />
        </div>
        </div>{/* end min-width wrapper */}
      </div>
    )
  }

  return null
}

// ── PresetBar ─────────────────────────────────────────────────────────────────

interface PresetBarProps {
  readonly kitId: KitId
  readonly accent: string
  readonly border: string
  readonly labelColor: string
  readonly onPlay?: () => void
  readonly onStop?: () => void
}

type SavedPreviewState = {
  tracks: import('../types').Track[]
  mutedKits: import('../types').KitId[]
}

function PresetBar({ kitId, accent, border, labelColor, onPlay, onStop }: PresetBarProps) {
  const loadMachinePreset = useSequencerStore((s) => s.loadMachinePreset)
  const loadState         = useSequencerStore((s) => s.loadState)
  const setActivePreset   = useSequencerStore((s) => s.setActivePreset)
  const clearMachine      = useSequencerStore((s) => s.clearMachine)
  const activePresetIdx   = useSequencerStore((s) => s.activePresets[kitId] ?? null)
  const presets    = MACHINE_PRESETS[kitId]
  const accentText = accent === '#fff' ? '#000' : '#fff'

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const ownTrackIds  = useRef(new Set(MACHINE_TRACKS[kitId].map((t) => t.id as string)))
  const savedRef     = useRef<SavedPreviewState | null>(null)
  const startedRef   = useRef(false)
  const committedRef = useRef(false)

  const handleContainerEnter = () => {
    if (savedRef.current) return
    const state = useSequencerStore.getState()
    // Snapshot full state so we can restore on leave
    savedRef.current = {
      tracks: state.tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })),
      mutedKits: [...state.mutedKits],
    }
    // Solo this kit — mute every other active kit
    const others = state.activeKits.filter((k) => k !== kitId)
    if (others.length > 0) {
      const otherIds = new Set(others.flatMap((k) => MACHINE_TRACKS[k].map((t) => t.id as string)))
      loadState({
        mutedKits: [...new Set([...state.mutedKits, ...others])],
        tracks: state.tracks.map((t) => otherIds.has(t.id) ? { ...t, muted: true } : t),
      })
    }
    if (!state.isPlaying) {
      onPlay?.()
      startedRef.current = true
    }
  }

  const handleContainerLeave = () => {
    setHoveredIdx(null)
    if (!savedRef.current) return
    const saved = savedRef.current
    if (committedRef.current) {
      // Keep this kit's preset; restore mute state for everything else
      const cur = useSequencerStore.getState()
      const own = ownTrackIds.current
      loadState({
        mutedKits: saved.mutedKits,
        tracks: cur.tracks.map((t) =>
          own.has(t.id) ? t : (saved.tracks.find((x) => x.id === t.id) ?? t)
        ),
      })
    } else {
      // Full revert
      loadState({ tracks: saved.tracks, mutedKits: saved.mutedKits })
      if (startedRef.current) onStop?.()
    }
    savedRef.current   = null
    startedRef.current  = false
    committedRef.current = false
  }

  return (
    <div
      className="flex items-stretch gap-2 shrink-0"
      style={{ marginLeft: 'auto' }}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
    >
      {/* Waveform preview — only for synths with a real filter to visualize */}
      {(kitId === 'tb303' || kitId === 'sh101') && (
        <WaveformPreview kitId={kitId} color={accent} width={160} height={110} />
      )}

      {/* Preset buttons + CLR */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: labelColor }}>
          PRESET
        </span>

        {/* 2-column named grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}>
          {presets.map((preset, i) => {
            const active = hoveredIdx === i
            const isCommitted = activePresetIdx === i
            return (
              <button
                key={preset.name}
                onMouseEnter={() => { setHoveredIdx(i); loadMachinePreset(kitId, preset) }}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => { committedRef.current = true; setActivePreset(kitId, i) }}
                className="font-mono font-bold select-none uppercase text-left"
                style={{
                  padding: '3px 7px',
                  fontSize: '9px',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  border: `1px solid ${active ? accent : isCommitted ? accent : border}`,
                  background: active ? accent : isCommitted ? `${accent}28` : 'transparent',
                  color: active ? accentText : isCommitted ? accent : labelColor,
                  boxShadow: active ? `0 0 8px ${accent}88` : isCommitted ? `0 0 4px ${accent}55` : 'none',
                  transition: 'background 80ms, color 80ms, border-color 80ms, box-shadow 80ms',
                  whiteSpace: 'nowrap',
                }}
              >
                {preset.name}
              </button>
            )
          })}
        </div>

        {/* Clear button */}
        <button
          onClick={() => { clearMachine(kitId); setActivePreset(kitId, null) }}
          className="font-mono font-bold uppercase w-full"
          style={{
            marginTop: '2px',
            padding: '3px 7px',
            fontSize: '9px',
            letterSpacing: '0.06em',
            borderRadius: '2px',
            border: `1px solid ${border}`,
            background: 'transparent',
            color: labelColor,
            cursor: 'pointer',
            transition: 'border-color 80ms, color 80ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = labelColor }}
        >CLR</button>
      </div>
    </div>
  )
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
        WAVE
      </span>
    </div>
  )
}
