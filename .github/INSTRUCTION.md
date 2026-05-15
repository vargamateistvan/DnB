# DnB Sequencer — Developer Guide

A browser-based drum machine and step sequencer that models six classic Roland machines: TR-808, TR-909, TR-606, TR-707, TB-303, and SH-101. Audio synthesis and playback runs entirely in-browser via Tone.js. No backend.

Live: https://vargamateistvan.github.io/DnB/

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React | 19 |
| Language | TypeScript | 6 |
| Build | Vite | 8 |
| Styling | Tailwind CSS | 3 |
| Audio | Tone.js | 15 |
| State | Zustand (with persist) | 5 |
| MIDI | @tonejs/midi | 2 |
| Audio encode | lamejs | 1.2 |

TypeScript is configured with `noUnusedLocals` and `noUnusedParameters` — the build will fail on unused variables.

---

## Getting Started

```bash
yarn install
yarn dev       # http://localhost:5173/DnB/
yarn build     # production build → dist/
yarn preview   # preview dist/
```

Deployment is automatic: any push to `main` triggers the GitHub Actions workflow (`.github/workflows/`) which builds and deploys to GitHub Pages.

---

## Directory Structure

```
src/
├── App.tsx                  # Root: layout shell, desktop/mobile branching
├── main.tsx                 # React entry point
│
├── types/index.ts           # All shared types (KitId, Track, Step, MachineParams, SequencerState)
├── machines.ts              # Machine themes (colors, fonts), track definitions, default synth params
├── kits.ts                  # Tone.js synth/sampler factories for each machine
├── presets.ts               # Named step patterns (50+ genres)
│
├── store/
│   └── sequencerStore.ts    # Zustand store — all state + 25+ actions
│
├── hooks/
│   ├── useAudioEngine.ts    # Tone.js engine: synth lifetime, sequencing, param sync
│   ├── useExport.ts         # MIDI export + WebM audio recording
│   ├── useMidiImport.ts     # MIDI file → sequencer state
│   └── useSongs.ts          # Song library (localStorage CRUD)
│
└── components/
    ├── Transport.tsx         # Global header: play/stop, BPM, swing, step count, menus
    ├── MachinePanel.tsx      # Per-kit shell: label strip, grid, controls, drag handles
    ├── DrumGrid.tsx          # Step grid for drum kits (808/909/606/707)
    ├── PianoRollGrid.tsx     # Piano roll for bass machines (303/101)
    ├── MachineControls.tsx   # Hardware-style controls: knobs, faders, bender, presets
    └── KnobControl.tsx       # Reusable SVG rotary knob (vertical drag, 0–1 range)
```

---

## Core Data Model

### KitId and TrackId

```ts
type KitId = 'tr808' | 'tr909' | 'tr606' | 'tr707' | 'tb303' | 'sh101'

// Track IDs follow the pattern: `${kitId}_${instrument}`
// e.g. "tr808_kick", "tr909_snare", "custom_1718000000123"
```

### Step

The atomic unit of the sequencer. A track has 16, 32, or 64 of these.

```ts
type Step = {
  active: boolean     // on/off
  velocity: number    // 0–1 amplitude
  note?: string       // optional per-step note override, used by TB-303 / SH-101
}
```

### Track

One row in the sequencer grid.

```ts
type Track = {
  id: string
  synthType: 'membrane' | 'noise' | 'metal' | 'synth' | 'mono'
  label: string       // short label shown in the grid (e.g. "BD", "BASS")
  color: string       // hex — velocity color for TR-808, accent for others
  steps: Step[]
  volume: number      // 0–1
  muted: boolean
  note: string        // default trigger note (e.g. "C1")
  custom?: true       // present only on user-added or MIDI-imported tracks
}
```

### MachineParams

Synthesis controls persisted per kit. Defaults are defined in `machines.ts`.

```ts
type MachineParams = {
  tr808: { shuffle: number; accentLevel: number }
  tr909: { shuffle: number; accentLevel: number; bdDecay: number; sdSnappy: number;
           ltDecay: number; htDecay: number; ohDecay: number; cymTune: number }
  tr606: { accentLevel: number }
  tr707: { accentLevel: number }
  tb303: { cutoff: number; resonance: number; envMod: number; decay: number;
           accent: number; waveform: 'sawtooth' | 'square' }
  sh101: { vcfFreq: number; vcfRes: number; vcfEnv: number; vcfMod: number;
           subOsc: number; waveform: 'pulse' | 'sawtooth'; portamento: number; pitchBend: number }
}
```

---

## State Management

Everything lives in a single Zustand store (`src/store/sequencerStore.ts`). Always use single-field selectors to avoid spurious re-renders:

```ts
// Good
const bpm = useSequencerStore((s) => s.bpm)

// Bad — re-renders whenever any state changes
const { bpm, swing } = useSequencerStore()
```

State is persisted to `localStorage` under the key `"dnb-sequencer"` via Zustand's `persist` middleware. Transient fields (`currentStep`, `isPlaying`) are excluded via `partialize`.

### Key actions

| Action | What it does |
|---|---|
| `toggleStep(trackId, stepIndex)` | Toggle a step on/off |
| `setStepVelocity(trackId, stepIndex, v)` | Set velocity 0–1 |
| `setStepNote(trackId, stepIndex, note)` | Per-step pitch override |
| `toggleKit(kitId)` | Show/hide a machine (min 1 always active) |
| `reorderKit(draggedId, targetId)` | Move machine in the stack |
| `reorderTrack(draggedId, targetId)` | Move row within a machine |
| `setMachineParam(kitId, key, value)` | Update any synthesis knob |
| `loadMachinePreset(kitId, preset)` | Apply a named pattern |
| `clearMachine(kitId)` | Wipe all steps of one machine |
| `randomize(kitId?)` | Fill steps at instrument-specific densities |
| `loadState(partial)` | Bulk-load song state (MIDI import, song library) |

---

## Audio Engine

`src/hooks/useAudioEngine.ts` owns the entire Tone.js lifecycle. It is instantiated once in `App.tsx` and exposes `{ play, stop, triggerPad, connectToRecorder }`.

### Signal chain

```
Synths / Players
    → AmplitudeEnvelope   (TR-909 drums only, for per-voice decay control)
    → Tone.Channel        (per-track mute + volume)
    → Tone.Compressor     (-6 dB, ratio 4, 500 ms release)
    → Tone.Gain
    → Tone.Reverb         (1.2 s decay, 12% wet)
    → Tone.Destination
```

### Synth types by machine

| Machine | Voice type | Notes |
|---|---|---|
| TR-808 | `Tone.Player` (samples) | .wav sample library |
| TR-909 | `Tone.Player` + `AmplitudeEnvelope` | Envelope controls per-voice decay |
| TR-606 | `Tone.Player` (samples) | |
| TR-707 | `Tone.Player` (samples) | |
| TB-303 | `Tone.MonoSynth` + `Tone.Filter` | Resonant lowpass, envelope sweep |
| SH-101 | `Tone.MonoSynth` + `Tone.Filter` + sub osc | Square sub one octave down |

### Parameter sync

Machine knobs/faders update `machineParams` in the store. `useAudioEngine` watches those values in a `useEffect` and applies them to Tone.js nodes synchronously:

- **TB-303 cutoff**: 100–8000 Hz (exponential)
- **TB-303 resonance**: Q 1–20
- **SH-101 vcfFreq**: 80–8000 Hz
- **SH-101 pitchBend**: ±1200 cents (±12 semitones) via `MonoSynth.detune`
- **SH-101 portamento**: glide time 0–0.5 s
- **TR-909 bdDecay / sdSnappy / ltDecay / htDecay / ohDecay**: `AmplitudeEnvelope.decay`
- **TR-909 cymTune**: `Player.playbackRate`
- **TR-808 / TR-909 shuffle**: `Tone.Transport.swing`

### Adding a new synth parameter

1. Add the field to the relevant type in `types/index.ts`
2. Set a default in `machines.ts` under `DEFAULT_MACHINE_PARAMS`
3. Read it in `useAudioEngine.ts` inside the machine params `useEffect` and apply to the Tone node
4. Add a knob/fader in the matching `if (kit === '...')` block in `MachineControls.tsx`
5. Use `?? defaultValue` when reading from `params.kitId` — persisted state may predate the new field

---

## Machines

### MACHINE_THEMES (`machines.ts`)

Every kit has a theme object used throughout the UI:

```ts
type MachineTheme = {
  bg: string         // grid background
  panel: string      // controls panel background
  surface: string    // label strip background
  border: string     // divider color
  accent: string     // LED / knob ring color
  text: string       // primary text
  textDim: string    // secondary text
  labelBg: string    // pad label background
  labelText: string  // pad label text
  stepActive: string // active step color
  stepInactive: string
  stepBeat: string   // beat-1 step color
  logoColor: string  // watermark color
  font: string       // label font
  gridLines?: boolean // TR-707 grid lines
}
```

### MACHINE_TRACKS (`machines.ts`)

Static list of all tracks for each kit. Custom tracks are merged at runtime from the store.

```ts
MACHINE_TRACKS['tr808'] = [
  { id: 'tr808_kick',  label: 'BD', synthType: 'membrane', note: 'C1', color: '#ff6b35' },
  { id: 'tr808_snare', label: 'SD', synthType: 'noise',    note: 'C1', color: '#ffd93d' },
  // ...
]
```

### Grid type per machine

- **DrumGrid** — TR-808, TR-909, TR-606, TR-707  
- **PianoRollGrid** — TB-303, SH-101 (uses `isBassLine(kitId)` helper)

---

## Adding a New Machine

1. **`types/index.ts`**: Add the kit ID to the `KitId` union and a params type to `MachineParams`.
2. **`machines.ts`**: Add `MACHINE_THEMES[newKit]`, `MACHINE_TRACKS[newKit]`, and `DEFAULT_MACHINE_PARAMS[newKit]`.
3. **`kits.ts`**: Add synth/sampler factory functions (or reuse sample-player pattern from TR-808).
4. **`useAudioEngine.ts`**: Wire up synths in `initAudio`, add param sync in the machine params `useEffect`.
5. **`MachineControls.tsx`**: Add `if (kit === 'newkit') { ... return <div>...</div> }` block with knobs.
6. **`presets.ts`**: Add `MACHINE_PRESETS['newkit']` array.
7. **`kits.ts`** (`KIT_LIST`): Add `{ id, label, year, description }` entry for the tab bar.

---

## Presets

Patterns live in `src/presets.ts`:

```ts
type PresetStep = { index: number; velocity?: number; note?: string }

type MachinePreset = {
  name: string
  tracks: Partial<Record<TrackId, PresetStep[]>>
}

// MACHINE_PRESETS['tr808'] = [{ name: 'BOOM BAP', tracks: { 'tr808_kick': [...] } }]
```

Only tracks listed in `tracks` are overwritten. Unlisted tracks are untouched. `velocity` and `note` are optional per step.

---

## Song Library

`src/hooks/useSongs.ts` manages unlimited named saves in localStorage under `"dnb-songs"`:

```ts
type SongEntry = {
  id: string            // "${timestamp}-${random}"
  name: string
  savedAt: string       // ISO date string
  state: Partial<SequencerState>
}
```

CRUD: `saveSong(name)`, `loadSong(id)`, `deleteSong(id)`, `renameSong(id, name)`.  
Songs are opened in `Transport.tsx` via the `SongLibraryDialog` modal (☰ menu → Song library).

---

## Styling Conventions

- **Layout**: Tailwind utilities. Use `hidden md:flex` / `flex md:hidden` for responsive breakpoints.
- **Machine colors**: Always read from `MACHINE_THEMES[kitId]` — never hardcode colors inside components.
- **Inline styles for dynamic values**: Theme colors are strings, not Tailwind classes, so `style={{ color: theme.accent }}` is the norm.
- **No comments on obvious code**: Comments are reserved for non-obvious invariants or workarounds.
- **No premature abstractions**: Add helpers only when the same pattern appears 3+ times with a clear boundary.

---

## MIDI

### Import

`useMidiImport.ts` reads a `.mid` file, maps MIDI notes to sequencer tracks:
- Channel 10 (GM percussion) → drum tracks, guesses `synthType` from MIDI note number
- Other channels → bass/synth tracks, pitch stored per step

### Export

`useExport.ts` reads the current store state and converts active steps to MIDI events using `@tonejs/midi`. BPM and step timing are encoded. Exported as a `.mid` file download.

---

## Deployment

Push to `main` → GitHub Actions builds with `yarn build` → uploads `dist/` → GitHub Pages.

The Vite `base` path is `/DnB/` (`vite.config.ts`). Sample assets are served from `public/samples/`.

Manual deploy:
```bash
yarn build
# dist/ is ready for any static host
```
