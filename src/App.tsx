import { useAudioEngine } from './hooks/useAudioEngine'
import { Transport } from './components/Transport'
import { MachinePanel } from './components/MachinePanel'
import { useSequencerStore } from './store/sequencerStore'

export default function App() {
  const { play, stop, triggerPad, connectToRecorder } = useAudioEngine()
  const activeKits = useSequencerStore((s) => s.activeKits)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#111' }}>
      <Transport onPlay={play} onStop={stop} connectToRecorder={connectToRecorder} />
      <div className="flex flex-col flex-1 min-h-0 overflow-auto">
        {activeKits.map((kitId) => (
          <MachinePanel key={kitId} kitId={kitId} onPadTrigger={triggerPad} />
        ))}
      </div>
    </div>
  )
}
