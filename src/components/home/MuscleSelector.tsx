import { MUSCLE_COLORS, MUSCLE_COLORS_BG } from '@/lib/utils'
import { getDaysSinceLastTrainedMuscle, calculateReadinessScore } from '@/lib/progressionEngine'
import { getLastBodyweight } from '@/lib/storage'
import type { MuscleGroup } from '@/types'

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders']

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  Chest: '◉',
  Back: '◈',
  Legs: '⬡',
  Arms: '⬟',
  Shoulders: '◆'
}

const MUSCLE_EXERCISES: Record<MuscleGroup, string> = {
  Chest: 'Incline Bench Press',
  Back: 'Lat Pulldown',
  Legs: 'Squat',
  Arms: 'Overhead Press',
  Shoulders: 'Overhead Press'
}

interface Props {
  onSelectMuscle: (muscle: MuscleGroup) => void
}

export function MuscleSelector({ onSelectMuscle }: Props) {
  const lastBW = getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170

  return (
    <div>
      <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Start Session</div>
      <div className="grid grid-cols-1 gap-2">
        {MUSCLES.map(muscle => {
          const color = MUSCLE_COLORS[muscle]
          const bgColor = MUSCLE_COLORS_BG[muscle]
          const daysSince = getDaysSinceLastTrainedMuscle(muscle)
          const daysLabel = daysSince === 999
            ? 'never trained'
            : daysSince < 1
            ? 'trained today'
            : daysSince < 2
            ? '1 day ago'
            : `${Math.floor(daysSince)}d ago`

          // Readiness from primary compound
          const primaryExercise = MUSCLE_EXERCISES[muscle]
          const exType = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders'].includes(muscle) ? 'compound' : 'compound'
          const targetRange: [number, number] = muscle === 'Chest' || muscle === 'Back' || muscle === 'Legs'
            ? [5, 8]
            : [6, 8]

          const readiness = calculateReadinessScore(primaryExercise, muscle, exType, targetRange, bodyweight)
          const readinessColor = readiness.score >= 75
            ? 'hsl(142, 55%, 40%)'
            : readiness.score >= 50
            ? 'hsl(38, 85%, 52%)'
            : 'hsl(4, 70%, 50%)'

          return (
            <button
              key={muscle}
              onClick={() => onSelectMuscle(muscle)}
              className="card flex items-center justify-between p-4 active:scale-[0.98] transition-transform text-left"
              style={{ borderColor: `${color}30` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-display"
                  style={{ backgroundColor: bgColor, color }}
                >
                  {MUSCLE_ICONS[muscle]}
                </div>
                <div>
                  <div className="font-display font-bold text-white text-base">{muscle}</div>
                  <div className="font-mono text-xs text-[#444] mt-0.5">{daysLabel}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div
                    className="font-display font-bold text-lg"
                    style={{ color: readinessColor }}
                  >
                    {readiness.score}
                  </div>
                  <div className="font-mono text-[10px] text-[#444]">readiness</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4l6 6-6 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
