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

  // ── Desktop drag-to-reorder ──────────────────────────────────────────────
  const dragKitRef   = useRef<KitId | null>(null)
  const [dragOverKit, setDragOverKit] = useState<KitId | null>(null)

  // ── Mobile state ─────────────────────────────────────────────────────────
  const [mobileKit, setMobileKit] = useState<KitId>(activeKits[0])
  const [showControls, setShowControls] = useState(false)

  // ── Mobile tab drag-to-reorder (Pointer Events) ──────────────────────────
  const tabDragRef = useRef<{ kitId: KitId; startX: number; startY: number; isDragging: boolean } | null>(null)
  const [tabDragging, setTabDragging] = useState<KitId | null>(null)
  const [tabDragOver, setTabDragOver] = useState<KitId | null>(null)
  const didTabDragRef = useRef(false)

  const onTabPointerDown = (kitId: KitId, e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    tabDragRef.current = { kitId, startX: e.clientX, startY: e.clientY, isDragging: false }
  }

  const onTabPointerMove = (kitId: KitId, e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = tabDragRef.current
    if (!drag || drag.kitId !== kitId) return
    const dx = Math.abs(e.clientX - drag.startX)
    const dy = Math.abs(e.clientY - drag.startY)
    if (!drag.isDragging) {
      if (dx < 10 || dx <= dy) return
      drag.isDragging = true
      setTabDragging(kitId)
    }
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const over = el?.closest('[data-tabkit]')?.getAttribute('data-tabkit') as KitId | null
    setTabDragOver(over ?? null)
  }

  const onTabPointerUp = (kitId: KitId) => {
    const drag = tabDragRef.current
    if (!drag || drag.kitId !== kitId) return
    if (drag.isDragging) {
      didTabDragRef.current = true
      if (tabDragOver && tabDragOver !== kitId) reorderKit(kitId, tabDragOver)
    }
    tabDragRef.current = null
    setTabDragging(null)
    setTabDragOver(null)
  }

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
            color: showControls ? MACHINE_THEMES[mobileKit].accent : '#888',
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
                data-tabkit={kitId}
                onClick={() => {
                  if (didTabDragRef.current) { didTabDragRef.current = false; return }
                  setMobileKit(kitId); setShowControls(false)
                }}
                onPointerDown={(e) => onTabPointerDown(kitId, e)}
                onPointerMove={(e) => onTabPointerMove(kitId, e)}
                onPointerUp={() => onTabPointerUp(kitId)}
                onPointerCancel={() => onTabPointerUp(kitId)}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all"
                style={{
                  background: isSel ? theme.surface : 'transparent',
                  borderTop: `2px solid ${tabDragOver === kitId ? theme.accent : isSel ? theme.accent : 'transparent'}`,
                  opacity: tabDragging === kitId ? 0.4 : 1,
                  touchAction: 'none',
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
