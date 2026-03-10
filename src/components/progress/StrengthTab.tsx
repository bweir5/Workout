import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from 'recharts'
import { getORMHistory } from '@/lib/progressionEngine'
import { getPRs } from '@/lib/storage'
import { formatDate, MUSCLE_COLORS } from '@/lib/utils'

const EXERCISES = [
  { name: 'Incline Bench Press (Barbell)', color: MUSCLE_COLORS.Chest },
  { name: 'Lat Pulldown (Cable)', color: MUSCLE_COLORS.Back },
  { name: 'Squat (Barbell)', color: MUSCLE_COLORS.Legs },
  { name: 'Overhead Press (Barbell)', color: MUSCLE_COLORS.Shoulders },
  { name: 'Seated Incline Curl (Dumbbell)', color: MUSCLE_COLORS.Arms }
]

// Strength standards for 170 lb male (intermediate)
const STRENGTH_STANDARDS: Record<string, { novice: number; intermediate: number; advanced: number; elite: number }> = {
  'Incline Bench Press (Barbell)': { novice: 135, intermediate: 185, advanced: 245, elite: 315 },
  'Lat Pulldown (Cable)': { novice: 120, intermediate: 170, advanced: 230, elite: 290 },
  'Squat (Barbell)': { novice: 155, intermediate: 225, advanced: 305, elite: 400 },
  'Overhead Press (Barbell)': { novice: 85, intermediate: 130, advanced: 180, elite: 235 },
  'Seated Incline Curl (Dumbbell)': { novice: 60, intermediate: 90, advanced: 125, elite: 165 }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs font-mono">
      <div className="text-[#555] mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.value?.toFixed(1)} lbs 1RM</div>
      ))}
    </div>
  )
}

export function StrengthTab() {
  const prs = getPRs()

  return (
    <div className="space-y-4">
      {EXERCISES.map(({ name, color }) => {
        const history = getORMHistory(name).slice(-16)
        const pr = prs.find(p => p.exerciseName === name)
        const standards = STRENGTH_STANDARDS[name]

        if (!history.length) {
          return (
            <div key={name} className="card p-4">
              <div className="font-display font-bold text-white text-sm mb-1">{name}</div>
              <div className="font-mono text-xs text-[#444]">No sessions logged yet</div>
            </div>
          )
        }

        const currentORM = history[history.length - 1]?.orm ?? 0

        // Determine strength standard level
        let level = 'Beginner'
        if (standards) {
          if (currentORM >= standards.elite) level = 'Elite'
          else if (currentORM >= standards.advanced) level = 'Advanced'
          else if (currentORM >= standards.intermediate) level = 'Intermediate'
          else if (currentORM >= standards.novice) level = 'Novice'
        }

        return (
          <div key={name} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-display font-bold text-white text-sm">{name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display font-bold text-2xl" style={{ color }}>
                    {currentORM.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-[#555]">lbs 1RM</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {pr && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1">
                    <span className="font-mono text-[10px] text-amber-400">★ PR</span>
                    <span className="font-display font-bold text-sm text-amber-400">{pr.orm.toFixed(1)}</span>
                  </div>
                )}
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ color, backgroundColor: `${color}15` }}
                >
                  {level}
                </span>
              </div>
            </div>

            {/* Chart */}
            {history.length > 1 && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="#131316" strokeDasharray="0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                      tickFormatter={d => d.slice(5)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {standards && (
                      <ReferenceLine
                        y={standards.intermediate}
                        stroke="#333"
                        strokeDasharray="3 3"
                        label={{ value: 'INT', fill: '#444', fontSize: 8 }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="orm"
                      stroke={color}
                      strokeWidth={2}
                      dot={(props: any) => {
                        const isPR = prs.find(p => p.exerciseName === name && p.achievedAt && props.payload.date === new Date(p.achievedAt).toISOString().split('T')[0])
                        return isPR ? (
                          <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="#FBBF24" stroke="#050507" strokeWidth={1.5} />
                        ) : (
                          <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={color} />
                        )
                      }}
                      activeDot={{ r: 4, fill: color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Strength standards */}
            {standards && (
              <div className="flex justify-between mt-3 pt-3 border-t border-[#0f0f12]">
                {(['novice', 'intermediate', 'advanced', 'elite'] as const).map(lvl => (
                  <div key={lvl} className="text-center">
                    <div
                      className="font-mono text-[10px] font-medium"
                      style={{
                        color: level.toLowerCase() === lvl ? color : '#444'
                      }}
                    >
                      {standards[lvl]}
                    </div>
                    <div className="font-mono text-[9px] text-[#333] capitalize">{lvl}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* PR Board */}
      <div className="card p-4">
        <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">PR Board</div>
        {prs.length === 0 ? (
          <div className="font-mono text-xs text-[#444]">No PRs recorded yet. Start training!</div>
        ) : (
          <div className="space-y-2">
            {[...prs].sort((a, b) => b.achievedAt - a.achievedAt).map(pr => (
              <div key={pr.exerciseName} className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-white">{pr.exerciseName}</div>
                  <div className="font-mono text-[10px] text-[#444]">{formatDate(pr.achievedAt)}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-amber-400 text-lg">{pr.orm.toFixed(1)}</span>
                  <span className="font-mono text-xs text-[#555]">lbs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
