import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MachineControls } from '../components/MachineControls'
import { mockState, mockTracks } from './mocks/store'
import type { Track } from '../types'

vi.mock('tone', () => import('./mocks/tone'))

let currentState = { ...mockState }

vi.mock('../store/sequencerStore', () => ({
  useSequencerStore: vi.fn((selector: (s: typeof currentState) => unknown) =>
    selector(currentState)
  ),
}))

vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    play: vi.fn(),
    stop: vi.fn(),
    triggerPad: vi.fn(),
    connectToRecorder: vi.fn(),
  }),
}))

const onPlay = vi.fn()
const onStop = vi.fn()

// All TR-909 tracks needed for the tr909 controls panel
const TR909_TRACKS: Track[] = [
  { id: 'tr909_kick', synthType: 'membrane', label: 'BD', color: '#ff6b35', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.9, muted: false, note: 'C1' },
  { id: 'tr909_snare', synthType: 'noise', label: 'SD', color: '#ff3575', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.85, muted: false, note: 'D1' },
  { id: 'tr909_hihat_closed', synthType: 'metal', label: 'CH', color: '#22d3ee', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.7, muted: false, note: 'F#1' },
  { id: 'tr909_hihat_open', synthType: 'metal', label: 'OH', color: '#0ea5e9', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.65, muted: false, note: 'A#1' },
  { id: 'tr909_clap', synthType: 'noise', label: 'HC', color: '#a855f7', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.75, muted: false, note: 'E1' },
  { id: 'tr909_rim', synthType: 'metal', label: 'RM', color: '#84cc16', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.6, muted: false, note: 'C#1' },
  { id: 'tr909_tom_lo', synthType: 'membrane', label: 'LT', color: '#f59e0b', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.75, muted: false, note: 'G1' },
  { id: 'tr909_tom_hi', synthType: 'membrane', label: 'HT', color: '#fb923c', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.75, muted: false, note: 'A1' },
  { id: 'tr909_cymbal', synthType: 'metal', label: 'CC', color: '#34d399', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.6, muted: false, note: 'C#2' },
]

beforeEach(() => {
  currentState = { ...mockState }
  vi.clearAllMocks()
})

describe('MachineControls — TR-808', () => {
  it('renders PRESET label', () => {
    currentState = { ...mockState, kit: 'tr808', tracks: mockTracks }
    render(<MachineControls kitId="tr808" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('PRESET')).toBeInTheDocument()
  })

  it('renders the CLR button', () => {
    currentState = { ...mockState, kit: 'tr808', tracks: mockTracks }
    render(<MachineControls kitId="tr808" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('CLR')).toBeInTheDocument()
  })

  it('renders LEVEL CONTROLS label', () => {
    currentState = { ...mockState, kit: 'tr808', tracks: mockTracks }
    render(<MachineControls kitId="tr808" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('LEVEL CONTROLS')).toBeInTheDocument()
  })
})

describe('MachineControls — TB-303', () => {
  it('renders PRESET label', () => {
    currentState = { ...mockState, kit: 'tb303', tracks: mockTracks }
    render(<MachineControls kitId="tb303" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('PRESET')).toBeInTheDocument()
  })

  it('renders the CLR button', () => {
    currentState = { ...mockState, kit: 'tb303', tracks: mockTracks }
    render(<MachineControls kitId="tb303" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('CLR')).toBeInTheDocument()
  })

  it('renders WAVEFORM toggle', () => {
    currentState = { ...mockState, kit: 'tb303', tracks: mockTracks }
    render(<MachineControls kitId="tb303" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('WAVEFORM')).toBeInTheDocument()
  })
})

describe('MachineControls — SH-101', () => {
  it('renders PRESET label', () => {
    currentState = { ...mockState, kit: 'sh101', tracks: mockTracks }
    render(<MachineControls kitId="sh101" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('PRESET')).toBeInTheDocument()
  })

  it('renders the CLR button', () => {
    currentState = { ...mockState, kit: 'sh101', tracks: mockTracks }
    render(<MachineControls kitId="sh101" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('CLR')).toBeInTheDocument()
  })

  it('renders VCF section', () => {
    currentState = { ...mockState, kit: 'sh101', tracks: mockTracks }
    render(<MachineControls kitId="sh101" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('VCF')).toBeInTheDocument()
  })
})

describe('MachineControls — TR-909', () => {
  it('renders PRESET label', () => {
    currentState = { ...mockState, kit: 'tr909', tracks: [...mockTracks, ...TR909_TRACKS] }
    render(<MachineControls kitId="tr909" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('PRESET')).toBeInTheDocument()
  })

  it('renders the CLR button', () => {
    currentState = { ...mockState, kit: 'tr909', tracks: [...mockTracks, ...TR909_TRACKS] }
    render(<MachineControls kitId="tr909" onPlay={onPlay} onStop={onStop} />)
    expect(screen.getByText('CLR')).toBeInTheDocument()
  })
})
