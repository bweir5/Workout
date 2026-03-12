import { useState } from 'react'
import { getSessions, deleteSession } from '@/lib/storage'
import { estimate1RM } from '@/lib/progressionEngine'
import { MUSCLE_COLORS, formatDuration, formatDate } from '@/lib/utils'
import type { Session } from '@/types'

const MUSCLES = ['All', 'Chest', 'Back', 'Legs', 'Arms']

export function LogScreen() {
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sessions, setSessions] = useState(() =>
    getSessions().filter(s => s.finishedAt)
  )

  const filtered = sessions
    .filter(s => filter === 'All' || s.muscle === filter)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))

  const handleDelete = (id: string) => {
    deleteSession(id)
    setSessions(getSessions().filter(s => s.finishedAt))
    setDeletingId(null)
    if (expanded === id) setExpanded(null)
  }

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-4">
      <h2 className="font-display font-extrabold text-2xl text-white mb-4">Session Log</h2>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {MUSCLES.map(m => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-mono text-xs transition-all active:scale-95 ${
              filter === m
                ? 'bg-white text-[#050507] font-medium'
                : 'bg-[#0a0a0c] border border-[#131316] text-[#555]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="font-display font-bold text-[#333] text-xl mb-2">No sessions yet</div>
          <div className="font-mono text-xs text-[#333]">Complete a workout to see it here</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isExpanded={expanded === session.id}
              onToggle={() => setExpanded(expanded === session.id ? null : session.id)}
              onDelete={() => setDeletingId(session.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-[#050507]/90 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="card p-6 w-full max-w-xs animate-spring-in">
            <div className="font-display font-bold text-white text-xl mb-1">Delete Session?</div>
            <div className="font-mono text-sm text-[#555] mb-5">
              This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-[#131316] border border-[#1a1a20] rounded-xl py-3 font-mono text-sm text-[#888] active:scale-95 transition-transform"
              >
                Keep
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 rounded-xl py-3 font-mono text-sm font-medium text-red-400 border border-red-500/20 bg-red-500/5 active:scale-95 transition-transform"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionCard({
  session,
  isExpanded,
  onToggle,
  onDelete
}: {
  session: Session
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const color = MUSCLE_COLORS[session.muscle] ?? '#888'
  const duration = session.finishedAt
    ? session.finishedAt - session.startedAt
    : 0

  const totalVolume = session.exercises.reduce((sum, ex) =>
    sum + ex.sets.filter(s => s.done && !s.fail).reduce((s2, set) => s2 + set.actualW * set.actualR, 0), 0
  )

  const maxORM = session.exercises.reduce((best, ex) => {
    return ex.sets.reduce((b, set) => {
      if (set.done && !set.fail && set.actualW > 0 && set.actualR > 0) {
        const orm = estimate1RM(set.actualW, set.actualR)
        return Math.max(b, orm)
      }
      return b
    }, best)
  }, 0)

  const hasPR = session.exercises.some(ex => ex.sets.some(s => s.isPR))

  return (
    <div className="card overflow-hidden" style={{ borderColor: `${color}25` }}>
      <div className="flex items-stretch">
        {/* Main tap area */}
        <button
          className="flex-1 flex items-start justify-between p-4 text-left active:bg-white/[0.02] transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-sm"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {session.muscle.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-white">{session.muscle}</span>
                {hasPR && <span className="font-mono text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">★ PR</span>}
              </div>
              <div className="font-mono text-xs text-[#444] mt-0.5">
                {formatDate(session.finishedAt!)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="font-mono text-xs text-[#555]">{formatDuration(duration)}</div>
            <div className="font-mono text-[10px] text-[#444]">{totalVolume.toLocaleString()} lbs</div>
            {maxORM > 0 && (
              <div className="font-mono text-[10px]" style={{ color }}>
                1RM ~{Math.round(maxORM)}
              </div>
            )}
          </div>
        </button>

        {/* Delete button — always visible */}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="px-3 flex items-center justify-center border-l border-[#0f0f12] text-[#333] active:text-red-400 active:bg-red-500/5 transition-colors"
          aria-label="Delete session"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M5 1h5M1 4h13M6 7v5M9 7v5M2 4l1 9a1 1 0 001 1h7a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#0f0f12] fade-in-up">
          {/* Nutrition on day */}
          {(session.proteinOnDay || session.bodyweightOnDay) && (
            <div className="flex gap-4 py-3 border-b border-[#0f0f12]">
              {session.bodyweightOnDay && (
                <div>
                  <div className="font-mono text-[10px] text-[#444]">Bodyweight</div>
                  <div className="font-display font-bold text-sm text-white">{session.bodyweightOnDay} lbs</div>
                </div>
              )}
              {session.proteinOnDay !== undefined && session.proteinTargetOnDay && (
                <div>
                  <div className="font-mono text-[10px] text-[#444]">Protein</div>
                  <div className="font-display font-bold text-sm text-white">
                    {session.proteinOnDay}g
                    <span className="font-mono text-[10px] text-[#444] ml-1">/ {session.proteinTargetOnDay}g</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Exercise breakdown */}
          <div className="space-y-3 py-3">
            {session.exercises.map(exercise => {
              const workSets = exercise.sets.filter(s => s.tag !== 'W' && s.done)
              const maxORM = workSets.reduce((b, s) => {
                const orm = estimate1RM(s.actualW, s.actualR)
                return Math.max(b, orm)
              }, 0)
              const hasPR = workSets.some(s => s.isPR)

              return (
                <div key={exercise.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-[#888]">{exercise.name}</span>
                    {hasPR && <span className="font-mono text-[10px] text-amber-400">★ PR</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.sets.filter(s => s.tag !== 'W').map((set, i) => (
                      <div
                        key={i}
                        className={`font-mono text-[10px] px-2 py-1 rounded ${
                          set.fail
                            ? 'bg-red-500/10 text-red-400'
                            : set.done
                            ? set.isPR
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-[#131316] text-[#666]'
                            : 'bg-[#0a0a0c] text-[#333]'
                        }`}
                      >
                        {set.actualW}×{set.actualR}
                        {set.isPR && ' ★'}
                        {set.fail && ' ✕'}
                      </div>
                    ))}
                  </div>
                  {maxORM > 0 && (
                    <div className="font-mono text-[10px] text-[#444] mt-1">
                      est. 1RM: {maxORM.toFixed(1)} lbs
                    </div>
                  )}
                  {exercise.note && (
                    <div className="font-mono text-[10px] text-[#444] mt-0.5 italic">{exercise.note}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* AI Analysis */}
          {session.aiPostAnalysis && (
            <div className="border-t border-[#0f0f12] pt-3">
              <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-2">AI Analysis</div>
              <div className="font-mono text-xs text-[#666] leading-relaxed">{session.aiPostAnalysis}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
