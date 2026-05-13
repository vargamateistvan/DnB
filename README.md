# DnB Sequencer

A browser-based drum machine and bass line sequencer inspired by classic Roland hardware. Built with React 19, Vite 8, TypeScript, Tone.js, and Zustand.

## Features

- **Six machines** running simultaneously, each with its own pattern and controls:
  - **TR-808** — velocity-sensitive dot-matrix steps, amber/orange aesthetic
  - **TR-909** — dark rect buttons with red LED stripe, grey industrial aesthetic
  - **TR-606** — variable-size red circles, dark controls panel
  - **TR-707** — black dot circles on olive grid, cream/rust controls panel
  - **TB-303** — upward-pointing triangle grid, grey hardware aesthetic
  - **SH-101** — LED dot-matrix piano roll, blue hardware aesthetic
- **Piano roll** for TB-303 and SH-101 (2-octave range, B2–C1)
- **Per-step velocity** on TR-808 (right-click drag to adjust)
- **Machine mute** — click the speaker icon on the label strip
- **Track mute** — right-click any track label pad
- **Preview pad** — left-click any track label to trigger a one-shot preview
- **Custom tracks** — click `+` on any row to add a track below it; `×` to remove
- **Per-track volume** — hover a row to reveal the VOL knob on the right
- **Randomize** — RND button in every machine's controls panel
- **BPM control** and **16 / 32 / 64 step count** selection in the global header

## Getting started

```bash
yarn          # install dependencies
yarn dev      # start dev server at http://localhost:5173
yarn build    # production build → dist/
yarn preview  # preview the production build locally
```

## Project structure

```
src/
  machines.ts          # Visual themes, track definitions, default params per kit
  types/index.ts       # KitId, TrackId, Step, Track, MachineParams, SequencerState
  store/
    sequencerStore.ts  # Zustand store — all sequencer state and actions
  kits.ts              # Tone.js synth/sampler setup per kit
  hooks/               # useAudioEngine — wires Tone.js Transport to the store
  components/
    App.tsx            # Root layout, kit switcher, global transport controls
    MachinePanel.tsx   # Outer shell per machine (label strip + grid + controls)
    DrumGrid.tsx       # Step grid for all drum machines
    PianoRollGrid.tsx  # Piano roll grid for TB-303 and SH-101
    MachineControls.tsx# Per-machine controls panel (knobs, faders, waveform toggles)
    KnobControl.tsx    # Reusable SVG rotary knob
```

## Adding a new machine

1. Add the kit ID to `KitId` in `src/types/index.ts`
2. Add a theme entry in `MACHINE_THEMES` in `src/machines.ts`
3. Add track definitions in `MACHINE_TRACKS`
4. Add default params to `DEFAULT_MACHINE_PARAMS` and the matching param interface in `types/`
5. Wire up synths/samplers in `src/kits.ts`
6. Add a controls section in `MachineControls.tsx`

## Tech stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI |
| Vite | 8 | Build & dev server |
| TypeScript | 5 | Type safety (`strict`, `noUnusedLocals`, `verbatimModuleSyntax`) |
| Tone.js | 15 | Web Audio synthesis and scheduling |
| Zustand | 5 | Global sequencer state |
| Tailwind CSS | 3 | Utility-first styling |
