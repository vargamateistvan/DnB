import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Step, Track, TrackId, KitId, SequencerState, MachineParams } from '../types'
import { DEFAULT_MACHINE_PARAMS, MACHINE_TRACKS } from '../machines'
import type { MachinePreset, PresetStep } from '../presets'
import type { SongPreset } from '../songPresets'

type StepCount = 16 | 32 | 64 | 128

const makeSteps = (count: StepCount): Step[] =>
  Array.from({ length: count }, () => ({ active: false, velocity: 0.8 }))

// ── Pentatonic notes pool for bass randomisation ───────────────────────────────
const BASS_NOTES = ['C1','Eb1','F1','G1','Bb1','C2','Eb2','F2','G2','Bb2','C3']

// ── Drum density by track type suffix ─────────────────────────────────────────
const DENSITY_BY_TYPE: Record<string, number> = {
  kick: 0.13, snare: 0.13, hihat_closed: 0.30, hihat_open: 0.06,
  cymbal: 0.04, clap: 0.10, rim: 0.08, tom_lo: 0.06, tom_hi: 0.06,
  bass: 0.20, cowbell: 0.05,
}

function trackDensity(id: string): number {
  const suffix = id.replace(/^(tr808|tr909|tr606|tr707|tb303|sh101)_/, '')
  return DENSITY_BY_TYPE[suffix] ?? 0.25
}

// ── Module-level helpers ───────────────────────────────────────────────────────

function toggleStepAt(steps: Step[], index: number): Step[] {
  return steps.map((s, i) => (i === index ? { ...s, active: !s.active } : s))
}

function setVelocityAt(steps: Step[], index: number, velocity: number): Step[] {
  return steps.map((s, i) => (i === index ? { ...s, velocity } : s))
}

function setProbabilityAt(steps: Step[], index: number, probability: number): Step[] {
  return steps.map((s, i) => (i === index ? { ...s, probability } : s))
}

// ── Undo / redo history (module-level, not persisted) ─────────────────────────
const MAX_HISTORY = 50
let _history: Track[][] = []
let _future:  Track[][] = []

function pushHistory(tracks: Track[]) {
  _history.push(tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })))
  if (_history.length > MAX_HISTORY) _history.shift()
  _future = []
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

function applyPresetSteps(track: Track, presetSteps: PresetStep[] | undefined): Track {
  const newSteps: Step[] = track.steps.map(() => ({ active: false, velocity: 0.8 }))
  for (const { index, velocity = 0.8, note } of presetSteps ?? []) {
    if (index < newSteps.length) {
      newSteps[index] = { active: true, velocity, ...(note ? { note } : {}) }
    }
  }
  return { ...track, steps: newSteps }
}

function randomizeTrack(trackId: string, stepCount: StepCount, isBass: boolean): Step[] {
  const density = trackDensity(trackId)
  return makeSteps(stepCount).map(() => {
    if (Math.random() > density) return { active: false, velocity: 0.8 }
    const velocity = 0.6 + Math.random() * 0.4
    const note = isBass ? BASS_NOTES[Math.floor(Math.random() * BASS_NOTES.length)] : undefined
    return { active: true, velocity, ...(note ? { note } : {}) }
  })
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_TRACKS: Track[] = [
  // TR-808
  { id: 'tr808_kick',         synthType: 'membrane', label: 'BD',   color: '#ff6b35', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C1'  },
  { id: 'tr808_snare',        synthType: 'noise',    label: 'SD',   color: '#ff3575', steps: makeSteps(16), volume: 0.85, muted: false, note: 'D1'  },
  { id: 'tr808_hihat_closed', synthType: 'metal',    label: 'CH',   color: '#22d3ee', steps: makeSteps(16), volume: 0.7,  muted: false, note: 'F#1' },
  { id: 'tr808_hihat_open',   synthType: 'metal',    label: 'OH',   color: '#0ea5e9', steps: makeSteps(16), volume: 0.65, muted: false, note: 'A#1' },
  { id: 'tr808_clap',         synthType: 'noise',    label: 'CP',   color: '#a855f7', steps: makeSteps(16), volume: 0.75, muted: false, note: 'E1'  },
  { id: 'tr808_rim',          synthType: 'metal',    label: 'RS',   color: '#84cc16', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#1' },
  { id: 'tr808_tom_lo',       synthType: 'membrane', label: 'LT',   color: '#f59e0b', steps: makeSteps(16), volume: 0.75, muted: false, note: 'G1'  },
  { id: 'tr808_tom_hi',       synthType: 'membrane', label: 'HT',   color: '#fb923c', steps: makeSteps(16), volume: 0.75, muted: false, note: 'A1'  },
  { id: 'tr808_cymbal',       synthType: 'metal',    label: 'CY',   color: '#34d399', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#2' },
  { id: 'tr808_cowbell',      synthType: 'metal',    label: 'CB',   color: '#fbbf24', steps: makeSteps(16), volume: 0.5,  muted: false, note: 'G#1' },
  // TR-909
  { id: 'tr909_kick',         synthType: 'membrane', label: 'BD',   color: '#ff6b35', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C1'  },
  { id: 'tr909_snare',        synthType: 'noise',    label: 'SD',   color: '#ff3575', steps: makeSteps(16), volume: 0.85, muted: false, note: 'D1'  },
  { id: 'tr909_hihat_closed', synthType: 'metal',    label: 'CH',   color: '#22d3ee', steps: makeSteps(16), volume: 0.7,  muted: false, note: 'F#1' },
  { id: 'tr909_hihat_open',   synthType: 'metal',    label: 'OH',   color: '#0ea5e9', steps: makeSteps(16), volume: 0.65, muted: false, note: 'A#1' },
  { id: 'tr909_clap',         synthType: 'noise',    label: 'HC',   color: '#a855f7', steps: makeSteps(16), volume: 0.75, muted: false, note: 'E1'  },
  { id: 'tr909_rim',          synthType: 'metal',    label: 'RM',   color: '#84cc16', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#1' },
  { id: 'tr909_tom_lo',       synthType: 'membrane', label: 'LT',   color: '#f59e0b', steps: makeSteps(16), volume: 0.75, muted: false, note: 'G1'  },
  { id: 'tr909_tom_hi',       synthType: 'membrane', label: 'HT',   color: '#fb923c', steps: makeSteps(16), volume: 0.75, muted: false, note: 'A1'  },
  { id: 'tr909_cymbal',       synthType: 'metal',    label: 'CC',   color: '#34d399', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#2' },
  // TR-606
  { id: 'tr606_kick',         synthType: 'membrane', label: 'BD',   color: '#ff6b35', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C1'  },
  { id: 'tr606_snare',        synthType: 'noise',    label: 'SD',   color: '#ff3575', steps: makeSteps(16), volume: 0.85, muted: false, note: 'D1'  },
  { id: 'tr606_hihat_closed', synthType: 'metal',    label: 'CH',   color: '#22d3ee', steps: makeSteps(16), volume: 0.7,  muted: false, note: 'F#1' },
  { id: 'tr606_hihat_open',   synthType: 'metal',    label: 'OH',   color: '#0ea5e9', steps: makeSteps(16), volume: 0.65, muted: false, note: 'A#1' },
  { id: 'tr606_clap',         synthType: 'noise',    label: 'CP',   color: '#a855f7', steps: makeSteps(16), volume: 0.75, muted: false, note: 'E1'  },
  { id: 'tr606_rim',          synthType: 'metal',    label: 'RS',   color: '#84cc16', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#1' },
  { id: 'tr606_tom_lo',       synthType: 'membrane', label: 'LT',   color: '#f59e0b', steps: makeSteps(16), volume: 0.75, muted: false, note: 'G1'  },
  { id: 'tr606_tom_hi',       synthType: 'membrane', label: 'HT',   color: '#fb923c', steps: makeSteps(16), volume: 0.75, muted: false, note: 'A1'  },
  { id: 'tr606_cymbal',       synthType: 'metal',    label: 'CY',   color: '#34d399', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#2' },
  // TR-707
  { id: 'tr707_kick',         synthType: 'membrane', label: 'BD',   color: '#ff6b35', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C1'  },
  { id: 'tr707_snare',        synthType: 'noise',    label: 'SD',   color: '#ff3575', steps: makeSteps(16), volume: 0.85, muted: false, note: 'D1'  },
  { id: 'tr707_hihat_closed', synthType: 'metal',    label: 'CH',   color: '#22d3ee', steps: makeSteps(16), volume: 0.7,  muted: false, note: 'F#1' },
  { id: 'tr707_hihat_open',   synthType: 'metal',    label: 'OH',   color: '#0ea5e9', steps: makeSteps(16), volume: 0.65, muted: false, note: 'A#1' },
  { id: 'tr707_clap',         synthType: 'noise',    label: 'CW',   color: '#a855f7', steps: makeSteps(16), volume: 0.75, muted: false, note: 'E1'  },
  { id: 'tr707_rim',          synthType: 'metal',    label: 'RM',   color: '#84cc16', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#1' },
  { id: 'tr707_tom_lo',       synthType: 'membrane', label: 'LT',   color: '#f59e0b', steps: makeSteps(16), volume: 0.75, muted: false, note: 'G1'  },
  { id: 'tr707_tom_hi',       synthType: 'membrane', label: 'HT',   color: '#fb923c', steps: makeSteps(16), volume: 0.75, muted: false, note: 'A1'  },
  { id: 'tr707_cymbal',       synthType: 'metal',    label: 'CY',   color: '#34d399', steps: makeSteps(16), volume: 0.6,  muted: false, note: 'C#2' },
  // Bass machines
  { id: 'tb303_bass',         synthType: 'mono',     label: 'BASS', color: '#a855f7', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C2'  },
  { id: 'sh101_bass',         synthType: 'mono',     label: 'BASS', color: '#f59e0b', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C2'  },
]

const AMEN_PRESET: Partial<Record<string, number[]>> = {
  tr808_kick:         [0, 6, 9, 12],
  tr808_snare:        [4, 10, 14],
  tr808_hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
  tr808_hihat_open:   [3, 11],
  tr909_kick:         [0, 6, 9, 12],
  tr909_snare:        [4, 10, 14],
  tr909_hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
  tr909_hihat_open:   [3, 11],
  tr606_kick:         [0, 6, 9, 12],
  tr606_snare:        [4, 10, 14],
  tr606_hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
  tr606_hihat_open:   [3, 11],
  tr707_kick:         [0, 6, 9, 12],
  tr707_snare:        [4, 10, 14],
  tr707_hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
  tr707_hihat_open:   [3, 11],
}

const CUSTOM_COLORS = [
  '#f472b6','#818cf8','#2dd4bf','#fb7185',
  '#facc15','#a78bfa','#4ade80','#38bdf8',
]
let colorIdx = 0

// ── Actions interface ──────────────────────────────────────────────────────────

interface SequencerActions {
  loadState: (partial: Partial<SequencerState>) => void
  toggleStep: (trackId: string, stepIndex: number) => void
  setStepVelocity: (trackId: string, stepIndex: number, velocity: number) => void
  setVolume: (trackId: string, volume: number) => void
  toggleMute: (trackId: string) => void
  setBpm: (bpm: number) => void
  setSwing: (swing: number) => void
  setStepCount: (count: StepCount) => void
  setTrackStepCount: (trackId: string, count: StepCount) => void
  setPlaying: (playing: boolean) => void
  setCurrentStep: (step: number) => void
  setKit: (kit: KitId) => void
  toggleKit: (kit: KitId) => void
  reorderKit: (draggedId: KitId, targetId: KitId) => void
  toggleMachineKitMute: (kit: KitId) => void
  setTrackKit: (trackId: string, kit: KitId | null) => void
  setMachineParam: <K extends KitId>(kitId: K, key: keyof MachineParams[K], value: MachineParams[K][keyof MachineParams[K]]) => void
  setStepNote: (trackId: string, stepIndex: number, note: string) => void
  addTrack: (afterId: string) => void
  removeTrack: (id: string) => void
  reorderTrack: (draggedId: string, targetId: string) => void
  loadPreset: (preset: 'amen' | 'clear') => void
  loadMachinePreset: (kitId: KitId, preset: MachinePreset) => void
  randomize: (kitId?: KitId) => void
  clearMachine: (kitId: KitId) => void
  setActivePreset: (kitId: KitId, index: number | null) => void
  setStepProbability: (trackId: string, stepIndex: number, probability: number) => void
  setMasterTune: (hz: number) => void
  loadSongPreset: (preset: SongPreset) => void
  undo: () => void
  redo: () => void
  resetAll: () => void
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useSequencerStore = create<SequencerState & SequencerActions>()(
  persist(
    (set, get) => ({
  tracks: DEFAULT_TRACKS,
  bpm: 174,
  swing: 0,
  masterTune: 440,
  stepCount: 16,
  isPlaying: false,
  currentStep: 0,
  kit: 'tr808',
  activeKits: ['tr808'],
  mutedKits: [],
  trackKits: {},
  machineParams: DEFAULT_MACHINE_PARAMS,
  activePresets: {},

  loadState: (partial) => set(partial),

  toggleStep: (trackId, stepIndex) => {
    pushHistory(get().tracks)
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, steps: toggleStepAt(t.steps, stepIndex) } : t
      ),
    }))
  },

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
  setMasterTune: (hz) => set({ masterTune: hz }),
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

  reorderKit: (draggedId, targetId) =>
    set((state) => {
      if (draggedId === targetId) return {}
      const from = state.activeKits.indexOf(draggedId)
      const to   = state.activeKits.indexOf(targetId)
      if (from === -1 || to === -1) return {}
      const next = [...state.activeKits]
      next.splice(from, 1)
      next.splice(to, 0, draggedId)
      return { activeKits: next }
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

  setTrackStepCount: (trackId, count) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, steps: resizeSteps(t.steps, count) } : t
      ),
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

  reorderTrack: (draggedId, targetId) =>
    set((state) => {
      if (draggedId === targetId) return {}
      const from = state.tracks.findIndex((t) => t.id === draggedId)
      const to   = state.tracks.findIndex((t) => t.id === targetId)
      if (from === -1 || to === -1) return {}
      const next = [...state.tracks]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return { tracks: next }
    }),

  setActivePreset: (kitId, index) =>
    set((state) => ({ activePresets: { ...state.activePresets, [kitId]: index } })),

  loadPreset: (preset) => {
    pushHistory(get().tracks)
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
    })
  },

  loadMachinePreset: (kitId, preset) => {
    pushHistory(get().tracks)
    set((state) => {
      const kitTrackIds = new Set(MACHINE_TRACKS[kitId].map((t) => t.id))
      const sc = (preset.stepCount ?? state.stepCount) as StepCount
      const scChanged = sc !== state.stepCount
      return {
        ...(scChanged ? { stepCount: sc } : {}),
        tracks: state.tracks.map((t) => {
          const resized = scChanged ? { ...t, steps: resizeSteps(t.steps, sc) } : t
          return kitTrackIds.has(t.id) ? applyPresetSteps(resized, preset.tracks[t.id]) : resized
        }),
      }
    })
  },

  randomize: (kitId) => {
    pushHistory(get().tracks)
    set((state) => {
      const targetKit = kitId ?? state.kit
      const machineTids = new Set(MACHINE_TRACKS[targetKit].map((m) => m.id as string))
      return {
        tracks: state.tracks.map((t) => {
          if (!machineTids.has(t.id) && !t.custom) return t
          const isBass = t.synthType === 'mono' || t.synthType === 'synth'
          return { ...t, steps: randomizeTrack(t.id, state.stepCount, isBass) }
        }),
      }
    })
  },

  clearMachine: (kitId) => {
    pushHistory(get().tracks)
    set((state) => {
      const machineTids = new Set(MACHINE_TRACKS[kitId].map((m) => m.id as string))
      return {
        tracks: state.tracks.map((t) =>
          machineTids.has(t.id) ? { ...t, steps: makeSteps(state.stepCount) } : t
        ),
        activePresets: { ...state.activePresets, [kitId]: null },
      }
    })
  },

  setStepProbability: (trackId, stepIndex, probability) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, steps: setProbabilityAt(t.steps, stepIndex, probability) } : t
      ),
    })),

  loadSongPreset: (preset) => {
    pushHistory(get().tracks)
    const sc = (preset.stepCount ?? 16) as StepCount
    set((state) => {
      const newTracks = state.tracks.map((t) => {
        const resized = { ...t, steps: resizeSteps(t.steps, sc) }
        if (t.id in preset.tracks) return applyPresetSteps(resized, preset.tracks[t.id])
        return { ...resized, steps: makeSteps(sc) }
      })
      const d = DEFAULT_MACHINE_PARAMS
      const mp = preset.machineParams
      return {
        tracks: newTracks,
        bpm: preset.bpm,
        stepCount: sc,
        activeKits: preset.activeKits,
        kit: preset.activeKits[0],
        activePresets: {},
        machineParams: {
          tr808: { ...d.tr808, ...mp?.tr808 },
          tr909: { ...d.tr909, ...mp?.tr909 },
          tr606: { ...d.tr606, ...mp?.tr606 },
          tr707: { ...d.tr707, ...mp?.tr707 },
          tb303: { ...d.tb303, ...mp?.tb303 },
          sh101: { ...d.sh101, ...mp?.sh101 },
        },
      }
    })
  },

  undo: () =>
    set((state) => {
      if (_history.length === 0) return {}
      const prev = _history.pop()!
      _future.push(state.tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })))
      return { tracks: prev }
    }),

  redo: () =>
    set((state) => {
      if (_future.length === 0) return {}
      const next = _future.pop()!
      _history.push(state.tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })))
      return { tracks: next }
    }),

  resetAll: () => {
    _history.length = 0
    _future.length = 0
    set({
      tracks: DEFAULT_TRACKS,
      bpm: 174,
      swing: 0,
      masterTune: 440,
      stepCount: 16,
      isPlaying: false,
      currentStep: 0,
      kit: 'tr808',
      activeKits: ['tr808'],
      mutedKits: [],
      trackKits: {},
      machineParams: DEFAULT_MACHINE_PARAMS,
      activePresets: {},
    })
  },
  }),
  {
    name: 'dnb-sequencer',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      tracks: state.tracks,
      bpm: state.bpm,
      swing: state.swing,
      masterTune: state.masterTune,
      stepCount: state.stepCount,
      kit: state.kit,
      activeKits: state.activeKits,
      mutedKits: state.mutedKits,
      trackKits: state.trackKits,
      machineParams: state.machineParams,
      activePresets: state.activePresets,
    }),
    merge: (persisted, current) => {
      const p = persisted as Partial<SequencerState>
      const d = DEFAULT_MACHINE_PARAMS
      // Always start from the canonical base tracks so no built-in track can go missing
      // (e.g. sh101_bass absent in an older localStorage save).
      // Base tracks keep their persisted state; custom tracks are appended after.
      const baseMap = new Map(current.tracks.map((t) => [t.id, t]))
      const persistedMap = new Map((p.tracks ?? []).map((t) => [t.id, t]))
      const tracks = [
        ...current.tracks.map((t) => persistedMap.get(t.id) ?? t),
        ...(p.tracks ?? []).filter((t) => !baseMap.has(t.id)),
      ]
      return {
        ...current,
        ...p,
        tracks,
        masterTune: p.masterTune ?? 440,
        machineParams: {
          tr808: { ...d.tr808, ...p.machineParams?.tr808 },
          tr909: { ...d.tr909, ...p.machineParams?.tr909 },
          tr606: { ...d.tr606, ...p.machineParams?.tr606 },
          tr707: { ...d.tr707, ...p.machineParams?.tr707 },
          tb303: { ...d.tb303, ...p.machineParams?.tb303 },
          sh101: { ...d.sh101, ...p.machineParams?.sh101 },
        },
      }
    },
  }
))
