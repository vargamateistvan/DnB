import { useSequencerStore } from '../store/sequencerStore'

interface Props {
  onPlay: () => void
  onStop: () => void
}

export function Transport({ onPlay, onStop }: Props) {
  const bpm = useSequencerStore((s) => s.bpm)
  const swing = useSequencerStore((s) => s.swing)
  const stepCount = useSequencerStore((s) => s.stepCount)
  const isPlaying = useSequencerStore((s) => s.isPlaying)
  const setBpm = useSequencerStore((s) => s.setBpm)
  const setSwing = useSequencerStore((s) => s.setSwing)
  const setStepCount = useSequencerStore((s) => s.setStepCount)
  const loadPreset = useSequencerStore((s) => s.loadPreset)

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-dnb-surface border-b border-dnb-border">
      {/* Logo */}
      <div className="font-mono text-lg font-bold tracking-widest text-dnb-accent">
        DnB<span className="text-dnb-accent2">STUDIO</span>
      </div>

      {/* Play / Stop */}
      <div className="flex gap-2">
        <button
          onClick={isPlaying ? onStop : onPlay}
          className={`px-5 py-1.5 rounded font-mono text-sm font-bold tracking-wider transition-all
            ${isPlaying
              ? 'bg-dnb-accent text-white shadow-[0_0_12px_rgba(255,107,53,0.6)]'
              : 'bg-dnb-card border border-dnb-border text-dnb-text hover:border-dnb-accent'
            }`}
        >
          {isPlaying ? '■ STOP' : '▶ PLAY'}
        </button>
      </div>

      {/* BPM */}
      <div className="flex items-center gap-2">
        <label className="font-mono text-xs text-dnb-dim uppercase tracking-wider">BPM</label>
        <input
          type="range"
          min={60}
          max={220}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-28 accent-dnb-accent"
        />
        <input
          type="number"
          min={60}
          max={220}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-14 bg-dnb-card border border-dnb-border rounded px-2 py-1 font-mono text-sm text-dnb-text text-center focus:outline-none focus:border-dnb-accent"
        />
      </div>

      {/* Swing */}
      <div className="flex items-center gap-2">
        <label className="font-mono text-xs text-dnb-dim uppercase tracking-wider">SWING</label>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={swing}
          onChange={(e) => setSwing(Number(e.target.value))}
          className="w-24 accent-dnb-accent2"
        />
        <span className="font-mono text-xs text-dnb-dim w-8 text-right">
          {Math.round(swing * 100)}%
        </span>
      </div>

      {/* Step count */}
      <div className="flex items-center gap-1">
        <label className="font-mono text-xs text-dnb-dim uppercase tracking-wider mr-1">STEPS</label>
        {([16, 32] as const).map((n) => (
          <button
            key={n}
            onClick={() => setStepCount(n)}
            className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all
              ${stepCount === n
                ? 'bg-dnb-accent2 text-white'
                : 'bg-dnb-card border border-dnb-border text-dnb-dim hover:border-dnb-accent2'
              }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="flex items-center gap-1 ml-auto">
        <label className="font-mono text-xs text-dnb-dim uppercase tracking-wider mr-1">PRESET</label>
        <button
          onClick={() => loadPreset('amen')}
          className="px-3 py-1 rounded font-mono text-xs border border-dnb-border text-dnb-dim hover:border-dnb-active hover:text-dnb-active transition-all"
        >
          AMEN
        </button>
        <button
          onClick={() => loadPreset('clear')}
          className="px-3 py-1 rounded font-mono text-xs border border-dnb-border text-dnb-dim hover:border-red-500 hover:text-red-400 transition-all"
        >
          CLEAR
        </button>
      </div>
    </div>
  )
}
