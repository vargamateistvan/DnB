import type { KitId, TrackId, MachineParams } from './types'

// ── Visual theme per machine ──────────────────────────────────────────────────

export interface MachineTheme {
  bg: string
  surface: string
  panel: string
  border: string
  accent: string
  labelBg: string
  labelText: string
  stepActive: string
  stepInactive: string
  stepBeat: string
  stepCurrent: string
  text: string
  textDim: string
  buttonShape: 'circle' | 'square' | 'triangle' | 'rect'
  gridLines: boolean
  logoColor: string
  font: string
}

export const MACHINE_THEMES: Record<KitId, MachineTheme> = {
  tr808: {
    bg: '#0e0e0e', surface: '#181818', panel: '#1e1e1e', border: '#2e2e2e',
    accent: '#f5a623', labelBg: '#f5a623', labelText: '#000',
    stepActive: '#f5a623', stepInactive: '#1e1e1e', stepBeat: '#262626',
    stepCurrent: '#fff', text: '#ccc', textDim: '#555',
    buttonShape: 'circle', gridLines: false,
    logoColor: '#f5a623', font: 'serif',
  },
  tr909: {
    bg: '#c0bcb4', surface: '#b4b0a8', panel: '#c8c4bc', border: '#9a9890',
    accent: '#c83000', labelBg: '#3a3838', labelText: '#eee',
    stepActive: '#c83000', stepInactive: '#4a4848', stepBeat: '#525050',
    stepCurrent: '#c83000', text: '#1a1a1a', textDim: '#666',
    buttonShape: 'rect', gridLines: false,
    logoColor: '#c83000', font: 'sans-serif',
  },
  tr606: {
    bg: '#c0c0bc', surface: '#b0b0ac', panel: '#a0a09c', border: '#888884',
    accent: '#cc2200', labelBg: '#1e1e1e', labelText: '#eee',
    stepActive: '#cc2200', stepInactive: '#848480', stepBeat: '#9a9a96',
    stepCurrent: '#fff', text: '#111', textDim: '#555',
    buttonShape: 'circle', gridLines: false,
    logoColor: '#222', font: 'sans-serif',
  },
  tr707: {
    bg: '#aeaa92', surface: '#a4a08a', panel: '#d4d0bc', border: '#88866e',
    accent: '#c04808', labelBg: '#1e1e1e', labelText: '#eee',
    stepActive: '#111', stepInactive: '#aeaa92', stepBeat: '#aeaa92',
    stepCurrent: '#c04808', text: '#1a1a1a', textDim: '#555',
    buttonShape: 'circle', gridLines: false,
    logoColor: '#444', font: 'sans-serif',
  },
  tb303: {
    bg: '#c8c8c4', surface: '#b8b8b4', panel: '#b0b0ac', border: '#9a9a96',
    accent: '#111', labelBg: '#111', labelText: '#fff',
    stepActive: '#111', stepInactive: '#9a9a96', stepBeat: '#aaaaA6',
    stepCurrent: '#cc0000', text: '#111', textDim: '#555',
    buttonShape: 'triangle', gridLines: false,
    logoColor: '#111', font: 'serif',
  },
  sh101: {
    bg: '#1a4fa0', surface: '#184488', panel: '#163a80', border: '#2a5fc0',
    accent: '#fff', labelBg: '#000', labelText: '#fff',
    stepActive: '#fff', stepInactive: '#2a5fc0', stepBeat: '#2040a0',
    stepCurrent: '#ffcc00', text: '#fff', textDim: '#8ab0e8',
    buttonShape: 'square', gridLines: false,
    logoColor: '#fff', font: 'sans-serif',
  },
}

// ── Track label mapping per machine ──────────────────────────────────────────

export interface MachineTrack {
  id: TrackId
  label: string
}

export const MACHINE_TRACKS: Record<KitId, MachineTrack[]> = {
  tr808: [
    { id: 'tr808_kick',         label: 'BD' },
    { id: 'tr808_snare',        label: 'SD' },
    { id: 'tr808_tom_lo',       label: 'LT' },
    { id: 'tr808_tom_hi',       label: 'HT' },
    { id: 'tr808_rim',          label: 'RS' },
    { id: 'tr808_clap',         label: 'CP' },
    { id: 'tr808_cowbell',      label: 'CB' },
    { id: 'tr808_cymbal',       label: 'CY' },
    { id: 'tr808_hihat_open',   label: 'OH' },
    { id: 'tr808_hihat_closed', label: 'CH' },
  ],
  tr909: [
    { id: 'tr909_cymbal',       label: 'CC' },
    { id: 'tr909_hihat_open',   label: 'OH' },
    { id: 'tr909_hihat_closed', label: 'CH' },
    { id: 'tr909_clap',         label: 'HC' },
    { id: 'tr909_rim',          label: 'RM' },
    { id: 'tr909_tom_hi',       label: 'HT' },
    { id: 'tr909_tom_lo',       label: 'LT' },
    { id: 'tr909_snare',        label: 'SD' },
    { id: 'tr909_kick',         label: 'BD' },
  ],
  tr606: [
    { id: 'tr606_kick',         label: 'BD' },
    { id: 'tr606_snare',        label: 'SD' },
    { id: 'tr606_tom_lo',       label: 'LT' },
    { id: 'tr606_tom_hi',       label: 'HT' },
    { id: 'tr606_cymbal',       label: 'CY' },
    { id: 'tr606_hihat_open',   label: 'OH' },
    { id: 'tr606_hihat_closed', label: 'CH' },
  ],
  tr707: [
    { id: 'tr707_kick',         label: 'BD' },
    { id: 'tr707_snare',        label: 'SD' },
    { id: 'tr707_rim',          label: 'RM' },
    { id: 'tr707_clap',         label: 'CW' },
    { id: 'tr707_tom_lo',       label: 'LT' },
    { id: 'tr707_tom_hi',       label: 'HT' },
    { id: 'tr707_hihat_closed', label: 'CH' },
    { id: 'tr707_hihat_open',   label: 'OH' },
    { id: 'tr707_cymbal',       label: 'CY' },
  ],
  tb303: [
    { id: 'tb303_bass', label: 'BASS' },
  ],
  sh101: [
    { id: 'sh101_bass', label: 'BASS' },
  ],
}

// ── Default parameters ────────────────────────────────────────────────────────

export const DEFAULT_MACHINE_PARAMS: MachineParams = {
  tr808: { shuffle: 0, accentLevel: 0.3 },
  tr909: { shuffle: 0, accentLevel: 0.3, bdDecay: 0.4, sdSnappy: 0.5, ltDecay: 0.4, htDecay: 0.4, ohDecay: 0.6, cymTune: 0.5 },
  tr606: { accentLevel: 0.25 },
  tr707: { accentLevel: 0.25 },
  tb303: { cutoff: 0.5, resonance: 0.4, envMod: 0.5, decay: 0.4, accent: 0.5, waveform: 'sawtooth' },
  sh101: { vcfFreq: 0.6, vcfRes: 0.3, vcfEnv: 0.4, vcfMod: 0.2, subOsc: 0.3, waveform: 'pulse', portamento: 0, pitchBend: 0 },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isBassLine(kitId: KitId): boolean {
  return kitId === 'tb303' || kitId === 'sh101'
}
