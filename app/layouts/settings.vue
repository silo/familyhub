<script setup lang="ts">
// Settings layout with authentication and timeout
const { isAuthenticated, isTimedOut, verify, updateActivity, checkTimeout } = useSettingsAuth()

const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

// Set up activity listeners
onMounted(async () => {
  if (import.meta.client) {
    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('click', updateActivity)
    window.addEventListener('scroll', updateActivity)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('mousemove', updateActivity)
    window.removeEventListener('keydown', updateActivity)
    window.removeEventListener('click', updateActivity)
    window.removeEventListener('scroll', updateActivity)
  }
})

// Check timeout every 5 seconds
const timeoutInterval = ref<ReturnType<typeof setInterval> | null>(null)
onMounted(() => {
  timeoutInterval.value = setInterval(checkTimeout, 5000)
})
onUnmounted(() => {
  if (timeoutInterval.value) {
    clearInterval(timeoutInterval.value)
  }
})

async function handleLogin() {
  if (!password.value) {
    error.value = 'Please enter your password'
    return
  }

  loading.value = true
  error.value = null

  const result = await verify(password.value)

  if (!result.success) {
    error.value = result.error || 'Verification failed'
  }

  password.value = ''
  loading.value = false
}

// Read version from runtime config
// const runtimeConfig = useRuntimeConfig()
const version = ref('1.0.0')

// Navigation items
const navItems = [
  { label: 'Family Members', to: '/settings/family-members', icon: 'i-lucide-users' },
  { label: 'Categories', to: '/settings/categories', icon: 'i-lucide-folder' },
  { label: 'Chores', to: '/settings/chores', icon: 'i-lucide-list-checks' },
  { label: 'Points', to: '/settings/points', icon: 'i-lucide-coins' },
  { label: 'Theme', to: '/settings/theme', icon: 'i-lucide-palette' },
  { label: 'Screensaver', to: '/settings/screensaver', icon: 'i-lucide-monitor' },
  { label: 'Security', to: '/settings/security', icon: 'i-lucide-shield' },
  { label: 'Backup', to: '/settings/backup', icon: 'i-lucide-download' },
]
</script>

<template>
  <div class="min-h-screen bg-muted">
    <!-- Auth Modal/Overlay -->
    <div
      v-if="!isAuthenticated || isTimedOut"
      class="fixed inset-0 z-50 flex items-center justify-center bg-inverted/80 backdrop-blur-sm"
    >
      <UCard class="w-full max-w-sm">
        <template #header>
          <div class="text-center">
            <h2 class="text-xl font-bold text-highlighted">Settings Access</h2>
            <p class="mt-1 text-sm text-muted">
              {{
                isTimedOut && isAuthenticated ? 'Session timed out' : 'Enter password to continue'
              }}
            </p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <UFormField label="Password" name="password">
            <UInput
              v-model="password"
              type="password"
              placeholder="Enter password"
              icon="i-lucide-lock"
              autofocus
            />
          </UFormField>

          <UAlert v-if="error" color="error" icon="i-lucide-alert-circle" :title="error" />

          <div class="flex gap-2">
            <UButton to="/dashboard" color="neutral" variant="outline" class="flex-1">
              Cancel
            </UButton>
            <UButton type="submit" class="flex-1" :loading="loading"> Unlock </UButton>
          </div>
        </form>
      </UCard>
    </div>

    <!-- Settings Content (visible when authenticated) -->
    <div v-show="isAuthenticated && !isTimedOut" class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-64 border-r border-default bg-default">
        <div class="flex h-full flex-col">
          <!-- Header -->
          <div class="border-b border-default p-4">
            <div class="flex items-center gap-2">
              <UButton
                to="/dashboard"
                color="neutral"
                variant="ghost"
                icon="i-lucide-arrow-left"
                size="sm"
              />
              <h1 class="text-lg font-semibold text-highlighted">Settings</h1>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 space-y-1 p-4">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated"
              active-class="bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
            >
              <UIcon :name="item.icon" class="size-5" />
              {{ item.label }}
            </NuxtLink>
          </nav>

          <!-- Footer -->
          <div class="border-t border-default p-4">
            <p class="text-xs text-dimmed">FamilyHub v{{ version }}</p>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
