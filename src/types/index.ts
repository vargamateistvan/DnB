export type TrackId =
  | 'kick'
  | 'snare'
  | 'hihat_closed'
  | 'hihat_open'
  | 'clap'
  | 'rim'
  | 'tom_lo'
  | 'tom_hi'
  | 'cymbal'
  | 'bass'

export interface Step {
  active: boolean
  velocity: number // 0–1
}

export interface Track {
  id: TrackId
  label: string
  color: string
  steps: Step[]
  volume: number // 0–1
  muted: boolean
  note: string // MIDI note for export
}

export interface SequencerState {
  tracks: Track[]
  bpm: number
  swing: number // 0–0.5 (fraction of 16th note)
  stepCount: 16 | 32
  isPlaying: boolean
  currentStep: number
  kit: string
}
