export interface WorkoutSet {
  tag: 'W' | '★' | ''
  targetW: number
  targetR: number
  actualW: number
  actualR: number
  done: boolean
  fail: boolean
  orm?: number
  isPR?: boolean
  rpe?: number
}

export interface Exercise {
  name: string
  muscleGroup: string
  type: 'compound' | 'isolation'
  sets: WorkoutSet[]
  note: string
  readinessScore?: number
  targetRepRange?: [number, number]
}

export interface Session {
  id: string
  muscle: string
  mesocycleWeek: 1 | 2 | 3 | 4
  startedAt: number
  finishedAt: number | null
  exercises: Exercise[]
  aiPreBrief: string
  aiPostAnalysis: string
  sessionStressScore: number
  bodyweightOnDay?: number
  proteinOnDay?: number
  proteinTargetOnDay?: number
}

export interface BodyweightEntry {
  date: string // "YYYY-MM-DD"
  weight: number // lbs
  loggedAt: number // timestamp
}

export interface ProteinEntry {
  id: string
  date: string // "YYYY-MM-DD"
  grams: number
  label?: string
  loggedAt: number
}

export interface DailyNutrition {
  date: string
  totalProtein: number
  proteinTarget: number
  bodyweight?: number
  proteinEntries: ProteinEntry[]
}

export interface PRRecord {
  exerciseName: string
  orm: number
  achievedAt: number
  sessionId: string
}

export interface ProgressionState {
  exerciseName: string
  currentWeight: number
  targetReps: [number, number]
  consecutiveSessions: number
  trend: 'progressing' | 'plateau' | 'regressing'
  lastUpdated: number
}

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Arms'

export interface VolumeLandmarks {
  MV: number
  MEV: number
  MAV: [number, number]
  MRV: number
}

export interface ReadinessFactors {
  daysSinceLastTrained: number
  performanceTrend: number
  avgRepsVsTarget: number
  plateauSessions: number
  proteinCompliance7day: number
  bodyweightTrend7day: number
  score: number
}

export interface FatigueState {
  score7day: number
  consecutive_failed_sessions: number
  deloadRecommended: boolean
  urgentRecoveryFlag: boolean
}

export type TrainingPhase = 'Bulk' | 'Cut' | 'Maintenance'

export interface AppSettings {
  weightUnit: 'lbs' | 'kg'
  proteinTargetOverride?: number
  restTimerCompound: number
  restTimerIsolation: number
  apiKey?: string
}

export interface WorkoutTemplate {
  muscle: MuscleGroup
  exercises: TemplateExercise[]
}

export interface TemplateExercise {
  name: string
  muscleGroup: string
  type: 'compound' | 'isolation'
  targetRepRange: [number, number]
  sets: TemplateSet[]
}

export interface TemplateSet {
  tag: 'W' | '★' | ''
  weight: number
  reps: number
}
