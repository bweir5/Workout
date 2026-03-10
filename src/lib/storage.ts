import type {
  Session,
  BodyweightEntry,
  ProteinEntry,
  PRRecord,
  ProgressionState,
  AppSettings
} from '@/types'

const KEYS = {
  SESSIONS: 'ironlog_sessions',
  WIP: 'ironlog_wip',
  PRS: 'ironlog_prs',
  PROGRESSION: 'ironlog_progression',
  MESOCYCLE_START: 'ironlog_mesocycle_start',
  BODYWEIGHT: 'ironlog_bodyweight',
  PROTEIN: 'ironlog_protein',
  SETTINGS: 'ironlog_settings'
} as const

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage write failed:', e)
  }
}

// Sessions
export const getSessions = (): Session[] => get<Session[]>(KEYS.SESSIONS, [])
export const saveSessions = (sessions: Session[]): void => set(KEYS.SESSIONS, sessions)

export const addSession = (session: Session): void => {
  const sessions = getSessions()
  saveSessions([...sessions, session])
}

export const updateSession = (session: Session): void => {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx === -1) {
    saveSessions([...sessions, session])
  } else {
    sessions[idx] = session
    saveSessions(sessions)
  }
}

export const deleteSession = (id: string): void => {
  saveSessions(getSessions().filter(s => s.id !== id))
}

// WIP session
export const getWIP = (): Session | null => get<Session | null>(KEYS.WIP, null)
export const saveWIP = (session: Session | null): void => set(KEYS.WIP, session)

// PRs
export const getPRs = (): PRRecord[] => get<PRRecord[]>(KEYS.PRS, [])
export const savePRs = (prs: PRRecord[]): void => set(KEYS.PRS, prs)

export const upsertPR = (pr: PRRecord): boolean => {
  const prs = getPRs()
  const existing = prs.find(p => p.exerciseName === pr.exerciseName)
  if (!existing || pr.orm > existing.orm) {
    const filtered = prs.filter(p => p.exerciseName !== pr.exerciseName)
    savePRs([...filtered, pr])
    return true
  }
  return false
}

// Progression states
export const getProgressionStates = (): ProgressionState[] =>
  get<ProgressionState[]>(KEYS.PROGRESSION, [])

export const saveProgressionStates = (states: ProgressionState[]): void =>
  set(KEYS.PROGRESSION, states)

export const upsertProgressionState = (state: ProgressionState): void => {
  const states = getProgressionStates()
  const idx = states.findIndex(s => s.exerciseName === state.exerciseName)
  if (idx === -1) {
    saveProgressionStates([...states, state])
  } else {
    states[idx] = state
    saveProgressionStates(states)
  }
}

// Mesocycle
export const getMesocycleStart = (): number => {
  const stored = get<number | null>(KEYS.MESOCYCLE_START, null)
  if (!stored) {
    const now = Date.now()
    set(KEYS.MESOCYCLE_START, now)
    return now
  }
  return stored
}

export const resetMesocycle = (): void => set(KEYS.MESOCYCLE_START, Date.now())

export const getMesocycleWeek = (): 1 | 2 | 3 | 4 => {
  const start = getMesocycleStart()
  const daysSince = (Date.now() - start) / (1000 * 60 * 60 * 24)
  const week = Math.floor(daysSince / 7) % 4 + 1
  return Math.min(Math.max(week, 1), 4) as 1 | 2 | 3 | 4
}

// Bodyweight
export const getBodyweightEntries = (): BodyweightEntry[] =>
  get<BodyweightEntry[]>(KEYS.BODYWEIGHT, [])

export const saveBodyweightEntries = (entries: BodyweightEntry[]): void =>
  set(KEYS.BODYWEIGHT, entries)

export const addBodyweightEntry = (entry: BodyweightEntry): void => {
  const entries = getBodyweightEntries()
  const filtered = entries.filter(e => e.date !== entry.date)
  saveBodyweightEntries([...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)))
}

export const getTodayBodyweight = (): BodyweightEntry | null => {
  const today = new Date().toISOString().split('T')[0]
  return getBodyweightEntries().find(e => e.date === today) ?? null
}

export const getLastBodyweight = (): BodyweightEntry | null => {
  const entries = getBodyweightEntries()
  if (!entries.length) return null
  return entries[entries.length - 1]
}

// Protein
export const getProteinEntries = (): ProteinEntry[] =>
  get<ProteinEntry[]>(KEYS.PROTEIN, [])

export const saveProteinEntries = (entries: ProteinEntry[]): void =>
  set(KEYS.PROTEIN, entries)

export const addProteinEntry = (entry: ProteinEntry): void => {
  const entries = getProteinEntries()
  saveProteinEntries([...entries, entry])
}

export const deleteProteinEntry = (id: string): void => {
  saveProteinEntries(getProteinEntries().filter(e => e.id !== id))
}

export const getTodayProtein = (): ProteinEntry[] => {
  const today = new Date().toISOString().split('T')[0]
  return getProteinEntries().filter(e => e.date === today)
}

export const getProteinByDate = (date: string): ProteinEntry[] =>
  getProteinEntries().filter(e => e.date === date)

export const getProteinTotalByDate = (date: string): number =>
  getProteinByDate(date).reduce((sum, e) => sum + e.grams, 0)

// Settings
export const getSettings = (): AppSettings =>
  get<AppSettings>(KEYS.SETTINGS, {
    weightUnit: 'lbs',
    restTimerCompound: 180,
    restTimerIsolation: 90
  })

export const saveSettings = (settings: AppSettings): void => set(KEYS.SETTINGS, settings)

// Export all data
export const exportData = (): string => {
  return JSON.stringify({
    sessions: getSessions(),
    bodyweight: getBodyweightEntries(),
    protein: getProteinEntries(),
    prs: getPRs(),
    progression: getProgressionStates(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  }, null, 2)
}
