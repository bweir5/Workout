import { useState, useCallback } from 'react'
import { BodyweightWidget } from './BodyweightWidget'
import { ProteinWidget } from './ProteinWidget'
import { MuscleSelector } from './MuscleSelector'
import { WeeklyVolumeCompliance } from './WeeklyVolumeCompliance'
import { getFatigueState, get7dayProteinCompliance, detectTrainingPhase, get7dayRollingAverage } from '@/lib/progressionEngine'
import { getSessions, getLastBodyweight, getBodyweightEntries, getMesocycleWeek } from '@/lib/storage'
import { getMesocycleWeekColor, getMesocycleWeekLabel, getPhaseColor, todayString } from '@/lib/utils'
import { generateWeeklyCheckIn } from '@/lib/aiCoach'
import type { MuscleGroup } from '@/types'

interface Props {
  onStartWorkout: (muscle: MuscleGroup) => void
}

export function HomeScreen({ onStartWorkout }: Props) {
  const [tick, setTick] = useState(0)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInText, setCheckInText] = useState<string | null>(null)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  const mesocycleWeek = getMesocycleWeek()
  const weekColor = getMesocycleWeekColor(mesocycleWeek)
  const weekLabel = getMesocycleWeekLabel(mesocycleWeek)

  const sessions = getSessions()
  const fatigue = getFatigueState(sessions)
  const lastBW = getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170
  const proteinCompliance = get7dayProteinCompliance(bodyweight)

  const bwEntries = getBodyweightEntries()
  const today = todayString()
  const todayAvg = get7dayRollingAverage(bwEntries, today)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const prevAvg = get7dayRollingAverage(bwEntries, sevenDaysAgo)
  const bwChange = todayAvg && prevAvg ? todayAvg - prevAvg : null

  const handleWeeklyCheckIn = async () => {
    setCheckInLoading(true)
    setCheckInText(null)
    const text = await generateWeeklyCheckIn()
    setCheckInText(text)
    setCheckInLoading(false)
  }

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto space-y-4" key={tick}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">IronLog</h1>
          <div className="font-mono text-xs text-[#444]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full font-mono text-xs font-medium"
          style={{ backgroundColor: `${weekColor}22`, color: weekColor }}
        >
          {weekLabel}
        </div>
      </div>

      {/* Warning banners */}
      {fatigue.urgentRecoveryFlag && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3 fade-in-up">
          <div className="font-display font-bold text-sm text-red-400">⚠ Urgent Recovery Flag</div>
          <div className="font-mono text-xs text-red-400/70 mt-1">
            Bodyweight dropping {bwChange !== null ? `${Math.abs(bwChange).toFixed(1)} lbs` : ''} this week + high fatigue. Consider deload before increasing training stress.
          </div>
        </div>
      )}

      {!fatigue.urgentRecoveryFlag && fatigue.deloadRecommended && (
        <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-3 fade-in-up">
          <div className="font-display font-bold text-sm text-amber-400">Deload Recommended</div>
          <div className="font-mono text-xs text-amber-400/70 mt-1">
            {fatigue.consecutive_failed_sessions >= 3
              ? `${fatigue.consecutive_failed_sessions} consecutive sessions with failed sets.`
              : `7-day fatigue score ${fatigue.score7day} exceeds threshold.`} Recovery precedes growth.
          </div>
        </div>
      )}

      {proteinCompliance < 80 && (
        <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-3 flex items-start gap-2 fade-in-up">
          <div className="text-amber-400 mt-0.5">⚠</div>
          <div>
            <div className="font-display font-bold text-sm text-amber-400">Protein Below Target</div>
            <div className="font-mono text-xs text-amber-400/70 mt-1">
              7-day avg {proteinCompliance.toFixed(0)}% compliance. Volume capped at MEV — muscle protein synthesis requires sustained leucine availability.
            </div>
          </div>
        </div>
      )}

      {/* Bodyweight widget */}
      <BodyweightWidget onUpdate={refresh} />

      {/* Protein widget */}
      <ProteinWidget onUpdate={refresh} />

      {/* Weekly volume compliance */}
      <WeeklyVolumeCompliance />

      {/* Muscle selector */}
      <MuscleSelector onSelectMuscle={onStartWorkout} />

      {/* Weekly check-in */}
      <button
        onClick={handleWeeklyCheckIn}
        disabled={checkInLoading}
        className="w-full card p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
      >
        <div>
          <div className="font-display font-bold text-white">Weekly AI Check-In</div>
          <div className="font-mono text-xs text-[#444] mt-0.5">Volume, strength, nutrition analysis</div>
        </div>
        {checkInLoading
          ? <div className="w-5 h-5 border-2 border-[#333] border-t-white rounded-full animate-spin" />
          : <span className="font-mono text-xl text-[#444]">→</span>
        }
      </button>

      {checkInText && (
        <div className="card p-4 fade-in-up">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Weekly Check-In</div>
          <div className="font-mono text-sm text-[#aaa] leading-relaxed whitespace-pre-wrap">{checkInText}</div>
          <button
            onClick={() => setCheckInText(null)}
            className="font-mono text-xs text-[#444] mt-3 underline underline-offset-2"
          >
            dismiss
          </button>
        </div>
      )}
    </div>
  )
}
