import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES, isBassLine } from '../machines'
import { MachineControls } from './MachineControls'
import { DrumGrid } from './DrumGrid'
import { PianoRollGrid } from './PianoRollGrid'
import type { KitId } from '../types'

const KIT_LABELS: Record<KitId, string> = {
  tr808: 'TR-808', tr909: 'TR-909', tr606: 'TR-606',
  tr707: 'TR-707', tb303: 'TB-303', sh101: 'SH-101',
}

interface Props {
  readonly kitId: KitId
  readonly onPadTrigger: (trackId: string) => void
  readonly onPlay: () => void
  readonly onStop: () => void
}

export function MachinePanel({ kitId, onPadTrigger, onPlay, onStop }: Props) {
  const mutedKits = useSequencerStore((s) => s.mutedKits)
  const toggleMachineKitMute = useSequencerStore((s) => s.toggleMachineKitMute)
  const theme = MACHINE_THEMES[kitId]
  const isBass = isBassLine(kitId)
  const isMuted = mutedKits.includes(kitId)

  return (
    <div
      className="flex flex-col shrink-0 border-b"
      style={{ borderColor: theme.border, opacity: isMuted ? 0.45 : 1 }}
    >
      {/* Main content row: label strip + grid */}
      <div className="flex">
        {/* Label strip: machine name + mute button */}
        <div
          className="shrink-0 flex flex-col items-center justify-between py-2"
          style={{ width: '20px', background: theme.surface, borderRight: `1px solid ${theme.border}` }}
        >
          <button
            onClick={() => toggleMachineKitMute(kitId)}
            title={isMuted ? 'Unmute machine' : 'Mute machine'}
            className="select-none transition-colors flex items-center justify-center"
            style={{ color: isMuted ? '#ef4444' : theme.textDim }}
          >
            {isMuted ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.63 3.63a1 1 0 0 0 0 1.41L7.29 8.7 7 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l4 4a1 1 0 0 0 1.7-.71v-2.58l4.18 4.18a1 1 0 0 0 1.41-1.41L5.05 3.63a1 1 0 0 0-1.42 0ZM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53A8.93 8.93 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71Zm-7-8-1.88 1.88L12 7.76V4a1 1 0 0 0-1.7-.71l-.74.74L12 6.56V4Z"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <span
            className="font-mono text-xs tracking-widest select-none whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: theme.accent }}
          >
            {KIT_LABELS[kitId]}
          </span>
        </div>

        {/* Grid */}
        {isBass
          ? <PianoRollGrid kitId={kitId} onPadTrigger={onPadTrigger} />
          : <DrumGrid kitId={kitId} onPadTrigger={onPadTrigger} />
        }
      </div>

      <MachineControls kitId={kitId} onPlay={onPlay} onStop={onStop} />
    </div>
  )
}
