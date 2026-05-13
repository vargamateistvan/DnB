import { useState, useCallback } from 'react'
import type * as Tone from 'tone'
import { useExport } from '../hooks/useExport'
import { useSequencerStore } from '../store/sequencerStore'
import { MACHINE_THEMES } from '../machines'

interface Props {
  connectToRecorder: (recorder: Tone.Recorder) => void
}

export function ExportPanel({ connectToRecorder }: Props) {
  const [recording, setRecording] = useState(false)
  const isPlaying = useSequencerStore((s) => s.isPlaying)
  const kit = useSequencerStore((s) => s.kit)
  const { exportMidi, startRecording, stopRecording } = useExport(connectToRecorder)
  const theme = MACHINE_THEMES[kit]

  const toggleRecord = useCallback(async () => {
    if (recording) {
      await stopRecording()
      setRecording(false)
    } else {
      await startRecording()
      setRecording(true)
    }
  }, [recording, startRecording, stopRecording])

  return (
    <div
      className="shrink-0 flex items-center gap-3 px-4 py-2 border-t"
      style={{ background: theme.surface, borderColor: theme.border }}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: theme.textDim }}>
        EXPORT
      </span>

      <button
        onClick={exportMidi}
        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold transition-all"
        style={{
          border: `1px solid ${theme.border}`,
          borderRadius: '3px',
          color: theme.textDim,
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.accent
          e.currentTarget.style.color = theme.accent
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border
          e.currentTarget.style.color = theme.textDim
        }}
      >
        ⬇ MIDI
      </button>

      <button
        onClick={toggleRecord}
        disabled={!isPlaying && !recording}
        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          border: `1px solid ${recording ? '#ef4444' : theme.border}`,
          borderRadius: '3px',
          color: recording ? '#ef4444' : theme.textDim,
          background: recording ? '#ef444415' : 'transparent',
        }}
      >
        {recording ? '● STOP REC' : '⏺ REC AUDIO'}
      </button>

      {!isPlaying && !recording && (
        <span className="font-mono text-[10px] italic" style={{ color: theme.textDim }}>
          Press START then REC AUDIO to capture .webm
        </span>
      )}
    </div>
  )
}
