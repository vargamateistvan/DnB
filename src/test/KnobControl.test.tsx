import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KnobControl } from '../components/KnobControl'

vi.mock('tone', () => import('./mocks/tone'))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('KnobControl', () => {
  it('renders SVG with correct label text', () => {
    const onChange = vi.fn()
    render(<KnobControl value={0.5} label="CUTOFF" onChange={onChange} />)
    expect(screen.getByText('CUTOFF')).toBeInTheDocument()
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('mouse drag calls onChange with a new value', () => {
    const onChange = vi.fn()
    render(<KnobControl value={0.5} label="VOLUME" onChange={onChange} />)

    const svg = document.querySelector('svg')

    fireEvent.mouseDown(svg, { clientY: 100 })
    fireEvent.mouseMove(globalThis, { clientY: 40 })

    expect(onChange).toHaveBeenCalled()
    const calledWith = (onChange.mock.calls[0] as [number])[0]
    expect(typeof calledWith).toBe('number')
    expect(calledWith).toBeGreaterThanOrEqual(0)
    expect(calledWith).toBeLessThanOrEqual(1)

    fireEvent.mouseUp(globalThis)
  })

  it('drag upward increases the value above the starting value', () => {
    const onChange = vi.fn()
    render(<KnobControl value={0.5} label="RES" onChange={onChange} />)
    const svg = document.querySelector('svg')

    fireEvent.mouseDown(svg, { clientY: 100 })
    fireEvent.mouseMove(globalThis, { clientY: 40 })

    const calledWith = (onChange.mock.calls[0] as [number])[0]
    expect(calledWith).toBeGreaterThan(0.5)

    fireEvent.mouseUp(globalThis)
  })

  it('clamps value to max 1', () => {
    const onChange = vi.fn()
    render(<KnobControl value={0.9} label="GAIN" onChange={onChange} />)
    const svg = document.querySelector('svg')

    fireEvent.mouseDown(svg, { clientY: 100 })
    fireEvent.mouseMove(globalThis, { clientY: -9999 })

    const calledWith = (onChange.mock.calls[0] as [number])[0]
    expect(calledWith).toBeLessThanOrEqual(1)

    fireEvent.mouseUp(globalThis)
  })
})
