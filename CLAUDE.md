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

**Audio** is wired in `src/hooks/useAudioEngine.ts`. Call `Tone.start()` on first user gesture before playing.

**Six machines:** `tr808`, `tr909`, `tr606`, `tr707`, `tb303`, `sh101`.  
TR-808/606/707/909 use `DrumGrid.tsx`; TB-303 and SH-101 use `PianoRollGrid.tsx`.

**Key files:**
- `src/machines.ts` — themes, track defs, DEFAULT_MACHINE_PARAMS (no Tone imports)
- `src/kits.ts` — Tone.js synth/sampler factory (`buildKit`, `buildSingleSynth`)
- `src/store/sequencerStore.ts` — all state + actions
- `src/presets.ts` — machine presets (MACHINE_PRESETS)
- `src/types/index.ts` — `KitId`, `Track`, `Step` (step has `probability?: number`)

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

## TypeScript gotchas

- `noUnusedLocals: true` in tsconfig — unused variables break `yarn build`.
- Declare store selectors BEFORE any `useCallback` that references them (TDZ).
- Test files use `as SVGSVGElement` / `window` instead of `globalThis` for `fireEvent` calls.
