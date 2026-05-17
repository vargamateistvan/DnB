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
    const webmBlob = await recorderRef.current.stop()
    recorderRef.current.dispose()
    recorderRef.current = null

    const arrayBuffer = await webmBlob.arrayBuffer()
    const audioCtx = new AudioContext()
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)
    audioCtx.close()

    const numChannels = decoded.numberOfChannels
    const sampleRate = decoded.sampleRate
    const numSamples = decoded.length
    const blockAlign = numChannels * 2
    const dataSize = numSamples * blockAlign
    const buf = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buf)
    const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
    w(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); w(8, 'WAVE')
    w(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true)
    view.setUint16(34, 16, true)
    w(36, 'data'); view.setUint32(40, dataSize, true)
    let offset = 44
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, decoded.getChannelData(ch)[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
        offset += 2
      }
    }
    downloadBlob(new Blob([buf], { type: 'audio/wav' }), 'dnb-loop.wav')
  }, [])

  return { exportMidi, startRecording, stopRecording }
}
