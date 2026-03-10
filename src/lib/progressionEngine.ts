import type {
  Session,
  Exercise,
  WorkoutSet,
  BodyweightEntry,
  ProgressionState,
  ReadinessFactors,
  FatigueState,
  TrainingPhase,
  VolumeLandmarks,
  MuscleGroup
} from '@/types'
import {
  getSessions,
  getBodyweightEntries,
  getProteinEntries,
  getProteinTotalByDate,
  getMesocycleWeek
} from './storage'

// ─── 1RM Estimation ──────────────────────────────────────────────────────────
export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function brzycki1RM(weight: number, reps: number): number {
  if (reps >= 37) return weight
  return weight * (36 / (37 - reps))
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return (epley1RM(weight, reps) + brzycki1RM(weight, reps)) / 2
}

// ─── Volume Landmarks ────────────────────────────────────────────────────────
export const VOLUME_LANDMARKS: Record<MuscleGroup, VolumeLandmarks> = {
  Chest: { MV: 8, MEV: 10, MAV: [12, 20], MRV: 22 },
  Back: { MV: 10, MEV: 12, MAV: [14, 22], MRV: 25 },
  Legs: { MV: 8, MEV: 10, MAV: [12, 20], MRV: 20 },
  Shoulders: { MV: 6, MEV: 8, MAV: [12, 20], MRV: 26 },
  Arms: { MV: 6, MEV: 8, MAV: [14, 20], MRV: 26 }
}

// ─── Bodyweight Smoothing ─────────────────────────────────────────────────────
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function interpolateBodyweight(
  entries: BodyweightEntry[]
): Map<string, { weight: number; interpolated: boolean }> {
  const result = new Map<string, { weight: number; interpolated: boolean }>()
  if (!entries.length) return result

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  // Fill actual entries
  sorted.forEach(e => result.set(e.date, { weight: e.weight, interpolated: false }))

  // Interpolate gaps up to 7 days
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    const gapDays = (bDate.getTime() - aDate.getTime()) / (1000 * 60 * 60 * 24)
    if (gapDays > 1 && gapDays <= 7) {
      for (let d = 1; d < gapDays; d++) {
        const interpDate = new Date(aDate)
        interpDate.setDate(interpDate.getDate() + d)
        const dateStr = interpDate.toISOString().split('T')[0]
        const fraction = d / gapDays
        const interpWeight = a.weight + (b.weight - a.weight) * fraction
        result.set(dateStr, { weight: Math.round(interpWeight * 10) / 10, interpolated: true })
      }
    }
  }

  return result
}

export function get7dayRollingAverage(
  entries: BodyweightEntry[],
  date: string
): number | null {
  const interpolated = interpolateBodyweight(entries)
  const targetDate = new Date(date)
  const weights: number[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(targetDate)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const entry = interpolated.get(dateStr)
    if (entry) weights.push(entry.weight)
  }

  if (!weights.length) return null
  return weights.reduce((a, b) => a + b, 0) / weights.length
}

export function detectTrainingPhase(entries: BodyweightEntry[]): TrainingPhase {
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const currentAvg = get7dayRollingAverage(entries, today)
  const prevAvg = get7dayRollingAverage(entries, sevenDaysAgo)

  if (!currentAvg || !prevAvg) return 'Maintenance'

  const weeklyChange = currentAvg - prevAvg
  if (weeklyChange > 0.3) return 'Bulk'
  if (weeklyChange < -0.3) return 'Cut'
  return 'Maintenance'
}

// ─── Protein Compliance ───────────────────────────────────────────────────────
export function get7dayProteinCompliance(bodyweight: number): number {
  const today = new Date()
  let totalCompliance = 0
  let daysWithData = 0
  const proteinTarget = bodyweight * 0.82

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const total = getProteinTotalByDate(dateStr)
    if (total > 0) {
      totalCompliance += total / proteinTarget
      daysWithData++
    }
  }

  if (!daysWithData) return 100 // No data = assume compliant
  return (totalCompliance / daysWithData) * 100
}

export function getProteinComplianceForDate(date: string, bodyweight: number): number {
  const proteinTarget = bodyweight * 0.82
  const total = getProteinTotalByDate(date)
  if (!total) return 0
  return (total / proteinTarget) * 100
}

// ─── Readiness Score ─────────────────────────────────────────────────────────
export function calculateReadinessScore(
  exerciseName: string,
  muscleGroup: string,
  exerciseType: 'compound' | 'isolation',
  targetRepRange: [number, number],
  bodyweight: number
): ReadinessFactors {
  const sessions = getSessions()
  const bwEntries = getBodyweightEntries()

  // Get last sessions for this exercise
  const exerciseSessions = sessions
    .filter(s => s.exercises.some(e => e.name === exerciseName) && s.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .slice(0, 3)

  // Days since last trained
  const lastSession = exerciseSessions[0]
  const daysSince = lastSession?.finishedAt
    ? (Date.now() - lastSession.finishedAt) / (1000 * 60 * 60 * 24)
    : 999

  const optimalMin = exerciseType === 'compound' ? 2 : 2
  const optimalMax = exerciseType === 'compound' ? 4 : 3

  // Days since score: 0-25 points
  let daysScore = 0
  if (daysSince >= optimalMin && daysSince <= optimalMax) {
    daysScore = 25
  } else if (daysSince > optimalMax) {
    daysScore = Math.max(0, 25 - (daysSince - optimalMax) * 3)
  } else if (daysSince < optimalMin) {
    daysScore = Math.max(0, daysSince * 12)
  }

  // Performance trend: 0-25 points
  let performanceTrend = 0
  let performanceTrendScore = 12 // neutral
  if (exerciseSessions.length >= 2) {
    const recentORM = getMaxORMFromSession(exerciseSessions[0], exerciseName)
    const prevORM = getMaxORMFromSession(exerciseSessions[1], exerciseName)
    if (prevORM > 0) {
      performanceTrend = ((recentORM - prevORM) / prevORM) * 100
      if (performanceTrend > 0) performanceTrendScore = 25
      else if (performanceTrend === 0) performanceTrendScore = 18
      else performanceTrendScore = Math.max(0, 15 + performanceTrend * 1.5)
    }
  }

  // Avg reps vs target: 0-25 points
  let avgRepsVsTarget = 0
  let repsScore = 12 // neutral
  if (exerciseSessions.length > 0) {
    const workSets = exerciseSessions[0].exercises
      .find(e => e.name === exerciseName)
      ?.sets.filter(s => s.tag !== 'W' && s.done) ?? []
    if (workSets.length > 0) {
      avgRepsVsTarget = workSets.reduce((s, set) => s + set.actualR, 0) / workSets.length
      const [minReps, maxReps] = targetRepRange
      if (avgRepsVsTarget >= maxReps) repsScore = 25
      else if (avgRepsVsTarget >= minReps) repsScore = 18
      else repsScore = Math.max(0, 10 - (minReps - avgRepsVsTarget) * 2)
    }
  }

  // Consecutive sessions at same weight (plateau): 0-25 points
  let plateauSessions = 0
  const progressionStates = JSON.parse(localStorage.getItem('ironlog_progression') ?? '[]') as { exerciseName: string; consecutiveSessions: number }[]
  const pState = progressionStates.find(p => p.exerciseName === exerciseName)
  if (pState) plateauSessions = pState.consecutiveSessions

  let plateauScore = 25
  if (plateauSessions >= 3) plateauScore = 10
  else if (plateauSessions >= 2) plateauScore = 17

  // Protein compliance modifier
  const compliance7day = get7dayProteinCompliance(bodyweight)
  let proteinPenalty = 0
  if (compliance7day < 80) {
    proteinPenalty = compliance7day < 70 ? 20 : 10
  }

  // Bodyweight trend modifier
  const bwTrend7day = get7dayBWChange(bwEntries)
  let bwPenalty = 0
  if (bwTrend7day < -1.0) {
    bwPenalty = 10 // >1% drop
  }

  const rawScore = daysScore + performanceTrendScore + repsScore + plateauScore
  const score = Math.max(0, Math.min(100, rawScore - proteinPenalty - bwPenalty))

  return {
    daysSinceLastTrained: daysSince,
    performanceTrend,
    avgRepsVsTarget,
    plateauSessions,
    proteinCompliance7day: compliance7day,
    bodyweightTrend7day: bwTrend7day,
    score
  }
}

function getMaxORMFromSession(session: Session, exerciseName: string): number {
  const exercise = session.exercises.find(e => e.name === exerciseName)
  if (!exercise) return 0
  let maxORM = 0
  for (const set of exercise.sets) {
    if (set.tag !== 'W' && set.done && !set.fail) {
      const orm = estimate1RM(set.actualW, set.actualR)
      if (orm > maxORM) maxORM = orm
    }
  }
  return maxORM
}

function get7dayBWChange(entries: BodyweightEntry[]): number {
  if (entries.length < 2) return 0
  const today = new Date().toISOString().split('T')[0]
  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const currentAvg = get7dayRollingAverage(entries, today)
  const prevAvg = get7dayRollingAverage(entries, sevenAgo)
  if (!currentAvg || !prevAvg || prevAvg === 0) return 0
  return ((currentAvg - prevAvg) / prevAvg) * 100
}

// ─── Double Progression Protocol ─────────────────────────────────────────────
export interface ProgressionRecommendation {
  action: 'increase' | 'hold' | 'decrease'
  newWeight: number
  reason: string
  nutritionNote?: string
}

export function calculateNextProgression(
  exerciseName: string,
  exerciseType: 'compound' | 'isolation',
  targetRepRange: [number, number],
  currentWeight: number,
  recentSets: WorkoutSet[],
  proteinCompliance: number
): ProgressionRecommendation {
  const workSets = recentSets.filter(s => s.tag !== 'W' && s.done)
  if (!workSets.length) {
    return { action: 'hold', newWeight: currentWeight, reason: 'No completed work sets to analyze.' }
  }

  const [minReps, maxReps] = targetRepRange
  const allHitTop = workSets.every(s => s.actualR >= maxReps && !s.fail)
  const allHitBottom = workSets.every(s => s.actualR >= minReps && !s.fail)
  const anyFailed = workSets.some(s => s.fail || s.actualR < minReps)

  const weightIncrement = exerciseType === 'compound' ? 5 : 2.5
  const weightDecrement = exerciseType === 'compound' ? 10 : 5

  if (anyFailed) {
    // Check if protein was the culprit
    if (proteinCompliance < 80) {
      return {
        action: 'hold',
        newWeight: currentWeight,
        reason: `Sets failed below bottom of rep range.`,
        nutritionNote: `Performance may reflect nutrition (${proteinCompliance.toFixed(0)}% protein compliance). Hold weight before reducing — inadequate leucine availability limits muscle protein synthesis (Norton & Layman, 2006).`
      }
    }
    return {
      action: 'decrease',
      newWeight: Math.round((currentWeight * (1 - weightDecrement / 100)) / 2.5) * 2.5,
      reason: `Sets failed below target rep range (${minReps}–${maxReps}). Reduce load ${weightDecrement}% to restore technique and confidence.`
    }
  }

  if (allHitTop) {
    return {
      action: 'increase',
      newWeight: currentWeight + weightIncrement,
      reason: `All work sets hit top of rep range (${maxReps}). Double progression threshold met — add ${weightIncrement} lbs per progressive overload principle (Schoenfeld, 2010).`
    }
  }

  if (allHitBottom) {
    return {
      action: 'hold',
      newWeight: currentWeight,
      reason: `All sets hit bottom of rep range (${minReps}). Target +1 rep per set next session before increasing load.`
    }
  }

  return {
    action: 'hold',
    newWeight: currentWeight,
    reason: `Mixed performance. Aim for consistent ${minReps}–${maxReps} reps before progressing.`
  }
}

// ─── Volume Per Muscle This Week ──────────────────────────────────────────────
export function getWeeklyVolumeByMuscle(): Record<string, number> {
  const sessions = getSessions()
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentSessions = sessions.filter(
    s => s.finishedAt && s.finishedAt > oneWeekAgo
  )

  const volumeMap: Record<string, number> = {}

  recentSessions.forEach(session => {
    session.exercises.forEach(exercise => {
      const workSets = exercise.sets.filter(s => s.tag !== 'W' && s.done)
      const muscle = exercise.muscleGroup
      volumeMap[muscle] = (volumeMap[muscle] ?? 0) + workSets.length
    })
  })

  return volumeMap
}

// ─── Fatigue Score ────────────────────────────────────────────────────────────
const DIFFICULTY_COEFFICIENTS: Record<string, number> = {
  compound: 1.0,
  isolation: 0.6
}

export function calculateSessionStressScore(exercises: Exercise[]): number {
  let total = 0
  exercises.forEach(exercise => {
    const coeff = DIFFICULTY_COEFFICIENTS[exercise.type] ?? 0.8
    exercise.sets
      .filter(s => s.tag !== 'W' && s.done)
      .forEach(set => {
        total += set.actualW * set.actualR * coeff
      })
  })
  return Math.round(total / 100) // Normalize
}

export function getFatigueState(sessions: Session[]): FatigueState {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentSessions = sessions.filter(
    s => s.finishedAt && s.finishedAt > oneWeekAgo
  )

  const score7day = recentSessions.reduce((sum, s) => sum + s.sessionStressScore, 0)

  // Count consecutive sessions with failed sets
  const sorted = [...sessions]
    .filter(s => s.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))

  let consecutiveFailed = 0
  for (const session of sorted) {
    const hasFailed = session.exercises.some(e => e.sets.some(s => s.fail))
    if (hasFailed) consecutiveFailed++
    else break
  }

  const FATIGUE_THRESHOLD = 200
  const deloadRecommended =
    score7day > FATIGUE_THRESHOLD || consecutiveFailed >= 3

  // Bodyweight dropping >1.5% in 7 days + high fatigue
  const bwEntries = getBodyweightEntries()
  const bwChange = get7dayBWChange(bwEntries)
  const urgentRecoveryFlag = bwChange < -1.5 && score7day > FATIGUE_THRESHOLD * 0.8

  return {
    score7day,
    consecutive_failed_sessions: consecutiveFailed,
    deloadRecommended,
    urgentRecoveryFlag
  }
}

// ─── Session Volume Recommendation ───────────────────────────────────────────
export function getRecommendedVolumeForMuscle(
  muscle: MuscleGroup,
  mesocycleWeek: 1 | 2 | 3 | 4,
  proteinCompliance: number
): { sets: number; rpe: number; note: string } {
  const landmarks = VOLUME_LANDMARKS[muscle]

  // Cap at MEV if protein is below 80%
  if (proteinCompliance < 80) {
    return {
      sets: landmarks.MEV,
      rpe: 7,
      note: `Protein compliance at ${proteinCompliance.toFixed(0)}% — capped at MEV (${landmarks.MEV} sets). Volume you can't recover from provides no stimulus (Israetel, 2019). Prioritize protein consistency.`
    }
  }

  switch (mesocycleWeek) {
    case 1:
      return { sets: landmarks.MEV, rpe: 7, note: 'Week 1: Baseline volume, RPE 7. Accumulation phase begins.' }
    case 2:
      return {
        sets: landmarks.MEV + 2,
        rpe: 8,
        note: 'Week 2: Progressive overload, +2 sets from MEV, RPE 8.'
      }
    case 3:
      return {
        sets: landmarks.MAV[0],
        rpe: 9,
        note: 'Week 3: MAV volume, RPE 9. PR attempt week — push top sets.'
      }
    case 4:
      return {
        sets: Math.round(landmarks.MEV * 0.45),
        rpe: 6,
        note: 'Week 4: Deload — 40–50% volume, 60% intensity. Supercompensation phase.'
      }
  }
}

// ─── Weekly Volume Stats For All Muscles ─────────────────────────────────────
export function getWeeklyVolumeStats(): Array<{
  muscle: MuscleGroup
  sets: number
  status: 'below_mev' | 'mev_to_mav' | 'mav_to_mrv' | 'above_mrv'
  landmarks: VolumeLandmarks
}> {
  const volumeByMuscle = getWeeklyVolumeByMuscle()
  const muscles: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders']

  return muscles.map(muscle => {
    const sets = volumeByMuscle[muscle] ?? 0
    const landmarks = VOLUME_LANDMARKS[muscle]

    let status: 'below_mev' | 'mev_to_mav' | 'mav_to_mrv' | 'above_mrv'
    if (sets < landmarks.MEV) status = 'below_mev'
    else if (sets <= landmarks.MAV[1]) status = 'mev_to_mav'
    else if (sets < landmarks.MRV) status = 'mav_to_mrv'
    else status = 'above_mrv'

    return { muscle, sets, status, landmarks }
  })
}

// ─── 1RM History For Exercise ─────────────────────────────────────────────────
export function getORMHistory(exerciseName: string): Array<{ date: string; orm: number; sessionId: string }> {
  const sessions = getSessions()
  const history: Array<{ date: string; orm: number; sessionId: string }> = []

  sessions
    .filter(s => s.finishedAt)
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0))
    .forEach(session => {
      const exercise = session.exercises.find(e => e.name === exerciseName)
      if (!exercise) return

      let maxORM = 0
      exercise.sets.forEach(set => {
        if (set.tag !== 'W' && set.done && !set.fail && set.actualR > 0 && set.actualW > 0) {
          const orm = estimate1RM(set.actualW, set.actualR)
          if (orm > maxORM) maxORM = orm
        }
      })

      if (maxORM > 0) {
        history.push({
          date: new Date(session.finishedAt!).toISOString().split('T')[0],
          orm: Math.round(maxORM * 10) / 10,
          sessionId: session.id
        })
      }
    })

  return history
}

// ─── Days Since Last Trained ──────────────────────────────────────────────────
export function getDaysSinceLastTrainedMuscle(muscle: string): number {
  const sessions = getSessions()
  const muscleSession = sessions
    .filter(s => s.muscle === muscle && s.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0]

  if (!muscleSession?.finishedAt) return 999
  return (Date.now() - muscleSession.finishedAt) / (1000 * 60 * 60 * 24)
}

