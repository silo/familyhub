<script setup lang="ts">
// Mobile login page
definePageMeta({
  layout: 'mobile',
})

const { login, isAuthenticated, isLoading, loadSession } = useMobileAuth()
const { isConfigured, loadConfig, apiUrl, serverUrl, clearConfig } = useMobileConfig()

const configLoading = ref(true)

// Load config and session on mount
onMounted(async () => {
  await loadConfig()

  // If not configured, redirect to setup
  if (!isConfigured.value) {
    await navigateTo('/mobile/setup')
    return
  }

  configLoading.value = false

  await loadSession()
  if (isAuthenticated.value) {
    await navigateTo('/mobile/scan')
  }
})

// Fetch family members for login
const members = ref<
  Array<{
    id: number
    name: string
    avatarType: string
    avatarValue: string
    color: string
    hasPassword: boolean
  }>
>([])
const fetchError = ref<string | null>(null)

watch(
  isConfigured,
  async configured => {
    if (configured && serverUrl.value) {
      try {
        const response = await $fetch<{ data: typeof members.value }>(apiUrl('/api/auth/members'))
        if ('data' in response) {
          members.value = response.data.filter(m => m.hasPassword)
        }
      } catch (error) {
        console.error('Failed to fetch members:', error)
        fetchError.value = 'Failed to connect to server'
      }
    }
  },
  { immediate: true }
)

const selectedMember = ref<number | null>(null)
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleLogin() {
  if (!selectedMember.value) {
    error.value = 'Please select a family member'
    return
  }

  if (!password.value) {
    error.value = 'Please enter your password'
    return
  }

  loading.value = true
  error.value = null

  const result = await login(selectedMember.value, password.value)

  if (result.success) {
    await navigateTo('/mobile/scan')
  } else {
    error.value = result.error || 'Login failed'
  }

  password.value = ''
  loading.value = false
}

function getAvatarUrl(member: { avatarType: string; avatarValue: string }) {
  if (member.avatarType === 'dicebear') {
    return `https://api.dicebear.com/7.x/personas/svg?seed=${member.avatarValue}`
  }
  return member.avatarValue
}

async function changeServer() {
  await clearConfig()
  await navigateTo('/mobile/setup')
}
</script>

<template>
  <div v-if="isLoading || configLoading" class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary" />
  </div>

  <UCard v-else class="mx-auto max-w-md">
    <template #header>
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">FamilyHub</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Select your profile to continue</p>
        <p v-if="serverUrl" class="mt-1 text-xs text-gray-400">Connected to: {{ serverUrl }}</p>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Connection Error -->
      <UAlert
        v-if="fetchError"
        color="error"
        icon="i-lucide-wifi-off"
        :title="fetchError"
        :description="`Could not connect to ${serverUrl}`"
      >
        <template #actions>
          <UButton size="xs" color="error" variant="soft" @click="changeServer">
            Change Server
          </UButton>
        </template>
      </UAlert>

      <!-- Family Member Selection -->
      <div v-else-if="members.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-users" class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-2 text-gray-600 dark:text-gray-400">No family members with passwords found.</p>
        <p class="text-sm text-gray-500">Ask an admin to set up your password.</p>
      </div>

      <div v-else class="grid gap-3">
        <button
          v-for="member in members"
          :key="member.id"
          type="button"
          class="flex items-center gap-4 rounded-lg border-2 p-4 transition-all"
          :class="[
            selectedMember === member.id
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
          ]"
          @click="selectedMember = member.id"
        >
          <img
            :src="getAvatarUrl(member)"
            :alt="member.name"
            class="h-12 w-12 rounded-full"
            :style="{ backgroundColor: member.color }"
          />
          <span class="font-medium text-gray-900 dark:text-white">
            {{ member.name }}
          </span>
          <UIcon
            v-if="selectedMember === member.id"
            name="i-lucide-check-circle"
            class="ml-auto h-5 w-5 text-primary"
          />
        </button>
      </div>

      <!-- Password Input -->
      <UFormField v-if="selectedMember" label="Password" name="password">
        <UInput
          v-model="password"
          type="password"
          placeholder="Enter your password"
          icon="i-lucide-lock"
          autofocus
          @keyup.enter="handleLogin"
        />
      </UFormField>

      <!-- Error Message -->
      <UAlert v-if="error" color="error" icon="i-lucide-alert-circle" :title="error" />

      <!-- Login Button -->
      <UButton
        v-if="members.length > 0"
        block
        size="lg"
        :loading="loading"
        :disabled="!selectedMember || !password"
        @click="handleLogin"
      >
        Login
      </UButton>

      <!-- Change Server Link -->
      <div class="text-center">
        <button
          type="button"
          class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="changeServer"
        >
          Change Server
        </button>
      </div>
    </div>
  </UCard>
</template>
