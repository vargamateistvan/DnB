import type { KitId } from './types'

export interface PresetStep {
  index: number
  velocity?: number
  note?: string
}

export interface MachinePreset {
  name: string
  stepCount?: 16 | 32 | 64 | 128
  tracks: Partial<Record<string, PresetStep[]>>
}

function steps(indices: number[], velocity = 0.8): PresetStep[] {
  return indices.map((index) => ({ index, velocity }))
}

function bassSteps(data: Array<[number, string, number?]>): PresetStep[] {
  return data.map(([index, note, velocity = 0.8]) => ({ index, note, velocity }))
}

export const MACHINE_PRESETS: Record<KitId, MachinePreset[]> = {
  tr808: [
    {
      name: 'HIP-HOP',
      tracks: {
        tr808_kick:         steps([0, 3, 6, 9, 12]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([6, 14], 0.6),
        tr808_clap:         steps([]),
        tr808_rim:          steps([]),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      name: 'BOOM BAP',
      tracks: {
        tr808_kick:         steps([0, 3, 7, 10]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([6], 0.6),
        tr808_clap:         steps([4, 12], 0.75),
        tr808_rim:          steps([2, 10], 0.55),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      name: 'TRAP',
      tracks: {
        tr808_kick:         steps([0, 3, 10, 14]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14], 0.6),
        tr808_hihat_open:   steps([3, 7, 11, 15], 0.65),
        tr808_clap:         steps([4, 12], 0.85),
        tr808_rim:          steps([]),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      name: 'ELECTRO',
      tracks: {
        tr808_kick:         steps([0, 4, 8, 12]),
        tr808_snare:        steps([4, 8, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([6, 14], 0.6),
        tr808_clap:         steps([2, 10], 0.7),
        tr808_rim:          steps([6, 14], 0.55),
        tr808_cowbell:      steps([0, 4, 8, 12], 0.5),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      // When Doves Cry — Prince
      name: 'DOVES CRY',
      tracks: {
        tr808_kick:         steps([0, 6, 10, 14]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([3, 11], 0.6),
        tr808_clap:         steps([4, 12], 0.85),
        tr808_rim:          steps([]),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([9, 13], 0.6),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      // Dembow — reggaeton foundation
      name: 'REGGAETON',
      tracks: {
        tr808_kick:         steps([0, 4, 8, 10, 12]),
        tr808_snare:        steps([4, 10, 12], 0.85),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([6, 14], 0.6),
        tr808_clap:         steps([4, 12], 0.9),
        tr808_rim:          steps([10], 0.75),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      // Straight Outta Compton — NWA
      name: 'COMPTON',
      tracks: {
        tr808_kick:         steps([0, 3, 8, 11]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([6], 0.6),
        tr808_clap:         steps([4, 12], 0.85),
        tr808_rim:          steps([2, 10], 0.5),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      // Billie Jean — Michael Jackson
      name: 'BILLIE J',
      tracks: {
        tr808_kick:         steps([0, 3, 8, 11]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([], 0.6),
        tr808_clap:         steps([4, 12], 0.85),
        tr808_rim:          steps([2, 6, 10, 14], 0.5),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      // Planet Rock — Afrika Bambaataa
      name: 'PLANET R',
      tracks: {
        tr808_kick:         steps([0, 4, 8, 12]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr808_hihat_open:   steps([]),
        tr808_clap:         steps([2, 6, 10, 14], 0.8),
        tr808_rim:          steps([2, 10], 0.55),
        tr808_cowbell:      steps([0, 4, 8, 12], 0.7),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([]),
        tr808_tom_hi:       steps([]),
      },
    },
    {
      // Typical R&B slow jam groove
      name: 'R&B JAM',
      tracks: {
        tr808_kick:         steps([0, 2, 8, 10]),
        tr808_snare:        steps([4, 12]),
        tr808_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.6),
        tr808_hihat_open:   steps([6, 14], 0.55),
        tr808_clap:         steps([4, 12], 0.8),
        tr808_rim:          steps([3, 11], 0.5),
        tr808_cowbell:      steps([]),
        tr808_cymbal:       steps([]),
        tr808_tom_lo:       steps([10, 14], 0.6),
        tr808_tom_hi:       steps([]),
      },
    },
  ],

  tr909: [
    {
      name: '4/4 HOUSE',
      tracks: {
        tr909_kick:         steps([0, 4, 8, 12]),
        tr909_snare:        steps([4, 12]),
        tr909_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr909_hihat_open:   steps([2, 6, 10, 14], 0.6),
        tr909_clap:         steps([4, 12], 0.8),
        tr909_rim:          steps([]),
        tr909_tom_lo:       steps([]),
        tr909_tom_hi:       steps([]),
        tr909_cymbal:       steps([]),
      },
    },
    {
      name: 'TECHNO',
      tracks: {
        tr909_kick:         steps([0, 4, 8, 12]),
        tr909_snare:        steps([4, 12]),
        tr909_hihat_closed: steps([2, 6, 10, 14], 0.65),
        tr909_hihat_open:   steps([6, 14], 0.6),
        tr909_clap:         steps([4, 12], 0.8),
        tr909_rim:          steps([2, 10], 0.55),
        tr909_tom_lo:       steps([7, 15], 0.6),
        tr909_tom_hi:       steps([3, 11], 0.55),
        tr909_cymbal:       steps([]),
      },
    },
    {
      name: 'JUNGLE',
      tracks: {
        tr909_kick:         steps([0, 3, 6, 10]),
        tr909_snare:        steps([4, 6, 12, 14]),
        tr909_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr909_hihat_open:   steps([2, 6, 10, 14], 0.6),
        tr909_clap:         steps([4, 12], 0.8),
        tr909_rim:          steps([14], 0.5),
        tr909_tom_lo:       steps([6, 14], 0.65),
        tr909_tom_hi:       steps([2, 10], 0.6),
        tr909_cymbal:       steps([]),
      },
    },
    {
      name: 'D&B',
      tracks: {
        tr909_kick:         steps([0, 3, 9, 12]),
        tr909_snare:        steps([4, 10, 12]),
        tr909_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr909_hihat_open:   steps([6, 14], 0.6),
        tr909_clap:         steps([4, 12], 0.8),
        tr909_rim:          steps([2, 14], 0.5),
        tr909_tom_lo:       steps([10, 14], 0.65),
        tr909_tom_hi:       steps([6], 0.6),
        tr909_cymbal:       steps([]),
      },
    },
    {
      // Around The World — Daft Punk
      name: 'ATW',
      tracks: {
        tr909_kick:         steps([0, 4, 8, 12]),
        tr909_snare:        steps([4, 12]),
        tr909_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr909_hihat_open:   steps([2, 6, 10, 14], 0.6),
        tr909_clap:         steps([2, 6, 10, 14], 0.75),
        tr909_rim:          steps([]),
        tr909_tom_lo:       steps([]),
        tr909_tom_hi:       steps([]),
        tr909_cymbal:       steps([0], 0.5),
      },
    },
    {
      // Strings of Life — Derrick May
      name: 'STRINGS',
      tracks: {
        tr909_kick:         steps([0, 4, 8, 12]),
        tr909_snare:        steps([4, 12], 0.9),
        tr909_hihat_closed: steps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 0.55),
        tr909_hihat_open:   steps([6, 14], 0.6),
        tr909_clap:         steps([4, 12], 0.85),
        tr909_rim:          steps([2, 6, 10, 14], 0.5),
        tr909_tom_lo:       steps([]),
        tr909_tom_hi:       steps([]),
        tr909_cymbal:       steps([]),
      },
    },
    {
      // Classic trance (early 90s)
      name: 'TRANCE',
      tracks: {
        tr909_kick:         steps([0, 4, 8, 12]),
        tr909_snare:        steps([4, 12]),
        tr909_hihat_closed: steps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 0.6),
        tr909_hihat_open:   steps([2, 10], 0.65),
        tr909_clap:         steps([4, 12], 0.85),
        tr909_rim:          steps([]),
        tr909_tom_lo:       steps([]),
        tr909_tom_hi:       steps([]),
        tr909_cymbal:       steps([0, 8], 0.5),
      },
    },
    {
      // One More Time — Daft Punk
      name: 'ONE MORE',
      tracks: {
        tr909_kick:         steps([0, 4, 8, 12]),
        tr909_snare:        steps([4, 12]),
        tr909_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr909_hihat_open:   steps([2, 6, 10, 14], 0.6),
        tr909_clap:         steps([2, 6, 10, 14], 0.75),
        tr909_rim:          steps([]),
        tr909_tom_lo:       steps([]),
        tr909_tom_hi:       steps([]),
        tr909_cymbal:       steps([0], 0.45),
      },
    },
    {
      // Da Funk — Daft Punk
      name: 'DA FUNK',
      tracks: {
        tr909_kick:         steps([0, 3, 8, 11]),
        tr909_snare:        steps([4, 12]),
        tr909_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr909_hihat_open:   steps([6, 14], 0.6),
        tr909_clap:         steps([4, 12], 0.85),
        tr909_rim:          steps([2, 6, 10, 14], 0.5),
        tr909_tom_lo:       steps([7], 0.6),
        tr909_tom_hi:       steps([3, 11], 0.55),
        tr909_cymbal:       steps([]),
      },
    },
    {
      // Hard-driving rave / hardcore feel
      name: 'RAVE',
      tracks: {
        tr909_kick:         steps([0, 2, 4, 6, 8, 10, 12, 14]),
        tr909_snare:        steps([4, 12]),
        tr909_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.7),
        tr909_hihat_open:   steps([6, 14], 0.6),
        tr909_clap:         steps([4, 12], 0.9),
        tr909_rim:          steps([2, 6, 10, 14], 0.55),
        tr909_tom_lo:       steps([7, 15], 0.65),
        tr909_tom_hi:       steps([3, 11], 0.6),
        tr909_cymbal:       steps([0], 0.5),
      },
    },
  ],

  tr606: [
    {
      name: 'MINIMAL',
      tracks: {
        tr606_kick:         steps([0, 8]),
        tr606_snare:        steps([4, 12]),
        tr606_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr606_hihat_open:   steps([6, 14], 0.6),
        tr606_cymbal:       steps([0], 0.5),
        tr606_tom_lo:       steps([]),
        tr606_tom_hi:       steps([]),
      },
    },
    {
      name: 'ELECTRO',
      tracks: {
        tr606_kick:         steps([0, 2, 8, 10]),
        tr606_snare:        steps([4, 6, 12, 14]),
        tr606_hihat_closed: steps([0, 4, 8, 12], 0.65),
        tr606_hihat_open:   steps([2, 6, 10, 14], 0.6),
        tr606_cymbal:       steps([0, 8], 0.5),
        tr606_tom_lo:       steps([10], 0.65),
        tr606_tom_hi:       steps([6], 0.6),
      },
    },
    {
      name: 'TECHNO',
      tracks: {
        tr606_kick:         steps([0, 7, 8, 15]),
        tr606_snare:        steps([4, 12]),
        tr606_hihat_closed: steps([2, 6, 10, 14], 0.65),
        tr606_hihat_open:   steps([6, 14], 0.6),
        tr606_cymbal:       steps([0, 8], 0.5),
        tr606_tom_lo:       steps([7], 0.65),
        tr606_tom_hi:       steps([3, 11], 0.6),
      },
    },
    {
      name: 'SHUFFLE',
      tracks: {
        tr606_kick:         steps([0, 6, 8, 14]),
        tr606_snare:        steps([4, 12]),
        tr606_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr606_hihat_open:   steps([3, 7, 11, 15], 0.6),
        tr606_cymbal:       steps([0, 8], 0.5),
        tr606_tom_lo:       steps([9], 0.65),
        tr606_tom_hi:       steps([1, 13], 0.55),
      },
    },
    {
      // Post-punk — Joy Division / Gang of Four feel
      name: 'POST-PUNK',
      tracks: {
        tr606_kick:         steps([0, 8]),
        tr606_snare:        steps([4, 6, 12, 14]),
        tr606_hihat_closed: steps([0, 4, 8, 12], 0.7),
        tr606_hihat_open:   steps([2, 6, 10, 14], 0.6),
        tr606_cymbal:       steps([0, 8], 0.5),
        tr606_tom_lo:       steps([10, 14], 0.6),
        tr606_tom_hi:       steps([6], 0.55),
      },
    },
    {
      // EBM — Front 242 / Nitzer Ebb
      name: 'EBM',
      tracks: {
        tr606_kick:         steps([0, 4, 8, 12]),
        tr606_snare:        steps([4, 6, 12, 14], 0.85),
        tr606_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.7),
        tr606_hihat_open:   steps([]),
        tr606_cymbal:       steps([0], 0.5),
        tr606_tom_lo:       steps([]),
        tr606_tom_hi:       steps([]),
      },
    },
    {
      // Industrial — pounding and relentless
      name: 'INDUSTRL',
      tracks: {
        tr606_kick:         steps([0, 2, 4, 8, 10, 12]),
        tr606_snare:        steps([3, 7, 11, 15], 0.9),
        tr606_hihat_closed: steps([1, 3, 5, 7, 9, 11, 13, 15], 0.65),
        tr606_hihat_open:   steps([]),
        tr606_cymbal:       steps([0, 8], 0.6),
        tr606_tom_lo:       steps([6, 14], 0.7),
        tr606_tom_hi:       steps([2, 10], 0.65),
      },
    },
    {
      // Personal Jesus — Depeche Mode
      name: 'PERS JES',
      tracks: {
        tr606_kick:         steps([0, 4, 8, 12]),
        tr606_snare:        steps([4, 10, 12, 14], 0.9),
        tr606_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.7),
        tr606_hihat_open:   steps([6, 14], 0.6),
        tr606_cymbal:       steps([0, 8], 0.5),
        tr606_tom_lo:       steps([]),
        tr606_tom_hi:       steps([2, 10], 0.6),
      },
    },
    {
      // Motorik — Neu! / krautrock
      name: 'MOTORIK',
      tracks: {
        tr606_kick:         steps([0, 4, 8, 12]),
        tr606_snare:        steps([4, 12]),
        tr606_hihat_closed: steps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 0.6),
        tr606_hihat_open:   steps([]),
        tr606_cymbal:       steps([0], 0.5),
        tr606_tom_lo:       steps([]),
        tr606_tom_hi:       steps([]),
      },
    },
  ],

  tr707: [
    {
      name: '80S POP',
      tracks: {
        tr707_kick:         steps([0, 8]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr707_hihat_open:   steps([6, 14], 0.6),
        tr707_cymbal:       steps([0], 0.5),
        tr707_rim:          steps([]),
        tr707_clap:         steps([]),
        tr707_tom_lo:       steps([10], 0.65),
        tr707_tom_hi:       steps([6], 0.6),
      },
    },
    {
      name: 'FUNK',
      tracks: {
        tr707_kick:         steps([0, 3, 8, 11]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr707_hihat_open:   steps([6, 10, 14], 0.6),
        tr707_cymbal:       steps([0], 0.5),
        tr707_rim:          steps([2, 14], 0.55),
        tr707_clap:         steps([0, 8], 0.55),
        tr707_tom_lo:       steps([7, 15], 0.65),
        tr707_tom_hi:       steps([3, 11], 0.6),
      },
    },
    {
      name: 'SYNTH POP',
      tracks: {
        tr707_kick:         steps([0, 4, 8, 12]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr707_hihat_open:   steps([6, 14], 0.6),
        tr707_cymbal:       steps([0, 8], 0.5),
        tr707_rim:          steps([2, 10], 0.5),
        tr707_clap:         steps([0, 8], 0.55),
        tr707_tom_lo:       steps([]),
        tr707_tom_hi:       steps([]),
      },
    },
    {
      name: 'DISCO',
      tracks: {
        tr707_kick:         steps([0, 4, 8, 12]),
        tr707_snare:        steps([4, 8, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr707_hihat_open:   steps([2, 6, 10, 14], 0.6),
        tr707_cymbal:       steps([0, 8], 0.5),
        tr707_rim:          steps([6, 14], 0.5),
        tr707_clap:         steps([2, 6, 10, 14], 0.6),
        tr707_tom_lo:       steps([6], 0.65),
        tr707_tom_hi:       steps([10], 0.6),
      },
    },
    {
      // Blue Monday — New Order (LinnDrum pattern from MIDI, 32-step = 2-bar loop)
      // Kick: beat1+2, machine-gun fill (steps 8-15), then every beat in bar 2
      // Snare: beats 2&4 only | Hihat: paired 16ths on every "and"
      name: 'BLUE MON',
      stepCount: 32,
      tracks: {
        tr707_kick: steps([
          0, 4,                              // bar 1: beats 1 & 2
          8, 9, 10, 11, 12, 13, 14, 15,     // bar 1: machine-gun fill (beats 3-4)
          16, 20, 24, 28,                    // bar 2: every beat
        ], 0.82),
        tr707_snare:        steps([4, 12, 20, 28], 0.82),
        tr707_hihat_closed: [
          // Paired 16ths on every "and" — first hit louder, second softer
          ...[ 2, 6,10,14,18,22,26,30].map(i => ({ index: i, velocity: 0.65 })),
          ...[ 3, 7,11,15,19,23,27,31].map(i => ({ index: i, velocity: 0.52 })),
        ],
        tr707_hihat_open:   steps([]),
        tr707_cymbal:       steps([]),
        tr707_rim:          steps([]),
        tr707_clap:         steps([]),
        tr707_tom_lo:       steps([]),
        tr707_tom_hi:       steps([]),
      },
    },
    {
      // Don't You Want Me — Human League
      name: "DON'T U",
      tracks: {
        tr707_kick:         steps([0, 8]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr707_hihat_open:   steps([6, 14], 0.6),
        tr707_cymbal:       steps([0, 8], 0.5),
        tr707_rim:          steps([2, 10], 0.5),
        tr707_clap:         steps([4, 12], 0.8),
        tr707_tom_lo:       steps([10], 0.6),
        tr707_tom_hi:       steps([6], 0.55),
      },
    },
    {
      // Hi-NRG — Italo / early Eurodance
      name: 'HI-NRG',
      tracks: {
        tr707_kick:         steps([0, 4, 8, 12]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.7),
        tr707_hihat_open:   steps([2, 6, 10, 14], 0.65),
        tr707_cymbal:       steps([0, 8], 0.5),
        tr707_rim:          steps([6, 14], 0.5),
        tr707_clap:         steps([4, 8, 12], 0.85),
        tr707_tom_lo:       steps([]),
        tr707_tom_hi:       steps([]),
      },
    },
    {
      // Safety Dance — Men Without Hats
      name: 'SAFETY D',
      tracks: {
        tr707_kick:         steps([0, 8]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr707_hihat_open:   steps([6, 14], 0.6),
        tr707_cymbal:       steps([0, 8], 0.5),
        tr707_rim:          steps([6, 14], 0.5),
        tr707_clap:         steps([4, 12], 0.8),
        tr707_tom_lo:       steps([10, 14], 0.6),
        tr707_tom_hi:       steps([2], 0.55),
      },
    },
    {
      // Harder Better Faster Stronger — Daft Punk
      name: 'HARDER',
      tracks: {
        tr707_kick:         steps([0, 4, 8, 12]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 0.6),
        tr707_hihat_open:   steps([2, 10], 0.65),
        tr707_cymbal:       steps([0, 8], 0.5),
        tr707_rim:          steps([6, 14], 0.5),
        tr707_clap:         steps([4, 12], 0.85),
        tr707_tom_lo:       steps([]),
        tr707_tom_hi:       steps([]),
      },
    },
    {
      // New Wave — Depeche Mode / early synth pop
      name: 'NEW WAVE',
      tracks: {
        tr707_kick:         steps([0, 6, 8, 14]),
        tr707_snare:        steps([4, 12]),
        tr707_hihat_closed: steps([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
        tr707_hihat_open:   steps([3, 11], 0.6),
        tr707_cymbal:       steps([0, 8], 0.5),
        tr707_rim:          steps([2, 10], 0.5),
        tr707_clap:         steps([4, 12], 0.8),
        tr707_tom_lo:       steps([9, 13], 0.6),
        tr707_tom_hi:       steps([]),
      },
    },
  ],

  tb303: [
    {
      name: 'ACID 1',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'C2',  0.9],   // accented
          [2,  'C2',  0.65],
          [3,  'C#2', 0.65],
          [4,  'Eb2', 0.9],   // accented
          [6,  'G2',  0.9],   // accented
          [8,  'C2',  0.9],   // accented
          [10, 'C2',  0.65],
          [11, 'Bb1', 0.65],
          [12, 'Ab1', 0.9],   // accented
          [14, 'G1',  0.65],
          [15, 'G1',  0.65],
        ]),
      },
    },
    {
      name: 'ACID 2',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'G1',  0.9],   // accented
          [2,  'C2',  0.65],
          [4,  'Eb2', 0.9],   // accented
          [6,  'G2',  0.9],   // accented
          [8,  'G1',  0.9],   // accented
          [10, 'Bb1', 0.65],
          [12, 'C2',  0.9],   // accented
          [14, 'Eb2', 0.65],
          [15, 'D2',  0.65],
        ]),
      },
    },
    {
      name: 'TECHNO',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'C1',  0.9],   // accented
          [4,  'C1',  0.9],   // accented
          [6,  'C1',  0.65],
          [7,  'Bb1', 0.65],
          [8,  'C1',  0.9],   // accented
          [12, 'C1',  0.9],   // accented
          [14, 'G1',  0.65],
          [15, 'F1',  0.65],
        ]),
      },
    },
    {
      name: 'WALKING',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'C2',  0.9],   // accented — beat 1
          [2,  'D2',  0.65],
          [4,  'Eb2', 0.9],   // accented — beat 2
          [6,  'F2',  0.65],
          [8,  'G2',  0.9],   // accented — beat 3
          [10, 'F2',  0.65],
          [12, 'Eb2', 0.9],   // accented — beat 4
          [14, 'D2',  0.65],
        ]),
      },
    },
    {
      // Phuture "Acid Tracks" — dense, repetitive, mostly root note
      name: 'ACID TRK',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'C1',  0.9],   // accented
          [1,  'C1',  0.65],
          [2,  'C1',  0.65],
          [3,  'G1',  0.9],   // accented — the burp
          [4,  'C1',  0.65],
          [5,  'F1',  0.65],
          [6,  'C1',  0.9],   // accented
          [7,  'C1',  0.65],
          [8,  'C1',  0.65],
          [9,  'G1',  0.9],   // accented
          [10, 'C1',  0.65],
          [12, 'C1',  0.9],   // accented
          [14, 'Bb1', 0.65],
          [15, 'Ab1', 0.65],
        ]),
      },
    },
    {
      // Josh Wink "Higher State of Consciousness" — hypnotic single-note drone
      name: 'JOSH WNK',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'C2',  0.9],   // accented
          [2,  'C2',  0.65],
          [4,  'C2',  0.9],   // accented
          [6,  'C2',  0.65],
          [8,  'G1',  0.9],   // accented
          [9,  'G1',  0.65],
          [10, 'G1',  0.9],   // accented
          [12, 'Bb1', 0.9],   // accented
          [13, 'Bb1', 0.65],
          [14, 'Bb1', 0.65],
        ]),
      },
    },
    {
      // Tight squelchy acid burst
      name: 'SQUELCH',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'C2',  0.9],   // accented
          [1,  'C2',  0.65],
          [2,  'Eb2', 0.9],   // accented
          [4,  'C2',  0.9],   // accented
          [5,  'C2',  0.65],
          [6,  'G1',  0.65],
          [8,  'C2',  0.9],   // accented
          [9,  'Eb2', 0.65],
          [12, 'C2',  0.9],   // accented
          [13, 'C2',  0.65],
          [14, 'G1',  0.65],
          [15, 'F1',  0.65],
        ]),
      },
    },
    {
      // Voodoo Ray — A Guy Called Gerald (Bb minor)
      name: 'VOODOO R',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'A#2', 0.9],   // Bb — accented
          [1,  'A#2', 0.65],
          [4,  'D#2', 0.9],   // Eb — accented
          [6,  'C2',  0.65],
          [8,  'A#2', 0.9],   // Bb — accented
          [9,  'G2',  0.65],
          [12, 'D#2', 0.9],   // Eb — accented
          [14, 'C2',  0.65],
          [15, 'A#2', 0.65],
        ]),
      },
    },
    {
      // Around the World — Daft Punk (G minor)
      name: 'ATW 303',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'G1',  0.9],   // G minor root — accented
          [2,  'G1',  0.65],
          [4,  'D2',  0.9],   // 5th — accented
          [6,  'C2',  0.65],  // 4th
          [8,  'G1',  0.9],   // root — accented
          [10, 'G1',  0.65],
          [12, 'A#1', 0.9],   // Bb — accented
          [14, 'A2',  0.65],
          [15, 'G1',  0.65],
        ]),
      },
    },
    {
      // Can You Feel It — Larry Heard / Mr Fingers (deep house, A minor)
      name: 'MR FNGRS',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'A1',  0.9],   // accented
          [4,  'G1',  0.9],   // accented
          [6,  'E1',  0.65],
          [8,  'D1',  0.9],   // accented
          [10, 'C1',  0.65],
          [12, 'D1',  0.9],   // accented
          [14, 'E1',  0.65],
          [15, 'G1',  0.65],
        ]),
      },
    },
    {
      // Melodic minor acid line
      name: 'MINOR',
      tracks: {
        tb303_bass: bassSteps([
          [0,  'A1',  0.9],   // accented
          [2,  'C2',  0.65],
          [4,  'D2',  0.9],   // accented
          [6,  'Eb2', 0.65],
          [8,  'E2',  0.9],   // accented
          [10, 'G2',  0.65],
          [12, 'A2',  0.9],   // accented
          [14, 'G2',  0.65],
          [15, 'E2',  0.65],
        ]),
      },
    },
  ],

  sh101: [
    {
      // Blue Monday — New Order (F minor, Moog Source sequence from MIDI)
      // MIDI: 128 BPM, 2-bar loop: F3×6, C3×6 (bar1) | D3×12 (bar2)
      // Rhythm per half-bar: 16th positions 0,2,3,4,6,7 (syncopated gallop)
      // 32 steps = 2 bars at 16th-note resolution
      name: 'BLUE MON',
      stepCount: 32,
      tracks: {
        sh101_bass: bassSteps([
          // Bar 1: F3 (beats 1-2) — positions 0,2,3,4,6,7
          [0,  'F3',  0.85],
          [2,  'F3',  0.78],
          [3,  'F3',  0.72],
          [4,  'F3',  0.80],
          [6,  'F3',  0.75],
          [7,  'F3',  0.70],
          // Bar 1: C3 (beats 3-4) — positions 8,10,11,12,14,15
          [8,  'C3',  0.82],
          [10, 'C3',  0.75],
          [11, 'C3',  0.70],
          [12, 'C3',  0.78],
          [14, 'C3',  0.72],
          [15, 'C3',  0.68],
          // Bar 2: D3 throughout — positions 16,18,19,20,22,23,24,26,27,28,30,31
          [16, 'D3',  0.85],
          [18, 'D3',  0.78],
          [19, 'D3',  0.72],
          [20, 'D3',  0.80],
          [22, 'D3',  0.75],
          [23, 'D3',  0.70],
          [24, 'D3',  0.82],
          [26, 'D3',  0.75],
          [27, 'D3',  0.70],
          [28, 'D3',  0.78],
          [30, 'D3',  0.72],
          [31, 'D3',  0.68],
        ]),
      },
    },
    {
      name: 'HOUSE',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'G1',  0.9],
          [1,  'G1',  0.7],
          [4,  'C2',  0.85],
          [5,  'C2',  0.7],
          [8,  'Eb2', 0.85],
          [9,  'D2',  0.7],
          [12, 'C2',  0.85],
          [14, 'G1',  0.75],
        ]),
      },
    },
    {
      name: 'MELODIC',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'C2',  0.85],
          [3,  'Eb2', 0.75],
          [4,  'G2',  0.8],
          [6,  'F2',  0.75],
          [8,  'Eb2', 0.85],
          [10, 'D2',  0.75],
          [12, 'C2',  0.8],
          [14, 'Bb1', 0.75],
          [15, 'G1',  0.7],
        ]),
      },
    },
    {
      name: 'MINIMAL',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'C2',  0.9],
          [4,  'C2',  0.8],
          [6,  'G1',  0.75],
          [8,  'C2',  0.9],
          [10, 'Bb1', 0.75],
          [12, 'G1',  0.8],
          [14, 'C2',  0.75],
        ]),
      },
    },
    {
      // Depeche Mode style — dark synth bass
      name: 'DEPECHE',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'C2',  0.85],
          [2,  'C2',  0.7],
          [4,  'G2',  0.8],
          [6,  'F2',  0.75],
          [8,  'Eb2', 0.85],
          [10, 'D2',  0.75],
          [12, 'C2',  0.8],
          [14, 'Bb1', 0.75],
          [15, 'G1',  0.65],
        ]),
      },
    },
    {
      // OMD / Orchestral Manoeuvres style
      name: 'OMD',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'C2',  0.85],
          [4,  'Eb2', 0.8],
          [6,  'G2',  0.8],
          [8,  'F2',  0.85],
          [10, 'Eb2', 0.75],
          [12, 'C2',  0.8],
          [14, 'G1',  0.75],
          [15, 'Bb1', 0.65],
        ]),
      },
    },
    {
      // Kraftwerk — robotic, sparse
      name: 'KRFTWERK',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'C2',  0.85],
          [4,  'C2',  0.8],
          [8,  'C2',  0.85],
          [10, 'G1',  0.75],
          [12, 'C2',  0.8],
          [14, 'Bb1', 0.7],
          [15, 'Ab1', 0.65],
        ]),
      },
    },
    {
      // Just Can't Get Enough — Depeche Mode
      name: 'JUST GT',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'A2',  0.85],
          [2,  'A2',  0.7],
          [4,  'D2',  0.8],
          [6,  'E2',  0.75],
          [8,  'A2',  0.85],
          [10, 'A2',  0.7],
          [12, 'D2',  0.8],
          [14, 'E2',  0.75],
        ]),
      },
    },
    {
      // Fade to Grey — Visage (Eb minor / D# minor)
      name: 'FADE GRY',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'D#2', 0.8],   // Eb — root
          [4,  'G#1', 0.75],  // Ab
          [6,  'A#1', 0.7],   // Bb
          [8,  'D#2', 0.8],   // Eb
          [10, 'G#2', 0.7],   // Ab (upper)
          [12, 'D#2', 0.75],  // Eb
          [14, 'G#1', 0.7],   // Ab
          [15, 'A#1', 0.65],  // Bb
        ]),
      },
    },
    {
      // Get Lucky — Daft Punk
      name: 'GET LCKY',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'B2',  0.85],
          [3,  'D2',  0.75],
          [4,  'F#2', 0.8],
          [7,  'E2',  0.7],
          [8,  'D2',  0.85],
          [11, 'B2',  0.75],
          [12, 'A2',  0.8],
          [14, 'F#2', 0.75],
          [15, 'E2',  0.65],
        ]),
      },
    },
    {
      // Acid-influenced SH-101 line
      name: 'ACID SH',
      tracks: {
        sh101_bass: bassSteps([
          [0,  'C2',  0.9],
          [1,  'C2',  0.7],
          [3,  'Eb2', 0.8],
          [4,  'G2',  0.85],
          [6,  'F2',  0.75],
          [8,  'C2',  0.9],
          [9,  'C2',  0.65],
          [11, 'Bb1', 0.75],
          [12, 'G1',  0.8],
          [14, 'C2',  0.75],
          [15, 'Eb2', 0.7],
        ]),
      },
    },
  ],
}
