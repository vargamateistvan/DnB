import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import type { TrackId } from '../types'

type PitchedSynth = Tone.MembraneSynth | Tone.Synth
type UnpitchedSynth = Tone.NoiseSynth | Tone.MetalSynth
type AnyToneSynth = PitchedSynth | UnpitchedSynth

function isUnpitched(s: AnyToneSynth): s is UnpitchedSynth {
  return s instanceof Tone.NoiseSynth || s instanceof Tone.MetalSynth
}

function buildSynthKit(): Record<TrackId, AnyToneSynth> {
  return {
    kick: new Tone.MembraneSynth({
      pitchDecay: 0.06, octaves: 8,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
    }),
    snare: new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    }),
    hihat_closed: new Tone.MetalSynth({
      frequency: 600, envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
    }),
    hihat_open: new Tone.MetalSynth({
      frequency: 600, envelope: { attack: 0.001, decay: 0.4, release: 0.1 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
    }),
    clap: new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
    }),
    rim: new Tone.MetalSynth({
      frequency: 800, envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 16, resonance: 5000, octaves: 1.5,
    }),
    tom_lo: new Tone.MembraneSynth({
      pitchDecay: 0.08, octaves: 4,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
    }),
    tom_hi: new Tone.MembraneSynth({
      pitchDecay: 0.06, octaves: 4,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
    }),
    cymbal: new Tone.MetalSynth({
      frequency: 300, envelope: { attack: 0.001, decay: 1.2, release: 0.3 },
      harmonicity: 5.1, modulationIndex: 64, resonance: 4000, octaves: 1.5,
    }),
    bass: new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.6, sustain: 0.1, release: 0.3 },
    }),
  }
}

const TRIGGER_NOTES: Partial<Record<TrackId, string>> = {
  kick: 'C1', tom_lo: 'E1', tom_hi: 'A1', bass: 'C2',
}

function triggerSynth(synth: AnyToneSynth, trackId: TrackId, time: number, velocity: number) {
  const note = TRIGGER_NOTES[trackId] ?? 'C2'
  if (isUnpitched(synth)) {
    synth.triggerAttackRelease('16n', time, velocity)
  } else {
    synth.triggerAttackRelease(note, '16n', time, velocity)
  }
}

export function useAudioEngine() {
  const synthsRef = useRef<Record<TrackId, AnyToneSynth> | null>(null)
  const channelsRef = useRef<Partial<Record<TrackId, Tone.Channel>>>({})
  const seqRef = useRef<Tone.Sequence | null>(null)
  const masterRef = useRef<Tone.Compressor | null>(null)
  // Tap node: compressor → tap → reverb → destination, recorder also connects to tap
  const tapRef = useRef<Tone.Gain | null>(null)

  const tracks = useSequencerStore((s) => s.tracks)
  const bpm = useSequencerStore((s) => s.bpm)
  const swing = useSequencerStore((s) => s.swing)
  const stepCount = useSequencerStore((s) => s.stepCount)
  const setCurrentStep = useSequencerStore((s) => s.setCurrentStep)
  const setPlaying = useSequencerStore((s) => s.setPlaying)

  useEffect(() => {
    const master = new Tone.Compressor(-6, 4)
    const tap = new Tone.Gain(1)
    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.12 })
    master.connect(tap)
    tap.connect(reverb)
    reverb.toDestination()
    masterRef.current = master
    tapRef.current = tap

    const synths = buildSynthKit()
    synthsRef.current = synths

    const ids = Object.keys(synths) as TrackId[]
    ids.forEach((id) => {
      const ch = new Tone.Channel({ volume: 0 }).connect(master)
      channelsRef.current[id] = ch
      synths[id].connect(ch)
    })

    return () => {
      seqRef.current?.dispose()
      master.dispose()
      tap.dispose()
      reverb.dispose()
      ids.forEach((id) => {
        synths[id].dispose()
        channelsRef.current[id]?.dispose()
      })
    }
  }, [])

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm
  }, [bpm])

  useEffect(() => {
    Tone.getTransport().swing = swing
    Tone.getTransport().swingSubdivision = '16n'
  }, [swing])

  useEffect(() => {
    tracks.forEach((track) => {
      const ch = channelsRef.current[track.id]
      if (!ch) return
      ch.mute = track.muted
      ch.volume.value = Tone.gainToDb(Math.max(0.0001, track.volume))
    })
  }, [tracks])

  useEffect(() => {
    seqRef.current?.dispose()
    const steps = Array.from({ length: stepCount }, (_, i) => i)

    seqRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step as number)
        const state = useSequencerStore.getState()
        state.tracks.forEach((track) => {
          if (track.muted) return
          const s = track.steps[step as number]
          if (!s?.active) return
          const synth = synthsRef.current?.[track.id]
          if (!synth) return
          triggerSynth(synth, track.id, time, s.velocity)
        })
      },
      steps,
      '16n'
    )

    if (Tone.getTransport().state === 'started') {
      seqRef.current.start(0)
    }
  }, [stepCount, setCurrentStep])

  const play = useCallback(async () => {
    await Tone.start()
    seqRef.current?.start(0)
    Tone.getTransport().start()
    setPlaying(true)
  }, [setPlaying])

  const stop = useCallback(() => {
    Tone.getTransport().stop()
    seqRef.current?.stop()
    setCurrentStep(0)
    setPlaying(false)
  }, [setPlaying, setCurrentStep])

  const triggerPad = useCallback((trackId: TrackId) => {
    const synth = synthsRef.current?.[trackId]
    if (!synth) return
    triggerSynth(synth, trackId, Tone.now(), 0.85)
  }, [])

  const connectToRecorder = useCallback((recorder: Tone.Recorder) => {
    tapRef.current?.connect(recorder)
  }, [])

  return { play, stop, triggerPad, connectToRecorder }
}
