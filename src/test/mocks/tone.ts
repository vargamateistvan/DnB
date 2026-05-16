import { vi } from 'vitest'

// Mock all Tone.js exports so tests don't need Web Audio API
const mockPlayer = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  disconnect: vi.fn().mockReturnThis(),
  start: vi.fn(),
  stop: vi.fn(),
  load: vi.fn().mockResolvedValue(undefined),
  loaded: true,
  volume: { value: 0 },
  dispose: vi.fn(),
}))

const mockSynth = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  disconnect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
  triggerAttack: vi.fn(),
  triggerRelease: vi.fn(),
  volume: { value: 0 },
  envelope: { attack: 0, decay: 0, sustain: 0, release: 0 },
  oscillator: { type: 'sine' },
  dispose: vi.fn(),
}))

const mockMembraneSynth = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  disconnect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
  volume: { value: 0 },
  envelope: { attack: 0, decay: 0, sustain: 0, release: 0 },
  dispose: vi.fn(),
}))

const mockNoiseSynth = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  disconnect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
  volume: { value: 0 },
  envelope: { attack: 0, decay: 0, sustain: 0, release: 0 },
  noise: { type: 'white' },
  dispose: vi.fn(),
}))

const mockMetalSynth = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  disconnect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
  volume: { value: 0 },
  envelope: { attack: 0, decay: 0, sustain: 0, release: 0 },
  dispose: vi.fn(),
}))

const mockMonoSynth = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  disconnect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
  triggerAttack: vi.fn(),
  triggerRelease: vi.fn(),
  setNote: vi.fn(),
  volume: { value: 0 },
  filter: { frequency: { value: 0 }, Q: { value: 0 } },
  oscillator: { type: 'sine' },
  portamento: 0,
  dispose: vi.fn(),
}))

const mockGain = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  disconnect: vi.fn().mockReturnThis(),
  gain: { value: 1 },
  dispose: vi.fn(),
}))

const mockRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(new Blob()),
  state: 'stopped',
  connect: vi.fn().mockReturnThis(),
  dispose: vi.fn(),
}))

const mockTransport = {
  start: vi.fn(),
  stop: vi.fn(),
  schedule: vi.fn(),
  scheduleRepeat: vi.fn(),
  cancel: vi.fn(),
  bpm: { value: 120 },
  swing: 0,
  swingSubdivision: '16n',
  position: '0:0:0',
  state: 'stopped',
}

const mockContext = {
  resume: vi.fn().mockResolvedValue(undefined),
  state: 'running',
  A4: 440,
}

const mockDestination = {
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockWaveform = vi.fn().mockImplementation(() => ({
  getValue: vi.fn().mockReturnValue(new Float32Array(1024)),
  dispose: vi.fn(),
}))

export const Player = mockPlayer
export const Synth = mockSynth
export const MembraneSynth = mockMembraneSynth
export const NoiseSynth = mockNoiseSynth
export const MetalSynth = mockMetalSynth
export const MonoSynth = mockMonoSynth
export const Gain = mockGain
export const Recorder = mockRecorder
export const Transport = mockTransport
export const getContext = vi.fn(() => mockContext)
export const getDestination = vi.fn(() => mockDestination)
export const Waveform = mockWaveform
export const start = vi.fn().mockResolvedValue(undefined)
export const gainToDb = vi.fn((gain: number) => Math.log10(gain) * 20)
export const dbToGain = vi.fn((db: number) => 10 ** (db / 20))
export const now = vi.fn(() => 0)
export const Filter = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  frequency: { value: 1000 },
  Q: { value: 1 },
  dispose: vi.fn(),
}))
export const FrequencyEnvelope = vi.fn().mockImplementation(() => ({
  connect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
  baseFrequency: 200,
  dispose: vi.fn(),
}))
export const Reverb = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  ready: Promise.resolve(),
  dispose: vi.fn(),
}))
export const Delay = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  dispose: vi.fn(),
}))
export const Distortion = vi.fn().mockImplementation(() => ({
  toDestination: vi.fn().mockReturnThis(),
  connect: vi.fn().mockReturnThis(),
  dispose: vi.fn(),
}))
