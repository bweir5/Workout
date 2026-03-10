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

const RPE_OPTIONS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10]

export function SetRow({ set, setIndex, onChange, onTimerStart, isCompound }: Props) {
  const [showRPE, setShowRPE] = useState(false)
  const [isPRFlash, setIsPRFlash] = useState(false)

  useEffect(() => {
    if (set.isPR) {
      setIsPRFlash(true)
      const timeout = setTimeout(() => setIsPRFlash(false), 2000)
      return () => clearTimeout(timeout)
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

  const tagLabel = set.tag === 'W' ? 'W' : set.tag === '★' ? '★' : (setIndex + 1).toString()
  const tagStyle = set.tag === '★'
    ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    : set.tag === 'W'
    ? 'text-[#555] bg-transparent border-[#222]'
    : 'text-[#666] bg-transparent border-[#1a1a20]'

  return (
    <div
      className={`set-row transition-all duration-300 ${
        isPRFlash ? 'pr-glow rounded-lg bg-amber-500/5' : ''
      } ${set.done && !set.fail ? 'opacity-70' : ''}`}
    >
      {/* Set tag */}
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs flex-shrink-0 ${tagStyle}`}>
        {tagLabel}
      </div>

      {/* Weight input */}
      <div className="flex flex-col items-center flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={set.actualW || ''}
          onChange={e => updateWeight(e.target.value)}
          placeholder={set.targetW.toString()}
          className="number-input w-full"
          style={{ fontSize: '1.1rem' }}
        />
        <span className="font-mono text-[9px] text-[#444] mt-0.5">lbs</span>
      </div>

      <span className="font-mono text-[#333] text-sm">×</span>

      {/* Reps input */}
      <div className="flex flex-col items-center flex-1">
        <input
          type="number"
          inputMode="numeric"
          value={set.actualR || ''}
          onChange={e => updateReps(e.target.value)}
          placeholder={set.targetR.toString()}
          className="number-input w-full"
          style={{ fontSize: '1.1rem' }}
        />
        <span className="font-mono text-[9px] text-[#444] mt-0.5">reps</span>
      </div>

      {/* 1RM estimate */}
      {set.orm && set.done && (
        <div className="flex flex-col items-center w-12 flex-shrink-0">
          <span className={`font-display font-bold text-sm ${set.isPR ? 'text-amber-400' : 'text-[#666]'}`}>
            {Math.round(set.orm)}
          </span>
          <span className="font-mono text-[9px] text-[#444]">1RM</span>
        </div>
      )}

      {/* RPE badge */}
      {set.done && set.rpe && (
        <div
          className="flex-shrink-0 font-mono text-[10px] text-[#555] bg-[#0f0f12] border border-[#1a1a20] rounded px-1 py-0.5 cursor-pointer"
          onClick={() => setShowRPE(!showRPE)}
        >
          RPE{set.rpe}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        {/* RPE button */}
        <button
          onClick={() => setShowRPE(!showRPE)}
          className="w-8 h-8 rounded-lg bg-[#0f0f12] border border-[#1a1a20] flex items-center justify-center font-mono text-[10px] text-[#555] active:scale-95 transition-transform"
        >
          R
        </button>
        {/* Fail button */}
        <button
          onClick={handleFail}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-display font-bold text-sm active:scale-95 transition-all ${
            set.fail
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-[#0f0f12] border-[#1a1a20] text-[#555]'
          }`}
        >
          ✕
        </button>
        {/* Done button */}
        <button
          onClick={handleDone}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-display font-bold text-sm active:scale-95 transition-all ${
            set.done && !set.fail
              ? 'bg-green-500/20 border-green-500/40 text-green-400'
              : 'bg-[#0f0f12] border-[#1a1a20] text-[#555]'
          }`}
        >
          ✓
        </button>
      </div>

      {/* PR badge */}
      {set.isPR && set.done && (
        <div className="absolute right-2 -top-3 bg-amber-400 text-[#050507] font-display font-bold text-[10px] px-2 py-0.5 rounded-full animate-bounce">
          NEW PR
        </div>
      )}

      {/* RPE picker dropdown */}
      {showRPE && (
        <div className="absolute right-0 top-full mt-1 bg-[#0f0f12] border border-[#1a1a20] rounded-xl p-2 z-10 grid grid-cols-4 gap-1 shadow-xl">
          {RPE_OPTIONS.map(rpe => (
            <button
              key={rpe}
              onClick={() => {
                onChange({ ...set, rpe })
                setShowRPE(false)
              }}
              className={`px-2 py-1.5 rounded-lg font-mono text-xs transition-all active:scale-95 ${
                set.rpe === rpe
                  ? 'bg-white text-[#050507] font-medium'
                  : 'text-[#888] hover:bg-[#1a1a20]'
              }`}
            >
              {rpe}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
