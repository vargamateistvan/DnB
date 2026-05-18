# DnB Sequencer — Claude Code Instructions

## Commands

```bash
yarn dev          # dev server at http://localhost:5173
yarn build        # tsc -b && vite build  (strict, noUnusedLocals)
yarn test --run   # run all tests once (vitest)
yarn deploy       # build + gh-pages deploy to GitHub Pages
```

## Architecture

**Stack:** React 19 · Vite 8 · TypeScript 6 · Tone.js 15 · Zustand 5 · Tailwind 3

**State** lives entirely in `src/store/sequencerStore.ts` (Zustand with `persist` middleware).  
Module-level `_history` / `_future` arrays power undo/redo without hitting localStorage.  
`StepCount` type is `16 | 32 | 64 | 128`.

**Audio** is wired in `src/hooks/useAudioEngine.ts`. Call `Tone.start()` on first user gesture before playing. `Tone.Chorus` and `Tone.LFO` `.start()` must be deferred to the `play()` callback — never call them at component mount (browser autoplay policy).

**Six machines:** `tr808`, `tr909`, `tr606`, `tr707`, `tb303`, `sh101`.  
TR-808/606/707/909 use `DrumGrid.tsx`; TB-303 and SH-101 use `PianoRollGrid.tsx` (2-octave grid, B3→C2).

**Key files:**
- `src/machines.ts` — themes, track defs, DEFAULT_MACHINE_PARAMS (no Tone imports)
- `src/kits.ts` — Tone.js synth/sampler factory (`buildKit`, `buildSingleSynth`)
- `src/store/sequencerStore.ts` — all state + actions
- `src/presets.ts` — per-machine presets (MACHINE_PRESETS)
- `src/songPresets.ts` — full-app song presets (SONG_PRESETS, SongPreset type)
- `src/types/index.ts` — `KitId`, `Track`, `Step` (step has `probability?: number`, `note?: string`)

## Audio signal chains

**TB-303:** `MonoSynth → Filter(-24dB) → Distortion → Channel`  
- Internal MonoSynth filter is bypassed (freq: 20000, Q: 0); external Filter handles VCF  
- `sweepBassFilter` schedules filter envelope per step; accent extends decay and raises peak  
- Distortion wet level scales with `accent` param

**SH-101:** `MonoSynth → Filter(-24dB) → Chorus → Channel`  
  Sub-osc: `Synth(square) → Gain(subOsc) → Filter` (same filter input)  
  PWM LFO: `LFO → MonoSynth.oscillator.width`  
- Chorus and PWM LFO are created at init but `.start()` is deferred to `play()`  
- `vcfMod` controls chorus wet (0.2–0.7) and LFO depth/rate  
- `sweepBassFilter` uses `vcfEnv` for both sweep amount and decay time

**TR-909:** Sample players → AmplitudeEnvelope → Channel (for kick, snare, toms, OH)

## Store persist / merge

The `merge` function in the persist config must guarantee all base tracks (including `sh101_bass`, `tb303_bass`) are always present even if the persisted localStorage state is from an older version. Pattern:

```ts
const baseMap = new Map(current.tracks.map((t) => [t.id, t]))
const persistedMap = new Map((p.tracks ?? []).map((t) => [t.id, t]))
const tracks = [
  ...current.tracks.map((t) => persistedMap.get(t.id) ?? t),  // base tracks, persisted overrides
  ...(p.tracks ?? []).filter((t) => !baseMap.has(t.id)),       // custom tracks
]
```

## Song presets

`SongPreset` in `src/songPresets.ts`:
```ts
interface SongPreset {
  name: string; artist: string; bpm: number
  stepCount?: 16 | 32 | 64
  activeKits: KitId[]
  machineParams?: Partial<{ [K in KitId]: Partial<MachineParams[K]> }>
  tracks: Partial<Record<string, PresetStep[]>>
}
```
`loadSongPreset` action in the store resizes all tracks to `stepCount`, applies patterns, sets `activeKits`, `bpm`, and resets `machineParams` to defaults merged with preset overrides.

## Testing

Tests live in `src/test/`. Run with `yarn test --run`.

**Config split:** `vite.config.ts` (build only, imports from `'vite'`) and `vitest.config.ts` (test only, imports from `'vitest/config'`, casts `react()` plugin as `any` to avoid rolldown/rollup type conflict between Vite 8 and vitest's bundled Vite).

**Mock pattern:**
```ts
vi.mock('../store/sequencerStore', () => ({
  useSequencerStore: vi.fn((selector) => selector(currentState)),
}))
```
`currentState` is a mutable `let` overridden per test via `beforeEach`.

Tone.js is mocked via `vi.mock('tone', () => import('./mocks/tone'))`.

## Key behaviours

- **Undo/redo:** Ctrl+Z / Ctrl+Y. History arrays are module-level, not persisted.
- **Tap tempo:** TAP button (or `onPointerDown`). Averages last 8 tap intervals.
- **Step probability:** Right-click an active step to open a popover with VELOCITY and PROB % sliders.
- **Mobile drag:** Tab bar supports pointer-based drag-and-drop (`data-tabkit` attribute + `document.elementFromPoint`).
- **`draggable` on MachinePanel:** only `true` when `onMachineDragStart` prop is provided, to avoid interfering with range inputs.
- **TB-303 square waveform:** PianoRollGrid renders square note cells instead of triangles when `machineParams.tb303.waveform === 'square'`.

## TypeScript gotchas

- `noUnusedLocals: true` in tsconfig — unused variables break `yarn build`.
- Declare store selectors BEFORE any `useCallback` that references them (TDZ).
- Test files use `as SVGSVGElement` / `window` instead of `globalThis` for `fireEvent` calls.
- Never chain `.start()` on Tone node constructors — the TypeScript return type may be `void`, causing ref assignment to fail. Always separate: `const x = new Tone.Chorus(...)` then `x.start()`.
- `Tone.Chorus` and `Tone.LFO` require `.start()` after `Tone.start()` (user gesture). Calling them at component mount throws an AudioContext suspended warning.
