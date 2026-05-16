# DnB Sequencer

A browser-based drum machine and bass line sequencer inspired by classic Roland hardware. Built with React 19, Vite 8, TypeScript, Tone.js, and Zustand.

## Machines

Each machine runs its own independent 16/32/64-step pattern simultaneously.

### TR-808 — Rhythm Composer (1980)
Roland's most iconic drum machine. Fully analog, famous for its deep booming kick, snappy rimshot, and cowbell. The sound of hip-hop, trap, electro, and house.

**What you can do:**
- Toggle 10 drum voices: BD, SD, CH, OH, CP, RS, LT, HT, CY, CB
- Right-click an active step to adjust **velocity** (visual size + brightness changes)
- Right-click a track label to **mute/unmute** it; left-click to **preview** the sound
- Use the **LEVEL CONTROLS** panel to adjust per-track volume with knobs
- Load built-in groove **presets** or hit **RND** to randomize the pattern
- Hit **CLR** to wipe the pattern

### TR-909 — Rhythm Composer (1983)
Hybrid analog/PCM machine — analog kick, snare & hi-hats, PCM cymbals. The foundation of house and techno.

**What you can do:**
- Toggle 9 voices: BD, SD, CH, OH, HC, RM, LT, HT, CC
- Adjust **LEVEL** and **DECAY** per voice via the controls panel
- OH decay knob controls the open hi-hat tail length
- Same mute, preview, preset, and CLR controls as TR-808

### TR-606 — Drumatix (1981)
Compact analog companion to the TB-303. Thin, lo-fi, raw — beloved in electro, post-punk, and EBM.

**What you can do:**
- Toggle 8 voices: BD, SD, CH, OH, LT, HT, CY (clap and rim are synthesized)
- Adjust per-voice volume and decay in the controls panel

### TR-707 — Rhythm Composer (1984)
16-voice PCM drum machine with MIDI. Bright, punchy digital sounds that defined 80s pop and R&B.

**What you can do:**
- Toggle 9 digital voices: BD, SD, CH, OH, CP, RS, LT, HT, CY
- Per-voice level and tone controls in the panel

### TB-303 — Bass Line (1981)
Monophonic bass synthesizer with a resonant 18 dB lowpass filter. Originally meant to simulate bass guitar — accidentally invented acid house.

**What you can do:**
- Compose bass lines on a **2-octave piano roll** (C2–B2) — click a cell to set note + activate that step
- Click an already-active cell to move it to a different pitch row
- Adjust **CUTOFF**, **RESONANCE**, **ENV MOD**, **DECAY** and **ACCENT** knobs
- Toggle **WAVEFORM** between sawtooth and square
- Add **DISTORTION** and **DELAY** from the effects section
- Use the **pitch bender** strip for live pitch modulation

### SH-101 — Synthesizer (1982)
Monophonic analog synth with a sub-oscillator and 24 dB filter. Warm, fat bass lines and leads — key sound of new wave and synth-pop.

**What you can do:**
- Compose bass lines on the same **2-octave piano roll**
- Adjust **VCF** (cutoff, resonance) and **VCA** (attack, decay, sustain, release) envelopes
- Control **LFO** rate and depth for modulation
- Toggle between **PULSE** and **SAWTOOTH** waveforms
- Add **REVERB** from the effects section
- **PORTAMENTO** slider for glide between notes

---

## How to use

### Transport
| Control | Action |
|---------|--------|
| **▶ / ■** | Play / Stop |
| **BPM slider** | Set tempo (60–220) |
| **TAP** | Tap tempo — tap 2+ times to set BPM from your rhythm |
| **SWG** | Swing amount — adds a shuffle feel |
| **16 / 32 / 64** | Step count per pattern |
| **Kit toggles** | Enable or disable individual machines |

### Step sequencer (drum machines)
| Action | What it does |
|--------|-------------|
| Click a step | Toggle on/off |
| Right-click an **active** step | Open velocity + probability editor |
| Left-click a track label | Preview that instrument |
| Right-click a track label | Mute/unmute the track |
| Drag the ⠿ handle | Reorder tracks |
| Click **+** on a row | Add a custom track below |
| Click **×** on a row | Remove a custom track |

### Piano roll (TB-303 / SH-101)
| Action | What it does |
|--------|-------------|
| Click an empty cell | Activate step at that pitch |
| Click an active cell (same row) | Deactivate the step |
| Click an active cell (different row) | Move the note to that pitch |
| Beat numbers 1–4 | Show which beat each group starts on |

### Step probability
Right-click any **active** step to open a popover with two sliders:
- **VELOCITY** — how hard the step hits (affects volume and brightness)
- **PROB %** — chance the step fires on any given cycle (100% = always, 50% = fires half the time)

A `%` badge appears on steps with probability below 100%.

### Undo / Redo
- **Ctrl+Z** (or Cmd+Z on Mac) — undo the last pattern change
- **Ctrl+Y** / **Ctrl+Shift+Z** — redo

### Saving sessions
Open the **≡ menu** in the transport bar → **SONGS** to save and load up to 4 named sessions. State is also persisted automatically in localStorage.

### MIDI and audio export
| Button | Action |
|--------|--------|
| **↑MIDI** | Import a MIDI file into the active pattern |
| **↓MIDI** | Export the current pattern as a `.mid` file |
| **⏺ REC** | Record audio output — click again to stop and download as `.mp3` |

### Machine controls
- **Hover the machine name** (vertical label strip) — shows hardware specs and history
- **Click the speaker icon** — mute/unmute the entire machine
- **Drag the label strip** — reorder machines
- **PRESET** bar — load a built-in groove pattern for that machine
- **CLR** — clear all active steps for that machine
- **RND** — randomize the pattern

---

## Getting started

```bash
yarn          # install dependencies
yarn dev      # start dev server at http://localhost:5173
yarn build    # production build → dist/
yarn preview  # preview the production build locally
yarn test     # run the test suite
```

## Project structure

```
src/
  machines.ts          # Visual themes, track definitions, default params per kit
  presets.ts           # Built-in groove presets per machine
  types/index.ts       # KitId, TrackId, Step, Track, MachineParams, SequencerState
  store/
    sequencerStore.ts  # Zustand store — all state, actions, undo/redo history
  kits.ts              # Tone.js synth/sampler factory per kit
  hooks/
    useAudioEngine.ts  # Wires Tone.js Transport to the store
    useExport.ts       # MIDI export + audio recording
    useSongs.ts        # Session save/load (localStorage)
    useMidiImport.ts   # MIDI file import
  components/
    App.tsx            # Root layout, mobile tab bar, keyboard shortcuts
    Transport.tsx      # Global transport bar (BPM, play/stop, TAP, kit toggles)
    MachinePanel.tsx   # Outer shell per machine (label strip + grid + controls)
    DrumGrid.tsx       # Step grid for drum machines (TR-808/909/606/707)
    PianoRollGrid.tsx  # Piano roll for TB-303 and SH-101
    MachineControls.tsx# Per-machine controls panel (knobs, faders, effects)
    KnobControl.tsx    # Reusable SVG rotary knob
  test/
    *.test.tsx         # Component tests (vitest + @testing-library/react)
    mocks/             # Tone.js and Zustand store mocks
```

## Adding a new machine

1. Add the kit ID to `KitId` in `src/types/index.ts`
2. Add a theme entry in `MACHINE_THEMES` in `src/machines.ts`
3. Add track definitions in `MACHINE_TRACKS`
4. Add default params to `DEFAULT_MACHINE_PARAMS`
5. Wire up synths/samplers in `src/kits.ts`
6. Add a controls section in `MachineControls.tsx`

## Samples

Roland drum machine samples sourced from the **[Roland Clan Library](https://www.rolandclan.com/library/)**.

## Tech stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI |
| Vite | 8 | Build & dev server |
| TypeScript | 6 | Type safety (`strict`, `noUnusedLocals`, `verbatimModuleSyntax`) |
| Tone.js | 15 | Web Audio synthesis and scheduling |
| Zustand | 5 | Global sequencer state |
| Tailwind CSS | 3 | Utility-first styling |
| Vitest | 3 | Unit and component testing |
