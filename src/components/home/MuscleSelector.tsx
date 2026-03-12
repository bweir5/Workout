import { MUSCLE_COLORS } from '@/lib/utils'
import { getDaysSinceLastTrainedMuscle, calculateReadinessScore } from '@/lib/progressionEngine'
import { getLastBodyweight } from '@/lib/storage'
import type { MuscleGroup } from '@/types'

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Arms']

const PRIMARY_EXERCISE: Record<MuscleGroup, string> = {
  Chest: 'Incline Bench Press (Barbell)',
  Back: 'Lat Pulldown (Cable)',
  Legs: 'Squat (Barbell)',
  Arms: 'Overhead Press (Barbell)'
}

const TARGET_RANGE: Record<MuscleGroup, [number, number]> = {
  Chest: [5, 8],
  Back: [5, 8],
  Legs: [5, 8],
  Arms: [6, 8]
}

interface Props {
  onSelectMuscle: (muscle: MuscleGroup) => void
}

export function MuscleSelector({ onSelectMuscle }: Props) {
  const lastBW = getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170

  return (
    <div className="grid grid-cols-2 gap-2">
      {MUSCLES.map(muscle => {
        const color = MUSCLE_COLORS[muscle]
        const daysSince = getDaysSinceLastTrainedMuscle(muscle)
        const daysLabel =
          daysSince === 999 ? 'fresh'
          : daysSince < 1 ? 'today'
          : daysSince < 2 ? '1d ago'
          : `${Math.floor(daysSince)}d ago`

        const readiness = calculateReadinessScore(
          PRIMARY_EXERCISE[muscle],
          muscle,
          'compound',
          TARGET_RANGE[muscle],
          bodyweight
        )

        const readinessColor =
          readiness.score >= 75 ? 'hsl(142, 55%, 40%)'
          : readiness.score >= 50 ? 'hsl(38, 85%, 52%)'
          : 'hsl(4, 70%, 50%)'

        return (
          <button
            key={muscle}
            onClick={() => onSelectMuscle(muscle)}
            className="card p-4 text-left active:scale-[0.97] transition-transform flex flex-col gap-3"
            style={{ borderColor: `${color}20` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-white text-base">{muscle}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 3l5 4-5 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-[#444]">{daysLabel}</span>
                <span className="font-mono text-[10px] font-medium" style={{ color: readinessColor }}>
                  {readiness.score}
                </span>
              </div>
              <div className="h-0.5 bg-[#131316] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${readiness.score}%`, backgroundColor: readinessColor }}
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
