import { useState } from 'react'
import {
  getTodayBodyweight,
  getLastBodyweight,
  addBodyweightEntry,
  getBodyweightEntries
} from '@/lib/storage'
import { get7dayRollingAverage, detectTrainingPhase } from '@/lib/progressionEngine'
import { getPhaseColor, todayString } from '@/lib/utils'

interface Props {
  onUpdate: () => void
}

export function BodyweightWidget({ onUpdate }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const todayEntry = getTodayBodyweight()
  const lastEntry = getLastBodyweight()
  const entries = getBodyweightEntries()
  const today = todayString()
  const rollingAvg = get7dayRollingAverage(entries, today)
  const phase = detectTrainingPhase(entries)
  const phaseColor = getPhaseColor(phase)

  const handleSave = () => {
    const val = parseFloat(inputValue)
    if (!val || val < 50 || val > 500) return
    addBodyweightEntry({ date: today, weight: val, loggedAt: Date.now() })
    setInputValue('')
    onUpdate()
  }

  const handleEditSave = () => {
    const val = parseFloat(editValue)
    if (val > 50 && val < 500) {
      addBodyweightEntry({ date: today, weight: val, loggedAt: Date.now() })
      onUpdate()
    }
    setEditing(false)
    setEditValue('')
  }

  if (todayEntry) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-0.5">Bodyweight</div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditing(false) }}
                placeholder={todayEntry.weight.toString()}
                autoFocus
                className="w-24 bg-[#0f0f12] border border-[#333] rounded-lg px-2 py-1 font-display text-xl font-bold text-white focus:outline-none"
              />
              <button onClick={handleEditSave} className="font-mono text-xs text-[#888] active:text-white">save</button>
              <button onClick={() => setEditing(false)} className="font-mono text-xs text-[#444]">cancel</button>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-2xl text-white">{todayEntry.weight}</span>
              <span className="font-mono text-xs text-[#444]">lbs</span>
              {rollingAvg && (
                <span className="font-mono text-[10px] text-[#444] ml-1">avg {rollingAvg.toFixed(1)}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="px-2 py-1 rounded-md text-[10px] font-mono font-medium"
            style={{ backgroundColor: `${phaseColor}18`, color: phaseColor }}
          >
            {phase}
          </div>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setEditValue(todayEntry.weight.toString()) }}
              className="font-mono text-[10px] text-[#444] active:text-[#888]"
            >
              edit
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-2">Bodyweight</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          placeholder={lastEntry ? lastEntry.weight.toString() : '170'}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg px-3 py-2.5 font-display text-lg font-bold text-white focus:outline-none focus:border-[#333] placeholder:text-[#333] transition-colors"
        />
        <span className="font-mono text-xs text-[#444]">lbs</span>
        <button
          onClick={handleSave}
          disabled={!inputValue}
          className="bg-white text-[#050507] font-display font-bold rounded-lg px-4 py-2.5 text-sm active:scale-95 transition-transform disabled:opacity-30"
        >
          Log
        </button>
      </div>
    </div>
  )
}
