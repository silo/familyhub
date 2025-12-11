// Utility functions for chore cooldown calculations
import type { Chore, ChoreCompletion } from '~/types'

export type CooldownStatus = {
  canComplete: boolean
  reason?: string
  nextAvailableAt?: Date
  remainingTime?: string
}

/**
 * Check if a chore can be completed based on its cooldown settings
 */
export function checkCooldownStatus(
  chore: Chore,
  lastCompletion?: ChoreCompletion | null,
  now = new Date()
): CooldownStatus {
  // No cooldown type means unlimited
  if (!chore.cooldownType || chore.cooldownType === 'unlimited') {
    return { canComplete: true }
  }

  // No previous completion means can complete
  if (!lastCompletion) {
    return { canComplete: true }
  }

  const lastCompletedAt = new Date(lastCompletion.completedAt)

  if (chore.cooldownType === 'daily') {
    // Check if completed today (using local timezone)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    if (lastCompletedAt >= todayStart) {
      const tomorrow = new Date(todayStart)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      return {
        canComplete: false,
        reason: 'Already completed today',
        nextAvailableAt: tomorrow,
        remainingTime: formatTimeRemaining(tomorrow.getTime() - now.getTime())
      }
    }
    return { canComplete: true }
  }

  if (chore.cooldownType === 'hours' && chore.cooldownHours) {
    const cooldownMs = chore.cooldownHours * 60 * 60 * 1000
    const nextAvailable = new Date(lastCompletedAt.getTime() + cooldownMs)

    if (now < nextAvailable) {
      return {
        canComplete: false,
        reason: `Wait ${chore.cooldownHours}h between completions`,
        nextAvailableAt: nextAvailable,
        remainingTime: formatTimeRemaining(nextAvailable.getTime() - now.getTime())
      }
    }
    return { canComplete: true }
  }

  return { canComplete: true }
}

/**
 * Format milliseconds remaining into human-readable string
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Now'

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Get display text for cooldown type
 */
export function getCooldownDisplayText(chore: Chore): string | null {
  if (!chore.cooldownType || chore.cooldownType === 'unlimited') {
    return null
  }

  if (chore.cooldownType === 'daily') {
    return 'Once per day'
  }

  if (chore.cooldownType === 'hours' && chore.cooldownHours) {
    return `Every ${chore.cooldownHours}h`
  }

  return null
}

/**
 * Check if a recurring chore should be shown today
 */
export function shouldShowRecurringChore(chore: Chore, date = new Date()): boolean {
  if (!chore.recurringType || !chore.recurringConfig) {
    return true
  }

  const config = chore.recurringConfig as {
    daysOfWeek?: number[]
    endDate?: string
  }

  // Check end date
  if (config.endDate) {
    const endDate = new Date(config.endDate)
    if (date > endDate) {
      return false
    }
  }

  // Check day of week (0 = Sunday, 1 = Monday, etc.)
  if (config.daysOfWeek && config.daysOfWeek.length > 0) {
    const dayOfWeek = date.getDay()
    return config.daysOfWeek.includes(dayOfWeek)
  }

  return true
}
