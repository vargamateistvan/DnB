import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import { buildKit } from '../kits'
import type { AnyToneSynth } from '../kits'
import type { SynthType, MachineParams } from '../types'

function isUnpitched(s: AnyToneSynth): s is Tone.NoiseSynth | Tone.MetalSynth {
  return s instanceof Tone.NoiseSynth || s instanceof Tone.MetalSynth
}

function noteOneOctaveDown(note: string): string {
  const m = /^([A-G]#?)(-?\d+)$/.exec(note)
  if (!m) return note
  const oct = Number.parseInt(m[2]) - 1
  return oct < 0 ? note : `${m[1]}${oct}`
}

const TRIGGER_NOTES: Record<string, string> = {
  tr808_kick: 'C1', tr808_tom_lo: 'E1', tr808_tom_hi: 'A1', tr808_cowbell: 'G#1',
  tr909_kick: 'C1', tr909_tom_lo: 'E1', tr909_tom_hi: 'A1',
  tr606_kick: 'C1', tr606_tom_lo: 'E1', tr606_tom_hi: 'A1',
  tr707_kick: 'C1', tr707_tom_lo: 'E1', tr707_tom_hi: 'A1',
  tb303_bass: 'C2', sh101_bass: 'C2',
}

function triggerSynth(synth: AnyToneSynth, trackId: string, time: number, velocity: number, stepNote?: string) {
  if (synth instanceof Tone.Player) {
    if (!synth.loaded) return
    synth.volume.value = Tone.gainToDb(Math.max(0.0001, velocity))
    try { synth.start(time) } catch { /* timing error after transport restart — skip beat */ }
    return
  }
  if (synth instanceof Tone.Sampler && !synth.loaded) return
  const note = stepNote ?? TRIGGER_NOTES[trackId] ?? 'C2'
  try {
    if (isUnpitched(synth)) {
      synth.triggerAttackRelease('16n', time, velocity)
    } else {
      synth.triggerAttackRelease(note, '16n', time, velocity)
    }
  } catch { /* timing error after transport restart — skip beat */ }
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

function resolveAccentLevel(mp: MachineParams, trackId: string): number {
  if (trackId.startsWith('tr808')) return mp.tr808.accentLevel
  if (trackId.startsWith('tr909')) return mp.tr909.accentLevel
  if (trackId.startsWith('tr606')) return mp.tr606.accentLevel
  if (trackId.startsWith('tr707')) return mp.tr707.accentLevel
  if (trackId.startsWith('tb303')) return mp.tb303.accent
  return 0
}

function sweepBassFilter(filter: Tone.Filter, trackId: string, mp: MachineParams, time: number) {
  if (trackId === 'tb303_bass') {
    const p = mp.tb303
    const base = Math.max(50, 100 + p.cutoff * 7900)
    const peak = base * Math.pow(2, p.envMod * 5)
    filter.frequency.cancelScheduledValues(time)
    filter.frequency.setValueAtTime(peak, time)
    filter.frequency.exponentialRampToValueAtTime(base, time + 0.05 + p.decay * 1.95)
  } else if (trackId === 'sh101_bass') {
    const p = mp.sh101
    const base = Math.max(50, 80 + p.vcfFreq * 7920)
    const peak = Math.min(base * Math.pow(2, p.vcfEnv * 3) * (1 + p.vcfMod * 2), 18000)
    filter.frequency.cancelScheduledValues(time)
    filter.frequency.setValueAtTime(peak, time)
    filter.frequency.exponentialRampToValueAtTime(base, time + 0.25)
  }
}

const BASE_TRACK_IDS = new Set([
  'tr808_kick','tr808_snare','tr808_hihat_closed','tr808_hihat_open','tr808_clap',
  'tr808_rim','tr808_tom_lo','tr808_tom_hi','tr808_cymbal','tr808_cowbell',
  'tr909_kick','tr909_snare','tr909_hihat_closed','tr909_hihat_open','tr909_clap',
  'tr909_rim','tr909_tom_lo','tr909_tom_hi','tr909_cymbal',
  'tr606_kick','tr606_snare','tr606_hihat_closed','tr606_hihat_open','tr606_clap',
  'tr606_rim','tr606_tom_lo','tr606_tom_hi','tr606_cymbal',
  'tr707_kick','tr707_snare','tr707_hihat_closed','tr707_hihat_open','tr707_clap',
  'tr707_rim','tr707_tom_lo','tr707_tom_hi','tr707_cymbal',
  'tb303_bass','sh101_bass',
])

export function useAudioEngine() {
  const synthsRef = useRef<Record<string, AnyToneSynth>>({})
  const channelsRef = useRef<Record<string, Tone.Channel>>({})
  const filtersRef = useRef<Record<string, Tone.Filter>>({})
  const subOscRef = useRef<Record<string, Tone.Synth>>({})
  const subGainRef = useRef<Record<string, Tone.Gain>>({})
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
        // Bass machines get a resonant lowpass filter inserted before the channel
        if (id === 'tb303_bass' || id === 'sh101_bass') {
          const filter = new Tone.Filter({ type: 'lowpass', rolloff: -24, frequency: 1200, Q: 8 })
          filtersRef.current[id] = filter
          synth.connect(filter)
          filter.connect(ch)
        } else {
          synth.connect(ch)
        }
      })
    })

    // SH-101 sub oscillator — square wave, 1 octave below, routed through same filter
    const sh101Filter = filtersRef.current['sh101_bass']
    if (sh101Filter) {
      const subOsc = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.2 },
      })
      const subGain = new Tone.Gain(0)
      subOsc.connect(subGain)
      subGain.connect(sh101Filter)
      subOscRef.current['sh101_bass'] = subOsc
      subGainRef.current['sh101_bass'] = subGain
    }

    return () => {
      master.dispose()
      tap.dispose()
      reverb.dispose()
      Object.values(synthsRef.current).forEach((s) => { s.disconnect(); s.dispose() })
      Object.values(channelsRef.current).forEach((ch) => ch.dispose())
      Object.values(filtersRef.current).forEach((f) => f.dispose())
      Object.values(subOscRef.current).forEach((s) => { s.disconnect(); s.dispose() })
      Object.values(subGainRef.current).forEach((g) => g.dispose())
      synthsRef.current = {}
      channelsRef.current = {}
      filtersRef.current = {}
      subOscRef.current = {}
      subGainRef.current = {}
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
      if (BASE_TRACK_IDS.has(id)) return
      synthsRef.current[id]?.disconnect()
      synthsRef.current[id]?.dispose()
      delete synthsRef.current[id]
      channelsRef.current[id]?.dispose()
      delete channelsRef.current[id]
    })
  }, [tracks])

  // ── Machine params → filters + shuffle ───────────────────────────────────
  useEffect(() => {
    // TB-303 static filter (cutoff / resonance)
    const tb303Filter = filtersRef.current['tb303_bass']
    if (tb303Filter) {
      const p = machineParams.tb303
      tb303Filter.frequency.value = Math.max(50, 100 + p.cutoff * 7900)
      tb303Filter.Q.value = 1 + p.resonance * 19
    }
    // SH-101 static filter (vcfFreq / vcfRes)
    const sh101Filter = filtersRef.current['sh101_bass']
    if (sh101Filter) {
      const p = machineParams.sh101
      sh101Filter.frequency.value = Math.max(50, 80 + p.vcfFreq * 7920)
      sh101Filter.Q.value = 1 + p.vcfRes * 11
    }
    // TB-303 waveform
    const tb303Synth = synthsRef.current['tb303_bass']
    if (tb303Synth instanceof Tone.MonoSynth) {
      tb303Synth.oscillator.type = machineParams.tb303.waveform
    }

    // SH-101 waveform + portamento
    const sh101Synth = synthsRef.current['sh101_bass']
    if (sh101Synth instanceof Tone.MonoSynth) {
      sh101Synth.oscillator.type = machineParams.sh101.waveform
      sh101Synth.portamento = machineParams.sh101.portamento * 0.5
    }

    // SH-101 sub oscillator level
    const subGain = subGainRef.current['sh101_bass']
    if (subGain) subGain.gain.value = machineParams.sh101.subOsc

    // TR-808 / TR-909 shuffle → transport swing
    const shuffle = Math.max(machineParams.tr808.shuffle, machineParams.tr909.shuffle)
    if (shuffle > 0) {
      Tone.getTransport().swing = shuffle
      Tone.getTransport().swingSubdivision = '16n'
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
        setCurrentStep(step)
        const state = useSequencerStore.getState()
        state.tracks.forEach((track) => {
          if (track.muted) return
          const s = track.steps[step % track.steps.length]
          if (!s?.active) return
          const synth = synthsRef.current[track.id]
          if (!synth) return

          const mp = state.machineParams
          const accentLevel = resolveAccentLevel(mp, track.id)
          const vel = s.velocity > 0.65
            ? Math.min(1, s.velocity + accentLevel * 0.3)
            : s.velocity

          triggerSynth(synth, track.id, time, vel, s.note)

          // SH-101 sub oscillator — trigger one octave below at subOsc level
          if (track.id === 'sh101_bass' && mp.sh101.subOsc > 0) {
            const subSynth = subOscRef.current['sh101_bass']
            const subNote = noteOneOctaveDown(s.note ?? TRIGGER_NOTES['sh101_bass'] ?? 'C2')
            try { subSynth?.triggerAttackRelease(subNote, '16n', time, Math.min(1, vel * mp.sh101.subOsc)) } catch { /* skip */ }
          }

          const filter = filtersRef.current[track.id]
          if (filter) sweepBassFilter(filter, track.id, mp, time)
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
