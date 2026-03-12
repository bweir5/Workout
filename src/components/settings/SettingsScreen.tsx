import { useState } from 'react'
import { getSettings, saveSettings, exportData, resetMesocycle } from '@/lib/storage'

export function SettingsScreen() {
  const [settings, setSettings] = useState(getSettings())
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exported, setExported] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ironlog-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  const handleMesocycleReset = () => {
    resetMesocycle()
    setConfirmReset(false)
    setResetDone(true)
    setTimeout(() => setResetDone(false), 3000)
  }

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-4">
      <h2 className="font-display font-extrabold text-xl text-white mb-5">Settings</h2>

      <div className="space-y-3">
        {/* AI Coaching */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">AI Coaching</div>
          <div>
            <label className="font-mono text-xs text-[#666] block mb-1.5">Anthropic API Key</label>
            <div className="relative">
              <input
                type={apiKeyVisible ? 'text' : 'password'}
                placeholder="sk-ant-api03-..."
                value={settings.apiKey ?? ''}
                onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
                className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#2a2a30] placeholder:text-[#2a2a30] pr-14 transition-colors"
              />
              <button
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#444]"
              >
                {apiKeyVisible ? 'hide' : 'show'}
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#333] mt-1.5">Required for AI features. Get key at console.anthropic.com</div>
          </div>
        </div>

        {/* Units & Targets */}
        <div className="card p-4 space-y-4">
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">Units & Targets</div>
          <div>
            <label className="font-mono text-xs text-[#666] block mb-2">Weight Unit</label>
            <div className="flex gap-2">
              {(['lbs', 'kg'] as const).map(unit => (
                <button
                  key={unit}
                  onClick={() => setSettings({ ...settings, weightUnit: unit })}
                  className={`flex-1 py-2.5 rounded-xl font-mono text-sm transition-all active:scale-95 ${
                    settings.weightUnit === unit
                      ? 'bg-white text-[#050507] font-medium'
                      : 'bg-[#0f0f12] border border-[#1a1a20] text-[#555]'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-xs text-[#666] block mb-1.5">Protein Target Override (g/day)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Default: bodyweight × 0.82"
              value={settings.proteinTargetOverride ?? ''}
              onChange={e => setSettings({ ...settings, proteinTargetOverride: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#2a2a30] placeholder:text-[#2a2a30]"
            />
          </div>
        </div>

        {/* Rest Timers */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">Rest Timers</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-xs text-[#666] block mb-1.5">Compound (sec)</label>
              <input
                type="number"
                inputMode="numeric"
                value={settings.restTimerCompound}
                onChange={e => setSettings({ ...settings, restTimerCompound: parseInt(e.target.value) || 180 })}
                className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-3 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-[#2a2a30]"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-[#666] block mb-1.5">Isolation (sec)</label>
              <input
                type="number"
                inputMode="numeric"
                value={settings.restTimerIsolation}
                onChange={e => setSettings({ ...settings, restTimerIsolation: parseInt(e.target.value) || 90 })}
                className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-3 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-[#2a2a30]"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full bg-white text-[#050507] font-display font-bold rounded-2xl py-3.5 active:scale-95 transition-all text-sm"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>

        {/* Data */}
        <div className="card p-4 space-y-2">
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1">Data</div>
          <button
            onClick={handleExport}
            className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl py-3 font-mono text-sm text-[#666] active:scale-95 transition-transform"
          >
            {exported ? '✓ Downloaded' : 'Export JSON'}
          </button>

          {resetDone ? (
            <div className="w-full py-3 font-mono text-xs text-center text-green-500">✓ Mesocycle reset to Week 1</div>
          ) : confirmReset ? (
            <div className="border border-red-500/20 rounded-xl p-3">
              <div className="font-mono text-xs text-[#666] mb-3">Reset mesocycle to Week 1? Cannot be undone.</div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="flex-1 bg-[#0f0f12] border border-[#1a1a20] rounded-lg py-2 font-mono text-xs text-[#555] active:scale-95">Cancel</button>
                <button onClick={handleMesocycleReset} className="flex-1 rounded-lg py-2 font-mono text-xs text-red-400 border border-red-500/20 bg-red-500/5 active:scale-95">Reset</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full bg-[#0f0f12] border border-amber-500/15 rounded-xl py-3 font-mono text-sm text-amber-600/70 active:scale-95 transition-transform"
            >
              Reset Mesocycle
            </button>
          )}
        </div>

        <div className="text-center font-mono text-[9px] text-[#2a2a30] py-2">IronLog · data stored locally on device</div>
      </div>

    </div>
  )
}
