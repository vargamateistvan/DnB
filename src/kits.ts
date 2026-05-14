import * as Tone from 'tone'
import type { KitId } from './types'

export type AnyToneSynth =
  | Tone.MembraneSynth
  | Tone.NoiseSynth
  | Tone.MetalSynth
  | Tone.Synth
  | Tone.MonoSynth
  | Tone.Player
  | Tone.Sampler

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

const BASE = import.meta.env.BASE_URL

function player(url: string): Tone.Player {
  return new Tone.Player({ url: BASE + url, fadeOut: 0.01 })
}

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
function buildTR808(): Record<string, AnyToneSynth> {
  const p = 'samples/tr808/'
  return {
    tr808_kick:         player(p + 'kick.wav'),
    tr808_snare:        player(p + 'snare.wav'),
    tr808_hihat_closed: player(p + 'hihat_closed.wav'),
    tr808_hihat_open:   player(p + 'hihat_open.wav'),
    tr808_clap:         player(p + 'clap.wav'),
    tr808_rim:          player(p + 'rim.wav'),
    tr808_tom_lo:       player(p + 'tom_lo.wav'),
    tr808_tom_hi:       player(p + 'tom_hi.wav'),
    tr808_cymbal:       player(p + 'cymbal.wav'),
    tr808_cowbell:      player(p + 'cowbell.wav'),
  }
}

// ─── TR-909 (1983) ──────────────────────────────────────────────────────────
function buildTR909(): Record<string, AnyToneSynth> {
  const p = 'samples/tr909/'
  return {
    tr909_kick:         player(p + 'kick.wav'),
    tr909_snare:        player(p + 'snare.wav'),
    tr909_hihat_closed: player(p + 'hihat_closed.wav'),
    tr909_hihat_open:   player(p + 'hihat_open.wav'),
    tr909_clap:         player(p + 'clap.wav'),
    tr909_rim:          player(p + 'rim.wav'),
    tr909_tom_lo:       player(p + 'tom_lo.wav'),
    tr909_tom_hi:       player(p + 'tom_hi.wav'),
    tr909_cymbal:       player(p + 'cymbal.wav'),
  }
}

// ─── TR-606 (1981) ──────────────────────────────────────────────────────────
function buildTR606(): Record<string, AnyToneSynth> {
  const p = 'samples/tr606/'
  return {
    tr606_kick:         player(p + 'kick.wav'),
    tr606_snare:        player(p + 'snare.wav'),
    tr606_hihat_closed: player(p + 'hihat_closed.wav'),
    tr606_hihat_open:   player(p + 'hihat_open.wav'),
    tr606_tom_lo:       player(p + 'tom_lo.wav'),
    tr606_tom_hi:       player(p + 'tom_hi.wav'),
    tr606_cymbal:       player(p + 'cymbal.wav'),
    // no clap/rim samples — fall back to synth
    tr606_clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.003, decay: 0.08, sustain: 0, release: 0.04 } }),
    tr606_rim:  new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.04, release: 0.01 }, harmonicity: 5.1, modulationIndex: 12, resonance: 7000, octaves: 1.2 }),
  }
}

// ─── TR-707 (1984) ──────────────────────────────────────────────────────────
function buildTR707(): Record<string, AnyToneSynth> {
  const p = 'samples/tr707/'
  return {
    tr707_kick:         player(p + 'kick.wav'),
    tr707_snare:        player(p + 'snare.wav'),
    tr707_hihat_closed: player(p + 'hihat_closed.wav'),
    tr707_hihat_open:   player(p + 'hihat_open.wav'),
    tr707_clap:         player(p + 'clap.wav'),
    tr707_rim:          player(p + 'rim.wav'),
    tr707_tom_lo:       player(p + 'tom_lo.wav'),
    tr707_tom_hi:       player(p + 'tom_hi.wav'),
    tr707_cymbal:       player(p + 'cymbal.wav'),
  }
}

// ─── TB-303 (1981) ──────────────────────────────────────────────────────────
// MonoSynth with internal filter bypassed — external filter chain handles VCF
function buildTB303(): Record<string, AnyToneSynth> {
  return {
    tb303_bass: new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.1 },
      filter: { type: 'lowpass', frequency: 20000, Q: 0 },
      filterEnvelope: { attack: 0.001, decay: 0.001, sustain: 1, release: 0.001, baseFrequency: 20000, octaves: 0, exponent: 1 },
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
// MonoSynth with portamento — sub oscillator managed separately in useAudioEngine
function buildSH101(): Record<string, AnyToneSynth> {
  return {
    sh101_bass: new Tone.MonoSynth({
      oscillator: { type: 'pulse' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.2 },
      filter: { type: 'lowpass', frequency: 20000, Q: 0 },
      filterEnvelope: { attack: 0.001, decay: 0.001, sustain: 1, release: 0.001, baseFrequency: 20000, octaves: 0, exponent: 1 },
      portamento: 0,
    }),
  }
}
