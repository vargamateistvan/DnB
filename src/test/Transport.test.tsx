import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Transport } from '../components/Transport'
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
    startRecording: vi.fn().mockResolvedValue(undefined),
    stopRecording: vi.fn().mockResolvedValue(undefined),
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

const onPlay = vi.fn()
const onStop = vi.fn()
// connectToRecorder receives a Tone.Recorder — stub it as any
const connectToRecorder = vi.fn()

beforeEach(() => {
  currentState = { ...mockState }
  vi.clearAllMocks()
})

describe('Transport', () => {
  it('renders play button (▶) when not playing', () => {
    currentState = { ...mockState, isPlaying: false }
    render(
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        connectToRecorder={connectToRecorder}
      />
    )
    // The play/stop button shows ▶ when stopped; both layouts render it so there will be 2
    const playBtns = screen.getAllByText('▶')
    expect(playBtns.length).toBeGreaterThan(0)
  })

  it('renders stop button (■) when playing', () => {
    currentState = { ...mockState, isPlaying: true }
    render(
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        connectToRecorder={connectToRecorder}
      />
    )
    const stopBtns = screen.getAllByText('■')
    expect(stopBtns.length).toBeGreaterThan(0)
  })

  it('renders BPM slider (input type=range)', () => {
    render(
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        connectToRecorder={connectToRecorder}
      />
    )
    const ranges = document.querySelectorAll('input[type="range"]')
    expect(ranges.length).toBeGreaterThan(0)
  })

  it('TAP button is present', () => {
    render(
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        connectToRecorder={connectToRecorder}
      />
    )
    const tapBtns = screen.getAllByText('TAP')
    expect(tapBtns.length).toBeGreaterThan(0)
  })

  it('clicking play button calls onPlay prop', () => {
    currentState = { ...mockState, isPlaying: false }
    render(
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        connectToRecorder={connectToRecorder}
      />
    )
    const playBtns = screen.getAllByText('▶')
    fireEvent.click(playBtns[0])
    expect(onPlay).toHaveBeenCalled()
  })

  it('clicking stop button calls onStop prop when playing', () => {
    currentState = { ...mockState, isPlaying: true }
    render(
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        connectToRecorder={connectToRecorder}
      />
    )
    const stopBtns = screen.getAllByText('■')
    fireEvent.click(stopBtns[0])
    expect(onStop).toHaveBeenCalled()
  })

  it('BPM slider has the correct value from store', () => {
    currentState = { ...mockState, bpm: 174 }
    render(
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        connectToRecorder={connectToRecorder}
      />
    )
    const ranges = document.querySelectorAll('input[type="range"]')
    // The first range input should be BPM
    const bpmSlider = Array.from(ranges).find(
      (el) => (el as HTMLInputElement).min === '60' && (el as HTMLInputElement).max === '220'
    ) as HTMLInputElement | undefined
    expect(bpmSlider).toBeDefined()
    expect(bpmSlider?.value).toBe('174')
  })
})
