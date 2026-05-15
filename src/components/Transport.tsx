import { useState, useCallback, useRef, type ReactNode } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import { KIT_LIST } from '../kits'
import { useExport } from '../hooks/useExport'
import { useSongs, type SongEntry } from '../hooks/useSongs'
import { useMidiImport } from '../hooks/useMidiImport'

interface Props {
  readonly onPlay: () => void
  readonly onStop: () => void
  readonly connectToRecorder: (r: Tone.Recorder) => void
}

const BG = '#111'
const BORDER = '#2a2a2a'
const TEXT_DIM = '#555'
const TEXT = '#ccc'

function SmallBtn({
  onClick, children, hoverColor = '#60a5fa', title, disabled = false,
}: {
  onClick: () => void
  children: ReactNode
  hoverColor?: string
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-2 h-7 font-mono text-[10px] font-bold transition-all shrink-0 disabled:opacity-30"
      style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = hoverColor; e.currentTarget.style.color = hoverColor } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
    >
      {children}
    </button>
  )
}

function HowToUseModal({ onClose }: { readonly onClose: () => void }) {
  const sections: { title: string; items: string[] }[] = [
    {
      title: 'Step Sequencer',
      items: [
        'Click any step button to toggle it on/off',
        'Right-click a pad label to mute/unmute that track',
        'Click a pad label to preview the sound',
        'Drag the 6-dot handle on a row to reorder tracks',
      ],
    },
    {
      title: 'Machines',
      items: [
        'Toggle machines on/off from the top bar',
        'Drag the vertical label strip to reorder machines',
        'Hover the machine name for hardware specs & history',
        'Each machine has hardware-style controls (knobs, faders, envelopes)',
      ],
    },
    {
      title: 'Transport & Pattern',
      items: [
        'BPM slider controls tempo (60–220)',
        'SWG (Swing) adds shuffle feel to the groove',
        'Choose 16, 32, or 64 steps per pattern',
        'RND randomizes the pattern · AMEN loads the Amen break · CLR clears all steps',
      ],
    },
    {
      title: 'Sessions & MIDI',
      items: [
        'Save/load up to 4 sessions — state is persisted across refreshes',
        '↑MIDI imports a MIDI file into the active pattern',
        '↓MIDI exports the current pattern as a MIDI file',
        'Red button records audio output — click again to stop & download',
      ],
    },
    {
      title: 'Mobile',
      items: [
        'Use the bottom tab bar to switch between machines',
        'Tap Controls (▲) to reveal the machine control panel',
        'BPM slider and machine toggles are always in the top bar',
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto flex flex-col"
        style={{ background: '#191919', border: `1px solid ${BORDER}`, borderRadius: '6px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: BORDER }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.12em',
              color: '#fff',
            }}
          >
            HOW TO USE
          </span>
          <button
            onClick={onClose}
            className="font-mono text-lg leading-none transition-colors"
            style={{ color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
          >×</button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-5 py-4">
          {sections.map((s) => (
            <div key={s.title}>
              <div
                className="font-mono text-[9px] uppercase tracking-widest mb-2"
                style={{ color: TEXT_DIM }}
              >{s.title}</div>
              <div className="flex flex-col gap-1.5">
                {s.items.map((item) => (
                  <div key={item} className="flex items-start gap-2 font-mono text-[11px]" style={{ color: '#aaa' }}>
                    <span style={{ color: '#555', flexShrink: 0 }}>·</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SongLibraryDialog({
  songs, saveSong, loadSong, deleteSong, renameSong, onClose,
}: {
  readonly songs: SongEntry[]
  readonly saveSong: (name: string) => string
  readonly loadSong: (id: string) => void
  readonly deleteSong: (id: string) => void
  readonly renameSong: (id: string, name: string) => void
  readonly onClose: () => void
}) {
  const [newName, setNewName]     = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    saveSong(newName.trim() || `Song ${songs.length + 1}`)
    setNewName('')
  }

  const startRename = (song: SongEntry) => {
    setRenamingId(song.id)
    setRenameVal(song.name)
  }

  const commitRename = () => {
    if (renamingId) renameSong(renamingId, renameVal)
    setRenamingId(null)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col"
        style={{ background: '#191919', border: `1px solid ${BORDER}`, borderRadius: '6px', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: '0.12em', color: '#fff' }}>
            SONG LIBRARY
          </span>
          <button
            onClick={onClose}
            className="font-mono text-lg leading-none transition-colors"
            style={{ color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
          >×</button>
        </div>

        {/* Save row */}
        <div className="flex gap-2 px-5 py-3 border-b shrink-0" style={{ borderColor: BORDER }}>
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={`Song ${songs.length + 1}`}
            className="flex-1 font-mono text-[11px] bg-transparent outline-none"
            style={{ border: `1px solid ${BORDER}`, borderRadius: '3px', padding: '5px 8px', color: TEXT }}
          />
          <button
            onClick={handleSave}
            className="px-3 h-8 font-mono text-[10px] font-bold transition-all shrink-0"
            style={{ background: 'transparent', border: '1px solid #333', borderRadius: '3px', color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.color = '#4ade80' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
          >SAVE</button>
        </div>

        {/* Song list */}
        <div className="flex-1 overflow-y-auto">
          {songs.length === 0 ? (
            <div className="px-5 py-10 text-center font-mono text-[10px]" style={{ color: TEXT_DIM }}>
              No songs saved yet
            </div>
          ) : songs.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-3 px-5 py-2.5 border-b group"
              style={{ borderColor: BORDER }}
            >
              {renamingId === song.id ? (
                <input
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  onBlur={commitRename}
                  autoFocus
                  className="flex-1 font-mono text-[11px] bg-transparent outline-none"
                  style={{ border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '2px 4px', color: TEXT }}
                />
              ) : (
                <button
                  className="flex-1 text-left font-mono text-[11px] truncate"
                  style={{ color: TEXT }}
                  onDoubleClick={() => startRename(song)}
                  title="Double-click to rename"
                >{song.name}</button>
              )}
              <span className="font-mono text-[9px] shrink-0 tabular-nums" style={{ color: '#555' }}>
                {new Date(song.savedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                {' '}
                {new Date(song.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => { loadSong(song.id); onClose() }}
                className="shrink-0 px-2 h-6 font-mono text-[9px] font-bold transition-all"
                style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.color = '#60a5fa' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
              >LOAD</button>
              <button
                onClick={() => deleteSong(song.id)}
                className="shrink-0 w-5 h-5 font-mono text-sm leading-none transition-colors opacity-0 group-hover:opacity-60 hover:!opacity-100"
                style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666' }}
                title="Delete"
              >×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Transport({ onPlay, onStop, connectToRecorder }: Props) {
  const [menuOpen, setMenuOpen]     = useState(false)
  const [showHelp, setShowHelp]     = useState(false)
  const [showSongs, setShowSongs]   = useState(false)
  const [recording, setRecording]   = useState(false)
  const { exportMidi, startRecording, stopRecording } = useExport(connectToRecorder)
  const { songs, saveSong, loadSong, deleteSong, renameSong } = useSongs()
  const { importMidi }              = useMidiImport()

  const toggleRecord = useCallback(async () => {
    if (recording) { await stopRecording(); setRecording(false) }
    else           { await startRecording(); setRecording(true) }
  }, [recording, startRecording, stopRecording])

  const bpm        = useSequencerStore((s) => s.bpm)
  const swing      = useSequencerStore((s) => s.swing)
  const stepCount  = useSequencerStore((s) => s.stepCount)
  const isPlaying  = useSequencerStore((s) => s.isPlaying)
  const activeKits = useSequencerStore((s) => s.activeKits)
  const setBpm     = useSequencerStore((s) => s.setBpm)
  const setSwing   = useSequencerStore((s) => s.setSwing)
  const setStepCount  = useSequencerStore((s) => s.setStepCount)
  const toggleKit  = useSequencerStore((s) => s.toggleKit)

  // ── Shared sub-elements ────────────────────────────────────────────────────

  const playStopBtn = (
    <button
      onClick={isPlaying ? onStop : onPlay}
      className="shrink-0 font-mono text-sm font-bold tracking-wider transition-all px-4 py-1.5"
      style={{
        background: isPlaying ? '#fff' : 'transparent',
        border: `1px solid ${isPlaying ? '#fff' : '#444'}`,
        borderRadius: '3px',
        color: isPlaying ? '#000' : TEXT,
        minWidth: '44px',
      }}
    >
      {isPlaying ? '■' : '▶'}
    </button>
  )

  const kitTabs = KIT_LIST.map((kit) => {
    const isActive = activeKits.includes(kit.id)
    return (
      <button
        key={kit.id}
        onClick={() => toggleKit(kit.id)}
        title={`${kit.label} (${kit.year}) — ${kit.description}`}
        className="flex items-center gap-2 transition-all shrink-0"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 transition-all"
          style={{
            background: isActive ? '#22c55e' : '#3a3a3a',
            boxShadow: isActive ? '0 0 7px #22c55e99' : 'none',
          }}
        />
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.06em',
            color: isActive ? '#ffffff' : '#484848',
            textDecoration: isActive ? 'none' : 'line-through',
            transition: 'color 150ms',
          }}
        >
          {kit.label}
        </span>
      </button>
    )
  })

  const stepCountBtns = ([16, 32, 64] as const).map((n) => (
    <button
      key={n}
      onClick={() => setStepCount(n)}
      className="w-8 h-7 font-mono text-[10px] font-bold transition-all"
      style={{
        background: stepCount === n ? '#fff' : 'transparent',
        border: `1px solid ${stepCount === n ? '#fff' : '#333'}`,
        borderRadius: '2px',
        color: stepCount === n ? '#000' : TEXT_DIM,
      }}
    >
      {n}
    </button>
  ))

  const openSongs = () => { setMenuOpen(false); setShowSongs(true) }

  // ── Mobile layout (< md) ───────────────────────────────────────────────────
  const mobileLayout = (
    <div className="flex flex-col md:hidden shrink-0 border-b select-none" style={{ background: BG, borderColor: BORDER }}>

      {/* Row 1: play + BPM + menu */}
      <div className="flex items-center gap-3 h-12 px-3">
        {playStopBtn}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-widest shrink-0" style={{ color: TEXT_DIM }}>BPM</span>
          <input
            type="range" min={60} max={220} step={1} value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1 cursor-pointer"
            style={{ accentColor: '#fff' }}
          />
          <span className="font-mono text-sm font-bold tabular-nums w-9 text-right shrink-0" style={{ color: TEXT }}>{bpm}</span>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex flex-col gap-1 justify-center items-center w-9 h-9 shrink-0"
          style={{
            border: `1px solid ${menuOpen ? '#fff' : '#333'}`,
            borderRadius: '3px',
            background: menuOpen ? '#fff' : 'transparent',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="block w-4 h-px" style={{ background: menuOpen ? '#000' : TEXT_DIM }} />
          ))}
        </button>
      </div>

      {/* Row 2: kit tabs + step count */}
      <div
        className="flex items-center h-9 px-3 gap-3 border-t"
        style={{ borderColor: BORDER }}
      >
        <div className="flex-1 flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {kitTabs}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {stepCountBtns}
        </div>
      </div>

      {/* Expandable drawer */}
      {menuOpen && (
        <div
          className="flex flex-col gap-4 px-3 py-4 border-t"
          style={{ background: '#141414', borderColor: BORDER }}
        >
          {/* Swing */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest w-8 shrink-0" style={{ color: TEXT_DIM }}>SWG</span>
            <input
              type="range" min={0} max={100} step={1} value={Math.round(swing * 100)}
              onChange={(e) => setSwing(Number(e.target.value) / 100)}
              className="flex-1 cursor-pointer"
              style={{ accentColor: '#fff' }}
            />
            <span className="font-mono text-[10px] tabular-nums w-8 text-right" style={{ color: TEXT_DIM }}>{Math.round(swing * 100)}%</span>
          </div>

          {/* MIDI + Record */}
          <div className="flex items-center gap-2 flex-wrap">
            <SmallBtn onClick={importMidi} hoverColor="#4ade80" title="Import MIDI">↑MIDI</SmallBtn>
            <SmallBtn onClick={exportMidi} hoverColor="#60a5fa" title="Export MIDI">↓MIDI</SmallBtn>
            <button
              onClick={toggleRecord}
              className="w-8 h-7 rounded-full transition-all shrink-0 flex items-center justify-center"
              style={{
                background: recording ? '#fff' : '#ef4444',
                boxShadow: recording ? '0 0 8px #ffffff80' : '0 0 6px #ef444480',
              }}
              title={recording ? 'Stop recording' : 'Record audio'}
            />
          </div>

          {/* Songs */}
          <button
            onClick={openSongs}
            className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
            style={{ color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#4ade80' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
          >♪ Song library ({songs.length})</button>

          {/* Help & Report */}
          <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: BORDER }}>
            <button
              onClick={() => { setMenuOpen(false); setShowHelp(true) }}
              className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{ color: TEXT_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
            >? How to use</button>
            <a
              href="https://github.com/vargamateistvan/DnB/issues"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{ color: TEXT_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
            >⚑ Report a problem</a>
          </div>
        </div>
      )}
    </div>
  )

  // ── Desktop layout (≥ md) ──────────────────────────────────────────────────
  const desktopLayout = (
    <div
      className="hidden md:flex shrink-0 items-center gap-5 px-4 h-10 border-b select-none relative"
      style={{ background: BG, borderColor: BORDER }}
    >
      {/* Machine tabs */}
      <div className="flex items-center gap-4">
        {kitTabs}
      </div>

      <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

      {playStopBtn}

      <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

      {/* BPM */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TEXT_DIM }}>BPM</span>
        <input
          type="range" min={60} max={220} step={1} value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-24 cursor-pointer"
          style={{ accentColor: '#fff' }}
        />
        <span className="font-mono text-sm font-bold tabular-nums w-8" style={{ color: TEXT }}>{bpm}</span>
      </div>

      {/* Swing */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TEXT_DIM }}>SWG</span>
        <input
          type="range" min={0} max={100} step={1} value={Math.round(swing * 100)}
          onChange={(e) => setSwing(Number(e.target.value) / 100)}
          className="w-16 cursor-pointer"
          style={{ accentColor: '#fff' }}
        />
        <span className="font-mono text-[10px] tabular-nums w-6" style={{ color: TEXT_DIM }}>{Math.round(swing * 100)}%</span>
      </div>

      <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

      {/* Step count */}
      <div className="flex items-center gap-1 shrink-0">
        {([16, 32, 64] as const).map((n) => (
          <button
            key={n}
            onClick={() => setStepCount(n)}
            className="w-7 h-5 font-mono text-[10px] font-bold transition-all"
            style={{
              background: stepCount === n ? '#fff' : 'transparent',
              border: `1px solid ${stepCount === n ? '#fff' : '#333'}`,
              borderRadius: '2px',
              color: stepCount === n ? '#000' : TEXT_DIM,
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Right: MIDI + record + menu */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        <button
          onClick={importMidi}
          className="font-mono text-[10px] font-bold px-2 h-5 transition-all shrink-0"
          style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.color = '#4ade80' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
          title="Import MIDI"
        >↑MIDI</button>

        <button
          onClick={exportMidi}
          className="font-mono text-[10px] font-bold px-2 h-5 transition-all shrink-0"
          style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.color = '#60a5fa' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
          title="Export MIDI"
        >↓MIDI</button>

        <button
          onClick={toggleRecord}
          className="w-6 h-6 rounded-full transition-all shrink-0"
          style={{
            background: recording ? '#fff' : '#ef4444',
            boxShadow: recording ? '0 0 8px #ffffff80' : '0 0 6px #ef444480',
          }}
          title={recording ? 'Stop recording' : 'Record audio'}
        />

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex flex-col gap-1 justify-center items-center w-6 h-6 shrink-0"
          title="More options"
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="block w-4 h-px" style={{ background: TEXT_DIM }} />
          ))}
        </button>
      </div>

      {/* Desktop dropdown */}
      {menuOpen && (
        <div
          className="absolute top-full right-0 z-50 mt-1 px-4 py-3 font-mono text-xs flex flex-col gap-4"
          style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '4px', minWidth: '200px' }}
        >
          <button
            onClick={openSongs}
            className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
            style={{ color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#4ade80' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
          >♪ Song library ({songs.length})</button>
          <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: BORDER }}>
            <button
              onClick={() => { setMenuOpen(false); setShowHelp(true) }}
              className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{ color: TEXT_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
            >? How to use</button>
            <a
              href="https://github.com/vargamateistvan/DnB/issues"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{ color: TEXT_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
            >⚑ Report a problem</a>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {mobileLayout}
      {desktopLayout}
      {showHelp && <HowToUseModal onClose={() => setShowHelp(false)} />}
      {showSongs && (
        <SongLibraryDialog
          songs={songs}
          saveSong={saveSong}
          loadSong={loadSong}
          deleteSong={deleteSong}
          renameSong={renameSong}
          onClose={() => setShowSongs(false)}
        />
      )}
    </>
  )
}
