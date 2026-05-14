import { useState, useCallback } from 'react'
import * as Tone from 'tone'
import { useSequencerStore } from '../store/sequencerStore'
import { KIT_LIST } from '../kits'
import { useExport } from '../hooks/useExport'
import { useSessionSlots } from '../hooks/useSessionSlots'
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
  children: React.ReactNode
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

export function Transport({ onPlay, onStop, connectToRecorder }: Props) {
  const [menuOpen, setMenuOpen]     = useState(false)
  const [recording, setRecording]   = useState(false)
  const { exportMidi, startRecording, stopRecording } = useExport(connectToRecorder)
  const { metas, save, load }       = useSessionSlots()
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
  const loadPreset = useSequencerStore((s) => s.loadPreset)
  const randomize  = useSequencerStore((s) => s.randomize)

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
        className="flex items-center gap-1.5 transition-all shrink-0"
        style={{ opacity: isActive ? 1 : 0.35 }}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: isActive ? kit.color : '#555' }} />
        <span
          className="font-mono text-xs font-bold tracking-wider"
          style={{ color: isActive ? '#fff' : TEXT_DIM, textDecoration: isActive ? 'none' : 'line-through' }}
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

  const presetBtns = ([
    { label: 'RND',  action: () => randomize(),        hover: '#a78bfa' },
    { label: 'AMEN', action: () => loadPreset('amen'), hover: '#60a5fa' },
    { label: 'CLR',  action: () => loadPreset('clear'),hover: '#f87171' },
  ] as const).map(({ label, action, hover }) => (
    <SmallBtn key={label} onClick={action} hoverColor={hover}>{label}</SmallBtn>
  ))

  const slotsPanel = (
    <div className="flex flex-col gap-2">
      <span style={{ color: TEXT_DIM }} className="font-mono text-[10px] uppercase tracking-widest">Slots</span>
      {(['s1', 's2', 's3', 's4'] as const).map((id, slotIndex) => {
        const meta = metas[slotIndex]
        return (
          <div key={id} className="flex items-center gap-2">
            <span className="font-mono w-5 text-[10px]" style={{ color: TEXT_DIM }}>{id.toUpperCase()}</span>
            <SmallBtn onClick={() => save(slotIndex)} hoverColor="#4ade80">SAVE</SmallBtn>
            <button
              onClick={() => load(slotIndex)}
              disabled={!meta}
              className="px-2 h-7 font-mono text-[10px] font-bold transition-all disabled:opacity-30"
              style={{
                background: 'transparent',
                border: `1px solid ${meta ? '#333' : '#222'}`,
                borderRadius: '2px',
                color: meta ? TEXT_DIM : '#333',
              }}
              onMouseEnter={(e) => { if (meta) { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.color = '#60a5fa' } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = meta ? '#333' : '#222'; e.currentTarget.style.color = meta ? TEXT_DIM : '#333' }}
            >LOAD</button>
            <span className="font-mono text-[9px]" style={{ color: '#444' }}>
              {meta ? new Date(meta.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )

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

          {/* Presets + MIDI + Record */}
          <div className="flex items-center gap-2 flex-wrap">
            {presetBtns}
            <div className="w-px h-5 shrink-0" style={{ background: BORDER }} />
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

          {/* Slots */}
          {slotsPanel}
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

      {/* Presets */}
      <div className="flex items-center gap-1 shrink-0">
        {([
          { label: 'RND',  action: () => randomize(),        hover: '#a78bfa' },
          { label: 'AMEN', action: () => loadPreset('amen'), hover: '#60a5fa' },
          { label: 'CLR',  action: () => loadPreset('clear'),hover: '#f87171' },
        ] as const).map(({ label, action, hover }) => (
          <button
            key={label}
            onClick={action}
            className="px-2 h-5 font-mono text-[10px] font-bold transition-all"
            style={{ background: 'transparent', border: '1px solid #333', borderRadius: '2px', color: TEXT_DIM }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = hover; e.currentTarget.style.color = hover }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = TEXT_DIM }}
          >
            {label}
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
          className="absolute top-full right-0 z-50 mt-1 px-4 py-3 font-mono text-xs flex flex-col gap-2"
          style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '4px', minWidth: '200px' }}
        >
          {slotsPanel}
        </div>
      )}
    </div>
  )

  return (
    <>
      {mobileLayout}
      {desktopLayout}
    </>
  )
}
