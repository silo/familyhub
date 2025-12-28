<script setup lang="ts">
import { Capacitor } from '@capacitor/core'

// Detect if running in Capacitor native app
const isNative = Capacitor.isNativePlatform()

if (isNative) {
  // Mobile app - go to mobile entry point
  await navigateTo('/mobile', { replace: true })
} else {
  // Web app - go to dashboard
  await navigateTo('/dashboard', { replace: true })
}
</script>

<template>
  <div>Redirecting...</div>
</template>
