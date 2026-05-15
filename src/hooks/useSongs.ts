import { useState, useCallback, useEffect } from 'react'
import { useSequencerStore } from '../store/sequencerStore'
import type { SequencerState } from '../types'

const STORAGE_KEY = 'dnb-songs'

export interface SongEntry {
  id: string
  name: string
  savedAt: string
  state: Partial<SequencerState>
}

function readAll(): SongEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SongEntry[]
  } catch {
    return []
  }
}

function writeAll(songs: SongEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
}

function captureState(): Partial<SequencerState> {
  const s = useSequencerStore.getState()
  return {
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
}

export function useSongs() {
  const [songs, setSongs] = useState<SongEntry[]>(readAll)

  const refresh = useCallback(() => setSongs(readAll()), [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  const saveSong = useCallback((name: string) => {
    const entry: SongEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || `Song ${Date.now()}`,
      savedAt: new Date().toISOString(),
      state: captureState(),
    }
    const updated = [entry, ...readAll()]
    writeAll(updated)
    setSongs(updated)
    return entry.id
  }, [])

  const loadSong = useCallback((id: string) => {
    const song = readAll().find((s) => s.id === id)
    if (!song) return
    useSequencerStore.getState().loadState(song.state)
  }, [])

  const deleteSong = useCallback((id: string) => {
    const updated = readAll().filter((s) => s.id !== id)
    writeAll(updated)
    setSongs(updated)
  }, [])

  const renameSong = useCallback((id: string, name: string) => {
    const updated = readAll().map((s) =>
      s.id === id ? { ...s, name: name.trim() || s.name } : s
    )
    writeAll(updated)
    setSongs(updated)
  }, [])

  return { songs, saveSong, loadSong, deleteSong, renameSong }
}
