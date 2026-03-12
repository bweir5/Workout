import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, ReferenceLine
} from 'recharts'
import { getSessions } from '@/lib/storage'
import { VOLUME_LANDMARKS } from '@/lib/progressionEngine'
import { getMesocycleWeekColor } from '@/lib/utils'
import type { MuscleGroup } from '@/types'

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Arms']

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  Chest: 'hsl(4, 75%, 52%)',
  Back: 'hsl(210, 75%, 52%)',
  Legs: 'hsl(142, 55%, 40%)',
  Arms: 'hsl(32, 90%, 52%)'
}

function getVolumeStatusColor(sets: number, muscle: MuscleGroup): string {
  const l = VOLUME_LANDMARKS[muscle]
  if (sets < l.MEV) return '#333'
  if (sets <= l.MAV[1]) return 'hsl(142, 50%, 40%)'
  if (sets < l.MRV) return 'hsl(38, 80%, 50%)'
  return 'hsl(4, 70%, 50%)'
}

export function VolumeTab() {
  const sessions = getSessions()

  // Last 8 weeks of volume per muscle
  const weeklyData: Array<Record<string, any>> = []
  for (let i = 7; i >= 0; i--) {
    const endMs = Date.now() - i * 7 * 24 * 60 * 60 * 1000
    const startMs = endMs - 7 * 24 * 60 * 60 * 1000
    const weekSessions = sessions.filter(
      s => s.finishedAt && s.finishedAt >= startMs && s.finishedAt < endMs
    )

    const weekLabel = new Date(startMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const entry: Record<string, any> = { week: weekLabel }

    MUSCLES.forEach(muscle => {
      let sets = 0
      weekSessions.forEach(session => {
        session.exercises.forEach(exercise => {
          if (exercise.muscleGroup === muscle) {
            sets += exercise.sets.filter(s => s.tag !== 'W' && s.done).length
          }
        })
      })
      entry[muscle] = sets
    })

    weeklyData.push(entry)
  }

  // Per-muscle breakdown chart
  const currentWeekData = MUSCLES.map(muscle => ({
    muscle,
    sets: weeklyData[weeklyData.length - 1]?.[muscle] ?? 0,
    color: MUSCLE_COLORS[muscle]
  }))

  return (
    <div className="space-y-4">
      {/* Current week summary */}
      <div className="card p-4">
        <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">This Week vs Landmarks</div>
        <div className="space-y-4">
          {MUSCLES.map(muscle => {
            const sets = currentWeekData.find(d => d.muscle === muscle)?.sets ?? 0
            const l = VOLUME_LANDMARKS[muscle]
            const color = getVolumeStatusColor(sets, muscle)
            const maxDisplay = l.MRV + 4
            const pct = Math.min((sets / maxDisplay) * 100, 100)
            const mevPct = (l.MEV / maxDisplay) * 100
            const mavLowPct = (l.MAV[0] / maxDisplay) * 100
            const mavHighPct = (l.MAV[1] / maxDisplay) * 100
            const mrvPct = (l.MRV / maxDisplay) * 100

            let statusLabel = 'Below MEV'
            if (sets >= l.MRV) statusLabel = 'Above MRV'
            else if (sets >= l.MAV[0]) statusLabel = 'MAV Zone'
            else if (sets >= l.MEV) statusLabel = 'Optimal'

            return (
              <div key={muscle}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-[#888]">{muscle}</span>
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded"
                      style={{ color, backgroundColor: `${color}18` }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <span className="font-display font-bold text-lg" style={{ color }}>{sets}</span>
                </div>

                {/* Stacked bar with landmark zones */}
                <div className="relative h-3 bg-[#0f0f12] rounded-full overflow-hidden">
                  {/* MEV zone */}
                  <div
                    className="absolute top-0 h-full bg-[#222]"
                    style={{ width: `${mevPct}%` }}
                  />
                  {/* MEV-MAV zone */}
                  <div
                    className="absolute top-0 h-full bg-green-500/10"
                    style={{ left: `${mevPct}%`, width: `${mavHighPct - mevPct}%` }}
                  />
                  {/* MAV-MRV zone */}
                  <div
                    className="absolute top-0 h-full bg-amber-500/10"
                    style={{ left: `${mavHighPct}%`, width: `${mrvPct - mavHighPct}%` }}
                  />
                  {/* Actual progress */}
                  <div
                    className="absolute top-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                  {/* MEV marker */}
                  <div className="absolute top-0 h-full w-px bg-[#333] z-10" style={{ left: `${mevPct}%` }} />
                  {/* MAV start */}
                  <div className="absolute top-0 h-full w-px bg-[#2a2a2a] z-10" style={{ left: `${mavLowPct}%` }} />
                  {/* MRV marker */}
                  <div className="absolute top-0 h-full w-px bg-[#333] z-10" style={{ left: `${mrvPct}%` }} />
                </div>

                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[9px] text-[#333]">MV {l.MV}</span>
                  <span className="font-mono text-[9px] text-[#333]">MEV {l.MEV}</span>
                  <span className="font-mono text-[9px] text-[#333]">MAV {l.MAV[0]}–{l.MAV[1]}</span>
                  <span className="font-mono text-[9px] text-[#333]">MRV {l.MRV}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 8-week history per muscle */}
      {MUSCLES.map(muscle => {
        const data = weeklyData.map(w => ({ week: w.week, sets: w[muscle] ?? 0 }))
        const l = VOLUME_LANDMARKS[muscle]
        const color = MUSCLE_COLORS[muscle]

        return (
          <div key={muscle} className="card p-4">
            <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">{muscle} — 8 weeks</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#0f0f12" strokeDasharray="0" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: '#444', fontSize: 8, fontFamily: 'DM Mono' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                    tickLine={false}
                    axisLine={false}
                    width={24}
                    domain={[0, l.MRV + 4]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const sets = payload[0]?.value as number
                      return (
                        <div className="card px-3 py-2 text-xs font-mono">
                          <div className="text-[#555]">{payload[0]?.payload?.week}</div>
                          <div style={{ color: getVolumeStatusColor(sets, muscle) }}>
                            {sets} sets
                          </div>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine y={l.MEV} stroke="#2a4a2a" strokeDasharray="3 3" />
                  <ReferenceLine y={l.MAV[0]} stroke="hsl(142, 30%, 25%)" strokeDasharray="3 3" />
                  <ReferenceLine y={l.MRV} stroke="hsl(4, 40%, 30%)" strokeDasharray="3 3" />
                  <Bar dataKey="sets" radius={[3, 3, 0, 0]}>
                    {data.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={getVolumeStatusColor(entry.sets, muscle)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t border-dashed border-[#2a4a2a]" />
                <span className="font-mono text-[9px] text-[#333]">MEV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: 'hsl(142, 30%, 25%)' }} />
                <span className="font-mono text-[9px] text-[#333]">MAV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: 'hsl(4, 40%, 30%)' }} />
                <span className="font-mono text-[9px] text-[#333]">MRV</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
