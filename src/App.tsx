import { useEffect, useRef, useState } from 'react'
import { useAudioEngine } from './hooks/useAudioEngine'
import { Transport } from './components/Transport'
import { MachinePanel } from './components/MachinePanel'
import { MachineControls } from './components/MachineControls'
import { useSequencerStore } from './store/sequencerStore'
import { MACHINE_THEMES } from './machines'
import { KIT_LIST } from './kits'
import type { KitId } from './types'

export default function App() {
  const { play, stop, triggerPad, connectToRecorder } = useAudioEngine()
  const activeKits = useSequencerStore((s) => s.activeKits)
  const reorderKit = useSequencerStore((s) => s.reorderKit)

  const dragKitRef   = useRef<KitId | null>(null)
  const [dragOverKit, setDragOverKit] = useState<KitId | null>(null)

  const [mobileKit, setMobileKit] = useState<KitId>(activeKits[0])
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    if (!activeKits.includes(mobileKit)) setMobileKit(activeKits[0])
  }, [activeKits, mobileKit])

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: '#111' }}>
      <Transport onPlay={play} onStop={stop} connectToRecorder={connectToRecorder} />

      {/* ── Desktop: vertical scrollable stack ───────────────────────────── */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-auto gap-2">
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

      {/* ── Mobile: single machine, tab bar, controls drawer ─────────────── */}
      <div className="flex md:hidden flex-col flex-1 min-h-0">

        {/* Grid — scrollable */}
        <div className="flex-1 min-h-0 overflow-auto">
          <MachinePanel
            key={mobileKit}
            kitId={mobileKit}
            onPadTrigger={triggerPad}
            onPlay={play}
            onStop={stop}
            hideControls
          />
        </div>

        {/* Controls toggle */}
        <button
          onClick={() => setShowControls((v) => !v)}
          className="shrink-0 flex items-center justify-center gap-2 h-9 font-mono text-[10px] uppercase tracking-widest border-t"
          style={{
            background: showControls ? MACHINE_THEMES[mobileKit].panel : '#0d0d0d',
            borderColor: MACHINE_THEMES[mobileKit].border,
            color: MACHINE_THEMES[mobileKit].accent,
          }}
        >
          <span style={{ fontSize: '8px' }}>{showControls ? '▼' : '▲'}</span>
          <span>Controls</span>
        </button>

        {/* Controls drawer */}
        {showControls && (
          <div className="shrink-0 overflow-x-auto border-b" style={{ maxHeight: '38vh', borderColor: MACHINE_THEMES[mobileKit].border }}>
            <MachineControls kitId={mobileKit} onPlay={play} onStop={stop} />
          </div>
        )}

        {/* Machine tab bar */}
        <div className="shrink-0 flex border-t" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
          {activeKits.map((kitId) => {
            const theme = MACHINE_THEMES[kitId]
            const meta  = KIT_LIST.find((k) => k.id === kitId)
            const isSel = kitId === mobileKit
            return (
              <button
                key={kitId}
                onClick={() => { setMobileKit(kitId); setShowControls(false) }}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all"
                style={{
                  background: isSel ? theme.surface : 'transparent',
                  borderTop: `2px solid ${isSel ? theme.accent : 'transparent'}`,
                }}
              >
                <span
                  className="select-none font-bold"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    color: isSel ? theme.accent : '#555',
                  }}
                >
                  {meta?.label ?? kitId}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
