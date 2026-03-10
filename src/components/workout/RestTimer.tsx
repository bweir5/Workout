import { useState, useEffect, useRef } from 'react'
import { getSettings } from '@/lib/storage'

interface Props {
  isCompound: boolean
  onClose: () => void
}

export function RestTimer({ isCompound, onClose }: Props) {
  const settings = getSettings()
  const defaultTime = isCompound ? settings.restTimerCompound : settings.restTimerIsolation

  const [timeLeft, setTimeLeft] = useState(defaultTime)
  const [customTime, setCustomTime] = useState(defaultTime)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false)
            // Vibrate on completion
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, timeLeft])

  const reset = (time: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimeLeft(time)
    setCustomTime(time)
    setRunning(true)
  }

  const toggle = () => setRunning(r => !r)

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const pct = (timeLeft / customTime) * 100

  const circumference = 2 * Math.PI * 44
  const strokeDash = (pct / 100) * circumference

  const color = timeLeft <= 30
    ? 'hsl(142, 55%, 40%)'
    : timeLeft <= 60
    ? 'hsl(38, 85%, 52%)'
    : 'hsl(210, 70%, 50%)'

  return (
    <div className="fixed inset-0 bg-[#050507]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-xs animate-spring-in">
        <div className="font-mono text-xs text-[#555] uppercase tracking-widest text-center mb-4">
          Rest Timer · {isCompound ? 'Compound' : 'Isolation'}
        </div>

        {/* Arc */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="44" fill="none" stroke="#131316" strokeWidth="6" />
            <circle
              cx="64" cy="64" r="44"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dasharray 0.3s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-3xl text-white">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            {timeLeft === 0 && (
              <span className="font-mono text-xs text-green-400 mt-1">REST COMPLETE</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={toggle}
            className="flex-1 bg-[#131316] border border-[#1a1a20] rounded-xl py-3 font-mono text-sm text-[#888] active:scale-95 transition-transform"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => reset(customTime)}
            className="flex-1 bg-[#131316] border border-[#1a1a20] rounded-xl py-3 font-mono text-sm text-[#888] active:scale-95 transition-transform"
          >
            Reset
          </button>
        </div>

        {/* Quick time buttons */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[60, 90, 120, 180, 240, 300, 360, 420].map(t => (
            <button
              key={t}
              onClick={() => reset(t)}
              className={`rounded-lg py-2 font-mono text-xs transition-all active:scale-95 ${
                customTime === t
                  ? 'bg-white text-[#050507] font-medium'
                  : 'bg-[#0f0f12] border border-[#1a1a20] text-[#555]'
              }`}
            >
              {t < 60 ? `${t}s` : `${t / 60}m`}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full font-mono text-sm text-[#555] py-2 active:scale-95 transition-transform"
        >
          Close
        </button>
      </div>
    </div>
  )
}
