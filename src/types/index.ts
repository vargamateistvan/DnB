export type TrackId = string

export type KitId = 'tr808' | 'tr909' | 'tr606' | 'tr707' | 'tb303' | 'sh101'

export type SynthType = 'membrane' | 'noise' | 'metal' | 'synth' | 'mono'

export interface Step {
  active: boolean
  velocity: number // 0–1
  note?: string    // per-step note override (bass lines)
}

export interface Track {
  id: string
  synthType: SynthType
  label: string
  color: string
  steps: Step[]
  volume: number // 0–1
  muted: boolean
  note: string
  custom?: true
}

// ── Machine parameter types ───────────────────────────────────────────────────

export interface TR808Params { shuffle: number; accentLevel: number }
export interface TR909Params { shuffle: number; accentLevel: number }
export interface TR606Params { accentLevel: number }
export interface TR707Params { accentLevel: number }
export interface TB303Params {
  cutoff: number
  resonance: number
  envMod: number
  decay: number
  accent: number
  waveform: 'sawtooth' | 'square'
}
export interface SH101Params {
  vcfFreq: number
  vcfRes: number
  vcfEnv: number
  vcfMod: number
  subOsc: number
  waveform: 'pulse' | 'sawtooth'
  portamento: number
}

export interface MachineParams {
  tr808: TR808Params
  tr909: TR909Params
  tr606: TR606Params
  tr707: TR707Params
  tb303: TB303Params
  sh101: SH101Params
}

export interface SequencerState {
  tracks: Track[]
  bpm: number
  swing: number
  stepCount: 16 | 32 | 64
  isPlaying: boolean
  currentStep: number
  kit: KitId
  activeKits: KitId[]
  mutedKits: KitId[]
  trackKits: Partial<Record<string, KitId>>
  machineParams: MachineParams
}
