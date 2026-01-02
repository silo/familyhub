// app/middleware/setup.global.ts
import { Capacitor } from '@capacitor/core'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for mobile app routes - mobile handles its own setup flow
  if (Capacitor.isNativePlatform() || to.path.startsWith('/mobile')) {
    return
  }

  // Skip middleware for setup page
  if (to.path === '/setup') {
    return
  }

  // Check if setup is complete
  // Use $fetch instead of useFetch to avoid caching issues after setup completion
  try {
    const response = await $fetch('/api/setup/status')

    if (!response?.data?.isSetupComplete) {
      return navigateTo('/setup')
    }
  } catch (error) {
    // If we can't check, redirect to setup
    console.error('Failed to check setup status:', error)
    return navigateTo('/setup')
  }
})
