import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, LineChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts'
import { getProteinEntries, getLastBodyweight, getSessions } from '@/lib/storage'
import { getProteinColor } from '@/lib/utils'

export function NutritionTab() {
  const entries = getProteinEntries()
  const lastBW = getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170
  const proteinTarget = Math.round(bodyweight * 0.82)
  const sessions = getSessions()

  // Last 30 days of protein data
  const last30Days: Array<{
    date: string
    total: number
    target: number
    compliance: number
    hasData: boolean
  }> = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().split('T')[0]
    const dayEntries = entries.filter(e => e.date === dateStr)
    const total = dayEntries.reduce((s, e) => s + e.grams, 0)
    const compliance = total > 0 ? (total / proteinTarget) * 100 : 0

    last30Days.push({
      date: dateStr,
      total: total > 0 ? total : 0,
      target: proteinTarget,
      compliance,
      hasData: dayEntries.length > 0
    })
  }

  // 7-day rolling compliance
  const rollingData = last30Days.map((day, idx) => {
    const window = last30Days.slice(Math.max(0, idx - 6), idx + 1).filter(d => d.hasData)
    const rolling = window.length > 0
      ? window.reduce((s, d) => s + d.compliance, 0) / window.length
      : null
    return { ...day, rolling }
  })

  // Stats
  const daysWithData = last30Days.filter(d => d.hasData)
  const bestDay = daysWithData.reduce((best, d) => d.total > (best?.total ?? 0) ? d : best, daysWithData[0])
  const worstDay = daysWithData.filter(d => d.total > 0).reduce((worst, d) => d.total < (worst?.total ?? Infinity) ? d : worst, daysWithData[0])
  const avgCompliance = daysWithData.length > 0
    ? daysWithData.reduce((s, d) => s + d.compliance, 0) / daysWithData.length
    : 0

  // Streak
  let streak = 0
  for (let i = 0; i < last30Days.length; i++) {
    const d = last30Days[last30Days.length - 1 - i]
    if (d.hasData && d.compliance >= 90) streak++
    else break
  }

  // Correlation: protein compliance vs session performance
  const correlationData = sessions
    .filter(s => s.finishedAt && s.proteinOnDay && s.proteinTargetOnDay)
    .map(s => ({
      compliance: Math.round(((s.proteinOnDay ?? 0) / (s.proteinTargetOnDay ?? proteinTarget)) * 100),
      stress: s.sessionStressScore
    }))
    .filter(d => d.compliance > 0 && d.stress > 0)
    .slice(-20)

  const color7day = getProteinColor(rollingData[rollingData.length - 1]?.rolling ?? 0)

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <div className="font-display font-bold text-xl" style={{ color: getProteinColor(avgCompliance) }}>
            {avgCompliance.toFixed(0)}%
          </div>
          <div className="font-mono text-[10px] text-[#444]">30-day avg</div>
        </div>
        <div className="card p-3 text-center">
          <div className="font-display font-bold text-xl text-amber-400">{streak}</div>
          <div className="font-mono text-[10px] text-[#444]">day streak</div>
        </div>
        <div className="card p-3 text-center">
          <div className="font-display font-bold text-xl text-white">{daysWithData.length}</div>
          <div className="font-mono text-[10px] text-[#444]">days logged</div>
        </div>
      </div>

      {/* Best/worst callouts */}
      {bestDay && worstDay && (
        <div className="grid grid-cols-2 gap-2">
          <div className="card p-3">
            <div className="font-mono text-[10px] text-green-400 mb-1">Best Day</div>
            <div className="font-display font-bold text-lg text-white">{bestDay.total}g</div>
            <div className="font-mono text-[10px] text-[#444]">{bestDay.date}</div>
          </div>
          <div className="card p-3">
            <div className="font-mono text-[10px] text-red-400 mb-1">Lowest Day</div>
            <div className="font-display font-bold text-lg text-white">{worstDay.total}g</div>
            <div className="font-mono text-[10px] text-[#444]">{worstDay.date}</div>
          </div>
        </div>
      )}

      {/* Daily protein bar chart */}
      <div className="card p-4">
        <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Daily Protein (30 days)</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rollingData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
              <CartesianGrid stroke="#0f0f12" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#444', fontSize: 8, fontFamily: 'DM Mono' }}
                tickFormatter={d => d.slice(8)}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  if (!d?.hasData) return null
                  return (
                    <div className="card px-3 py-2 text-xs font-mono">
                      <div className="text-[#555]">{d.date}</div>
                      <div style={{ color: getProteinColor((d.total / d.target) * 100) }}>
                        {d.total}g / {d.target}g
                      </div>
                    </div>
                  )
                }}
              />
              <ReferenceLine y={proteinTarget} stroke="#333" strokeDasharray="3 3" />
              <Bar
                dataKey="total"
                radius={[2, 2, 0, 0]}
              >
                {rollingData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={getProteinColor(entry.hasData ? (entry.total / proteinTarget) * 100 : 0)}
                    opacity={entry.hasData ? 1 : 0.2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-day rolling compliance */}
      <div className="card p-4">
        <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">7-Day Rolling Compliance %</div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#0f0f12" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#444', fontSize: 8, fontFamily: 'DM Mono' }}
                tickFormatter={d => d.slice(8)}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                tickLine={false}
                axisLine={false}
                width={28}
                domain={[0, 120]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="card px-3 py-2 text-xs font-mono">
                      <div className="text-[#555]">{payload[0]?.payload?.date}</div>
                      <div style={{ color: getProteinColor(payload[0]?.value as number ?? 0) }}>
                        {(payload[0]?.value as number)?.toFixed(0)}% compliance
                      </div>
                    </div>
                  )
                }}
              />
              <ReferenceLine y={90} stroke="hsl(142, 50%, 30%)" strokeDasharray="3 3" />
              <ReferenceLine y={80} stroke="#333" strokeDasharray="2 2" />
              <Line
                type="monotone"
                dataKey="rolling"
                stroke={color7day}
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4, fill: color7day }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Protein vs Performance correlation */}
      {correlationData.length >= 5 && (
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">
            Protein Compliance vs Session Performance
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#0f0f12" strokeDasharray="0" />
                <XAxis
                  dataKey="compliance"
                  name="Protein %"
                  tick={{ fill: '#444', fontSize: 9, fontFamily: 'DM Mono' }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Protein %', fill: '#444', fontSize: 9, position: 'bottom' }}
                />
                <YAxis
                  dataKey="stress"
                  name="Session Score"
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
                        <div style={{ color: getProteinColor(payload[0]?.value as number ?? 0) }}>
                          Protein: {payload[0]?.value}%
                        </div>
                        <div className="text-[#888]">Performance: {payload[1]?.value}</div>
                      </div>
                    )
                  }}
                />
                <ReferenceLine x={80} stroke="#333" strokeDasharray="2 2" />
                <Scatter data={correlationData} fill="hsl(142, 50%, 40%)" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="font-mono text-[10px] text-[#444] mt-2">
            Each point = one training session. Higher protein correlates with better performance.
          </div>
        </div>
      )}
    </div>
  )
}
