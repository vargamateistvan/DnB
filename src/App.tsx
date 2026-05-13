import { useAudioEngine } from './hooks/useAudioEngine'
import { Transport } from './components/Transport'
import { StepSequencer } from './components/StepSequencer'
import { Mixer } from './components/Mixer'
import { ExportPanel } from './components/ExportPanel'

export default function App() {
  const { play, stop, triggerPad, connectToRecorder } = useAudioEngine()

  return (
    <div className="flex flex-col h-screen bg-dnb-bg text-dnb-text font-mono overflow-hidden">
      <Transport onPlay={play} onStop={stop} />
      <StepSequencer onPadTrigger={triggerPad} />
      <Mixer />
      <ExportPanel connectToRecorder={connectToRecorder} />
    </div>
  )
}
