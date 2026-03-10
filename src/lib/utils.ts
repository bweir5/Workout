import type { MuscleGroup } from '@/types'

export const MUSCLE_COLORS: Record<string, string> = {
  Chest: 'hsl(4, 75%, 52%)',
  Back: 'hsl(210, 75%, 52%)',
  Legs: 'hsl(142, 55%, 40%)',
  Arms: 'hsl(32, 90%, 52%)',
  Shoulders: 'hsl(270, 60%, 58%)'
}

export const MUSCLE_COLORS_BG: Record<string, string> = {
  Chest: 'rgba(220, 50, 47, 0.12)',
  Back: 'rgba(47, 135, 220, 0.12)',
  Legs: 'rgba(50, 150, 85, 0.12)',
  Arms: 'rgba(230, 140, 30, 0.12)',
  Shoulders: 'rgba(150, 80, 200, 0.12)'
}

export function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hours > 0) return `${hours}h ${remainingMins}m`
  return `${mins}m`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getProteinColor(compliance: number): string {
  if (compliance >= 90) return 'hsl(142, 60%, 45%)'
  if (compliance >= 70) return 'hsl(38, 85%, 52%)'
  return 'hsl(4, 70%, 50%)'
}

export function getProteinColorClass(compliance: number): string {
  if (compliance >= 90) return 'text-green-400'
  if (compliance >= 70) return 'text-amber-400'
  return 'text-red-400'
}

export function getReadinessColor(score: number): string {
  if (score >= 75) return 'hsl(142, 55%, 40%)'
  if (score >= 50) return 'hsl(38, 85%, 52%)'
  return 'hsl(4, 70%, 50%)'
}

export function getMesocycleWeekColor(week: 1 | 2 | 3 | 4): string {
  switch (week) {
    case 1: return 'hsl(210, 70%, 50%)'
    case 2: return 'hsl(38, 85%, 52%)'
    case 3: return 'hsl(4, 70%, 52%)'
    case 4: return 'hsl(142, 50%, 42%)'
  }
}

export function getMesocycleWeekLabel(week: 1 | 2 | 3 | 4): string {
  switch (week) {
    case 1: return 'W1 · Accumulate'
    case 2: return 'W2 · Intensify'
    case 3: return 'W3 · Peak'
    case 4: return 'W4 · Deload'
  }
}

export function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'Bulk': return 'hsl(210, 70%, 50%)'
    case 'Cut': return 'hsl(4, 70%, 52%)'
    default: return 'hsl(142, 50%, 42%)'
  }
}

export function getPhaseIcon(phase: string): string {
  switch (phase) {
    case 'Bulk': return '↑'
    case 'Cut': return '↓'
    default: return '→'
  }
}

export function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getMuscles(): MuscleGroup[] {
  return ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders']
}
