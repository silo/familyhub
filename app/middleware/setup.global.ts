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
  try {
    const { data } = await useFetch('/api/setup/status')

    if (!data.value?.data?.isSetupComplete) {
      return navigateTo('/setup')
    }
  } catch (error) {
    // If we can't check, redirect to setup
    console.error('Failed to check setup status:', error)
    return navigateTo('/setup')
  }
})
