import * as Tone from 'tone'
import type { KitId } from './types'

export type AnyToneSynth =
  | Tone.MembraneSynth
  | Tone.NoiseSynth
  | Tone.MetalSynth
  | Tone.Synth
  | Tone.MonoSynth

export interface KitMeta {
  id: KitId
  label: string
  year: string
  color: string
  description: string
}

export const KIT_LIST: KitMeta[] = [
  { id: 'sh101', label: 'SH-101',  year: '1982', color: '#f59e0b', description: 'Bright monophonic bass' },
  { id: 'tb303', label: 'TB-303',  year: '1981', color: '#a855f7', description: 'Acid bass synthesizer' },
  { id: 'tr606', label: 'TR-606',  year: '1981', color: '#22d3ee', description: 'Thin electronic, TB-303 pair' },
  { id: 'tr707', label: 'TR-707',  year: '1984', color: '#84cc16', description: 'Digital precision' },
  { id: 'tr808', label: 'TR-808',  year: '1980', color: '#ff6b35', description: 'Warm analog deep kick' },
  { id: 'tr909', label: 'TR-909',  year: '1983', color: '#ff3575', description: 'Punchy house & techno' },
]

export function buildKit(id: KitId): Record<string, AnyToneSynth> {
  switch (id) {
    case 'tr808': return buildTR808()
    case 'tr909': return buildTR909()
    case 'tr606': return buildTR606()
    case 'tr707': return buildTR707()
    case 'tb303': return buildTB303()
    case 'sh101': return buildSH101()
  }
}

// ─── TR-808 (1980) ──────────────────────────────────────────────────────────
// Deep sine kick, thin noise snare, metallic hats — the DnB foundation
function buildTR808(): Record<string, AnyToneSynth> {
  return {
    tr808_kick: new Tone.MembraneSynth({
      pitchDecay: 0.09, octaves: 9,
      envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 0.5 },
    }),
    tr808_snare: new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    }),
    tr808_hihat_closed: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 3800, octaves: 1.5,
    }),
    tr808_hihat_open: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.55, release: 0.12 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 3800, octaves: 1.5,
    }),
    tr808_clap: new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.06 },
    }),
    tr808_rim: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 14, resonance: 5500, octaves: 1.5,
    }),
    tr808_tom_lo: new Tone.MembraneSynth({
      pitchDecay: 0.1, octaves: 4,
      envelope: { attack: 0.001, decay: 0.38, sustain: 0, release: 0.35 },
    }),
    tr808_tom_hi: new Tone.MembraneSynth({
      pitchDecay: 0.07, octaves: 4,
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.25 },
    }),
    tr808_cymbal: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1.4, release: 0.4 },
      harmonicity: 5.1, modulationIndex: 64, resonance: 4000, octaves: 1.5,
    }),
    tr808_cowbell: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
      harmonicity: 5.1, modulationIndex: 16, resonance: 800, octaves: 0.5,
    }),
  }
}

// ─── TR-909 (1983) ──────────────────────────────────────────────────────────
// Punchy kick with analogue + digital mix, crisp hats, deep sub
function buildTR909(): Record<string, AnyToneSynth> {
  return {
    tr909_kick: new Tone.MembraneSynth({
      pitchDecay: 0.06, octaves: 8,
      envelope: { attack: 0.001, decay: 0.38, sustain: 0.05, release: 0.3 },
    }),
    tr909_snare: new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.08 },
    }),
    tr909_hihat_closed: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.03, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 40, resonance: 5000, octaves: 1.5,
    }),
    tr909_hihat_open: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.45, release: 0.1 },
      harmonicity: 5.1, modulationIndex: 40, resonance: 5000, octaves: 1.5,
    }),
    tr909_clap: new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.003, decay: 0.08, sustain: 0, release: 0.04 },
    }),
    tr909_rim: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 20, resonance: 6000, octaves: 1.5,
    }),
    tr909_tom_lo: new Tone.MembraneSynth({
      pitchDecay: 0.08, octaves: 5,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
    }),
    tr909_tom_hi: new Tone.MembraneSynth({
      pitchDecay: 0.06, octaves: 5,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
    }),
    tr909_cymbal: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1.0, release: 0.3 },
      harmonicity: 5.1, modulationIndex: 64, resonance: 4500, octaves: 1.5,
    }),
  }
}

// ─── TR-606 (1981) ──────────────────────────────────────────────────────────
// Thin, bright, cheap-but-cool companion to the TB-303
function buildTR606(): Record<string, AnyToneSynth> {
  return {
    tr606_kick: new Tone.MembraneSynth({
      pitchDecay: 0.04, octaves: 5,
      envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.18 },
    }),
    tr606_snare: new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.04 },
    }),
    tr606_hihat_closed: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.025, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 24, resonance: 6000, octaves: 1.2,
    }),
    tr606_hihat_open: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.3, release: 0.08 },
      harmonicity: 5.1, modulationIndex: 24, resonance: 6000, octaves: 1.2,
    }),
    tr606_clap: new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.003, decay: 0.08, sustain: 0, release: 0.04 },
    }),
    tr606_rim: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 12, resonance: 7000, octaves: 1.2,
    }),
    tr606_tom_lo: new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 3,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.18 },
    }),
    tr606_tom_hi: new Tone.MembraneSynth({
      pitchDecay: 0.04, octaves: 3,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.14 },
    }),
    tr606_cymbal: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.7, release: 0.2 },
      harmonicity: 5.1, modulationIndex: 48, resonance: 5000, octaves: 1.2,
    }),
  }
}

// ─── TR-707 (1984) ──────────────────────────────────────────────────────────
// Digital precision — tighter, cleaner, more defined transients
function buildTR707(): Record<string, AnyToneSynth> {
  return {
    tr707_kick: new Tone.MembraneSynth({
      pitchDecay: 0.03, octaves: 7,
      envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.22 },
    }),
    tr707_snare: new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.05 },
    }),
    tr707_hihat_closed: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.035, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 36, resonance: 5500, octaves: 1.4,
    }),
    tr707_hihat_open: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.38, release: 0.09 },
      harmonicity: 5.1, modulationIndex: 36, resonance: 5500, octaves: 1.4,
    }),
    tr707_clap: new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.002, decay: 0.09, sustain: 0, release: 0.04 },
    }),
    tr707_rim: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.045, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 18, resonance: 6500, octaves: 1.4,
    }),
    tr707_tom_lo: new Tone.MembraneSynth({
      pitchDecay: 0.06, octaves: 4,
      envelope: { attack: 0.001, decay: 0.26, sustain: 0, release: 0.22 },
    }),
    tr707_tom_hi: new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 4,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.16 },
    }),
    tr707_cymbal: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.9, release: 0.25 },
      harmonicity: 5.1, modulationIndex: 56, resonance: 4800, octaves: 1.4,
    }),
  }
}

// ─── TB-303 (1981) ──────────────────────────────────────────────────────────
// Acid bass synth with resonant filter sweep — drum section from TR-606
function buildTB303(): Record<string, AnyToneSynth> {
  return {
    tb303_bass: new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { type: 'lowpass', rolloff: -24, Q: 8 },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.05, release: 0.2 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.35,
        sustain: 0.05,
        release: 0.2,
        baseFrequency: 80,
        octaves: 5,
        exponent: 4,
      },
    }),
  }
}

// ─── Single-track builder ────────────────────────────────────────────────────
// Builds a full kit, keeps only the requested track's synth, disposes the rest.
export function buildSingleSynth(kitId: KitId, trackId: string): AnyToneSynth {
  const all = buildKit(kitId)
  const target = all[trackId]
  Object.keys(all).forEach((id) => {
    if (id !== trackId) all[id].dispose()
  })
  return target
}

// Convenience lookup: kit color by id
export const KIT_COLOR: Record<KitId, string> = Object.fromEntries(
  KIT_LIST.map((k) => [k.id, k.color])
) as Record<KitId, string>

// Short labels for compact UI chips
export const KIT_SHORT: Record<KitId, string> = {
  tr808: '808', tr909: '909', tr606: '606',
  tr707: '707', tb303: '303', sh101: '101',
}

// ─── SH-101 (1982) ──────────────────────────────────────────────────────────
// Bright monophonic synth bass — pulse wave with warmer filter sweep
function buildSH101(): Record<string, AnyToneSynth> {
  return {
    sh101_bass: new Tone.MonoSynth({
      oscillator: { type: 'pulse' },
      filter: { type: 'lowpass', rolloff: -24, Q: 3 },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 0.3 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.25,
        sustain: 0.3,
        release: 0.3,
        baseFrequency: 180,
        octaves: 3,
        exponent: 2,
      },
    }),
  }
}
