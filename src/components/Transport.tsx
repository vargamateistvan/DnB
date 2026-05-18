import { useState, useCallback, useRef, type ReactNode } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import { KIT_LIST } from '../kits'
import { MACHINE_THEMES } from '../machines'
import { Oscilloscope } from './Oscilloscope'
import { useExport } from '../hooks/useExport'
import { useSongs, type SongEntry } from '../hooks/useSongs'
import { useMidiImport } from '../hooks/useMidiImport'
import { SONG_PRESETS } from '../songPresets'

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

const MACHINES_INFO: { name: string; year: string; tagline: string; chipBg: string; chipText: string; items: string[] }[] = [
  {
    name: 'TR-808', year: '1980',
    chipBg: MACHINE_THEMES.tr808.surface, chipText: MACHINE_THEMES.tr808.accent,
    tagline: 'Analog drum machine — the sound of hip-hop, trap & electro.',
    items: [
      '10 voices: BD, SD, CH, OH, CP, RS, LT, HT, CY, CB',
      'Right-click an active step to set velocity and probability',
      'LEVEL CONTROLS panel — per-voice volume knobs',
    ],
  },
  {
    name: 'TR-909', year: '1983',
    chipBg: MACHINE_THEMES.tr909.surface, chipText: MACHINE_THEMES.tr909.accent,
    tagline: 'Hybrid analog/PCM machine — foundation of house & techno.',
    items: [
      '9 voices: BD, SD, CH, OH, HC, RM, LT, HT, CC',
      'Per-voice LEVEL and DECAY controls in the panel',
      'OH DECAY knob controls open hi-hat tail length',
    ],
  },
  {
    name: 'TR-606', year: '1981',
    chipBg: MACHINE_THEMES.tr606.surface, chipText: MACHINE_THEMES.tr606.accent,
    tagline: 'Compact analog — raw lo-fi textures for electro & post-punk.',
    items: [
      '8 voices; clap and rim are synthesized (no samples)',
      'Per-voice volume and decay in the controls panel',
    ],
  },
  {
    name: 'TR-707', year: '1984',
    chipBg: MACHINE_THEMES.tr707.surface, chipText: MACHINE_THEMES.tr707.accent,
    tagline: 'PCM digital — bright punchy sounds that defined 80s pop & R&B.',
    items: [
      '9 digital voices: BD, SD, CH, OH, CP, RS, LT, HT, CY',
      'Per-voice level and tone controls in the panel',
    ],
  },
  {
    name: 'TB-303', year: '1981',
    chipBg: MACHINE_THEMES.tb303.surface, chipText: MACHINE_THEMES.tb303.accent,
    tagline: 'Acid bass synth — the squelch that launched acid house.',
    items: [
      'Click a piano roll cell to set a note and activate that step',
      'Click an active cell on a different row to move the note',
      'CUTOFF, RESONANCE, ENV MOD, DECAY, ACCENT knobs',
      'WAVEFORM toggle (sawtooth / square) · DISTORTION · DELAY',
      'Pitch bender strip for live modulation',
    ],
  },
  {
    name: 'SH-101', year: '1982',
    chipBg: MACHINE_THEMES.sh101.surface, chipText: MACHINE_THEMES.sh101.accent,
    tagline: 'Monophonic analog synth — warm leads & fat basslines.',
    items: [
      'Same 2-octave piano roll as the TB-303',
      'VCF (cutoff, resonance) and VCA (ADSR) envelope controls',
      'LFO rate and depth · PORTAMENTO glide slider',
      'WAVEFORM toggle (pulse / sawtooth) · REVERB effect',
    ],
  },
]

const HOW_TO_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: 'Step Sequencer',
    items: [
      'Click a step to toggle it on/off',
      'Right-click an active step → set VELOCITY and PROB % (chance it fires)',
      'Left-click a track label to preview that sound',
      'Right-click a track label to mute/unmute the track',
      'Drag the ⠿ handle on a row to reorder tracks',
      'Click + on a row to add a custom track · × to remove it',
    ],
  },
  {
    title: 'Piano Roll (TB-303 & SH-101)',
    items: [
      'Click an empty cell to activate a step at that pitch',
      'Click an active cell on the same row to deactivate it',
      'Click an active cell on a different row to move the note',
      'Beat numbers 1–4 above the grid mark each group of 4 steps',
    ],
  },
  {
    title: 'Transport & Pattern',
    items: [
      'TAP the TAP button 2+ times to set BPM from your rhythm',
      'SWG slider adds a shuffle/swing feel to the groove',
      'Choose 16, 32, 64, or 128 steps per pattern',
      'Ctrl+Z / Ctrl+Y (Cmd on Mac) — undo / redo pattern changes',
      'RND randomizes · AMEN loads the Amen break · CLR clears all steps',
    ],
  },
  {
    title: 'Machines',
    items: [
      'Toggle machines on/off from the kit buttons in the transport bar',
      'Drag the vertical label strip to reorder machines',
      'Click the speaker icon on the label strip to mute an entire machine',
      'Hover the machine name to see hardware specs & history',
      'PRESET bar loads a built-in groove · CLR wipes it · RND randomizes',
    ],
  },
  {
    title: 'Sessions & Export',
    items: [
      'SONGS — save and load named sessions (state also persists automatically)',
      '↑MIDI imports a MIDI file into the active pattern',
      '↓MIDI exports the current pattern as a .mid file',
      '⏺ REC records audio output — click again to stop and download as .mp3',
    ],
  },
  {
    title: 'Mobile',
    items: [
      'Use the bottom tab bar to switch between machines',
      'Drag the tab bar to reorder machines',
      'Tap Controls (▲) to reveal the machine control panel',
    ],
  },
]

function HowToUseModal({ onClose }: { readonly onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto flex flex-col"
        style={{ background: '#191919', border: `1px solid ${BORDER}`, borderRadius: '6px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: BORDER }}
        >
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: '0.12em', color: '#fff' }}>
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

        <div className="flex flex-col gap-6 px-5 py-5">

          {/* Machines */}
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest mb-3" style={{ color: TEXT_DIM }}>
              Machines
            </div>
            <div className="flex flex-col gap-3">
              {MACHINES_INFO.map((m) => (
                <div key={m.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                        fontSize: '11px', letterSpacing: '0.1em',
                        background: m.chipBg, color: m.chipText,
                        padding: '1px 6px', borderRadius: '2px',
                        flexShrink: 0,
                      }}
                    >{m.name}</span>
                    <span className="font-mono text-[9px]" style={{ color: '#444' }}>{m.year}</span>
                    <span className="font-mono text-[9px]" style={{ color: '#666' }}>— {m.tagline}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 pl-2">
                    {m.items.map((item) => (
                      <div key={item} className="flex items-start gap-2 font-mono text-[10px]" style={{ color: '#888' }}>
                        <span style={{ color: '#555', flexShrink: 0 }}>·</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: BORDER }} />

          {/* How-to sections */}
          {HOW_TO_SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: TEXT_DIM }}>
                {s.title}
              </div>
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
  const [menuOpen, setMenuOpen]         = useState(false)
  const [showHelp, setShowHelp]         = useState(false)
  const [showSongs, setShowSongs]       = useState(false)
  const [showSongPresets, setShowSongPresets] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [recording, setRecording]       = useState(false)
  const tapTimesRef  = useRef<number[]>([])
  const tapResetRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { exportMidi, startRecording, stopRecording } = useExport(connectToRecorder)
  const { songs, saveSong, loadSong, deleteSong, renameSong } = useSongs()
  const { importMidi }              = useMidiImport()

  const bpm        = useSequencerStore((s) => s.bpm)
  const swing      = useSequencerStore((s) => s.swing)
  const masterTune = useSequencerStore((s) => s.masterTune)
  const stepCount  = useSequencerStore((s) => s.stepCount)
  const isPlaying  = useSequencerStore((s) => s.isPlaying)
  const activeKits = useSequencerStore((s) => s.activeKits)
  const setBpm     = useSequencerStore((s) => s.setBpm)
  const setSwing   = useSequencerStore((s) => s.setSwing)
  const setMasterTune  = useSequencerStore((s) => s.setMasterTune)
  const setStepCount   = useSequencerStore((s) => s.setStepCount)
  const toggleKit      = useSequencerStore((s) => s.toggleKit)
  const loadSongPreset = useSequencerStore((s) => s.loadSongPreset)
  const resetAll       = useSequencerStore((s) => s.resetAll)

  const handleTap = useCallback(() => {
    const now = Date.now()
    const times = tapTimesRef.current
    if (times.length > 0 && now - times[times.length - 1] > 2000) times.length = 0
    times.push(now)
    if (tapResetRef.current) clearTimeout(tapResetRef.current)
    tapResetRef.current = setTimeout(() => { tapTimesRef.current = [] }, 2000)
    if (times.length < 2) return
    if (times.length > 8) times.splice(0, times.length - 8)
    let total = 0
    for (let i = 1; i < times.length; i++) total += times[i] - times[i - 1]
    setBpm(Math.max(60, Math.min(220, Math.round(60000 / (total / (times.length - 1))))))
  }, [setBpm])

  const toggleRecord = useCallback(async () => {
    if (recording) { await stopRecording(); setRecording(false) }
    else           { await startRecording(); setRecording(true) }
  }, [recording, startRecording, stopRecording])

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

  const stepCountBtns = (([16, 32, 64, 128] as const)).map((n) => (
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
          <button
            onPointerDown={handleTap}
            className="shrink-0 px-2 h-7 font-mono text-[10px] font-bold select-none"
            style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM, touchAction: 'none' }}
          >TAP</button>
        </div>

        <Oscilloscope width={72} height={28} />

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

          {/* Master tune */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest w-8 shrink-0" style={{ color: TEXT_DIM }}>A4</span>
            <input
              type="range" min={432} max={444} step={1} value={masterTune}
              onChange={(e) => setMasterTune(Number(e.target.value))}
              className="flex-1 cursor-pointer"
              style={{ accentColor: '#fff' }}
            />
            <span className="font-mono text-[10px] tabular-nums w-8 text-right" style={{ color: TEXT_DIM }}>{masterTune} Hz</span>
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

          {/* Presets + Songs */}
          <button
            onClick={() => { setMenuOpen(false); setShowSongPresets(true) }}
            className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
            style={{ color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f59e0b' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
          >★ Song presets</button>
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
            <button
              onClick={() => { setMenuOpen(false); setShowResetConfirm(true) }}
              className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{ color: TEXT_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
            >⟳ Reset everything</button>
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

  // ── Desktop layout (≥ md) — two rows ──────────────────────────────────────
  const desktopLayout = (
    <div
      className="hidden md:flex flex-col shrink-0 border-b select-none relative"
      style={{ background: BG, borderColor: BORDER }}
    >
      {/* Row 1: machine tabs · play · step count · oscilloscope · actions */}
      <div className="flex items-center gap-4 px-4 h-10">
        <div className="flex items-center gap-4">
          {kitTabs}
        </div>

        <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

        {playStopBtn}

        <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

        {/* Step count */}
        <div className="flex items-center gap-1 shrink-0">
          {(([16, 32, 64, 128] as const)).map((n) => (
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

        {/* Oscilloscope */}
        <Oscilloscope width={100} height={24} />

        {/* Right: MIDI + record + reset + menu */}
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
            onClick={() => setShowResetConfirm(true)}
            className="font-mono text-[10px] font-bold px-2 h-5 transition-all shrink-0"
            style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
            title="Reset all machines and settings"
          >RST</button>

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
      </div>

      {/* Row 2: BPM · SWG · A4 */}
      <div
        className="flex items-center gap-5 px-4 h-8 border-t"
        style={{ borderColor: BORDER }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TEXT_DIM }}>BPM</span>
          <input
            type="range" min={60} max={220} step={1} value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-28 cursor-pointer"
            style={{ accentColor: '#fff' }}
          />
          <span className="font-mono text-sm font-bold tabular-nums w-8" style={{ color: TEXT }}>{bpm}</span>
          <button
            onPointerDown={handleTap}
            className="px-2 h-5 font-mono text-[10px] font-bold select-none shrink-0"
            style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM, touchAction: 'none' }}
          >TAP</button>
        </div>

        <div className="w-px h-4 shrink-0" style={{ background: BORDER }} />

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TEXT_DIM }}>SWG</span>
          <input
            type="range" min={0} max={100} step={1} value={Math.round(swing * 100)}
            onChange={(e) => setSwing(Number(e.target.value) / 100)}
            className="w-24 cursor-pointer"
            style={{ accentColor: '#fff' }}
          />
          <span className="font-mono text-[10px] tabular-nums w-6" style={{ color: TEXT_DIM }}>{Math.round(swing * 100)}%</span>
        </div>

        <div className="w-px h-4 shrink-0" style={{ background: BORDER }} />

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TEXT_DIM }}>A4</span>
          <input
            type="range" min={432} max={444} step={1} value={masterTune}
            onChange={(e) => setMasterTune(Number(e.target.value))}
            className="w-20 cursor-pointer"
            style={{ accentColor: '#fff' }}
          />
          <span className="font-mono text-[10px] tabular-nums w-12" style={{ color: TEXT_DIM }}>{masterTune} Hz</span>
        </div>
      </div>

      {/* Desktop dropdown */}
      {menuOpen && (
        <div
          className="absolute top-full right-0 z-50 mt-1 px-4 py-3 font-mono text-xs flex flex-col gap-4"
          style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '4px', minWidth: '200px' }}
        >
          <button
            onClick={() => { setMenuOpen(false); setShowSongPresets(true) }}
            className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
            style={{ color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f59e0b' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
          >★ Song presets</button>
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
            <button
              onClick={() => { setMenuOpen(false); setShowResetConfirm(true) }}
              className="text-left font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{ color: TEXT_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
            >⟳ Reset everything</button>
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
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)' }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="flex flex-col gap-5 px-6 py-5"
            style={{ background: '#191919', border: `1px solid #3a3a3a`, borderRadius: '6px', minWidth: '280px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: '0.12em', color: '#fff' }}>
                RESET EVERYTHING
              </span>
              <span className="font-mono text-[10px]" style={{ color: TEXT_DIM }}>
                All patterns, BPM, and machine settings will be cleared. This cannot be undone.
              </span>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 h-8 font-mono text-[10px] font-bold transition-all"
                style={{ background: 'transparent', border: '1px solid #333', borderRadius: '3px', color: TEXT_DIM }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#ccc' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
              >CANCEL</button>
              <button
                onClick={() => { resetAll(); onStop(); setShowResetConfirm(false) }}
                className="px-4 h-8 font-mono text-[10px] font-bold transition-all"
                style={{ background: '#f87171', border: '1px solid #f87171', borderRadius: '3px', color: '#000' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fca5a5' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f87171' }}
              >RESET</button>
            </div>
          </div>
        </div>
      )}
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
      {showSongPresets && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowSongPresets(false)}
        >
          <div
            className="flex flex-col gap-0 overflow-hidden"
            style={{ background: '#141414', border: `1px solid #2a2a2a`, borderRadius: '6px', minWidth: '340px', maxWidth: '480px', width: '90vw', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
              <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>★ Song Presets</span>
              <button onClick={() => setShowSongPresets(false)} className="font-mono text-lg leading-none" style={{ color: '#555' }}>×</button>
            </div>
            <div className="overflow-y-auto">
              {SONG_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => { loadSongPreset(preset); setShowSongPresets(false) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b group"
                  style={{ borderColor: '#1e1e1e', background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1e1e1e' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs font-bold" style={{ color: '#fff' }}>{preset.name}</span>
                    <span className="font-mono text-[10px]" style={{ color: '#555' }}>{preset.artist}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex gap-1">
                      {preset.activeKits.map((k) => (
                        <span key={k} className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ background: MACHINE_THEMES[k].surface, color: MACHINE_THEMES[k].accent }}>{KIT_LIST.find((kit) => kit.id === k)?.label ?? k}</span>
                      ))}
                    </div>
                    <span className="font-mono text-[10px] tabular-nums" style={{ color: '#555' }}>{preset.stepCount ?? 16}st</span>
                    <span className="font-mono text-[10px] tabular-nums" style={{ color: '#f59e0b' }}>{preset.bpm}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
