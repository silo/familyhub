// app/middleware/setup.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
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
