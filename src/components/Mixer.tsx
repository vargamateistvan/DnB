import { useSequencerStore } from '../store/sequencerStore'

export function Mixer() {
  const tracks = useSequencerStore((s) => s.tracks)
  const setVolume = useSequencerStore((s) => s.setVolume)
  const toggleMute = useSequencerStore((s) => s.toggleMute)

  return (
    <div className="flex gap-1 px-4 py-3 bg-dnb-surface border-t border-dnb-border overflow-x-auto">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="flex flex-col items-center gap-1.5 min-w-[52px]"
        >
          {/* Volume readout */}
          <span className="font-mono text-[9px] text-dnb-muted">
            {Math.round(track.volume * 100)}
          </span>

          {/* Vertical fader */}
          <div className="relative h-20 flex items-center justify-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={track.volume}
              onChange={(e) => setVolume(track.id, Number(e.target.value))}
              className="absolute h-20 w-3 cursor-pointer"
              style={{
                writingMode: 'vertical-lr',
                direction: 'rtl',
                accentColor: track.color,
                opacity: track.muted ? 0.3 : 1,
              }}
            />
          </div>

          {/* Mute button */}
          <button
            onClick={() => toggleMute(track.id)}
            className="w-10 py-0.5 rounded font-mono text-[9px] font-bold border transition-all"
            style={{
              borderColor: track.muted ? '#4a4a6a' : track.color + '80',
              color: track.muted ? '#4a4a6a' : track.color,
              backgroundColor: track.muted ? 'transparent' : track.color + '15',
            }}
          >
            {track.muted ? 'OFF' : 'ON'}
          </button>

          {/* Label */}
          <span
            className="font-mono text-[9px] font-bold tracking-wider truncate w-full text-center"
            style={{ color: track.muted ? '#4a4a6a' : track.color }}
          >
            {track.label}
          </span>
        </div>
      ))}
    </div>
  )
}
