import { useState, useCallback } from 'react'
import { BodyweightWidget } from './BodyweightWidget'
import { ProteinWidget } from './ProteinWidget'
import { MuscleSelector } from './MuscleSelector'
import { WeeklyVolumeCompliance } from './WeeklyVolumeCompliance'
import { getFatigueState, get7dayProteinCompliance } from '@/lib/progressionEngine'
import { getSessions, getLastBodyweight, getMesocycleWeek } from '@/lib/storage'
import { getMesocycleWeekColor, getMesocycleWeekLabel } from '@/lib/utils'
import { generateWeeklyCheckIn } from '@/lib/aiCoach'
import type { MuscleGroup } from '@/types'

interface Props {
  onStartWorkout: (muscle: MuscleGroup) => void
}

export function HomeScreen({ onStartWorkout }: Props) {
  const [tick, setTick] = useState(0)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInText, setCheckInText] = useState<string | null>(null)
  const [showNutrition, setShowNutrition] = useState(false)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  const mesocycleWeek = getMesocycleWeek()
  const weekColor = getMesocycleWeekColor(mesocycleWeek)
  const weekLabel = getMesocycleWeekLabel(mesocycleWeek)

  const sessions = getSessions()
  const fatigue = getFatigueState(sessions)
  const lastBW = getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170
  const proteinCompliance = get7dayProteinCompliance(bodyweight)

  const handleWeeklyCheckIn = async () => {
    setCheckInLoading(true)
    setCheckInText(null)
    const text = await generateWeeklyCheckIn()
    setCheckInText(text)
    setCheckInLoading(false)
  }

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto space-y-3" key={tick}>

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-extrabold text-xl text-white tracking-tight">IronLog</h1>
        <div
          className="px-2.5 py-1 rounded-full font-mono text-[10px] font-medium"
          style={{ backgroundColor: `${weekColor}18`, color: weekColor }}
        >
          {weekLabel}
        </div>
      </div>

      {/* Alerts — shown only when needed */}
      {fatigue.urgentRecoveryFlag && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3 fade-in-up">
          <div className="font-mono text-xs text-red-400 font-medium">⚠ Urgent Recovery — deload before adding volume</div>
        </div>
      )}
      {!fatigue.urgentRecoveryFlag && fatigue.deloadRecommended && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl px-4 py-3 fade-in-up">
          <div className="font-mono text-xs text-amber-400 font-medium">Deload recommended — {fatigue.consecutive_failed_sessions >= 3 ? `${fatigue.consecutive_failed_sessions} consecutive failed sessions` : `fatigue score ${fatigue.score7day}`}</div>
        </div>
      )}
      {proteinCompliance < 80 && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl px-4 py-3 fade-in-up">
          <div className="font-mono text-xs text-amber-400 font-medium">⚠ Protein {proteinCompliance.toFixed(0)}% — volume capped at MEV</div>
        </div>
      )}

      {/* Muscle selector — primary action */}
      <div>
        <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-2">Train</div>
        <MuscleSelector onSelectMuscle={onStartWorkout} />
      </div>

      {/* Nutrition — collapsible card */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowNutrition(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-white/[0.02] transition-colors"
        >
          <span className="font-mono text-[10px] text-[#555] uppercase tracking-widest">Nutrition</span>
          <div className="flex items-center gap-2">
            {proteinCompliance >= 90
              ? <span className="font-mono text-[10px] text-green-500">✓ on target</span>
              : <span className="font-mono text-[10px]" style={{ color: proteinCompliance >= 70 ? 'hsl(38,85%,52%)' : 'hsl(4,70%,50%)' }}>{proteinCompliance.toFixed(0)}%</span>
            }
            <span className="font-mono text-xs text-[#333]">{showNutrition ? '∧' : '∨'}</span>
          </div>
        </button>
        {showNutrition && (
          <div className="px-4 pb-4 border-t border-[#0f0f12] space-y-4 fade-in-up pt-4">
            <BodyweightWidget onUpdate={refresh} />
            <ProteinWidget onUpdate={refresh} />
          </div>
        )}
      </div>

      {/* Weekly volume */}
      <WeeklyVolumeCompliance />

      {/* Weekly AI check-in */}
      <button
        onClick={handleWeeklyCheckIn}
        disabled={checkInLoading}
        className="w-full card px-4 py-3.5 flex items-center justify-between active:scale-[0.99] transition-transform"
      >
        <div>
          <div className="font-display font-bold text-sm text-white">Weekly Check-In</div>
          <div className="font-mono text-[10px] text-[#444] mt-0.5">AI analysis · volume · nutrition</div>
        </div>
        {checkInLoading
          ? <div className="w-4 h-4 border-2 border-[#333] border-t-white rounded-full animate-spin" />
          : <span className="font-mono text-base text-[#444]">→</span>
        }
      </button>

      {checkInText && (
        <div className="card px-4 py-4 fade-in-up">
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-3">Weekly Check-In</div>
          <div className="font-mono text-xs text-[#888] leading-relaxed whitespace-pre-wrap">{checkInText}</div>
          <button onClick={() => setCheckInText(null)} className="font-mono text-[10px] text-[#444] mt-3">
            dismiss
          </button>
        </div>
      )}
    </div>
  )
}
