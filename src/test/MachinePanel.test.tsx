import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MachinePanel } from '../components/MachinePanel'
import { mockState } from './mocks/store'

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

vi.mock('../hooks/useExport', () => ({
  useExport: () => ({
    exportMidi: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
  }),
}))

vi.mock('../hooks/useSongs', () => ({
  useSongs: () => ({
    songs: [],
    saveSong: vi.fn(),
    loadSong: vi.fn(),
    deleteSong: vi.fn(),
    renameSong: vi.fn(),
  }),
}))

vi.mock('../hooks/useMidiImport', () => ({
  useMidiImport: () => ({
    importMidi: vi.fn(),
  }),
}))

const onPadTrigger = vi.fn()
const onPlay = vi.fn()
const onStop = vi.fn()

beforeEach(() => {
  currentState = { ...mockState }
  vi.clearAllMocks()
})

describe('MachinePanel', () => {
  it('renders machine name label strip', () => {
    render(
      <MachinePanel
        kitId="tr808"
        onPadTrigger={onPadTrigger}
        onPlay={onPlay}
        onStop={onStop}
      />
    )
    // KIT_LABELS['tr808'] = 'TR-808' — also appears in DrumGrid watermark, so use getAllByText
    expect(screen.getAllByText('TR-808').length).toBeGreaterThan(0)
  })

  it('mute button is present', () => {
    render(
      <MachinePanel
        kitId="tr808"
        onPadTrigger={onPadTrigger}
        onPlay={onPlay}
        onStop={onStop}
      />
    )
    // The mute button has title "Mute machine" or "Unmute machine"
    const muteBtn = screen.getByTitle('Mute machine')
    expect(muteBtn).toBeInTheDocument()
  })

  it('when hideControls is false, MachineControls is rendered (PRESET label visible)', () => {
    render(
      <MachinePanel
        kitId="tr808"
        onPadTrigger={onPadTrigger}
        onPlay={onPlay}
        onStop={onStop}
        hideControls={false}
      />
    )
    // MachineControls for tr808 renders a PresetBar which has "PRESET" label
    expect(screen.getByText('PRESET')).toBeInTheDocument()
  })

  it('when hideControls is true, MachineControls is not rendered', () => {
    render(
      <MachinePanel
        kitId="tr808"
        onPadTrigger={onPadTrigger}
        onPlay={onPlay}
        onStop={onStop}
        hideControls={true}
      />
    )
    // PRESET label should not be present when hideControls=true
    expect(screen.queryByText('PRESET')).not.toBeInTheDocument()
  })

  it('renders TR-909 machine label strip', () => {
    // Add TR-909 tracks to the state
    const tr909Tracks = mockState.tracks.concat([
      { id: 'tr909_kick', synthType: 'membrane', label: 'BD', color: '#ff6b35', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.9, muted: false, note: 'C1' },
      { id: 'tr909_snare', synthType: 'noise', label: 'SD', color: '#ff3575', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.85, muted: false, note: 'D1' },
      { id: 'tr909_hihat_closed', synthType: 'metal', label: 'CH', color: '#22d3ee', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.7, muted: false, note: 'F#1' },
      { id: 'tr909_hihat_open', synthType: 'metal', label: 'OH', color: '#0ea5e9', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.65, muted: false, note: 'A#1' },
      { id: 'tr909_clap', synthType: 'noise', label: 'HC', color: '#a855f7', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.75, muted: false, note: 'E1' },
      { id: 'tr909_rim', synthType: 'metal', label: 'RM', color: '#84cc16', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.6, muted: false, note: 'C#1' },
      { id: 'tr909_tom_lo', synthType: 'membrane', label: 'LT', color: '#f59e0b', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.75, muted: false, note: 'G1' },
      { id: 'tr909_tom_hi', synthType: 'membrane', label: 'HT', color: '#fb923c', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.75, muted: false, note: 'A1' },
      { id: 'tr909_cymbal', synthType: 'metal', label: 'CC', color: '#34d399', steps: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })), volume: 0.6, muted: false, note: 'C#2' },
    ])
    currentState = { ...mockState, tracks: tr909Tracks }

    render(
      <MachinePanel
        kitId="tr909"
        onPadTrigger={onPadTrigger}
        onPlay={onPlay}
        onStop={onStop}
      />
    )
    expect(screen.getAllByText('TR-909').length).toBeGreaterThan(0)
  })
})
