import { useState } from 'react'
import {
  getTodayProtein,
  addProteinEntry,
  deleteProteinEntry,
  getLastBodyweight,
  getSettings
} from '@/lib/storage'
import { getProteinColor, generateId, todayString, formatTime } from '@/lib/utils'

interface Props {
  onUpdate: () => void
}

const QUICK_AMOUNTS = [25, 30, 40, 50]

export function ProteinWidget({ onUpdate }: Props) {
  const [customAmount, setCustomAmount] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [showLabelField, setShowLabelField] = useState(false)

  const settings = getSettings()
  const lastBW = getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170
  const proteinTarget = settings.proteinTargetOverride ?? Math.round(bodyweight * 0.82)

  const todayEntries = getTodayProtein()
  const totalProtein = todayEntries.reduce((s, e) => s + e.grams, 0)
  const compliance = (totalProtein / proteinTarget) * 100
  const progressPct = Math.min(compliance, 100)
  const color = getProteinColor(compliance)

  const circumference = 2 * Math.PI * 38 // radius 38
  const strokeDash = (progressPct / 100) * circumference

  const addProtein = (grams: number, label?: string) => {
    addProteinEntry({
      id: generateId(),
      date: todayString(),
      grams,
      label: label || undefined,
      loggedAt: Date.now()
    })
    onUpdate()
  }

  const handleQuickAdd = (amount: number) => {
    addProtein(amount)
  }

  const handleCustomAdd = () => {
    const val = parseFloat(customAmount)
    if (!val || val <= 0 || val > 500) return
    addProtein(val, customLabel || undefined)
    setCustomAmount('')
    setCustomLabel('')
    setShowCustom(false)
    setShowLabelField(false)
  }

  return (
    <div className="card p-4">
      <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Daily Protein</div>

      {/* Arc progress + numbers */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle
              cx="48" cy="48" r="38"
              fill="none"
              stroke="#131316"
              strokeWidth="6"
            />
            <circle
              cx="48" cy="48" r="38"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-lg text-white leading-none">{totalProtein}g</span>
            <span className="font-mono text-[10px] text-[#555]">{compliance.toFixed(0)}%</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-display font-bold text-3xl" style={{ color }}>{totalProtein}</span>
            <span className="font-mono text-sm text-[#555]">/ {proteinTarget}g</span>
          </div>
          <div className="w-full bg-[#131316] rounded-full h-1.5 mb-2">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: color }}
            />
          </div>
          <div className="font-mono text-xs" style={{ color }}>
            {compliance >= 90 ? '✓ On target' : compliance >= 70 ? `${(proteinTarget - totalProtein)}g remaining` : `⚠ ${(proteinTarget - totalProtein)}g needed`}
          </div>
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2 mb-3">
        {QUICK_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => handleQuickAdd(amount)}
            className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg py-2.5 font-mono text-sm text-[#888] active:scale-95 active:border-[#333] transition-all"
          >
            +{amount}g
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-3 py-2.5 font-mono text-sm text-[#888] active:scale-95 transition-all"
        >
          +custom
        </button>
      </div>

      {/* Custom input */}
      {showCustom && (
        <div className="mb-3 fade-in-up">
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="grams"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
              className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#333] placeholder:text-[#333]"
            />
            <button
              onClick={() => setShowLabelField(!showLabelField)}
              className="bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-3 py-2 font-mono text-xs text-[#555] active:scale-95 transition-all"
            >
              label
            </button>
            <button
              onClick={handleCustomAdd}
              className="bg-white text-[#050507] font-display font-bold rounded-lg px-4 py-2 active:scale-95 transition-transform"
            >
              Add
            </button>
          </div>
          {showLabelField && (
            <input
              type="text"
              placeholder="e.g. post-workout shake"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#333] placeholder:text-[#333]"
            />
          )}
        </div>
      )}

      {/* Entry list */}
      {todayEntries.length > 0 && (
        <div className="border-t border-[#131316] pt-3 space-y-1.5">
          {[...todayEntries].reverse().map(entry => (
            <div key={entry.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">{entry.grams}g</span>
                {entry.label && (
                  <span className="font-mono text-xs text-[#555]">{entry.label}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#444]">{formatTime(entry.loggedAt)}</span>
                <button
                  onClick={() => {
                    deleteProteinEntry(entry.id)
                    onUpdate()
                  }}
                  className="font-mono text-xs text-[#333] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {todayEntries.length === 0 && (
        <div className="font-mono text-xs text-[#333] text-center py-2">No protein logged today</div>
      )}
    </div>
  )
}
