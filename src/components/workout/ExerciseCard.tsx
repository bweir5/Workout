import { useState } from 'react'
import type { Exercise, WorkoutSet } from '@/types'
import { SetRow } from './SetRow'
import { MUSCLE_COLORS } from '@/lib/utils'
import { estimate1RM } from '@/lib/progressionEngine'
import { upsertPR, getPRs } from '@/lib/storage'
import { generateId } from '@/lib/utils'

interface Props {
  exercise: Exercise
  sessionId: string
  onChange: (updated: Exercise) => void
  onTimerStart?: (isCompound: boolean) => void
}

export function ExerciseCard({ exercise, sessionId, onChange, onTimerStart }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const color = MUSCLE_COLORS[exercise.muscleGroup] ?? '#888'

  const readinessColor = (exercise.readinessScore ?? 50) >= 75
    ? 'hsl(142, 55%, 40%)'
    : (exercise.readinessScore ?? 50) >= 50
    ? 'hsl(38, 85%, 52%)'
    : 'hsl(4, 70%, 50%)'

  const workSets = exercise.sets.filter(s => s.tag !== 'W' && s.done && !s.fail)
  const currentMax1RM = workSets.reduce((best, set) => {
    const orm = estimate1RM(set.actualW, set.actualR)
    return orm > best ? orm : best
  }, 0)

  const handleSetChange = (index: number, updated: WorkoutSet) => {
    const newSets = [...exercise.sets]
    newSets[index] = updated

    // Check for PR
    if (updated.done && !updated.fail && updated.actualW > 0 && updated.actualR > 0) {
      const orm = estimate1RM(updated.actualW, updated.actualR)
      const existingPRs = getPRs()
      const existingPR = existingPRs.find(p => p.exerciseName === exercise.name)
      const isPR = !existingPR || orm > existingPR.orm

      if (isPR) {
        newSets[index] = { ...updated, isPR: true, orm }
        upsertPR({
          exerciseName: exercise.name,
          orm: Math.round(orm * 10) / 10,
          achievedAt: Date.now(),
          sessionId
        })
      }
    }

    onChange({ ...exercise, sets: newSets })
  }

  const addSet = () => {
    const workSets = exercise.sets.filter(s => s.tag !== 'W')
    const lastWorkSet = workSets[workSets.length - 1]
    const newSet: WorkoutSet = {
      tag: '',
      targetW: lastWorkSet?.targetW ?? 0,
      targetR: lastWorkSet?.targetR ?? 10,
      actualW: lastWorkSet?.actualW ?? lastWorkSet?.targetW ?? 0,
      actualR: lastWorkSet?.actualR ?? lastWorkSet?.targetR ?? 10,
      done: false,
      fail: false
    }
    onChange({ ...exercise, sets: [...exercise.sets, newSet] })
  }

  const removeLastSet = () => {
    if (exercise.sets.length <= 1) return
    // Only remove non-warmup sets
    const workSetsIndices = exercise.sets
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.tag !== 'W')
      .map(({ i }) => i)

    if (workSetsIndices.length === 0) return
    const lastWorkIdx = workSetsIndices[workSetsIndices.length - 1]
    const newSets = exercise.sets.filter((_, i) => i !== lastWorkIdx)
    onChange({ ...exercise, sets: newSets })
  }

  const totalVolume = exercise.sets
    .filter(s => s.done && !s.fail)
    .reduce((sum, s) => sum + s.actualW * s.actualR, 0)

  const doneSets = exercise.sets.filter(s => s.done).length
  const totalSets = exercise.sets.length

  return (
    <div className="card overflow-hidden" style={{ borderColor: `${color}25` }}>
      {/* Header */}
      <button
        className="w-full flex items-start justify-between p-4 text-left active:bg-[#0f0f12] transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="px-2 py-0.5 rounded font-mono text-[10px] uppercase"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {exercise.type}
            </div>
            {exercise.readinessScore !== undefined && (
              <div
                className="px-2 py-0.5 rounded font-mono text-[10px]"
                style={{ backgroundColor: `${readinessColor}18`, color: readinessColor }}
              >
                {exercise.readinessScore} ready
              </div>
            )}
            {currentMax1RM > 0 && (
              <div className="font-mono text-[10px] text-[#444]">
                1RM ~{Math.round(currentMax1RM)}
              </div>
            )}
          </div>
          <div className="font-display font-bold text-white text-base leading-tight truncate">
            {exercise.name}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="font-mono text-[10px] text-[#444]">
              {doneSets}/{totalSets} sets
            </span>
            {totalVolume > 0 && (
              <span className="font-mono text-[10px] text-[#444]">
                {totalVolume.toLocaleString()} lbs vol
              </span>
            )}
            {exercise.targetRepRange && (
              <span className="font-mono text-[10px] text-[#444]">
                target {exercise.targetRepRange[0]}–{exercise.targetRepRange[1]} reps
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {doneSets === totalSets && doneSets > 0 && (
            <div className="w-2 h-2 rounded-full bg-green-400" />
          )}
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          >
            <path d="M4 6l4 4 4-4" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Sets */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="relative">
            {exercise.sets.map((set, index) => (
              <SetRow
                key={index}
                set={set}
                setIndex={index}
                onChange={updated => handleSetChange(index, updated)}
                onTimerStart={onTimerStart ? () => onTimerStart(exercise.type === 'compound') : undefined}
                isCompound={exercise.type === 'compound'}
              />
            ))}
          </div>

          {/* Note field */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Add note..."
              value={exercise.note}
              onChange={e => onChange({ ...exercise, note: e.target.value })}
              className="w-full bg-transparent border-b border-[#1a1a20] py-1.5 font-mono text-xs text-[#666] placeholder:text-[#333] focus:outline-none focus:border-[#333] transition-colors"
            />
          </div>

          {/* Add/remove set */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={addSet}
              className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg py-2 font-mono text-xs text-[#666] active:scale-95 transition-transform"
            >
              + Add Set
            </button>
            <button
              onClick={removeLastSet}
              className="bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-4 py-2 font-mono text-xs text-[#444] active:scale-95 transition-transform"
            >
              − Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
