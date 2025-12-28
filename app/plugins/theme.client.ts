// app/plugins/theme.client.ts
// Client-side plugin to load and apply theme settings on app startup

import { applyTheme, normalizeRadius } from '~/composables/useTheme'
import { DEFAULT_THEME, type PrimaryColor, type NeutralColor, type ColorMode } from '~/types'

export default defineNuxtPlugin(async () => {
  try {
    const response = await $fetch('/api/settings')

    if (response && 'data' in response && response.data) {
      const settings = response.data as {
        primaryColor?: string
        neutralColor?: string
        radius?: string
        colorMode?: string
      }

      applyTheme({
        primaryColor: (settings.primaryColor as PrimaryColor) || DEFAULT_THEME.primaryColor,
        neutralColor: (settings.neutralColor as NeutralColor) || DEFAULT_THEME.neutralColor,
        radius: normalizeRadius(settings.radius),
        colorMode: (settings.colorMode as ColorMode) || DEFAULT_THEME.colorMode,
      })
    }
  } catch (error) {
    console.warn('Failed to load theme settings:', error)
  }
})
