import { getWeeklyVolumeStats } from '@/lib/progressionEngine'
import type { MuscleGroup } from '@/types'

const VOLUME_STATUS_COLORS = {
  below_mev: '#333',
  mev_to_mav: 'hsl(142, 50%, 40%)',
  mav_to_mrv: 'hsl(38, 80%, 50%)',
  above_mrv: 'hsl(4, 70%, 50%)'
}

const VOLUME_STATUS_LABELS = {
  below_mev: 'Below MEV',
  mev_to_mav: 'Optimal',
  mav_to_mrv: 'Caution',
  above_mrv: 'Overreaching'
}

export function WeeklyVolumeCompliance() {
  const stats = getWeeklyVolumeStats()

  return (
    <div className="card p-4">
      <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Weekly Volume</div>
      <div className="space-y-3">
        {stats.map(({ muscle, sets, status, landmarks }) => {
          const color = VOLUME_STATUS_COLORS[status]
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
                    {sets}
                  </span>
                  <span className="font-mono text-[10px] text-[#444]">sets</span>
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      color,
                      backgroundColor: `${color}18`
                    }}
                  >
                    {VOLUME_STATUS_LABELS[status]}
                  </span>
                </div>
              </div>
              <div className="relative h-2 bg-[#131316] rounded-full overflow-hidden">
                {/* MEV marker */}
                <div
                  className="absolute top-0 h-full w-px bg-[#333]"
                  style={{ left: `${mevPct}%` }}
                />
                {/* MAV zone */}
                <div
                  className="absolute top-0 h-full opacity-10 bg-green-500"
                  style={{ left: `${mavLowPct}%`, width: `${mavHighPct - mavLowPct}%` }}
                />
                {/* MRV marker */}
                <div
                  className="absolute top-0 h-full w-px bg-[#444]"
                  style={{ left: `${mrvPct}%` }}
                />
                {/* Progress bar */}
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="font-mono text-[9px] text-[#333]">MEV {landmarks.MEV}</span>
                <span className="font-mono text-[9px] text-[#333]">MAV {landmarks.MAV[0]}–{landmarks.MAV[1]}</span>
                <span className="font-mono text-[9px] text-[#333]">MRV {landmarks.MRV}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
