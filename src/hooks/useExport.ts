import { useCallback, useRef } from 'react'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'
import { useSequencerStore } from '../store/sequencerStore'

function noteNameToMidi(name: string): number {
  const semitones: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
    'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  }
  const match = name.match(/^([A-G]#?)(\d)$/)
  if (!match) return 36
  return (parseInt(match[2]) + 1) * 12 + (semitones[match[1]] ?? 0)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useExport(connectToRecorder: (recorder: Tone.Recorder) => void) {
  const recorderRef = useRef<Tone.Recorder | null>(null)

  const exportMidi = useCallback(() => {
    const { tracks, bpm } = useSequencerStore.getState()
    const midi = new Midi()
    midi.header.setTempo(bpm)
    const stepSec = 60 / bpm / 4

    tracks.forEach((track) => {
      const midiTrack = midi.addTrack()
      midiTrack.name = track.label
      track.steps.forEach((step, i) => {
        if (!step.active) return
        const midiNote = noteNameToMidi(step.note ?? track.note)
        midiTrack.addNote({
          midi: midiNote,
          time: i * stepSec,
          duration: stepSec * 0.9,
          velocity: step.velocity,
        })
      })
    })

    const blob = new Blob([Uint8Array.from(midi.toArray())], { type: 'audio/midi' })
    downloadBlob(blob, 'dnb-pattern.mid')
  }, [])

  const startRecording = useCallback(async () => {
    const recorder = new Tone.Recorder()
    connectToRecorder(recorder)
    await recorder.start()
    recorderRef.current = recorder
  }, [connectToRecorder])

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return
    const blob = await recorderRef.current.stop()
    recorderRef.current.dispose()
    recorderRef.current = null
    downloadBlob(blob, 'dnb-loop.webm')
  }, [])

  return { exportMidi, startRecording, stopRecording }
}
