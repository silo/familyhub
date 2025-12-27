<script setup lang="ts">
// Mobile profile page
definePageMeta({
  layout: 'default',
})

const { user, isAuthenticated, logout, loadSession, isLoading, getAuthHeaders } = useMobileAuth()

// Check authentication
onMounted(async () => {
  await loadSession()
  if (!isAuthenticated.value) {
    await navigateTo('/mobile/login')
  }
})

// Fetch points for current user
const { data: pointsData, refresh: refreshPoints } = await useFetch(() => 
  user.value ? `/api/points/history/${user.value.id}` : null,
  {
    headers: getAuthHeaders(),
    watch: [user],
  }
)

const totalPoints = computed(() => {
  if (!pointsData.value || 'error' in pointsData.value) return 0
  return pointsData.value.data?.totalPoints || 0
})

// Handle logout
async function handleLogout() {
  await logout()
  await navigateTo('/mobile/login')
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

        <!-- Actions -->
        <div class="space-y-3">
          <UButton
            block
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="refreshPoints"
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
