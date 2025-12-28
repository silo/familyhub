<script setup lang="ts">
// Mobile profile page
import type { PointsHistoryResponse } from '~/types'

definePageMeta({
  layout: 'default',
})

const { user, isAuthenticated, logout, loadSession, isLoading, getAuthHeaders } = useMobileAuth()
const { serverUrl, clearConfig, apiUrl } = useMobileConfig()

// Check authentication
onMounted(async () => {
  await loadSession()
  if (!isAuthenticated.value) {
    await navigateTo('/mobile/login')
  }
})

// Fetch points for current user
const { data: pointsData, refresh: refreshPoints } = await useFetch<PointsHistoryResponse>(
  () => user.value ? apiUrl(`/api/points/history/${user.value.id}`) : apiUrl('/api/points/history/0'),
  {
    headers: getAuthHeaders(),
    watch: [user],
  }
)

const totalPoints = computed(() => {
  if (!pointsData.value || !('data' in pointsData.value)) return 0
  return pointsData.value.data?.totalPoints || 0
})

const transactions = computed(() => {
  if (!pointsData.value || !('data' in pointsData.value)) return []
  return pointsData.value.data?.transactions || []
})

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Handle logout
async function handleLogout() {
  await logout()
  await navigateTo('/mobile/login')
}

// Change server
async function handleChangeServer() {
  await logout()
  await clearConfig()
  await navigateTo('/mobile/setup')
}

// Wrapper for refresh button
function handleRefresh() {
  refreshPoints()
}

function getAvatarUrl() {
  if (!user.value) return ''
  if (user.value.avatarType === 'dicebear') {
    return `https://api.dicebear.com/7.x/personas/svg?seed=${user.value.avatarValue}`
  }
  return user.value.avatarValue
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex min-h-screen items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary" />
    </div>

    <div v-else-if="isAuthenticated" class="flex min-h-screen flex-col">
      <!-- Header -->
      <header class="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <!-- User Card -->
        <UCard class="mb-6">
          <div class="flex items-center gap-4">
            <img
              :src="getAvatarUrl()"
              :alt="user?.name"
              class="h-20 w-20 rounded-full"
              :style="{ backgroundColor: user?.color }"
            >
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ user?.name }}
              </h2>
              <p v-if="user?.isAdmin" class="text-sm text-primary">
                Admin
              </p>
            </div>
          </div>
        </UCard>

        <!-- Points Card -->
        <UCard class="mb-6">
          <div class="text-center">
            <p class="text-sm text-gray-500">Total Points</p>
            <p class="text-4xl font-bold text-primary">
              {{ totalPoints }}
            </p>
          </div>
        </UCard>

        <!-- Points History -->
        <div class="mb-6">
          <h3 class="mb-3 text-sm font-medium text-gray-500">
            Recent Activity
          </h3>
          
          <div v-if="transactions.length === 0" class="rounded-lg bg-white p-4 text-center dark:bg-gray-800">
            <p class="text-sm text-gray-500">No transactions yet</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="tx in transactions"
              :key="tx.id"
              class="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-800"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    tx.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  ]"
                >
                  <UIcon
                    :name="tx.type === 'earned' ? 'i-lucide-plus' : 'i-lucide-minus'"
                    class="h-4 w-4"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ tx.description || (tx.type === 'earned' ? 'Points earned' : 'Points redeemed') }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(tx.createdAt) }}
                  </p>
                </div>
              </div>
              <span
                :class="[
                  'font-semibold',
                  tx.type === 'earned' ? 'text-green-600' : 'text-red-600'
                ]"
              >
                {{ tx.type === 'earned' ? '+' : '-' }}{{ Math.abs(tx.amount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <UButton
            block
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="handleRefresh"
          >
            Refresh Points
          </UButton>

          <UButton
            block
            color="error"
            variant="outline"
            icon="i-lucide-log-out"
            @click="handleLogout"
          >
            Logout
          </UButton>
        </div>

        <!-- Server Info -->
        <div class="mt-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <p class="text-xs text-gray-500 dark:text-gray-400">Connected to:</p>
          <p class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ serverUrl }}</p>
          <button
            type="button"
            class="mt-2 text-xs text-primary hover:underline"
            @click="handleChangeServer"
          >
            Change Server
          </button>
        </div>
      </main>

      <!-- Bottom Navigation -->
      <nav class="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="flex justify-around py-3">
          <NuxtLink
            to="/mobile/scan"
            class="flex flex-col items-center text-gray-500 hover:text-primary"
          >
            <UIcon name="i-lucide-scan" class="h-6 w-6" />
            <span class="mt-1 text-xs">Scan</span>
          </NuxtLink>
          <NuxtLink
            to="/mobile/chores"
            class="flex flex-col items-center text-gray-500 hover:text-primary"
          >
            <UIcon name="i-lucide-list-checks" class="h-6 w-6" />
            <span class="mt-1 text-xs">My Chores</span>
          </NuxtLink>
          <NuxtLink
            to="/mobile/profile"
            class="flex flex-col items-center text-primary"
          >
            <UIcon name="i-lucide-user" class="h-6 w-6" />
            <span class="mt-1 text-xs">Profile</span>
          </NuxtLink>
        </div>
      </nav>
    </div>
  </div>
</template>
