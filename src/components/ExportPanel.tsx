import { useState, useCallback } from 'react'
import type * as Tone from 'tone'
import { useExport } from '../hooks/useExport'
import { useSequencerStore } from '../store/sequencerStore'

interface Props {
  connectToRecorder: (recorder: Tone.Recorder) => void
}

export function ExportPanel({ connectToRecorder }: Props) {
  const [recording, setRecording] = useState(false)
  const isPlaying = useSequencerStore((s) => s.isPlaying)
  const { exportMidi, startRecording, stopRecording } = useExport(connectToRecorder)

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
    <div className="flex items-center gap-3 px-4 py-2 bg-dnb-surface border-t border-dnb-border">
      <span className="font-mono text-xs text-dnb-dim uppercase tracking-wider">EXPORT</span>

      <button
        onClick={exportMidi}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-dnb-border font-mono text-xs text-dnb-dim hover:border-dnb-accent2 hover:text-dnb-accent2 transition-all"
      >
        <span>⬇</span> MIDI
      </button>

      <button
        onClick={toggleRecord}
        disabled={!isPlaying && !recording}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-xs transition-all
          ${recording
            ? 'border-red-500 text-red-400 bg-red-500/10 animate-pulse'
            : 'border-dnb-border text-dnb-dim hover:border-dnb-accent hover:text-dnb-accent disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
      >
        <span>{recording ? '●' : '⏺'}</span>
        {recording ? 'STOP REC' : 'REC AUDIO'}
      </button>

      {!isPlaying && !recording && (
        <span className="font-mono text-[10px] text-dnb-muted italic">
          Press PLAY then REC AUDIO to capture as .webm
        </span>
      )}
    </div>
  )
}
