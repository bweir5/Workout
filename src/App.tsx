import { useState, useCallback } from 'react'
import { HomeScreen } from '@/components/home/HomeScreen'
import { ActiveWorkout } from '@/components/workout/ActiveWorkout'
import { ProgressScreen } from '@/components/progress/ProgressScreen'
import { LogScreen } from '@/components/log/LogScreen'
import { SettingsScreen } from '@/components/settings/SettingsScreen'
import { getWIP } from '@/lib/storage'
import type { MuscleGroup } from '@/types'

type Screen = 'home' | 'workout' | 'progress' | 'log' | 'settings'

const NAV_ITEMS: Array<{ id: Screen; label: string; icon: React.ReactNode }> = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M2 9.5L11 2l9 7.5V20a1 1 0 01-1 1H14v-6H8v6H3a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M6 11h10M2 11h2m16 0h-2M4 9V7m0 8v-2m14-4V7m0 8v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 17l5-5 4 3 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 21h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'log',
    label: 'Log',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="3" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 8h6M8 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 2v2m0 16v2M2 11h2m16 0h2m-3.34-6.66-1.41 1.41M5.75 16.25l-1.41 1.41M18.66 16.66l-1.41-1.41M5.75 5.75 4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [workoutMuscle, setWorkoutMuscle] = useState<MuscleGroup | null>(null)

  // Check for WIP session on mount
  const wip = getWIP()

  const startWorkout = useCallback((muscle: MuscleGroup) => {
    setWorkoutMuscle(muscle)
    setScreen('workout')
  }, [])

  const handleWorkoutFinish = useCallback(() => {
    setWorkoutMuscle(null)
    setScreen('home')
  }, [])

  const handleWorkoutCancel = useCallback(() => {
    setWorkoutMuscle(null)
    setScreen('home')
  }, [])

  // Active workout screen (full screen, no nav)
  if (screen === 'workout' && workoutMuscle) {
    return (
      <ActiveWorkout
        muscle={workoutMuscle}
        onFinish={handleWorkoutFinish}
        onCancel={handleWorkoutCancel}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#050507] relative">
      {/* WIP banner */}
      {wip && screen !== 'workout' && (
        <div
          className="mx-4 mt-4 max-w-lg mx-auto card p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => startWorkout(wip.muscle as MuscleGroup)}
          style={{ borderColor: 'rgba(251, 191, 36, 0.2)', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}
        >
          <div>
            <div className="font-display font-bold text-amber-400 text-sm">Resume {wip.muscle}</div>
            <div className="font-mono text-[10px] text-amber-400/50">Session in progress — tap to continue</div>
          </div>
          <span className="font-mono text-amber-400 text-lg">→</span>
        </div>
      )}

      {/* Screen content */}
      <div>
        {screen === 'home' && <HomeScreen onStartWorkout={startWorkout} />}
        {screen === 'progress' && <ProgressScreen />}
        {screen === 'log' && <LogScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#050507]/95 backdrop-blur-md border-t border-[#131316] safe-pb z-30">
        <div className="flex max-w-lg mx-auto">
          {NAV_ITEMS.map(item => {
            const isActive = screen === item.id && !(screen === 'workout' && workoutMuscle)
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'workout') {
                    if (!workoutMuscle) {
                      setScreen('home')
                    }
                  } else {
                    setScreen(item.id)
                  }
                }}
                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all active:scale-90 ${
                  isActive ? 'text-white' : 'text-[#444]'
                }`}
              >
                <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className={`font-mono text-[10px] ${isActive ? 'text-white' : 'text-[#333]'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
