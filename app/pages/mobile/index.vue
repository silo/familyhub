<script setup lang="ts">
// Mobile app entry point - redirects to setup or login
definePageMeta({
  layout: 'mobile',
})

const { loadConfig, isConfigured } = useMobileConfig()
const { loadSession, isAuthenticated } = useMobileAuth()

onMounted(async () => {
  await loadConfig()
  
  if (!isConfigured.value) {
    // First time - go to server setup
    await navigateTo('/mobile/setup', { replace: true })
    return
  }
  
  await loadSession()
  
  if (isAuthenticated.value) {
    // Already logged in - go to scan
    await navigateTo('/mobile/scan', { replace: true })
  } else {
    // Need to login
    await navigateTo('/mobile/login', { replace: true })
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="mx-auto h-12 w-12 animate-spin text-primary" />
      <p class="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
</template>
