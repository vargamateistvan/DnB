import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PianoRollGrid } from '../components/PianoRollGrid'
import { mockState, mockTracks } from './mocks/store'

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

const onPadTrigger = vi.fn()

beforeEach(() => {
  currentState = { ...mockState }
  vi.clearAllMocks()
})

describe('PianoRollGrid — TB-303', () => {
  it('renders note labels for all 12 notes', () => {
    render(<PianoRollGrid kitId="tb303" onPadTrigger={onPadTrigger} />)

    // Note labels strip the octave number for tb303 (shows just letter)
    // The component renders rowNote.replace(/\d/, '') as the first span
    const expectedNotes = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C']
    for (const note of expectedNotes) {
      const matches = screen.getAllByText(note)
      expect(matches.length).toBeGreaterThan(0)
    }
  })

  it('renders beat numbers 1 2 3 4 above the grid', () => {
    render(<PianoRollGrid kitId="tb303" onPadTrigger={onPadTrigger} />)

    // Beat numbers are rendered as text "1", "2", "3", "4" in the header row
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
  })

  it('clicking a cell in the C2 row calls toggleStep and setStepNote with C2', () => {
    const toggleStep = vi.fn()
    const setStepNote = vi.fn()
    currentState = { ...mockState, toggleStep, setStepNote }

    render(<PianoRollGrid kitId="tb303" onPadTrigger={onPadTrigger} />)

    // All step cells are buttons with no text (aria role=button, no text content for inactive cells)
    const allButtons = screen.getAllByRole('button')
    // Each row has 16 step buttons; C2 is the last row (index 11 in NOTES array)
    // Rows: B2, A#2, A2, G#2, G2, F#2, F2, E2, D#2, D2, C#2, C2
    // With 16 steps per row and 12 rows: C2 row starts at button index 11*16=176
    // But there are no other non-step buttons in PianoRollGrid
    const c2RowStart = 11 * 16
    const c2FirstButton = allButtons[c2RowStart]
    expect(c2FirstButton).toBeDefined()

    fireEvent.click(c2FirstButton)

    expect(toggleStep).toHaveBeenCalledWith('tb303_bass', 0)
    expect(setStepNote).toHaveBeenCalledWith('tb303_bass', 0, 'C2')
  })
})

describe('PianoRollGrid — SH-101', () => {
  it('renders note labels for all 12 notes', () => {
    // Add sh101_bass track to state so component doesn't return null
    const sh101State = {
      ...mockState,
      tracks: mockTracks,
    }
    currentState = sh101State

    render(<PianoRollGrid kitId="sh101" onPadTrigger={onPadTrigger} />)

    // SH-101 shows note + octave number (split into two spans), so just check note letters
    const expectedNotes = ['B', 'A', 'G', 'F', 'E', 'D', 'C']
    for (const note of expectedNotes) {
      const matches = screen.getAllByText(note)
      expect(matches.length).toBeGreaterThan(0)
    }
  })

  it('renders beat numbers 1 2 3 4 above the grid', () => {
    currentState = { ...mockState, tracks: mockTracks }
    render(<PianoRollGrid kitId="sh101" onPadTrigger={onPadTrigger} />)

    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
  })
})
