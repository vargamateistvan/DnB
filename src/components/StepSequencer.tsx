import { useSequencerStore } from '../store/sequencerStore'
import type { TrackId } from '../types'

interface Props {
  onPadTrigger: (trackId: TrackId) => void
}

export function StepSequencer({ onPadTrigger }: Props) {
  const tracks = useSequencerStore((s) => s.tracks)
  const currentStep = useSequencerStore((s) => s.currentStep)
  const stepCount = useSequencerStore((s) => s.stepCount)
  const isPlaying = useSequencerStore((s) => s.isPlaying)
  const toggleStep = useSequencerStore((s) => s.toggleStep)

  const groups = stepCount === 16
    ? [[0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15]]
    : [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[16,17,18,19],[20,21,22,23],[24,25,26,27],[28,29,30,31]]

  return (
    <div className="flex-1 overflow-auto px-4 py-3">
      <div className="space-y-1.5">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-2">
            {/* Pad / label */}
            <button
              onMouseDown={() => onPadTrigger(track.id)}
              className="w-16 shrink-0 py-1.5 rounded font-mono text-xs font-bold tracking-wider border transition-all active:scale-95"
              style={{
                borderColor: track.color + '60',
                color: track.muted ? '#4a4a6a' : track.color,
                textShadow: track.muted ? 'none' : `0 0 8px ${track.color}80`,
              }}
            >
              {track.label}
            </button>

            {/* Steps grouped into beats */}
            <div className="flex gap-1 flex-1">
              {groups.map((group, gi) => (
                <div key={gi} className="flex gap-0.5">
                  {group.map((stepIdx) => {
                    const step = track.steps[stepIdx]
                    const isActive = step?.active ?? false
                    const isCurrent = isPlaying && currentStep === stepIdx
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleStep(track.id, stepIdx)}
                        className="relative w-7 h-7 rounded-sm border transition-all duration-75 hover:opacity-80"
                        style={{
                          backgroundColor: isActive
                            ? track.color
                            : isCurrent
                            ? '#2a2a3a'
                            : '#13131a',
                          borderColor: isCurrent
                            ? '#ffffff50'
                            : isActive
                            ? track.color
                            : '#2a2a3a',
                          boxShadow: isActive
                            ? `0 0 6px ${track.color}80`
                            : isCurrent
                            ? '0 0 4px #ffffff30'
                            : 'none',
                          opacity: track.muted ? 0.3 : 1,
                        }}
                      >
                        {isActive && (
                          <span
                            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ backgroundColor: '#ffffff80' }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Beat numbers */}
      <div className="flex items-center gap-2 mt-2 ml-[72px]">
        <div className="flex gap-1 flex-1">
          {groups.map((group, gi) => (
            <div key={gi} className="flex gap-0.5">
              {group.map((stepIdx) => (
                <div
                  key={stepIdx}
                  className="w-7 text-center font-mono text-[9px] text-dnb-muted"
                >
                  {stepIdx % 4 === 0 ? stepIdx / 4 + 1 : '·'}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
