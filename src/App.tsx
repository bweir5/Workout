import { useState, useCallback } from 'react'
import { HomeScreen } from '@/components/home/HomeScreen'
import { ActiveWorkout } from '@/components/workout/ActiveWorkout'
import { ProgressScreen } from '@/components/progress/ProgressScreen'
import { LogScreen } from '@/components/log/LogScreen'
import { SettingsScreen } from '@/components/settings/SettingsScreen'
import { getWIP, saveWIP } from '@/lib/storage'
import type { MuscleGroup, Session } from '@/types'

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
  const [wip, setWip] = useState<Session | null>(() => getWIP())
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const startWorkout = useCallback((muscle: MuscleGroup) => {
    setWorkoutMuscle(muscle)
    setScreen('workout')
  }, [])

  const handleWorkoutFinish = useCallback(() => {
    setWip(null)
    setWorkoutMuscle(null)
    setScreen('home')
  }, [])

  const handleWorkoutCancel = useCallback(() => {
    // Re-read WIP from storage in case it was updated or cleared by ActiveWorkout
    setWip(getWIP())
    setWorkoutMuscle(null)
    setScreen('home')
  }, [])

  const handleDiscardWIP = useCallback(() => {
    saveWIP(null)
    setWip(null)
    setShowDiscardConfirm(false)
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
        <div className="mx-4 mt-4 max-w-lg mx-auto">
          <div
            className="card flex items-center justify-between"
            style={{ borderColor: 'rgba(251, 191, 36, 0.2)', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}
          >
            <button
              className="flex-1 flex items-center justify-between p-3 active:scale-[0.99] transition-transform"
              onClick={() => startWorkout(wip.muscle as MuscleGroup)}
            >
              <div>
                <div className="font-display font-bold text-amber-400 text-sm">Resume {wip.muscle}</div>
                <div className="font-mono text-[10px] text-amber-400/50">Tap to continue session</div>
              </div>
              <span className="font-mono text-amber-400 text-lg mr-3">→</span>
            </button>
            <button
              onClick={() => setShowDiscardConfirm(true)}
              className="px-3 py-4 font-mono text-xs text-amber-400/40 hover:text-red-400 transition-colors border-l border-amber-500/10"
              aria-label="Discard workout"
            >
              ✕
            </button>
          </div>
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
            const isWorkoutTab = item.id === 'workout'
            const isActive = screen === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isWorkoutTab) {
                    if (wip) {
                      // Resume existing workout
                      startWorkout(wip.muscle as MuscleGroup)
                    } else {
                      // Go to home to pick a muscle and start a workout
                      setScreen('home')
                    }
                  } else {
                    setScreen(item.id)
                  }
                }}
                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all active:scale-90 relative ${
                  isWorkoutTab && wip
                    ? 'text-amber-400'
                    : isActive
                    ? 'text-white'
                    : 'text-[#444]'
                }`}
              >
                {/* WIP dot indicator on Workout tab */}
                {isWorkoutTab && wip && (
                  <div className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
                <div className={`transition-transform ${isActive && !isWorkoutTab ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className={`font-mono text-[10px] ${isWorkoutTab && wip ? 'text-amber-400' : isActive ? 'text-white' : 'text-[#333]'}`}>
                  {isWorkoutTab && wip ? 'Resume' : item.label}
                </span>
                {isActive && !isWorkoutTab && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Discard WIP confirm modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-[#050507]/90 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="card p-6 w-full max-w-xs animate-spring-in">
            <div className="font-display font-bold text-white text-xl mb-1">Discard Workout?</div>
            <div className="font-mono text-sm text-[#555] mb-5">
              Your {wip?.muscle} session will be permanently deleted.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 bg-[#131316] border border-[#1a1a20] rounded-xl py-3 font-mono text-sm text-[#888] active:scale-95 transition-transform"
              >
                Keep
              </button>
              <button
                onClick={handleDiscardWIP}
                className="flex-1 rounded-xl py-3 font-mono text-sm font-medium text-red-400 border border-red-500/20 bg-red-500/5 active:scale-95 transition-transform"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
