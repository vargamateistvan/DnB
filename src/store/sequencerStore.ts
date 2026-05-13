import { create } from 'zustand'
import type { Track, TrackId, SequencerState } from '../types'

const makeSteps = (count: 16 | 32) =>
  Array.from({ length: count }, () => ({ active: false, velocity: 0.8 }))

const DEFAULT_TRACKS: Track[] = [
  { id: 'kick',         label: 'KICK',    color: '#ff6b35', steps: makeSteps(16), volume: 0.9, muted: false, note: 'C1' },
  { id: 'snare',        label: 'SNARE',   color: '#ff3575', steps: makeSteps(16), volume: 0.85, muted: false, note: 'D1' },
  { id: 'hihat_closed', label: 'HH CL',  color: '#22d3ee', steps: makeSteps(16), volume: 0.7, muted: false, note: 'F#1' },
  { id: 'hihat_open',   label: 'HH OP',  color: '#0ea5e9', steps: makeSteps(16), volume: 0.65, muted: false, note: 'A#1' },
  { id: 'clap',         label: 'CLAP',   color: '#a855f7', steps: makeSteps(16), volume: 0.75, muted: false, note: 'E1' },
  { id: 'rim',          label: 'RIM',    color: '#84cc16', steps: makeSteps(16), volume: 0.6, muted: false, note: 'C#1' },
  { id: 'tom_lo',       label: 'TOM L',  color: '#f59e0b', steps: makeSteps(16), volume: 0.75, muted: false, note: 'G1' },
  { id: 'tom_hi',       label: 'TOM H',  color: '#fb923c', steps: makeSteps(16), volume: 0.75, muted: false, note: 'A1' },
  { id: 'cymbal',       label: 'CYMBL',  color: '#34d399', steps: makeSteps(16), volume: 0.6, muted: false, note: 'C#2' },
  { id: 'bass',         label: 'BASS',   color: '#7c3aed', steps: makeSteps(16), volume: 0.9, muted: false, note: 'C2' },
]

const AMEN_PRESET: Partial<Record<TrackId, number[]>> = {
  kick:         [0, 6, 9, 12],
  snare:        [4, 10, 14],
  hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
  hihat_open:   [3, 11],
}

interface SequencerActions {
  toggleStep: (trackId: TrackId, stepIndex: number) => void
  setStepVelocity: (trackId: TrackId, stepIndex: number, velocity: number) => void
  setVolume: (trackId: TrackId, volume: number) => void
  toggleMute: (trackId: TrackId) => void
  setBpm: (bpm: number) => void
  setSwing: (swing: number) => void
  setStepCount: (count: 16 | 32) => void
  setPlaying: (playing: boolean) => void
  setCurrentStep: (step: number) => void
  loadPreset: (preset: 'amen' | 'clear') => void
}

export const useSequencerStore = create<SequencerState & SequencerActions>((set) => ({
  tracks: DEFAULT_TRACKS,
  bpm: 174,
  swing: 0,
  stepCount: 16,
  isPlaying: false,
  currentStep: 0,
  kit: 'tr808',

  toggleStep: (trackId, stepIndex) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              steps: t.steps.map((s, i) =>
                i === stepIndex ? { ...s, active: !s.active } : s
              ),
            }
          : t
      ),
    })),

  setStepVelocity: (trackId, stepIndex, velocity) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              steps: t.steps.map((s, i) =>
                i === stepIndex ? { ...s, velocity } : s
              ),
            }
          : t
      ),
    })),

  setVolume: (trackId, volume) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)),
    })),

  toggleMute: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    })),

  setBpm: (bpm) => set({ bpm }),
  setSwing: (swing) => set({ swing }),
  setStepCount: (stepCount) =>
    set((state) => ({
      stepCount,
      tracks: state.tracks.map((t) => ({
        ...t,
        steps:
          t.steps.length === stepCount
            ? t.steps
            : stepCount === 32
            ? [...t.steps, ...makeSteps(16)]
            : t.steps.slice(0, 16),
      })),
    })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentStep: (currentStep) => set({ currentStep }),

  loadPreset: (preset) =>
    set((state) => {
      if (preset === 'clear') {
        return {
          tracks: state.tracks.map((t) => ({
            ...t,
            steps: makeSteps(state.stepCount),
          })),
        }
      }
      // amen
      return {
        tracks: state.tracks.map((t) => ({
          ...t,
          steps: makeSteps(state.stepCount).map((s, i) =>
            AMEN_PRESET[t.id]?.includes(i) ? { active: true, velocity: 0.85 } : s
          ),
        })),
      }
    }),
}))
