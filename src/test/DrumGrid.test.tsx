import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DrumGrid } from '../components/DrumGrid'
import { mockState, mockTracks } from './mocks/store'
import type { Track } from '../types'

vi.mock('tone', () => import('./mocks/tone'))

// Mutable state reference so individual tests can override it
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

function makeTracksWithActiveKickStep(): Track[] {
  return mockTracks.map((t) =>
    t.id === 'tr808_kick'
      ? { ...t, steps: [{ active: true, velocity: 0.8 }, ...t.steps.slice(1)] }
      : t
  )
}

// Helper: get step buttons (buttons with no text content)
function getStepButtons() {
  return screen.getAllByRole('button').filter((btn) => {
    const text = btn.textContent?.trim() ?? ''
    return text === ''
  })
}

beforeEach(() => {
  currentState = { ...mockState }
  vi.clearAllMocks()
})

describe('DrumGrid', () => {
  it('renders track pad labels BD, SD, CH', () => {
    render(<DrumGrid kitId="tr808" onPadTrigger={onPadTrigger} />)
    expect(screen.getByText('BD')).toBeInTheDocument()
    expect(screen.getByText('SD')).toBeInTheDocument()
    expect(screen.getByText('CH')).toBeInTheDocument()
  })

  it('clicking an inactive step calls toggleStep with correct trackId', () => {
    const toggleStep = vi.fn()
    currentState = { ...mockState, toggleStep }

    render(<DrumGrid kitId="tr808" onPadTrigger={onPadTrigger} />)

    const stepButtons = getStepButtons()
    expect(stepButtons.length).toBeGreaterThan(0)
    fireEvent.click(stepButtons[0])
    expect(toggleStep).toHaveBeenCalled()

    // The first track is tr808_kick (id: 'tr808_kick'), step index 0
    const [trackId, stepIndex] = toggleStep.mock.calls[0] as [string, number]
    expect(trackId).toBe('tr808_kick')
    expect(stepIndex).toBe(0)
  })

  it('clicking an active step also calls toggleStep', () => {
    const toggleStep = vi.fn()
    currentState = {
      ...mockState,
      toggleStep,
      tracks: makeTracksWithActiveKickStep(),
    }

    render(<DrumGrid kitId="tr808" onPadTrigger={onPadTrigger} />)

    const stepButtons = getStepButtons()
    fireEvent.click(stepButtons[0])
    expect(toggleStep).toHaveBeenCalled()
  })

  it('right-clicking an active step shows VELOCITY and PROB % sliders in popover', () => {
    currentState = {
      ...mockState,
      tracks: makeTracksWithActiveKickStep(),
    }

    render(<DrumGrid kitId="tr808" onPadTrigger={onPadTrigger} />)

    const stepButtons = getStepButtons()
    // Step 0 of kick is active — right-click should open popover
    fireEvent.contextMenu(stepButtons[0])

    expect(screen.getByText('VELOCITY')).toBeInTheDocument()
    expect(screen.getByText('PROB %')).toBeInTheDocument()
  })
})
