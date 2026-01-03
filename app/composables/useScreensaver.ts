// app/composables/useScreensaver.ts
// Manages screensaver state, idle detection, and settings

import type { Settings } from '~/types'

interface ForecastDay {
  date: string
  dayName: string
  tempHigh: number
  tempLow: number
  condition: string
  iconName: string
}

interface WeatherData {
  temp: number
  condition: string
  iconName: string
  units: 'metric' | 'imperial'
  forecast: ForecastDay[]
}

interface ScreensaverState {
  isActive: boolean
  settings: Settings | null
  currentImage: string | null
  attribution: string | null
  weather: WeatherData | null
  isDimmed: boolean
  isLoading: boolean
}

// Activity events to listen for
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'touchmove'] as const

export function useScreensaver() {
  // Global state shared across components
  const state = useState<ScreensaverState>('screensaver', () => ({
    isActive: false,
    settings: null,
    currentImage: null,
    attribution: null,
    weather: null,
    isDimmed: false,
    isLoading: false,
  }))

  const lastActivity = useState<number>('screensaver-activity', () => Date.now())
  const isInitialized = useState<boolean>('screensaver-initialized', () => false)

  // Convert time string (HH:MM) to minutes since midnight
  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return (hours ?? 0) * 60 + (minutes ?? 0)
  }

  // Get current time in minutes for the configured timezone
  function getCurrentTimeInMinutes(timezone: string): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(new Date())
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0')
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0')
    return hour * 60 + minute
  }

  // Check if current time is within dim schedule
  function isInDimSchedule(): boolean {
    const { settings } = state.value
    if (!settings?.screensaverDimEnabled || !settings.screensaverDimStart || !settings.screensaverDimEnd) {
      return false
    }

    try {
      const currentMinutes = getCurrentTimeInMinutes(settings.screensaverTimezone || 'UTC')
      const startMinutes = timeToMinutes(settings.screensaverDimStart)
      const endMinutes = timeToMinutes(settings.screensaverDimEnd)

      // Handle overnight schedule (e.g., 23:00 to 06:00)
      if (startMinutes > endMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes
      }
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    } catch {
      return false
    }
  }

  // Update last activity timestamp and deactivate if active
  function updateActivity() {
    lastActivity.value = Date.now()
    if (state.value.isActive) {
      deactivate()
    }
  }

  // Activate screensaver
  function activate() {
    if (!state.value.settings?.screensaverEnabled || state.value.isActive) return
    state.value.isActive = true
    state.value.isDimmed = isInDimSchedule()
  }

  // Deactivate screensaver
  function deactivate() {
    if (!state.value.isActive) return
    state.value.isActive = false
    lastActivity.value = Date.now()
  }

  // Fetch settings from API
  async function fetchSettings() {
    try {
      const response = await $fetch<{ data?: Settings; error?: string }>('/api/settings')
      if (response.data) {
        state.value.settings = response.data
      }
    } catch (error) {
      console.error('Failed to fetch screensaver settings:', error)
    }
  }

  // Fetch new background image with preloading
  async function fetchImage(): Promise<boolean> {
    state.value.isLoading = true

    try {
      const { settings } = state.value
      const response = await $fetch<{
        data?: { url: string; attribution: string }
        error?: string
      }>('/api/screensaver/image', {
        query: { category: settings?.screensaverCategory },
      })

      if (!response.data) {
        return false
      }

      // Preload image before displaying
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = response.data!.url
      })

      state.value.currentImage = response.data.url
      state.value.attribution = response.data.attribution
      return true
    } catch (error) {
      console.error('Failed to fetch screensaver image:', error)
      return false
    } finally {
      state.value.isLoading = false
    }
  }

  // Fetch weather data
  async function fetchWeather(): Promise<boolean> {
    try {
      const response = await $fetch<{ data?: WeatherData; error?: string }>('/api/screensaver/weather')

      if (response.data) {
        state.value.weather = response.data
        return true
      }

      if (response.error) {
        console.warn('Weather fetch error:', response.error)
      }
      return false
    } catch (error) {
      console.error('Failed to fetch weather:', error)
      state.value.weather = null
      return false
    }
  }

  // Check if screensaver should activate based on timeout
  function checkTimeout() {
    const { settings, isActive } = state.value
    if (!settings?.screensaverEnabled) return

    const timeoutMs = settings.screensaverTimeout * 1000
    const elapsed = Date.now() - lastActivity.value

    if (elapsed >= timeoutMs && !isActive) {
      activate()
    }

    // Update dim state while active
    if (isActive) {
      state.value.isDimmed = isInDimSchedule()
    }
  }

  // Initialize screensaver system
  async function initialize() {
    if (isInitialized.value) return
    isInitialized.value = true

    await fetchSettings()

    // Set up activity listeners (client-side only)
    if (import.meta.client) {
      ACTIVITY_EVENTS.forEach((event) => {
        window.addEventListener(event, updateActivity, { passive: true })
      })
    }
  }

  // Cleanup event listeners
  function cleanup() {
    if (import.meta.client) {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }

  return {
    // State (readonly)
    isActive: computed(() => state.value.isActive),
    settings: computed(() => state.value.settings),
    currentImage: computed(() => state.value.currentImage),
    attribution: computed(() => state.value.attribution),
    weather: computed(() => state.value.weather),
    isDimmed: computed(() => state.value.isDimmed),
    isLoading: computed(() => state.value.isLoading),
    // Actions
    initialize,
    cleanup,
    activate,
    deactivate,
    checkTimeout,
    fetchSettings,
    fetchImage,
    fetchWeather,
  }
}
