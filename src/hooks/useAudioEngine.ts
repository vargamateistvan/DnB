import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import { buildKit } from '../kits'
import type { AnyToneSynth } from '../kits'
import type { SynthType } from '../types'

function isUnpitched(s: AnyToneSynth): s is Tone.NoiseSynth | Tone.MetalSynth {
  return s instanceof Tone.NoiseSynth || s instanceof Tone.MetalSynth
}

const TRIGGER_NOTES: Record<string, string> = {
  tr808_kick: 'C1', tr808_tom_lo: 'E1', tr808_tom_hi: 'A1', tr808_cowbell: 'G#1',
  tr909_kick: 'C1', tr909_tom_lo: 'E1', tr909_tom_hi: 'A1',
  tr606_kick: 'C1', tr606_tom_lo: 'E1', tr606_tom_hi: 'A1',
  tr707_kick: 'C1', tr707_tom_lo: 'E1', tr707_tom_hi: 'A1',
  tb303_bass: 'C2', sh101_bass: 'C2',
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
        envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
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

const BASE_TRACK_IDS: string[] = [
  'tr808_kick','tr808_snare','tr808_hihat_closed','tr808_hihat_open','tr808_clap',
  'tr808_rim','tr808_tom_lo','tr808_tom_hi','tr808_cymbal','tr808_cowbell',
  'tr909_kick','tr909_snare','tr909_hihat_closed','tr909_hihat_open','tr909_clap',
  'tr909_rim','tr909_tom_lo','tr909_tom_hi','tr909_cymbal',
  'tr606_kick','tr606_snare','tr606_hihat_closed','tr606_hihat_open','tr606_clap',
  'tr606_rim','tr606_tom_lo','tr606_tom_hi','tr606_cymbal',
  'tr707_kick','tr707_snare','tr707_hihat_closed','tr707_hihat_open','tr707_clap',
  'tr707_rim','tr707_tom_lo','tr707_tom_hi','tr707_cymbal',
  'tb303_bass','sh101_bass',
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
  const maxStepCount = Math.max(...tracks.map((t) => t.steps.length), 16)
  const machineParams = useSequencerStore((s) => s.machineParams)
  const setCurrentStep = useSequencerStore((s) => s.setCurrentStep)
  const setPlaying = useSequencerStore((s) => s.setPlaying)

  // ── Init: master chain + all per-kit synths ──────────────────────────────
  useEffect(() => {
    const master = new Tone.Compressor(-6, 4)
    const tap = new Tone.Gain(1)
    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.12 })
    master.connect(tap)
    tap.connect(reverb)
    reverb.toDestination()
    masterRef.current = master
    tapRef.current = tap

    // Build every kit's synths once — each machine has its own fixed set
    const allKits: string[] = ['tr808','tr909','tr606','tr707','tb303','sh101']
    allKits.forEach((kit) => {
      const synths = buildKit(kit as Parameters<typeof buildKit>[0])
      Object.entries(synths).forEach(([id, synth]) => {
        const ch = new Tone.Channel({ volume: 0 }).connect(master)
        channelsRef.current[id] = ch
        synthsRef.current[id] = synth
        synth.connect(ch)
      })
    })

    return () => {
      master.dispose()
      tap.dispose()
      reverb.dispose()
      Object.values(synthsRef.current).forEach((s) => { s.disconnect(); s.dispose() })
      Object.values(channelsRef.current).forEach((ch) => ch.dispose())
      synthsRef.current = {}
      channelsRef.current = {}
    }
  }, [])

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
      if (BASE_TRACK_IDS.includes(id)) return
      synthsRef.current[id]?.disconnect()
      synthsRef.current[id]?.dispose()
      delete synthsRef.current[id]
      channelsRef.current[id]?.dispose()
      delete channelsRef.current[id]
    })
  }, [tracks])

  // ── Machine params → TB-303 / SH-101 MonoSynths ──────────────────────────
  useEffect(() => {
    const tb303 = synthsRef.current['tb303_bass']
    if (tb303 instanceof Tone.MonoSynth) {
      const p = machineParams.tb303
      tb303.filter.frequency.value = 100 + p.cutoff * 7900
      tb303.filter.Q.value = 1 + p.resonance * 19
      tb303.filterEnvelope.octaves = p.envMod * 5
      tb303.filterEnvelope.decay = 0.05 + p.decay * 1.95
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tb303.oscillator.type = p.waveform as any
    }
    const sh101 = synthsRef.current['sh101_bass']
    if (sh101 instanceof Tone.MonoSynth) {
      const p = machineParams.sh101
      sh101.filter.frequency.value = 80 + p.vcfFreq * 7920
      sh101.filter.Q.value = 1 + p.vcfRes * 11
      sh101.filterEnvelope.octaves = p.vcfEnv * 3
      sh101.portamento = p.portamento * 0.5
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sh101.oscillator.type = p.waveform as any
    }
  }, [machineParams])

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
    const steps = Array.from({ length: maxStepCount }, (_, i) => i)

    seqRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step as number)
        const state = useSequencerStore.getState()
        state.tracks.forEach((track) => {
          if (track.muted) return
          const s = track.steps[(step as number) % track.steps.length]
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
  }, [maxStepCount, setCurrentStep])

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
