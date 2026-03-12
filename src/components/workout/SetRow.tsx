import { useState, useEffect } from 'react'
import type { WorkoutSet } from '@/types'
import { estimate1RM } from '@/lib/progressionEngine'

interface Props {
  set: WorkoutSet
  setIndex: number
  onChange: (updated: WorkoutSet) => void
  onTimerStart?: () => void
  isCompound: boolean
}

export function SetRow({ set, setIndex, onChange, onTimerStart }: Props) {
  const [isPRFlash, setIsPRFlash] = useState(false)

  useEffect(() => {
    if (set.isPR) {
      setIsPRFlash(true)
      const t = setTimeout(() => setIsPRFlash(false), 2000)
      return () => clearTimeout(t)
    }
  }, [set.isPR])

  const updateWeight = (val: string) => {
    const w = parseFloat(val) || 0
    const orm = w > 0 && set.actualR > 0 ? estimate1RM(w, set.actualR) : 0
    onChange({ ...set, actualW: w, orm: orm > 0 ? orm : undefined })
  }

  const updateReps = (val: string) => {
    const r = parseInt(val) || 0
    const orm = set.actualW > 0 && r > 0 ? estimate1RM(set.actualW, r) : 0
    onChange({ ...set, actualR: r, orm: orm > 0 ? orm : undefined })
  }

  const handleDone = () => {
    const newDone = !set.done
    onChange({ ...set, done: newDone, fail: newDone ? false : set.fail })
    if (newDone && onTimerStart) onTimerStart()
  }

  const handleFail = () => {
    onChange({ ...set, fail: !set.fail, done: true })
  }

  const tagLabel = set.tag === 'W' ? 'W' : set.tag === '★' ? '★' : String(setIndex + 1)
  const tagCls = set.tag === '★'
    ? 'text-amber-400 border-amber-400/20 bg-amber-400/5'
    : set.tag === 'W'
    ? 'text-[#444] border-[#1a1a20]'
    : 'text-[#555] border-[#1a1a20]'

  return (
    <div
      className={`set-row transition-all duration-200 ${
        isPRFlash ? 'pr-glow rounded-lg bg-amber-500/5' : ''
      } ${set.done && !set.fail ? 'opacity-60' : ''}`}
    >
      {/* Tag */}
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-[11px] flex-shrink-0 ${tagCls}`}>
        {tagLabel}
      </div>

      {/* Weight */}
      <input
        type="number"
        inputMode="decimal"
        value={set.actualW || ''}
        onChange={e => updateWeight(e.target.value)}
        placeholder={set.targetW.toString()}
        className="number-input flex-1"
        style={{ fontSize: '1.05rem' }}
      />

      <span className="font-mono text-[#2a2a30] text-sm">×</span>

      {/* Reps */}
      <input
        type="number"
        inputMode="numeric"
        value={set.actualR || ''}
        onChange={e => updateReps(e.target.value)}
        placeholder={set.targetR.toString()}
        className="number-input flex-1"
        style={{ fontSize: '1.05rem' }}
      />

      {/* 1RM — shown after done */}
      {set.orm && set.done ? (
        <div className="w-10 text-center flex-shrink-0">
          <span className={`font-mono text-xs ${set.isPR ? 'text-amber-400' : 'text-[#444]'}`}>
            {Math.round(set.orm)}
          </span>
        </div>
      ) : (
        <div className="w-10 flex-shrink-0" />
      )}

      {/* Fail + Done */}
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={handleFail}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm active:scale-90 transition-all ${
            set.fail ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-transparent border-[#1a1a20] text-[#444]'
          }`}
        >
          ✕
        </button>
        <button
          onClick={handleDone}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm active:scale-90 transition-all ${
            set.done && !set.fail ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-transparent border-[#1a1a20] text-[#444]'
          }`}
        >
          ✓
        </button>
      </div>

      {/* PR badge */}
      {set.isPR && set.done && (
        <div className="absolute right-2 -top-3 bg-amber-400 text-[#050507] font-display font-bold text-[9px] px-2 py-0.5 rounded-full animate-bounce">
          PR
        </div>
      )}
    </div>
  )
}
