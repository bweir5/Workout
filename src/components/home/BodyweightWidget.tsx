import { useState } from 'react'
import {
  getTodayBodyweight,
  getLastBodyweight,
  addBodyweightEntry,
  getBodyweightEntries
} from '@/lib/storage'
import {
  get7dayRollingAverage,
  detectTrainingPhase
} from '@/lib/progressionEngine'
import { getPhaseColor, getPhaseIcon, todayString } from '@/lib/utils'

interface Props {
  onUpdate: () => void
}

export function BodyweightWidget({ onUpdate }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)

  const todayEntry = getTodayBodyweight()
  const lastEntry = getLastBodyweight()
  const entries = getBodyweightEntries()
  const today = todayString()
  const rollingAvg = get7dayRollingAverage(entries, today)
  const phase = detectTrainingPhase(entries)
  const phaseColor = getPhaseColor(phase)
  const phaseIcon = getPhaseIcon(phase)

  const handleSave = () => {
    const val = parseFloat(inputValue)
    if (!val || val < 50 || val > 500) return
    setSaving(true)
    addBodyweightEntry({
      date: today,
      weight: val,
      loggedAt: Date.now()
    })
    setInputValue('')
    setSaving(false)
    onUpdate()
  }

  if (todayEntry) {
    return (
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-1">Bodyweight</div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-white">{todayEntry.weight}</span>
              <span className="font-mono text-sm text-[#555]">lbs</span>
            </div>
            {rollingAvg && (
              <div className="font-mono text-xs text-[#555] mt-1">
                7-day avg: <span className="text-[#888]">{rollingAvg.toFixed(1)} lbs</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className="px-3 py-1.5 rounded-full text-xs font-mono font-medium"
              style={{ backgroundColor: `${phaseColor}22`, color: phaseColor }}
            >
              {phaseIcon} {phase.toUpperCase()}
            </div>
            <button
              onClick={() => {
                const newVal = prompt('Update bodyweight (lbs):', todayEntry.weight.toString())
                if (newVal) {
                  const val = parseFloat(newVal)
                  if (val > 50 && val < 500) {
                    addBodyweightEntry({ date: today, weight: val, loggedAt: Date.now() })
                    onUpdate()
                  }
                }
              }}
              className="font-mono text-xs text-[#444] underline underline-offset-2"
            >
              edit
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Morning Bodyweight</div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-0 rounded-xl bg-amber-500/5 animate-pulse pointer-events-none" />
          <input
            type="number"
            inputMode="decimal"
            placeholder={lastEntry ? `last: ${lastEntry.weight}` : '170.0'}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full bg-[#0f0f12] border border-amber-500/30 rounded-xl px-4 py-3 font-display text-xl font-bold text-white focus:outline-none focus:border-amber-500/60 placeholder:text-[#333] transition-colors"
          />
        </div>
        <div className="font-mono text-sm text-[#555] w-6">lbs</div>
        <button
          onClick={handleSave}
          disabled={saving || !inputValue}
          className="bg-white text-[#050507] font-display font-bold rounded-xl px-5 py-3 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100 whitespace-nowrap"
        >
          Log
        </button>
      </div>
      {lastEntry && (
        <div className="font-mono text-xs text-[#444] mt-2">
          Last logged: {lastEntry.weight} lbs on {lastEntry.date}
        </div>
      )}
    </div>
  )
}
