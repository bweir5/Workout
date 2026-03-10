import { useState } from 'react'
import { getSettings, saveSettings, exportData, resetMesocycle } from '@/lib/storage'

export function SettingsScreen() {
  const [settings, setSettings] = useState(getSettings())
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exported, setExported] = useState(false)

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
    if (confirm('Reset mesocycle to Week 1? This will restart your 4-week cycle.')) {
      resetMesocycle()
      alert('Mesocycle reset to Week 1.')
    }
  }

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-4">
      <h2 className="font-display font-extrabold text-2xl text-white mb-6">Settings</h2>

      <div className="space-y-4">
        {/* AI Coaching */}
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">AI Coaching</div>
          <div className="space-y-3">
            <div>
              <label className="font-mono text-xs text-[#888] block mb-1.5">Anthropic API Key</label>
              <div className="relative">
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  placeholder="sk-ant-api03-..."
                  value={settings.apiKey ?? ''}
                  onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
                  className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#333] placeholder:text-[#333] pr-16"
                />
                <button
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#444] hover:text-[#888] transition-colors"
                >
                  {apiKeyVisible ? 'hide' : 'show'}
                </button>
              </div>
              <div className="font-mono text-[10px] text-[#333] mt-1.5">
                Required for AI coaching. Get your key at console.anthropic.com
              </div>
            </div>
          </div>
        </div>

        {/* Units & Targets */}
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Units & Targets</div>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs text-[#888] block mb-2">Weight Unit</label>
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
              <label className="font-mono text-xs text-[#888] block mb-1.5">
                Protein Target Override (g/day)
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Default: BW × 0.82g"
                value={settings.proteinTargetOverride ?? ''}
                onChange={e => setSettings({
                  ...settings,
                  proteinTargetOverride: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#333] placeholder:text-[#333]"
              />
              <div className="font-mono text-[10px] text-[#333] mt-1">
                Leave empty to use default formula (bodyweight × 0.82g)
              </div>
            </div>
          </div>
        </div>

        {/* Rest Timers */}
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Rest Timers</div>
          <div className="space-y-3">
            <div>
              <label className="font-mono text-xs text-[#888] block mb-1.5">Compound exercises (seconds)</label>
              <input
                type="number"
                inputMode="numeric"
                value={settings.restTimerCompound}
                onChange={e => setSettings({ ...settings, restTimerCompound: parseInt(e.target.value) || 180 })}
                className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#333]"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-[#888] block mb-1.5">Isolation exercises (seconds)</label>
              <input
                type="number"
                inputMode="numeric"
                value={settings.restTimerIsolation}
                onChange={e => setSettings({ ...settings, restTimerIsolation: parseInt(e.target.value) || 90 })}
                className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#333]"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-white text-[#050507] font-display font-bold rounded-2xl py-4 active:scale-95 transition-all"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>

        {/* Danger zone */}
        <div className="card p-4">
          <div className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Data</div>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full bg-[#0f0f12] border border-[#1a1a20] rounded-xl py-3 font-mono text-sm text-[#888] active:scale-95 transition-transform"
            >
              {exported ? '✓ Downloaded' : 'Export Data (JSON)'}
            </button>
            <button
              onClick={handleMesocycleReset}
              className="w-full bg-[#0f0f12] border border-amber-500/20 rounded-xl py-3 font-mono text-sm text-amber-500/70 active:scale-95 transition-transform"
            >
              Reset Mesocycle to Week 1
            </button>
          </div>
        </div>

        <div className="text-center font-mono text-[10px] text-[#333] py-2">
          IronLog v1.0 · Data stored locally
        </div>
      </div>
    </div>
  )
}
