import Anthropic from '@anthropic-ai/sdk'
import type { Session, Exercise } from '@/types'
import {
  getSessions,
  getSettings,
  getBodyweightEntries,
  getLastBodyweight,
  getTodayBodyweight,
  getTodayProtein,
  getProteinTotalByDate
} from './storage'
import {
  get7dayProteinCompliance,
  detectTrainingPhase,
  get7dayRollingAverage,
  getWeeklyVolumeStats,
  getFatigueState,
  estimate1RM
} from './progressionEngine'
import { getMesocycleWeek } from './storage'

function getClient(): Anthropic | null {
  const settings = getSettings()
  const apiKey = settings.apiKey ?? import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

function buildSystemPrompt(): string {
  const bwEntries = getBodyweightEntries()
  const lastBW = getTodayBodyweight() ?? getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170
  const phase = detectTrainingPhase(bwEntries)
  const proteinCompliance = get7dayProteinCompliance(bodyweight)
  const mesocycleWeek = getMesocycleWeek()
  const proteinTarget = Math.round(bodyweight * 0.82)
  const today = new Date().toISOString().split('T')[0]
  const todayAvg = get7dayRollingAverage(bwEntries, today)

  return `You are a sports scientist and strength coach with a PhD in exercise science, specializing in evidence-based hypertrophy for natural athletes. You base all recommendations on peer-reviewed research (Schoenfeld, Israetel, Helms, Krieger, Norton). Be direct, specific, reference actual numbers. Never be generic. Cite the scientific principle behind each recommendation.

User profile:
- 30yo male, 5'10", current bodyweight: ${lastBW?.weight ?? 'unknown'} lbs (7-day avg: ${todayAvg?.toFixed(1) ?? 'unknown'} lbs)
- Intermediate-advanced lifter, post knee injury rebuilding legs
- Protein target: ${proteinTarget}g/day (bodyweight × 0.82g)
- Current estimated 1RMs: Incline Bench ~234, Lat Pulldown ~241, OHP ~177, Squat ~217 (recovering)
- Current training phase: ${phase}
- 7-day protein compliance: ${proteinCompliance.toFixed(0)}%
- Mesocycle week: ${mesocycleWeek}

Nutrition integration rules you must follow:
- If 7-day protein compliance < 80%: explicitly note this is limiting recovery and muscle protein synthesis. Cite: protein synthesis requires sustained leucine availability (Norton & Layman, 2006). Recommend holding volume at MEV until compliance improves.
- If bodyweight dropping >1% in 7 days during apparent bulk: flag energy deficit risk. Recommend caloric audit before increasing training stress.
- If protein was below target on the day of a poor session: note this as a likely contributing factor before recommending weight reduction.
- Correlate: show user when their best sessions align with high protein days.`
}

export async function generatePreWorkoutBrief(
  muscle: string,
  exercises: Exercise[],
  mesocycleWeek: 1 | 2 | 3 | 4
): Promise<string> {
  const client = getClient()
  if (!client) return 'Add your Anthropic API key in Settings to enable AI coaching.'

  const bwEntries = getBodyweightEntries()
  const todayBW = getTodayBodyweight() ?? getLastBodyweight()
  const todayProtein = getTodayProtein()
  const proteinSoFar = todayProtein.reduce((s, e) => s + e.grams, 0)
  const bodyweight = todayBW?.weight ?? 170
  const proteinTarget = Math.round(bodyweight * 0.82)
  const compliance7day = get7dayProteinCompliance(bodyweight)

  const exerciseSummary = exercises.map(e => {
    const topSet = e.sets.find(s => s.tag === '★') ?? e.sets.filter(s => s.tag !== 'W')[0]
    return `${e.name} (${e.type}, readiness: ${e.readinessScore ?? '?'}/100) — prescribed top set: ${topSet?.targetW ?? '?'}×${topSet?.targetR ?? '?'}`
  }).join('\n')

  const userMessage = `I'm about to train ${muscle}. Here's what's loaded for today:
${exerciseSummary}

Today's data:
- Bodyweight: ${todayBW?.weight ?? 'not logged'} lbs
- Protein logged so far today: ${proteinSoFar}g / ${proteinTarget}g target
- 7-day protein compliance: ${compliance7day.toFixed(0)}%
- Mesocycle week: ${mesocycleWeek}

Give me a pre-workout brief: 3–4 sentences. Reference today's bodyweight, protein logged so far, readiness scores, what weight to hit on the top set and why. Mention mesocycle week context. Be direct and specific.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }]
    })
    const content = response.content[0]
    return content.type === 'text' ? content.text : 'Unable to generate brief.'
  } catch (e) {
    console.error('AI brief failed:', e)
    return 'AI coaching unavailable. Check your API key and internet connection.'
  }
}

export async function generatePostWorkoutAnalysis(session: Session): Promise<string> {
  const client = getClient()
  if (!client) return 'Add your Anthropic API key in Settings to enable AI coaching.'

  const bodyweight = session.bodyweightOnDay ?? getLastBodyweight()?.weight ?? 170
  const proteinTarget = Math.round(bodyweight * 0.82)
  const proteinOnDay = session.proteinOnDay ?? 0
  const proteinCompliance = proteinOnDay > 0 ? (proteinOnDay / proteinTarget) * 100 : 0

  const duration = session.finishedAt
    ? Math.round((session.finishedAt - session.startedAt) / 60000)
    : 0

  const exerciseSummary = session.exercises.map(exercise => {
    const workSets = exercise.sets.filter(s => s.tag !== 'W' && s.done)
    const failedSets = workSets.filter(s => s.fail)
    const [min, max] = exercise.targetRepRange ?? [6, 12]
    const avgReps = workSets.length
      ? workSets.reduce((s, set) => s + set.actualR, 0) / workSets.length
      : 0
    const maxORM = workSets.reduce((best, set) => {
      const orm = estimate1RM(set.actualW, set.actualR)
      return orm > best ? orm : best
    }, 0)
    const prSets = workSets.filter(s => s.isPR)

    return `${exercise.name}: ${workSets.length} work sets, avg ${avgReps.toFixed(1)} reps (target ${min}–${max}), best 1RM est. ${maxORM.toFixed(1)} lbs${failedSets.length ? `, ${failedSets.length} failed sets` : ''}${prSets.length ? ' ★PR' : ''}`
  }).join('\n')

  const userMessage = `Session completed: ${session.muscle}, ${duration} minutes.
Session stress score: ${session.sessionStressScore}

Performance:
${exerciseSummary}

Nutrition on training day:
- Protein: ${proteinOnDay}g / ${proteinTarget}g target (${proteinCompliance.toFixed(0)}% compliance)
- Bodyweight: ${bodyweight} lbs

Provide post-workout analysis:
1. Performance vs targets (be specific about each exercise)
2. Protein on training day (flag if low, cite research if relevant)
3. Specific weight adjustments for next session (exact numbers)
4. Recovery recommendation based on session stress + nutrition
5. One science-based insight relevant to today's performance

Be direct, specific, reference actual numbers.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }]
    })
    const content = response.content[0]
    return content.type === 'text' ? content.text : 'Unable to generate analysis.'
  } catch (e) {
    console.error('AI analysis failed:', e)
    return 'AI coaching unavailable. Check your API key and internet connection.'
  }
}

export async function generateWeeklyCheckIn(): Promise<string> {
  const client = getClient()
  if (!client) return 'Add your Anthropic API key in Settings to enable AI coaching.'

  const sessions = getSessions()
  const bwEntries = getBodyweightEntries()
  const lastBW = getTodayBodyweight() ?? getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170
  const proteinCompliance = get7dayProteinCompliance(bodyweight)
  const phase = detectTrainingPhase(bwEntries)
  const mesocycleWeek = getMesocycleWeek()
  const volumeStats = getWeeklyVolumeStats()
  const fatigue = getFatigueState(sessions)
  const today = new Date().toISOString().split('T')[0]
  const todayAvg = get7dayRollingAverage(bwEntries, today)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const prevAvg = get7dayRollingAverage(bwEntries, sevenDaysAgo)
  const bwChangeNum = todayAvg && prevAvg ? todayAvg - prevAvg : null
  const bwChange = bwChangeNum !== null ? bwChangeNum.toFixed(1) : 'unknown'

  const volumeSummary = volumeStats.map(v =>
    `${v.muscle}: ${v.sets} sets (MEV=${v.landmarks.MEV}, MAV=${v.landmarks.MAV[0]}–${v.landmarks.MAV[1]}, MRV=${v.landmarks.MRV}) — ${v.status}`
  ).join('\n')

  // Get best sessions this week
  const weekSessions = sessions
    .filter(s => s.finishedAt && s.finishedAt > Date.now() - 7 * 24 * 60 * 60 * 1000)
    .sort((a, b) => (b.sessionStressScore ?? 0) - (a.sessionStressScore ?? 0))

  const sessionCount = weekSessions.length

  const userMessage = `Weekly check-in request.

This week's data:
- Sessions completed: ${sessionCount}
- 7-day protein compliance: ${proteinCompliance.toFixed(0)}%
- Bodyweight trend: ${phase}, 7-day avg ${todayAvg?.toFixed(1) ?? 'N/A'} lbs (${bwChangeNum !== null && bwChangeNum > 0 ? '+' : ''}${bwChange} lbs vs last week)
- Fatigue score: ${fatigue.score7day} (deload recommended: ${fatigue.deloadRecommended ? 'YES' : 'no'})
- Mesocycle: Week ${mesocycleWeek}

Volume compliance by muscle:
${volumeSummary}

Provide weekly check-in:
1. 7-day protein compliance with trend assessment
2. Bodyweight trend + detected phase (${phase}) with what it means
3. Volume compliance vs RP landmarks per muscle group
4. Next week priorities (specific)
5. ${proteinCompliance < 80 ? 'REQUIRED: Specific actionable protein fix with science citation (compliance is critically low)' : 'One performance optimization for next week'}

Reference specific numbers. Be a coach, not a chatbot.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }]
    })
    const content = response.content[0]
    return content.type === 'text' ? content.text : 'Unable to generate check-in.'
  } catch (e) {
    console.error('AI check-in failed:', e)
    return 'AI coaching unavailable. Check your API key and internet connection.'
  }
}
