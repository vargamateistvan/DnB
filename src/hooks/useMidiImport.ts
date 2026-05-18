import { useCallback } from 'react'
import { Midi } from '@tonejs/midi'
import { useSequencerStore } from '../store/sequencerStore'
import type { Track, Step, SynthType } from '../types'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[midi % 12]}${octave}`
}

function snapStepCount(maxStep: number): 16 | 32 | 64 | 128 {
  if (maxStep <= 15) return 16
  if (maxStep <= 31) return 32
  if (maxStep <= 63) return 64
  return 128
}

function guessSynthType(name: string): SynthType {
  const n = name.toLowerCase()
  if (n.includes('kick') || n.includes('bd') || n.includes('bass drum') || n.includes('tom')) return 'membrane'
  if (n.includes('snare') || n.includes('sd') || n.includes('clap')) return 'noise'
  if (n.includes('hat') || n.includes('cymbal') || n.includes('rim') || n.includes('cowbell')) return 'metal'
  if (n.includes('bass') || n.includes('303') || n.includes('101') || n.includes('synth')) return 'mono'
  return 'membrane'
}

const GM_DRUMS: Record<number, { label: string; synthType: SynthType; note: string }> = {
  35: { label: 'BD2', synthType: 'membrane', note: 'C1' },
  36: { label: 'BD',  synthType: 'membrane', note: 'C1' },
  37: { label: 'RS',  synthType: 'metal',    note: 'C#1' },
  38: { label: 'SD',  synthType: 'noise',    note: 'D1' },
  39: { label: 'CP',  synthType: 'noise',    note: 'E1' },
  40: { label: 'SD2', synthType: 'noise',    note: 'D1' },
  41: { label: 'LT',  synthType: 'membrane', note: 'G1' },
  42: { label: 'CH',  synthType: 'metal',    note: 'F#1' },
  43: { label: 'LT2', synthType: 'membrane', note: 'G1' },
  44: { label: 'CH2', synthType: 'metal',    note: 'G#1' },
  45: { label: 'MT',  synthType: 'membrane', note: 'A1' },
  46: { label: 'OH',  synthType: 'metal',    note: 'A#1' },
  47: { label: 'MT2', synthType: 'membrane', note: 'A1' },
  48: { label: 'HT',  synthType: 'membrane', note: 'A1' },
  49: { label: 'CY',  synthType: 'metal',    note: 'C#2' },
  50: { label: 'HT2', synthType: 'membrane', note: 'B1' },
  51: { label: 'RC',  synthType: 'metal',    note: 'D#2' },
  56: { label: 'CB',  synthType: 'metal',    note: 'G#1' },
}

const IMPORT_COLORS = [
  '#f472b6', '#818cf8', '#2dd4bf', '#fb7185',
  '#facc15', '#a78bfa', '#4ade80', '#38bdf8',
  '#f97316', '#84cc16', '#22d3ee', '#e879f9',
]

function emptySteps(count: number): Step[] {
  return Array.from({ length: count }, () => ({ active: false, velocity: 0.8 }))
}

function padSteps(steps: Step[], targetCount: 16 | 32 | 64 | 128): Step[] {
  if (steps.length >= targetCount) return steps.slice(0, targetCount)
  return [...steps, ...emptySteps(targetCount - steps.length)]
}

export interface ImportResult {
  tracks: Track[]
  bpm: number
  stepCount: 16 | 32 | 64 | 128
}

function parseMidi(buffer: ArrayBuffer): ImportResult {
  const midi = new Midi(buffer)
  const bpm = Math.round(midi.header.tempos[0]?.bpm ?? 120)
  const stepSec = 60 / bpm / 4

  const importedTracks: Track[] = []
  let colorIdx = 0

  for (const midiTrack of midi.tracks) {
    if (midiTrack.notes.length === 0) continue

    // GM percussion channel (0-indexed channel 9)
    const isPercussion = midiTrack.channel === 9

    if (isPercussion) {
      // Group notes by MIDI pitch — each pitch becomes a sequencer track
      const byPitch = new Map<number, { time: number; velocity: number }[]>()
      for (const note of midiTrack.notes) {
        const bucket = byPitch.get(note.midi) ?? []
        bucket.push({ time: note.time, velocity: note.velocity })
        byPitch.set(note.midi, bucket)
      }

      for (const [pitch, notes] of byPitch) {
        const maxStep = Math.max(...notes.map((n) => Math.round(n.time / stepSec)))
        const stepCount = snapStepCount(maxStep)
        const steps = emptySteps(stepCount)
        for (const { time, velocity } of notes) {
          const si = Math.round(time / stepSec)
          if (si < stepCount) steps[si] = { active: true, velocity }
        }
        const info = GM_DRUMS[pitch] ?? {
          label: `P${pitch}`,
          synthType: 'membrane' as SynthType,
          note: midiToNoteName(pitch),
        }
        importedTracks.push({
          id: `import_${Date.now()}_${pitch}`,
          synthType: info.synthType,
          label: info.label,
          color: IMPORT_COLORS[colorIdx++ % IMPORT_COLORS.length],
          steps,
          volume: 0.8,
          muted: false,
          note: info.note,
          custom: true,
        })
      }
    } else {
      // Melodic track: per-step note overrides
      const name = midiTrack.name || `TRK${importedTracks.length + 1}`
      const maxStep = Math.max(...midiTrack.notes.map((n) => Math.round(n.time / stepSec)))
      const stepCount = snapStepCount(maxStep)
      const steps = emptySteps(stepCount)
      let defaultNote = 'C2'
      for (const note of midiTrack.notes) {
        const si = Math.round(note.time / stepSec)
        if (si >= stepCount) continue
        const noteName = midiToNoteName(note.midi)
        defaultNote = noteName
        steps[si] = { active: true, velocity: note.velocity, note: noteName }
      }
      importedTracks.push({
        id: `import_${Date.now()}_${midiTrack.channel}`,
        synthType: guessSynthType(name),
        label: name.slice(0, 4).toUpperCase(),
        color: IMPORT_COLORS[colorIdx++ % IMPORT_COLORS.length],
        steps,
        volume: 0.8,
        muted: false,
        note: defaultNote,
        custom: true,
      })
    }
  }

  // Align all tracks to the same (longest) step count
  const maxSteps = importedTracks.reduce((m, t) => Math.max(m, t.steps.length), 0)
  const finalStepCount = snapStepCount(Math.max(maxSteps - 1, 0))

  const tracks = importedTracks.map((t) => ({
    ...t,
    steps: padSteps(t.steps, finalStepCount),
  }))

  return { tracks, bpm, stepCount: finalStepCount }
}

export function useMidiImport() {
  const importMidi = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.mid,.midi'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const buffer = await file.arrayBuffer()
        const result = parseMidi(buffer)
        if (result.tracks.length === 0) return
        useSequencerStore.getState().loadState({
          tracks: result.tracks,
          bpm: result.bpm,
          stepCount: result.stepCount,
          mutedKits: [],
          trackKits: {},
        })
      } catch (err) {
        console.error('MIDI import failed', err)
      }
    }
    input.click()
  }, [])

  return { importMidi }
}
