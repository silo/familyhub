// app/composables/useSettingsAuth.ts

const TIMEOUT_MS = 60 * 1000 // 1 minute

export function useSettingsAuth() {
  const isAuthenticated = useState<boolean>('settings-auth', () => false)
  const lastActivity = useState<number>('settings-last-activity', () => 0)

  // Check if session has timed out
  const isTimedOut = computed(() => {
    if (!isAuthenticated.value) return true
    if (lastActivity.value === 0) return true
    return Date.now() - lastActivity.value > TIMEOUT_MS
  })

  // Update activity timestamp
  function updateActivity() {
    if (isAuthenticated.value) {
      lastActivity.value = Date.now()
    }
  }

  // Verify password
  async function verify(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await $fetch('/api/settings/verify', {
        method: 'POST',
        body: { password },
      })

      if ('error' in response) {
        return { success: false, error: response.error }
      }

      isAuthenticated.value = true
      lastActivity.value = Date.now()

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Verification failed' }
    }
  }

  // Lock/logout
  function lock() {
    isAuthenticated.value = false
    lastActivity.value = 0
  }

  // Check and lock if timed out
  function checkTimeout() {
    if (isAuthenticated.value && isTimedOut.value) {
      lock()
    }
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    isTimedOut,
    verify,
    updateActivity,
    lock,
    checkTimeout,
  }
}
