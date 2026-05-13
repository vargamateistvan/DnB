import { create } from 'zustand'
import type { Step, Track, TrackId, KitId, SequencerState, MachineParams } from '../types'
import { DEFAULT_MACHINE_PARAMS, MACHINE_TRACKS } from '../machines'

type StepCount = 16 | 32 | 64

const makeSteps = (count: StepCount): Step[] =>
  Array.from({ length: count }, () => ({ active: false, velocity: 0.8 }))

// ── Pentatonic notes pool for bass randomisation ───────────────────────────────
const BASS_NOTES = ['C1','Eb1','F1','G1','Bb1','C2','Eb2','F2','G2','Bb2','C3']

// ── Drum density per track (probability a step fires) ─────────────────────────
const RANDOM_DENSITY: Partial<Record<string, number>> = {
  kick:         0.13,
  snare:        0.13,
  hihat_closed: 0.30,
  hihat_open:   0.06,
  cymbal:       0.04,
  clap:         0.10,
  rim:          0.08,
  tom_lo:       0.06,
  tom_hi:       0.06,
  bass:         0.20,
}

// ── Module-level helpers ───────────────────────────────────────────────────────

function toggleStepAt(steps: Step[], index: number): Step[] {
  return steps.map((s, i) => (i === index ? { ...s, active: !s.active } : s))
}

function setVelocityAt(steps: Step[], index: number, velocity: number): Step[] {
  return steps.map((s, i) => (i === index ? { ...s, velocity } : s))
}

function resizeSteps(steps: Step[], stepCount: StepCount): Step[] {
  if (steps.length === stepCount) return steps
  if (stepCount > steps.length) {
    const pad = Array.from({ length: stepCount - steps.length }, (): Step => ({ active: false, velocity: 0.8 }))
    return [...steps, ...pad]
  }
  return steps.slice(0, stepCount)
}

function applyAmenPreset(stepCount: StepCount, activeIndices: number[]): Step[] {
  return makeSteps(stepCount).map((s, i) =>
    activeIndices.includes(i % 16) ? { active: true, velocity: 0.85 } : s
  )
}

function randomizeTrack(trackId: string, stepCount: StepCount, isBass: boolean): Step[] {
  const density = RANDOM_DENSITY[trackId] ?? 0.25
  return makeSteps(stepCount).map(() => {
    if (Math.random() > density) return { active: false, velocity: 0.8 }
    const velocity = 0.6 + Math.random() * 0.4
    const note = isBass ? BASS_NOTES[Math.floor(Math.random() * BASS_NOTES.length)] : undefined
    return { active: true, velocity, ...(note ? { note } : {}) }
  })
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_TRACKS: Track[] = [
  { id: 'kick',         synthType: 'membrane', label: 'KICK',  color: '#ff6b35', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C1'  },
  { id: 'snare',        synthType: 'noise',    label: 'SNARE', color: '#ff3575', steps: makeSteps(16), volume: 0.85, muted: false, note: 'D1'  },
  { id: 'hihat_closed', synthType: 'metal',    label: 'HH CL', color: '#22d3ee', steps: makeSteps(16), volume: 0.7,  muted: false, note: 'F#1' },
  { id: 'hihat_open',   synthType: 'metal',    label: 'HH OP', color: '#0ea5e9', steps: makeSteps(16), volume: 0.65, muted: false, note: 'A#1' },
  { id: 'clap',         synthType: 'noise',    label: 'CLAP',  color: '#a855f7', steps: makeSteps(16), volume: 0.75, muted: false, note: 'E1'  },
  { id: 'rim',          synthType: 'metal',    label: 'RIM',   color: '#84cc16', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#1' },
  { id: 'tom_lo',       synthType: 'membrane', label: 'TOM L', color: '#f59e0b', steps: makeSteps(16), volume: 0.75, muted: false, note: 'G1'  },
  { id: 'tom_hi',       synthType: 'membrane', label: 'TOM H', color: '#fb923c', steps: makeSteps(16), volume: 0.75, muted: false, note: 'A1'  },
  { id: 'cymbal',       synthType: 'metal',    label: 'CYMBL', color: '#34d399', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#2' },
  { id: 'bass',         synthType: 'synth',    label: 'BASS',  color: '#7c3aed', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C2'  },
]

const AMEN_PRESET: Partial<Record<TrackId, number[]>> = {
  kick:         [0, 6, 9, 12],
  snare:        [4, 10, 14],
  hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
  hihat_open:   [3, 11],
}

const CUSTOM_COLORS = [
  '#f472b6','#818cf8','#2dd4bf','#fb7185',
  '#facc15','#a78bfa','#4ade80','#38bdf8',
]
let colorIdx = 0

// ── Actions interface ──────────────────────────────────────────────────────────

interface SequencerActions {
  toggleStep: (trackId: string, stepIndex: number) => void
  setStepVelocity: (trackId: string, stepIndex: number, velocity: number) => void
  setVolume: (trackId: string, volume: number) => void
  toggleMute: (trackId: string) => void
  setBpm: (bpm: number) => void
  setSwing: (swing: number) => void
  setStepCount: (count: StepCount) => void
  setPlaying: (playing: boolean) => void
  setCurrentStep: (step: number) => void
  setKit: (kit: KitId) => void
  toggleKit: (kit: KitId) => void
  toggleMachineKitMute: (kit: KitId) => void
  setTrackKit: (trackId: string, kit: KitId | null) => void
  setMachineParam: <K extends KitId>(kitId: K, key: keyof MachineParams[K], value: MachineParams[K][keyof MachineParams[K]]) => void
  setStepNote: (trackId: string, stepIndex: number, note: string) => void
  addTrack: (afterId: string) => void
  removeTrack: (id: string) => void
  loadPreset: (preset: 'amen' | 'clear') => void
  randomize: (kitId?: KitId) => void
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useSequencerStore = create<SequencerState & SequencerActions>((set, get) => ({
  tracks: DEFAULT_TRACKS,
  bpm: 174,
  swing: 0,
  stepCount: 16,
  isPlaying: false,
  currentStep: 0,
  kit: 'tr808',
  activeKits: ['tr808'],
  mutedKits: [],
  trackKits: {},
  machineParams: DEFAULT_MACHINE_PARAMS,

  toggleStep: (trackId, stepIndex) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, steps: toggleStepAt(t.steps, stepIndex) } : t
      ),
    })),

  setStepVelocity: (trackId, stepIndex, velocity) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, steps: setVelocityAt(t.steps, stepIndex, velocity) } : t
      ),
    })),

  setVolume: (trackId, volume) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)),
    })),

  toggleMute: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    })),

  setBpm: (bpm) => set({ bpm }),
  setSwing: (swing) => set({ swing }),
  setKit: (kit) => set({ kit, activeKits: [kit] }),

  toggleKit: (kit) =>
    set((state) => {
      const already = state.activeKits.includes(kit)
      if (already) {
        // Never remove the last kit
        if (state.activeKits.length <= 1) return {}
        const next = state.activeKits.filter((k) => k !== kit)
        return { activeKits: next, kit: next[0] }
      }
      return { activeKits: [...state.activeKits, kit] }
    }),

  toggleMachineKitMute: (kit) =>
    set((state) => {
      const muted = state.mutedKits.includes(kit)
      const trackIds = new Set(MACHINE_TRACKS[kit].map((t) => t.id as string))
      return {
        mutedKits: muted
          ? state.mutedKits.filter((k) => k !== kit)
          : [...state.mutedKits, kit],
        tracks: state.tracks.map((t) =>
          trackIds.has(t.id) ? { ...t, muted: !muted } : t
        ),
      }
    }),

  setTrackKit: (trackId, kit) =>
    set((state) => {
      if (kit === null) {
        const next = { ...state.trackKits }
        delete next[trackId]
        return { trackKits: next }
      }
      return { trackKits: { ...state.trackKits, [trackId]: kit } }
    }),

  setMachineParam: (kitId, key, value) =>
    set((state) => ({
      machineParams: {
        ...state.machineParams,
        [kitId]: { ...state.machineParams[kitId], [key]: value },
      },
    })),

  setStepCount: (stepCount) =>
    set((state) => ({
      stepCount,
      tracks: state.tracks.map((t) => ({ ...t, steps: resizeSteps(t.steps, stepCount) })),
    })),

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentStep: (currentStep) => set({ currentStep }),

  addTrack: (afterId) => {
    const { tracks, stepCount } = get()
    const source = tracks.find((t) => t.id === afterId)
    if (!source) return
    const newTrack: Track = {
      id: `custom_${Date.now()}`,
      synthType: source.synthType,
      label: source.label.slice(0, 4) + '2',
      color: CUSTOM_COLORS[colorIdx++ % CUSTOM_COLORS.length],
      steps: makeSteps(stepCount),
      volume: source.volume,
      muted: false,
      note: source.note,
      custom: true,
    }
    const idx = tracks.findIndex((t) => t.id === afterId)
    const next = [...tracks]
    next.splice(idx + 1, 0, newTrack)
    set({ tracks: next })
  },

  setStepNote: (trackId, stepIndex, note) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, steps: t.steps.map((s, i) => (i === stepIndex ? { ...s, note } : s)) }
          : t
      ),
    })),

  removeTrack: (id) =>
    set((state) => ({ tracks: state.tracks.filter((t) => t.id !== id) })),

  loadPreset: (preset) =>
    set((state) => {
      if (preset === 'clear') {
        return { tracks: state.tracks.map((t) => ({ ...t, steps: makeSteps(state.stepCount) })) }
      }
      return {
        tracks: state.tracks.map((t) => {
          const activeIndices = AMEN_PRESET[t.id as TrackId] ?? []
          return { ...t, steps: applyAmenPreset(state.stepCount, activeIndices) }
        }),
      }
    }),

  randomize: (kitId) =>
    set((state) => {
      const targetKit = kitId ?? state.kit
      const machineTids = new Set(MACHINE_TRACKS[targetKit].map((m) => m.id as string))
      return {
        tracks: state.tracks.map((t) => {
          if (!machineTids.has(t.id) && !t.custom) return t
          const isBass = t.id === 'bass' || t.synthType === 'mono'
          return { ...t, steps: randomizeTrack(t.id, state.stepCount, isBass) }
        }),
      }
    }),
}))
