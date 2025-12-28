// app/composables/useMobileConfig.ts
// Composable for mobile app server configuration

import { Preferences } from '@capacitor/preferences'

const SERVER_URL_KEY = 'familyhub_server_url'

export function useMobileConfig() {
  const serverUrl = useState<string | null>('mobile-server-url', () => null)
  const isConfigured = computed(() => !!serverUrl.value)
  const isLoading = ref(true)

  // Load server URL from storage
  async function loadConfig() {
    isLoading.value = true
    try {
      const { value } = await Preferences.get({ key: SERVER_URL_KEY })
      if (value) {
        serverUrl.value = value
      }
    } catch (error) {
      console.error('Failed to load server config:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Save server URL to storage
  async function setServerUrl(url: string): Promise<{ success: boolean; error?: string }> {
    // Normalize URL - remove trailing slash
    const normalizedUrl = url.replace(/\/+$/, '')
    
    // Validate URL format
    try {
      new URL(normalizedUrl)
    } catch {
      return { success: false, error: 'Invalid URL format' }
    }

    // Test connection to the server
    try {
      const response = await fetch(`${normalizedUrl}/api/setup/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        return { success: false, error: 'Could not connect to server' }
      }
      
      const data = await response.json()
      if (!('data' in data)) {
        return { success: false, error: 'Invalid server response' }
      }
    } catch (error) {
      console.error('Server connection test failed:', error)
      return { success: false, error: 'Could not connect to server. Check the URL and try again.' }
    }

    // Save to storage
    try {
      await Preferences.set({
        key: SERVER_URL_KEY,
        value: normalizedUrl,
      })
      serverUrl.value = normalizedUrl
      return { success: true }
    } catch (error) {
      console.error('Failed to save server URL:', error)
      return { success: false, error: 'Failed to save configuration' }
    }
  }

  // Clear server URL (for resetting config)
  async function clearConfig() {
    try {
      await Preferences.remove({ key: SERVER_URL_KEY })
      serverUrl.value = null
    } catch (error) {
      console.error('Failed to clear config:', error)
    }
  }

  // Build full API URL
  function apiUrl(path: string): string {
    if (!serverUrl.value) {
      // Fallback to relative URL (for web)
      return path
    }
    return `${serverUrl.value}${path}`
  }

  return {
    serverUrl: readonly(serverUrl),
    isConfigured,
    isLoading: readonly(isLoading),
    loadConfig,
    setServerUrl,
    clearConfig,
    apiUrl,
  }
}
