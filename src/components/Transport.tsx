import { useState, useCallback } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import { KIT_LIST } from '../kits'
import { useExport } from '../hooks/useExport'

interface Props {
  onPlay: () => void
  onStop: () => void
  connectToRecorder: (r: Tone.Recorder) => void
}

const BG = '#111'
const BORDER = '#2a2a2a'
const TEXT_DIM = '#555'
const TEXT = '#ccc'

export function Transport({ onPlay, onStop, connectToRecorder }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const { exportMidi, startRecording, stopRecording } = useExport(connectToRecorder)

  const toggleRecord = useCallback(async () => {
    if (recording) { await stopRecording(); setRecording(false) }
    else { await startRecording(); setRecording(true) }
  }, [recording, startRecording, stopRecording])

  const bpm        = useSequencerStore((s) => s.bpm)
  const swing      = useSequencerStore((s) => s.swing)
  const stepCount  = useSequencerStore((s) => s.stepCount)
  const isPlaying  = useSequencerStore((s) => s.isPlaying)
  const activeKits = useSequencerStore((s) => s.activeKits)
  const setBpm     = useSequencerStore((s) => s.setBpm)
  const setSwing   = useSequencerStore((s) => s.setSwing)
  const setStepCount = useSequencerStore((s) => s.setStepCount)
  const toggleKit  = useSequencerStore((s) => s.toggleKit)
  const loadPreset = useSequencerStore((s) => s.loadPreset)
  const randomize  = useSequencerStore((s) => s.randomize)

  return (
    <div
      className="shrink-0 flex items-center gap-5 px-4 h-10 border-b select-none relative"
      style={{ background: BG, borderColor: BORDER }}
    >
      {/* ── Machine tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {KIT_LIST.map((kit) => {
          const isActive = activeKits.includes(kit.id)
          return (
            <button
              key={kit.id}
              onClick={() => toggleKit(kit.id)}
              title={`${kit.label} (${kit.year}) — ${kit.description}`}
              className="flex items-center gap-1.5 transition-all"
              style={{ opacity: isActive ? 1 : 0.35 }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: isActive ? kit.color : '#555' }}
              />
              <span
                className="font-mono text-xs font-bold tracking-wider"
                style={{
                  color: isActive ? '#fff' : TEXT_DIM,
                  textDecoration: isActive ? 'none' : 'line-through',
                }}
              >
                {kit.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

      {/* ── Play / Stop ──────────────────────────────────────────────────── */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        className="shrink-0 font-mono text-xs font-bold tracking-wider transition-all px-3 py-1"
        style={{
          background: isPlaying ? '#fff' : 'transparent',
          border: `1px solid ${isPlaying ? '#fff' : '#444'}`,
          borderRadius: '3px',
          color: isPlaying ? '#000' : TEXT,
        }}
      >
        {isPlaying ? '■' : '▶'}
      </button>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

      {/* ── BPM slider ───────────────────────────────────────────────────── */}
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

      {/* ── Swing slider ─────────────────────────────────────────────────── */}
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

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />

      {/* ── Step count ───────────────────────────────────────────────────── */}
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

      {/* ── Presets ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        {([
          { label: 'RND',   action: randomize,                 hover: '#a78bfa' },
          { label: 'AMEN',  action: () => loadPreset('amen'),  hover: '#60a5fa' },
          { label: 'CLR',   action: () => loadPreset('clear'), hover: '#f87171' },
        ] as const).map(({ label, action, hover }) => (
          <button
            key={label}
            onClick={action}
            className="px-2 h-5 font-mono text-[10px] font-bold transition-all"
            style={{ background: 'transparent', border: `1px solid #333`, borderRadius: '2px', color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = hover; e.currentTarget.style.color = hover }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Right side: record + menu ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        {/* MIDI export */}
        <button
          onClick={exportMidi}
          className="font-mono text-[10px] font-bold px-2 h-5 transition-all shrink-0"
          style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.color = '#60a5fa' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
          title="Export MIDI"
        >MIDI</button>

        {/* Record button */}
        <button
          onClick={toggleRecord}
          className="w-6 h-6 rounded-full transition-all shrink-0"
          style={{
            background: recording ? '#fff' : '#ef4444',
            boxShadow: recording ? '0 0 8px #ffffff80' : '0 0 6px #ef444480',
          }}
          title={recording ? 'Stop recording' : 'Record audio'}
        />

        {/* Hamburger / menu */}
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

      {/* ── Dropdown menu ────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="absolute top-full right-0 z-50 mt-1 px-4 py-3 font-mono text-xs flex flex-col gap-2"
          style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '4px', minWidth: '160px' }}
        >
          <span style={{ color: TEXT_DIM }} className="text-[10px] uppercase tracking-widest">About</span>
          <span style={{ color: TEXT }}>DnB Studio</span>
          <span style={{ color: TEXT_DIM }}>6 Roland machines</span>
        </div>
      )}
    </div>
  )
}
