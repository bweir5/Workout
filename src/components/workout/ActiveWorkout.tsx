import { useState, useEffect, useRef } from 'react'
import type { Session, Exercise, MuscleGroup } from '@/types'
import { ExerciseCard } from './ExerciseCard'
import { RestTimer } from './RestTimer'
import {
  saveWIP,
  updateSession,
  getWIP,
  getTodayBodyweight,
  getLastBodyweight,
  getProteinTotalByDate,
  getMesocycleWeek
} from '@/lib/storage'
import {
  calculateSessionStressScore,
  estimate1RM
} from '@/lib/progressionEngine'
import {
  generatePreWorkoutBrief,
  generatePostWorkoutAnalysis
} from '@/lib/aiCoach'
import { MUSCLE_COLORS, formatDuration, todayString, generateId } from '@/lib/utils'
import { getTemplateForMuscle } from '@/lib/templates'

interface Props {
  muscle: MuscleGroup
  onFinish: () => void
  onCancel: () => void
}

export function ActiveWorkout({ muscle, onFinish, onCancel }: Props) {
  const [session, setSession] = useState<Session | null>(null)
  const [showTimer, setShowTimer] = useState(false)
  const [timerIsCompound, setTimerIsCompound] = useState(true)
  const [preBriefLoading, setPreBriefLoading] = useState(false)
  const [postAnalysisLoading, setPostAnalysisLoading] = useState(false)
  const [showPreBrief, setShowPreBrief] = useState(true)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [finishedSession, setFinishedSession] = useState<Session | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const color = MUSCLE_COLORS[muscle] ?? '#888'

  // Initialize session
  useEffect(() => {
    const wip = getWIP()
    const mesocycleWeek = getMesocycleWeek()
    const lastBW = getTodayBodyweight() ?? getLastBodyweight()
    const bodyweight = lastBW?.weight ?? 170
    const todayStr = todayString()
    const proteinOnDay = getProteinTotalByDate(todayStr)
    const proteinTarget = Math.round(bodyweight * 0.82)

    if (wip && wip.muscle === muscle) {
      setSession(wip)
      startTimeRef.current = wip.startedAt
    } else {
      const template = getTemplateForMuscle(muscle)
      if (!template) return

      const exercises: Exercise[] = template.exercises.map(te => ({
        name: te.name,
        muscleGroup: te.muscleGroup,
        type: te.type,
        targetRepRange: te.targetRepRange,
        sets: te.sets.map(ts => ({
          tag: ts.tag,
          targetW: ts.weight,
          targetR: ts.reps,
          actualW: ts.weight,
          actualR: ts.reps,
          done: false,
          fail: false
        })),
        note: '',
        readinessScore: undefined
      }))

      const newSession: Session = {
        id: generateId(),
        muscle,
        mesocycleWeek,
        startedAt: Date.now(),
        finishedAt: null,
        exercises,
        aiPreBrief: '',
        aiPostAnalysis: '',
        sessionStressScore: 0,
        bodyweightOnDay: lastBW?.weight,
        proteinOnDay,
        proteinTargetOnDay: proteinTarget
      }
      setSession(newSession)
      saveWIP(newSession)
      startTimeRef.current = newSession.startedAt

      // Generate pre-brief
      setPreBriefLoading(true)
      generatePreWorkoutBrief(muscle, exercises, mesocycleWeek).then(brief => {
        setSession(prev => {
          if (!prev) return prev
          const updated = { ...prev, aiPreBrief: brief }
          saveWIP(updated)
          return updated
        })
        setPreBriefLoading(false)
      })
    }
  }, [muscle])

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const updateExercise = (index: number, updated: Exercise) => {
    setSession(prev => {
      if (!prev) return prev
      const exercises = [...prev.exercises]
      exercises[index] = updated
      const stressScore = calculateSessionStressScore(exercises)
      const updated_ = { ...prev, exercises, sessionStressScore: stressScore }
      saveWIP(updated_)
      return updated_
    })
  }

  const handleFinish = async () => {
    if (!session) return
    setShowFinishConfirm(false)
    setPostAnalysisLoading(true)

    const stressScore = calculateSessionStressScore(session.exercises)
    const finishedAt = Date.now()
    const todayStr = todayString()
    const proteinOnDay = getProteinTotalByDate(todayStr)
    const lastBW = getTodayBodyweight() ?? getLastBodyweight()

    const finishedSession: Session = {
      ...session,
      finishedAt,
      sessionStressScore: stressScore,
      proteinOnDay,
      bodyweightOnDay: lastBW?.weight
    }

    // Generate post analysis
    const analysis = await generatePostWorkoutAnalysis(finishedSession)
    const sessionWithAnalysis = { ...finishedSession, aiPostAnalysis: analysis }

    updateSession(sessionWithAnalysis)
    saveWIP(null)
    setFinishedSession(sessionWithAnalysis)
    setPostAnalysisLoading(false)

    if (timerRef.current) clearInterval(timerRef.current)
  }

  const totalVolume = session?.exercises.reduce((sum, ex) =>
    sum + ex.sets.filter(s => s.done && !s.fail).reduce((s2, set) => s2 + set.actualW * set.actualR, 0), 0
  ) ?? 0

  const doneSets = session?.exercises.reduce((sum, ex) =>
    sum + ex.sets.filter(s => s.done).length, 0
  ) ?? 0

  const totalSets = session?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) ?? 0

  const maxORM = session?.exercises.reduce((best, ex) => {
    return ex.sets.reduce((b, set) => {
      if (set.done && !set.fail && set.orm) return Math.max(b, set.orm)
      return b
    }, best)
  }, 0) ?? 0

  // Finished state - show analysis
  if (finishedSession) {
    return (
      <div className="min-h-screen bg-[#050507] pb-24">
        <div className="px-4 pt-4 max-w-lg mx-auto">
          {/* Finish header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-display font-bold"
              style={{ backgroundColor: `${color}22`, color }}
            >
              ✓
            </div>
            <div>
              <div className="font-display font-extrabold text-xl text-white">{muscle} Complete</div>
              <div className="font-mono text-xs text-[#555]">
                {formatDuration(finishedSession.finishedAt! - finishedSession.startedAt)} · {totalVolume.toLocaleString()} lbs
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Duration', value: formatDuration(finishedSession.finishedAt! - finishedSession.startedAt) },
              { label: 'Sets', value: `${doneSets}/${totalSets}` },
              { label: 'Top 1RM', value: maxORM > 0 ? `${Math.round(maxORM)}` : '—' }
            ].map(stat => (
              <div key={stat.label} className="card p-3 text-center">
                <div className="font-display font-bold text-lg text-white">{stat.value}</div>
                <div className="font-mono text-[10px] text-[#444]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0" />
              <div className="font-mono text-xs text-[#555] uppercase tracking-widest">AI Analysis</div>
            </div>
            {postAnalysisLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-4 h-4 border-2 border-[#333] border-t-white rounded-full animate-spin flex-shrink-0" />
                <span className="font-mono text-sm text-[#555]">Analyzing your session...</span>
              </div>
            ) : (
              <div className="font-mono text-sm text-[#aaa] leading-relaxed whitespace-pre-wrap">
                {finishedSession.aiPostAnalysis || 'No analysis available.'}
              </div>
            )}
          </div>

          <button
            onClick={onFinish}
            className="w-full bg-white text-[#050507] font-display font-bold rounded-2xl py-4 active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#333] border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050507]">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#050507]/95 backdrop-blur-sm border-b border-[#131316] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={onCancel}
            className="font-mono text-sm text-[#555] active:scale-95 transition-transform"
          >
            ← Cancel
          </button>
          <div className="text-center">
            <div className="font-display font-bold text-white" style={{ color }}>{muscle}</div>
            <div className="font-mono text-[10px] text-[#444]">
              {formatDuration(elapsed)} · {totalVolume.toLocaleString()} lbs · {doneSets}/{totalSets} sets
            </div>
          </div>
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="font-mono text-sm font-medium active:scale-95 transition-transform"
            style={{ color }}
          >
            Finish →
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-28 max-w-lg mx-auto space-y-3">
        {/* AI Pre-brief */}
        {showPreBrief && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0" />
                <div className="font-mono text-xs text-[#555] uppercase tracking-widest">Pre-Workout Brief</div>
              </div>
              <button
                onClick={() => setShowPreBrief(false)}
                className="font-mono text-xs text-[#333]"
              >
                hide
              </button>
            </div>
            {preBriefLoading ? (
              <div className="flex items-center gap-3 py-2">
                <div className="w-4 h-4 border-2 border-[#333] border-t-purple-500 rounded-full animate-spin flex-shrink-0" />
                <span className="font-mono text-sm text-[#555]">Preparing your session...</span>
              </div>
            ) : (
              <div className="font-mono text-sm text-[#aaa] leading-relaxed">
                {session.aiPreBrief || 'Add API key in Settings for AI coaching.'}
              </div>
            )}
          </div>
        )}

        {/* Exercise cards */}
        {session.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.name}
            exercise={exercise}
            sessionId={session.id}
            onChange={updated => updateExercise(index, updated)}
            onTimerStart={isCompound => {
              setTimerIsCompound(isCompound)
              setShowTimer(true)
            }}
          />
        ))}

        {/* Bottom finish button */}
        <button
          onClick={() => setShowFinishConfirm(true)}
          className="w-full py-4 rounded-2xl font-display font-bold text-white border active:scale-95 transition-transform"
          style={{ borderColor: `${color}40`, backgroundColor: `${color}15`, color }}
        >
          Finish {muscle} Session
        </button>
      </div>

      {/* Rest timer modal */}
      {showTimer && (
        <RestTimer
          isCompound={timerIsCompound}
          onClose={() => setShowTimer(false)}
        />
      )}

      {/* Finish confirm modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-[#050507]/90 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="card p-6 w-full max-w-xs animate-spring-in">
            <div className="font-display font-bold text-white text-xl mb-2">Finish Session?</div>
            <div className="font-mono text-sm text-[#555] mb-6">
              {doneSets}/{totalSets} sets complete · {totalVolume.toLocaleString()} lbs volume
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 bg-[#131316] border border-[#1a1a20] rounded-xl py-3 font-mono text-sm text-[#888] active:scale-95 transition-transform"
              >
                Continue
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 bg-white text-[#050507] font-display font-bold rounded-xl py-3 active:scale-95 transition-transform"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
