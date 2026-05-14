import { useState, useCallback, useEffect } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import type { SequencerState } from '../types'

const NUM_SLOTS = 4
const slotKey = (n: number) => `dnb-slot-${n}`

export interface SlotMeta {
  savedAt: string
}

type SavedSlot = Partial<SequencerState> & { meta: SlotMeta }

function readMeta(slot: number): SlotMeta | null {
  try {
    const raw = localStorage.getItem(slotKey(slot))
    if (!raw) return null
    return (JSON.parse(raw) as SavedSlot).meta ?? null
  } catch {
    return null
  }
}

export function useSessionSlots() {
  const [metas, setMetas] = useState<(SlotMeta | null)[]>(() =>
    Array.from({ length: NUM_SLOTS }, (_, i) => readMeta(i))
  )

  const refresh = useCallback(() => {
    setMetas(Array.from({ length: NUM_SLOTS }, (_, i) => readMeta(i)))
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('dnb-slot-')) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  const save = useCallback((slot: number) => {
    const s = useSequencerStore.getState()
    const data: SavedSlot = {
      meta: { savedAt: new Date().toISOString() },
      tracks: s.tracks,
      bpm: s.bpm,
      swing: s.swing,
      stepCount: s.stepCount,
      kit: s.kit,
      activeKits: s.activeKits,
      mutedKits: s.mutedKits,
      trackKits: s.trackKits,
      machineParams: s.machineParams,
    }
    localStorage.setItem(slotKey(slot), JSON.stringify(data))
    refresh()
  }, [refresh])

  const load = useCallback((slot: number) => {
    try {
      const raw = localStorage.getItem(slotKey(slot))
      if (!raw) return
      const { meta: _meta, ...state } = JSON.parse(raw) as SavedSlot
      useSequencerStore.getState().loadState(state)
    } catch {}
  }, [])

  return { metas, save, load }
}
