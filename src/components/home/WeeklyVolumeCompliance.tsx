import { getWeeklyVolumeStats } from '@/lib/progressionEngine'

const VOLUME_STATUS_COLORS = {
  below_mev: '#333',
  mev_to_mav: 'hsl(142, 50%, 40%)',
  mav_to_mrv: 'hsl(38, 80%, 50%)',
  above_mrv: 'hsl(4, 70%, 50%)'
}

const VOLUME_STATUS_LABELS = {
  below_mev: 'Under-training',
  mev_to_mav: 'Optimal',
  mav_to_mrv: 'High — taper soon',
  above_mrv: 'Overreaching'
}

export function WeeklyVolumeCompliance() {
  const stats = getWeeklyVolumeStats()

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="font-mono text-xs text-[#555] uppercase tracking-widest">Weekly Volume</div>
        <div className="font-mono text-[9px] text-[#333]">sets per muscle · this week</div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#333]" />
          <span className="font-mono text-[9px] text-[#444]">MEV = minimum effective</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-green-500/30" />
          <span className="font-mono text-[9px] text-[#444]">MAV = optimal growth zone</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#444]" />
          <span className="font-mono text-[9px] text-[#444]">MRV = max recoverable</span>
        </div>
      </div>

      <div className="space-y-4">
        {stats.map(({ muscle, sets, status, landmarks }) => {
          const color = VOLUME_STATUS_COLORS[status]
          const label = VOLUME_STATUS_LABELS[status]
          const maxSets = landmarks.MRV + 2
          const pct = Math.min((sets / maxSets) * 100, 100)
          const mevPct = (landmarks.MEV / maxSets) * 100
          const mavLowPct = (landmarks.MAV[0] / maxSets) * 100
          const mavHighPct = (landmarks.MAV[1] / maxSets) * 100
          const mrvPct = (landmarks.MRV / maxSets) * 100

          return (
            <div key={muscle}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-[#888]">{muscle}</span>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm" style={{ color }}>
                    {sets} sets
                  </span>
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color, backgroundColor: `${color}18` }}
                  >
                    {label}
                  </span>
                </div>
              </div>
              <div className="relative h-2.5 bg-[#131316] rounded-full overflow-hidden">
                {/* MEV marker */}
                <div className="absolute top-0 h-full w-px bg-[#2a2a2a]" style={{ left: `${mevPct}%` }} />
                {/* MAV zone highlight */}
                <div
                  className="absolute top-0 h-full opacity-15 bg-green-500"
                  style={{ left: `${mavLowPct}%`, width: `${mavHighPct - mavLowPct}%` }}
                />
                {/* MRV marker */}
                <div className="absolute top-0 h-full w-px bg-[#2a2a2a]" style={{ left: `${mrvPct}%` }} />
                {/* Progress bar */}
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              {/* Scale labels */}
              <div className="relative mt-0.5 h-3">
                <span
                  className="absolute font-mono text-[9px] text-[#333] -translate-x-1/2"
                  style={{ left: `${mevPct}%` }}
                >
                  {landmarks.MEV}
                </span>
                <span
                  className="absolute font-mono text-[9px] text-[#333] -translate-x-1/2"
                  style={{ left: `${(mavLowPct + mavHighPct) / 2}%` }}
                >
                  {landmarks.MAV[0]}–{landmarks.MAV[1]}
                </span>
                <span
                  className="absolute font-mono text-[9px] text-[#333] -translate-x-1/2"
                  style={{ left: `${mrvPct}%` }}
                >
                  {landmarks.MRV}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-[#0f0f12]">
        <p className="font-mono text-[9px] text-[#333] leading-relaxed">
          These bars show how many sets you've done this week vs research-backed volume landmarks (Israetel / RP Strength). Aim to keep all muscles in the green MAV zone.
        </p>
      </div>
    </div>
  )
}
