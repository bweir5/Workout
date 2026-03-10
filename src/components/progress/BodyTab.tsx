import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { getBodyweightEntries } from '@/lib/storage'
import {
  interpolateBodyweight,
  get7dayRollingAverage,
  detectTrainingPhase,
  getORMHistory
} from '@/lib/progressionEngine'
import { getPhaseColor, getPhaseIcon } from '@/lib/utils'

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs font-mono">
      <div className="text-[#555] mb-1">{payload[0]?.payload?.date}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || '#888' }}>
          {p.name === 'avg' ? '7d avg: ' : 'weight: '}{p.value?.toFixed(1)} lbs
          {p.payload?.interpolated && <span className="text-[#444] ml-1">(est)</span>}
        </div>
      ))}
    </div>
  )
}

export function BodyTab() {
  const entries = getBodyweightEntries()
  const phase = detectTrainingPhase(entries)
  const phaseColor = getPhaseColor(phase)
  const phaseIcon = getPhaseIcon(phase)

  // Build chart data with interpolation
  const interpolated = interpolateBodyweight(entries)
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  // Last 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const recentEntries = sorted.filter(e => e.date >= cutoff)

  const chartData = recentEntries.map(e => {
    const avg = get7dayRollingAverage(entries, e.date)
    return {
      date: e.date,
      weight: e.weight,
      avg: avg ? Math.round(avg * 10) / 10 : undefined,
      interpolated: false
    }
  })

  // Add interpolated points
  const allDates = new Set(recentEntries.map(e => e.date))
  interpolated.forEach((val, date) => {
    if (date >= cutoff && val.interpolated && !allDates.has(date)) {
      const avg = get7dayRollingAverage(entries, date)
      chartData.push({
        date,
        weight: val.weight,
        avg: avg ? Math.round(avg * 10) / 10 : undefined,
        interpolated: true
      })
    }
  })
  chartData.sort((a, b) => a.date.localeCompare(b.date))

  // Weekly averages table
  const weeklyAvgs: Array<{ week: string; avg: number; change: number | null }> = []
  for (let i = 0; i < 8; i++) {
    const endDate = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const endStr = endDate.toISOString().split('T')[0]
    const startStr = startDate.toISOString().split('T')[0]

    const weekEntries = sorted.filter(e => e.date >= startStr && e.date <= endStr)
    if (!weekEntries.length) continue

    const avg = weekEntries.reduce((s, e) => s + e.weight, 0) / weekEntries.length
    const prevWeekEntries = sorted.filter(e => {
      const prevEnd = new Date(startDate.getTime())
      const prevStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      return e.date >= prevStart.toISOString().split('T')[0] && e.date < prevEnd.toISOString().split('T')[0]
    })
    const prevAvg = prevWeekEntries.length
      ? prevWeekEntries.reduce((s, e) => s + e.weight, 0) / prevWeekEntries.length
      : null

    weeklyAvgs.push({
      week: `${startStr.slice(5)} – ${endStr.slice(5)}`,
      avg: Math.round(avg * 10) / 10,
      change: prevAvg !== null ? Math.round((avg - prevAvg) * 10) / 10 : null
    })
  }

  // Correlation data: BW avg vs top 1RM
  const ormHistory = getORMHistory('Incline Bench Press (Barbell)')
  const correlationData = ormHistory.filter(o => {
    const bwAvg = get7dayRollingAverage(entries, o.date)
    return bwAvg !== null
  }).map(o => ({
    bw: Math.round((get7dayRollingAverage(entries, o.date) ?? 0) * 10) / 10,
    orm: o.orm
  }))

  const currentBW = entries.length > 0 ? entries[entries.length - 1].weight : null
  const today = new Date().toISOString().split('T')[0]
  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const currentAvg = get7dayRollingAverage(entries, today)
  const prevAvg = get7dayRollingAverage(entries, sevenAgo)
  const weekChange = currentAvg && prevAvg ? currentAvg - prevAvg : null

  return (
    <div className="space-y-4">
      {/* Phase card */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-1">Current Phase</div>
            <div className="font-display font-extrabold text-3xl" style={{ color: phaseColor }}>
              {phaseIcon} {phase.toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            {currentAvg && (
              <div>
                <div className="font-display font-bold text-2xl text-white">{currentAvg.toFixed(1)}</div>
                <div className="font-mono text-xs text-[#555]">7-day avg</div>
              </div>
            )}
            {weekChange !== null && (
              <div className="font-mono text-xs mt-1" style={{ color: weekChange > 0 ? '#4CAF50' : weekChange < 0 ? '#EF5350' : '#888' }}>
                {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)} lbs/week
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bodyweight chart */}
      {chartData.length > 0 ? (
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Bodyweight (90 days)</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#0f0f12" strokeDasharray="0" vertical={false} />
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
                {/* Raw scatter - actual points */}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#333"
                  strokeWidth={0}
                  dot={(props: any) => (
                    <circle
                      key={props.key}
                      cx={props.cx}
                      cy={props.cy}
                      r={props.payload.interpolated ? 2 : 3}
                      fill={props.payload.interpolated ? '#222' : '#555'}
                      stroke="none"
                      opacity={props.payload.interpolated ? 0.4 : 0.7}
                    />
                  )}
                  activeDot={false}
                />
                {/* 7-day rolling avg line */}
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke={phaseColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: phaseColor }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: phaseColor }} />
              <span className="font-mono text-[10px] text-[#444]">7-day avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#555]" />
              <span className="font-mono text-[10px] text-[#444]">daily</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#222] opacity-50" />
              <span className="font-mono text-[10px] text-[#333]">estimated</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-4">
          <div className="font-mono text-xs text-[#444]">Log bodyweight to see trends</div>
        </div>
      )}

      {/* Weekly averages table */}
      {weeklyAvgs.length > 0 && (
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Weekly Averages</div>
          <div className="space-y-2">
            {weeklyAvgs.slice(0, 6).map((w, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#555]">{w.week}</span>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-sm text-white">{w.avg}</span>
                  {w.change !== null && (
                    <span
                      className="font-mono text-xs w-12 text-right"
                      style={{
                        color: w.change > 0.1 ? '#4CAF50' : w.change < -0.1 ? '#EF5350' : '#555'
                      }}
                    >
                      {w.change > 0 ? '+' : ''}{w.change}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BW vs 1RM correlation */}
      {correlationData.length >= 5 && (
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">
            Bodyweight vs Bench 1RM
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#0f0f12" strokeDasharray="0" />
                <XAxis
                  dataKey="bw"
                  name="Bodyweight"
                  tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'BW (lbs)', fill: '#444', fontSize: 9, position: 'bottom' }}
                />
                <YAxis
                  dataKey="orm"
                  name="1RM"
                  tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <ZAxis range={[20, 20]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="card px-3 py-2 text-xs font-mono">
                        <div className="text-[#888]">BW: {payload[0]?.value} lbs</div>
                        <div className="text-amber-400">1RM: {(payload[1]?.value as number)?.toFixed(1)} lbs</div>
                      </div>
                    )
                  }}
                />
                <Scatter data={correlationData} fill="hsl(4, 75%, 52%)" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
