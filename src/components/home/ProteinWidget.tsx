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
  const [showCustom, setShowCustom] = useState(false)

  const settings = getSettings()
  const lastBW = getLastBodyweight()
  const bodyweight = lastBW?.weight ?? 170
  const proteinTarget = settings.proteinTargetOverride ?? Math.round(bodyweight * 0.82)

  const todayEntries = getTodayProtein()
  const totalProtein = todayEntries.reduce((s, e) => s + e.grams, 0)
  const compliance = (totalProtein / proteinTarget) * 100
  const progressPct = Math.min(compliance, 100)
  const color = getProteinColor(compliance)

  const addProtein = (grams: number) => {
    addProteinEntry({ id: generateId(), date: todayString(), grams, loggedAt: Date.now() })
    onUpdate()
  }

  const handleCustomAdd = () => {
    const val = parseFloat(customAmount)
    if (!val || val <= 0 || val > 500) return
    addProtein(val)
    setCustomAmount('')
    setShowCustom(false)
  }

  const statusText =
    compliance >= 100 ? '✓ Complete'
    : compliance >= 90 ? '✓ On target'
    : compliance >= 70 ? `${proteinTarget - totalProtein}g to go`
    : `⚠ ${proteinTarget - totalProtein}g needed`

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-0.5">Protein</div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-white">{totalProtein}g</span>
            <span className="font-mono text-xs text-[#444]">/ {proteinTarget}g</span>
          </div>
        </div>
        <span className="font-mono text-xs pb-0.5" style={{ color }}>{statusText}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#131316] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%`, backgroundColor: color }}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-1.5">
        {QUICK_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => addProtein(amount)}
            className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg py-2 font-mono text-xs text-[#666] active:scale-95 active:border-[#2a2a30] active:text-white transition-all"
          >
            +{amount}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`bg-[#0f0f12] border rounded-lg px-3 py-2 font-mono text-xs transition-all active:scale-95 ${
            showCustom ? 'border-[#333] text-white' : 'border-[#1a1a20] text-[#555]'
          }`}
        >
          +g
        </button>
      </div>

      {/* Custom input */}
      {showCustom && (
        <div className="flex gap-2 fade-in-up">
          <input
            type="number"
            inputMode="numeric"
            placeholder="grams"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
            autoFocus
            className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#333] placeholder:text-[#333]"
          />
          <button
            onClick={handleCustomAdd}
            className="bg-white text-[#050507] font-display font-bold rounded-lg px-4 py-2 active:scale-95 transition-transform text-sm"
          >
            Add
          </button>
        </div>
      )}

      {/* Entry list */}
      {todayEntries.length > 0 && (
        <div className="border-t border-[#0f0f12] pt-2 space-y-1">
          {[...todayEntries].reverse().map(entry => (
            <div key={entry.id} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#888]">{entry.grams}g</span>
                {entry.label && <span className="font-mono text-xs text-[#444]">{entry.label}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#333]">{formatTime(entry.loggedAt)}</span>
                <button
                  onClick={() => { deleteProteinEntry(entry.id); onUpdate() }}
                  className="w-5 h-5 flex items-center justify-center text-[#333] active:text-red-400 transition-colors font-mono text-base leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
