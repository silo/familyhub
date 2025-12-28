// app/composables/useMobileAuth.ts
// Composable for mobile app authentication with session persistence

import { Preferences } from '@capacitor/preferences'

const SESSION_KEY = 'familyhub_session'
const USER_KEY = 'familyhub_user'

interface User {
  id: number
  name: string
  avatarType: string
  avatarValue: string
  color: string
  isAdmin: boolean
}

interface Session {
  token: string
  expiresAt: string
  user: User
}

export function useMobileAuth() {
  const { apiUrl } = useMobileConfig()
  const user = useState<User | null>('mobile-user', () => null)
  const token = useState<string | null>('mobile-token', () => null)
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isLoading = ref(true)

  // Load session from storage on app start
  async function loadSession() {
    isLoading.value = true
    try {
      const { value: sessionJson } = await Preferences.get({ key: SESSION_KEY })
      if (sessionJson) {
        const session: Session = JSON.parse(sessionJson)
        
        // Check if session is expired
        if (new Date(session.expiresAt) > new Date()) {
          token.value = session.token
          user.value = session.user
        } else {
          // Clear expired session
          await clearSession()
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      await clearSession()
    } finally {
      isLoading.value = false
    }
  }

  // Save session to storage
  async function saveSession(session: Session) {
    try {
      await Preferences.set({
        key: SESSION_KEY,
        value: JSON.stringify(session),
      })
      token.value = session.token
      user.value = session.user
    } catch (error) {
      console.error('Failed to save session:', error)
      throw error
    }
  }

  // Clear session from storage
  async function clearSession() {
    try {
      await Preferences.remove({ key: SESSION_KEY })
      token.value = null
      user.value = null
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  // Login with family member ID and password
  async function login(
    familyMemberId: number,
    password: string,
    deviceName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await $fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        body: {
          familyMemberId,
          password,
          deviceName: deviceName || 'Mobile App',
        },
      })

      if ('error' in response) {
        return { success: false, error: response.error }
      }

      await saveSession({
        token: response.data.token,
        expiresAt: response.data.expiresAt,
        user: response.data.user,
      })

      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  // Logout
  async function logout(): Promise<{ success: boolean; error?: string }> {
    try {
      if (token.value) {
        await $fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    }

    await clearSession()
    return { success: true }
  }

  // Get auth headers for API calls
  function getAuthHeaders(): Record<string, string> {
    if (!token.value) return {}
    return {
      Authorization: `Bearer ${token.value}`,
    }
  }

  // Refresh user data from API
  async function refreshUser(): Promise<void> {
    if (!token.value) return

    try {
      const response = await $fetch(apiUrl('/api/auth/me'), {
        headers: getAuthHeaders(),
      })

      if ('data' in response) {
        user.value = response.data
      } else {
        // Session invalid, clear it
        await clearSession()
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      await clearSession()
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    isLoading: readonly(isLoading),
    loadSession,
    login,
    logout,
    getAuthHeaders,
    refreshUser,
  }
}
