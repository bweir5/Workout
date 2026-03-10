import { useState } from 'react'
import { StrengthTab } from './StrengthTab'
import { BodyTab } from './BodyTab'
import { NutritionTab } from './NutritionTab'
import { VolumeTab } from './VolumeTab'

type Tab = 'strength' | 'body' | 'nutrition' | 'volume'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'strength', label: 'Strength' },
  { id: 'body', label: 'Body' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'volume', label: 'Volume' }
]

export function ProgressScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('strength')

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <h2 className="font-display font-extrabold text-2xl text-white mb-4">Progress</h2>

        {/* Tab bar */}
        <div className="flex gap-1 bg-[#0a0a0c] border border-[#131316] rounded-2xl p-1 mb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl font-mono text-xs transition-all active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-white text-[#050507] font-medium'
                  : 'text-[#555] hover:text-[#888]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        {activeTab === 'strength' && <StrengthTab />}
        {activeTab === 'body' && <BodyTab />}
        {activeTab === 'nutrition' && <NutritionTab />}
        {activeTab === 'volume' && <VolumeTab />}
      </div>
    </div>
  )
}
