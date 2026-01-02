/**
 * System Bars Plugin
 *
 * Configures Android/iOS system bars (status bar + navigation bar) for immersive mode.
 * Uses Capacitor 8's built-in SystemBars API from @capacitor/core.
 *
 * @see https://capacitorjs.com/docs/apis/system-bars
 */
import { Capacitor, SystemBars } from '@capacitor/core'

export default defineNuxtPlugin(async () => {
  // Skip on web - SystemBars only works on native platforms
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    // Hide system bars for full-screen immersive experience
    // This hides both the status bar (top) and navigation bar (bottom)
    await SystemBars.hide({})
  } catch (error) {
    // Fail silently - app works fine with system bars visible
    console.warn('[SystemBars] Failed to hide system bars:', error)
  }
})
