import { useRef, useState } from 'react'
import { useAudioEngine } from './hooks/useAudioEngine'
import { Transport } from './components/Transport'
import { MachinePanel } from './components/MachinePanel'
import { useSequencerStore } from './store/sequencerStore'
import type { KitId } from './types'

export default function App() {
  const { play, stop, triggerPad, connectToRecorder } = useAudioEngine()
  const activeKits  = useSequencerStore((s) => s.activeKits)
  const reorderKit  = useSequencerStore((s) => s.reorderKit)

  const dragKitRef    = useRef<KitId | null>(null)
  const [dragOverKit, setDragOverKit] = useState<KitId | null>(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#111' }}>
      <Transport onPlay={play} onStop={stop} connectToRecorder={connectToRecorder} />
      <div className="flex flex-col flex-1 min-h-0 overflow-auto gap-2">
        {activeKits.map((kitId) => (
          <MachinePanel
            key={kitId} kitId={kitId}
            onPadTrigger={triggerPad} onPlay={play} onStop={stop}
            isDragOver={dragOverKit === kitId}
            onMachineDragStart={() => { dragKitRef.current = kitId }}
            onMachineDragOver={(e) => { e.preventDefault(); if (dragKitRef.current !== kitId) setDragOverKit(kitId) }}
            onMachineDragLeave={() => setDragOverKit(null)}
            onMachineDrop={() => { if (dragKitRef.current) reorderKit(dragKitRef.current, kitId); setDragOverKit(null) }}
            onMachineDragEnd={() => { dragKitRef.current = null; setDragOverKit(null) }}
          />
        ))}
      </div>
    </div>
  )
}
