import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import { buildKit } from '../kits'
import type { AnyToneSynth } from '../kits'
import type { TrackId, SynthType } from '../types'

function isUnpitched(s: AnyToneSynth): s is Tone.NoiseSynth | Tone.MetalSynth {
  return s instanceof Tone.NoiseSynth || s instanceof Tone.MetalSynth
}

const TRIGGER_NOTES: Record<string, string> = {
  kick: 'C1', tom_lo: 'E1', tom_hi: 'A1', bass: 'C2',
}

function triggerSynth(synth: AnyToneSynth, trackId: string, time: number, velocity: number, stepNote?: string) {
  const note = stepNote ?? TRIGGER_NOTES[trackId] ?? 'C2'
  if (isUnpitched(synth)) {
    synth.triggerAttackRelease('16n', time, velocity)
  } else {
    synth.triggerAttackRelease(note, '16n', time, velocity)
  }
}

function buildCustomSynth(synthType: SynthType): AnyToneSynth {
  switch (synthType) {
    case 'membrane':
      return new Tone.MembraneSynth({
        pitchDecay: 0.06, octaves: 7,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.35 },
      })
    case 'noise':
      return new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
      })
    case 'metal':
      return new Tone.MetalSynth({
        frequency: 600, envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
        harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
      })
    case 'mono':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', rolloff: -24, Q: 6 },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.05, release: 0.2 },
        filterEnvelope: { attack: 0.001, decay: 0.4, sustain: 0.05, release: 0.2, baseFrequency: 100, octaves: 4, exponent: 3 },
      })
    case 'synth':
    default:
      return new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.6, sustain: 0.1, release: 0.3 },
      })
  }
}

const BASE_TRACK_IDS: TrackId[] = [
  'kick', 'snare', 'hihat_closed', 'hihat_open', 'clap',
  'rim', 'tom_lo', 'tom_hi', 'cymbal', 'bass',
]

export function useAudioEngine() {
  const synthsRef = useRef<Record<string, AnyToneSynth>>({})
  const channelsRef = useRef<Record<string, Tone.Channel>>({})
  const seqRef = useRef<Tone.Sequence | null>(null)
  const masterRef = useRef<Tone.Compressor | null>(null)
  const tapRef = useRef<Tone.Gain | null>(null)

  const tracks = useSequencerStore((s) => s.tracks)
  const bpm = useSequencerStore((s) => s.bpm)
  const swing = useSequencerStore((s) => s.swing)
  const stepCount = useSequencerStore((s) => s.stepCount)
  const kitId = useSequencerStore((s) => s.kit)
  const machineParams = useSequencerStore((s) => s.machineParams)
  const setCurrentStep = useSequencerStore((s) => s.setCurrentStep)
  const setPlaying = useSequencerStore((s) => s.setPlaying)

  // ── Init: master chain + channels for all base tracks ────────────────────
  useEffect(() => {
    const master = new Tone.Compressor(-6, 4)
    const tap = new Tone.Gain(1)
    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.12 })
    master.connect(tap)
    tap.connect(reverb)
    reverb.toDestination()
    masterRef.current = master
    tapRef.current = tap

    BASE_TRACK_IDS.forEach((id) => {
      const ch = new Tone.Channel({ volume: 0 }).connect(master)
      channelsRef.current[id] = ch
    })

    return () => {
      master.dispose()
      tap.dispose()
      reverb.dispose()
      Object.values(channelsRef.current).forEach((ch) => ch.dispose())
      channelsRef.current = {}
    }
  }, [])

  // ── Kit swap: rebuild base 10 synths ─────────────────────────────────────
  useEffect(() => {
    BASE_TRACK_IDS.forEach((id) => {
      synthsRef.current[id]?.disconnect()
      synthsRef.current[id]?.dispose()
    })

    const kitSynths = buildKit(kitId)
    BASE_TRACK_IDS.forEach((id) => {
      synthsRef.current[id] = kitSynths[id]
      const ch = channelsRef.current[id]
      if (ch) kitSynths[id].connect(ch)
    })

    return () => {
      BASE_TRACK_IDS.forEach((id) => {
        synthsRef.current[id]?.disconnect()
        synthsRef.current[id]?.dispose()
      })
    }
  }, [kitId])

  // ── Dynamic track sync: add/remove custom track synths ───────────────────
  useEffect(() => {
    const storeIds = new Set(tracks.map((t) => t.id))
    const audioIds = new Set(Object.keys(channelsRef.current))

    // Create channel + synth for newly added tracks
    tracks.forEach((track) => {
      if (audioIds.has(track.id)) return
      const master = masterRef.current
      if (!master) return
      const ch = new Tone.Channel({ volume: 0 }).connect(master)
      channelsRef.current[track.id] = ch
      const synth = buildCustomSynth(track.synthType)
      synthsRef.current[track.id] = synth
      synth.connect(ch)
    })

    // Destroy synth + channel for removed tracks (skip base tracks)
    audioIds.forEach((id) => {
      if (storeIds.has(id)) return
      if (BASE_TRACK_IDS.includes(id as TrackId)) return
      synthsRef.current[id]?.disconnect()
      synthsRef.current[id]?.dispose()
      delete synthsRef.current[id]
      channelsRef.current[id]?.dispose()
      delete channelsRef.current[id]
    })
  }, [tracks])

  // ── Machine params → bass MonoSynth (TB-303 / SH-101) ────────────────────
  useEffect(() => {
    const synth = synthsRef.current['bass']
    if (!(synth instanceof Tone.MonoSynth)) return

    if (kitId === 'tb303') {
      const p = machineParams.tb303
      synth.filter.frequency.value = 100 + p.cutoff * 7900
      synth.filter.Q.value = 1 + p.resonance * 19
      synth.filterEnvelope.octaves = p.envMod * 5
      synth.filterEnvelope.decay = 0.05 + p.decay * 1.95
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      synth.oscillator.type = p.waveform as any
    } else if (kitId === 'sh101') {
      const p = machineParams.sh101
      synth.filter.frequency.value = 80 + p.vcfFreq * 7920
      synth.filter.Q.value = 1 + p.vcfRes * 11
      synth.filterEnvelope.octaves = p.vcfEnv * 3
      synth.portamento = p.portamento * 0.5
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      synth.oscillator.type = p.waveform as any
    }
  }, [kitId, machineParams])

  // ── BPM / Swing ───────────────────────────────────────────────────────────
  useEffect(() => { Tone.getTransport().bpm.value = bpm }, [bpm])
  useEffect(() => {
    Tone.getTransport().swing = swing
    Tone.getTransport().swingSubdivision = '16n'
  }, [swing])

  // ── Channel volumes / mutes ───────────────────────────────────────────────
  useEffect(() => {
    tracks.forEach((track) => {
      const ch = channelsRef.current[track.id]
      if (!ch) return
      ch.mute = track.muted
      ch.volume.value = Tone.gainToDb(Math.max(0.0001, track.volume))
    })
  }, [tracks])

  // ── Sequence ──────────────────────────────────────────────────────────────
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
          const synth = synthsRef.current[track.id]
          if (!synth) return
          triggerSynth(synth, track.id, time, s.velocity, s.note)
        })
      },
      steps,
      '16n'
    )

    if (Tone.getTransport().state === 'started') seqRef.current.start(0)
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

  const triggerPad = useCallback((trackId: string) => {
    const synth = synthsRef.current[trackId]
    if (!synth) return
    triggerSynth(synth, trackId, Tone.now(), 0.85)
  }, [])

  const connectToRecorder = useCallback((recorder: Tone.Recorder) => {
    tapRef.current?.connect(recorder)
  }, [])

  return { play, stop, triggerPad, connectToRecorder }
}
