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
  const doneSets = exercise.sets.filter(s => s.done).length
  const totalSets = exercise.sets.length
  const allDone = doneSets === totalSets && doneSets > 0

  const handleSetChange = (index: number, updated: WorkoutSet) => {
    const newSets = [...exercise.sets]
    newSets[index] = updated

    if (updated.done && !updated.fail && updated.actualW > 0 && updated.actualR > 0) {
      const orm = estimate1RM(updated.actualW, updated.actualR)
      const existingPRs = getPRs()
      const existingPR = existingPRs.find(p => p.exerciseName === exercise.name)
      if (!existingPR || orm > existingPR.orm) {
        newSets[index] = { ...updated, isPR: true, orm }
        upsertPR({ exerciseName: exercise.name, orm: Math.round(orm * 10) / 10, achievedAt: Date.now(), sessionId })
      }
    }

    onChange({ ...exercise, sets: newSets })
  }

  const addSet = () => {
    const workSets = exercise.sets.filter(s => s.tag !== 'W')
    const last = workSets[workSets.length - 1]
    const newSet: WorkoutSet = {
      tag: '',
      targetW: last?.targetW ?? 0,
      targetR: last?.targetR ?? 10,
      actualW: last?.actualW ?? last?.targetW ?? 0,
      actualR: last?.actualR ?? last?.targetR ?? 10,
      done: false,
      fail: false
    }
    onChange({ ...exercise, sets: [...exercise.sets, newSet] })
  }

  const removeLastSet = () => {
    const workIndices = exercise.sets.map((s, i) => ({ s, i })).filter(({ s }) => s.tag !== 'W').map(({ i }) => i)
    if (workIndices.length === 0) return
    onChange({ ...exercise, sets: exercise.sets.filter((_, i) => i !== workIndices[workIndices.length - 1]) })
  }

  return (
    <div className="card overflow-hidden" style={{ borderColor: allDone ? `${color}30` : `${color}15` }}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-white/[0.02] transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-white text-sm leading-tight truncate">{exercise.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="font-mono text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {exercise.type}
            </span>
            {exercise.targetRepRange && (
              <span className="font-mono text-[10px] text-[#444]">{exercise.targetRepRange[0]}–{exercise.targetRepRange[1]} reps</span>
            )}
            <span className="font-mono text-[10px] text-[#444]">{doneSets}/{totalSets}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {allDone && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          >
            <path d="M3 5l4 4 4-4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Sets */}
      {!collapsed && (
        <div className="px-4 pb-4 border-t border-[#0a0a0d]">
          <div className="relative mt-2">
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

          <input
            type="text"
            placeholder="Note..."
            value={exercise.note}
            onChange={e => onChange({ ...exercise, note: e.target.value })}
            className="w-full bg-transparent border-b border-[#131316] py-1.5 mt-2 font-mono text-xs text-[#555] placeholder:text-[#2a2a30] focus:outline-none focus:border-[#2a2a30] transition-colors"
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={addSet}
              className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg py-1.5 font-mono text-xs text-[#555] active:scale-95 transition-transform"
            >
              + set
            </button>
            <button
              onClick={removeLastSet}
              className="bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-4 py-1.5 font-mono text-xs text-[#444] active:scale-95 transition-transform"
            >
              − remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
