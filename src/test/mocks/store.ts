import { vi } from 'vitest'
import { DEFAULT_MACHINE_PARAMS } from '../../machines'
import type { Track, SequencerState } from '../../types'

function makeSteps(count: number) {
  return Array.from({ length: count }, () => ({ active: false, velocity: 0.8 }))
}

export const mockTracks: Track[] = [
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
  // Bass machines
  { id: 'tb303_bass',         synthType: 'mono',     label: 'BASS', color: '#a855f7', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C2'  },
  { id: 'sh101_bass',         synthType: 'mono',     label: 'BASS', color: '#f59e0b', steps: makeSteps(16), volume: 0.9,  muted: false, note: 'C2'  },
]

export const mockState: SequencerState & Record<string, unknown> = {
  tracks: mockTracks,
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
  activePresets: {},
  // Actions
  loadState: vi.fn(),
  toggleStep: vi.fn(),
  setStepVelocity: vi.fn(),
  setVolume: vi.fn(),
  toggleMute: vi.fn(),
  setBpm: vi.fn(),
  setSwing: vi.fn(),
  setStepCount: vi.fn(),
  setTrackStepCount: vi.fn(),
  setPlaying: vi.fn(),
  setCurrentStep: vi.fn(),
  setKit: vi.fn(),
  toggleKit: vi.fn(),
  reorderKit: vi.fn(),
  toggleMachineKitMute: vi.fn(),
  setTrackKit: vi.fn(),
  setMachineParam: vi.fn(),
  setStepNote: vi.fn(),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  reorderTrack: vi.fn(),
  loadPreset: vi.fn(),
  loadMachinePreset: vi.fn(),
  randomize: vi.fn(),
  clearMachine: vi.fn(),
  setActivePreset: vi.fn(),
  setStepProbability: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
}
