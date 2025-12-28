<script setup lang="ts">
// Mobile chores page - shows chores assigned to current user
definePageMeta({
  layout: 'default',
})

const { user, isAuthenticated, loadSession, isLoading, getAuthHeaders } = useMobileAuth()
const { apiUrl } = useMobileConfig()

// Check authentication
onMounted(async () => {
  await loadSession()
  if (!isAuthenticated.value) {
    await navigateTo('/mobile/login')
  }
})

// Fetch chores
const { data: choresResponse, refresh: refreshChores } = await useFetch(() => apiUrl('/api/chores'), {
  headers: getAuthHeaders(),
  watch: [user],
})

// Filter chores assigned to current user
const myChores = computed(() => {
  if (!choresResponse.value || 'error' in choresResponse.value || !user.value) {
    return []
  }
  return choresResponse.value.data?.filter(
    (chore: any) => chore.assigneeId === user.value?.id
  ) || []
})

// All available chores (unassigned or assigned to user)
const availableChores = computed(() => {
  if (!choresResponse.value || 'error' in choresResponse.value) {
    return []
  }
  return choresResponse.value.data?.filter(
    (chore: any) => !chore.assigneeId || chore.assigneeId === user.value?.id
  ) || []
})
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
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            My Chores
          </h1>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            @click="refreshChores"
          />
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto p-4">
        <!-- Assigned to me -->
        <section class="mb-6">
          <h2 class="mb-3 text-sm font-medium text-gray-500">
            Assigned to me ({{ myChores.length }})
          </h2>
          
          <div v-if="myChores.length === 0" class="rounded-lg bg-white p-6 text-center dark:bg-gray-800">
            <UIcon name="i-lucide-check-circle" class="mx-auto h-12 w-12 text-green-500" />
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              No chores assigned to you!
            </p>
          </div>

          <div v-else class="space-y-3">
            <UCard
              v-for="chore in myChores"
              :key="chore.id"
              class="transition-all hover:shadow-md"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ chore.title }}
                  </h3>
                  <p v-if="chore.description" class="mt-1 text-sm text-gray-500">
                    {{ chore.description }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="chore.points > 0"
                    class="rounded-full bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800"
                  >
                    {{ chore.points }} pts
                  </span>
                  <UIcon
                    v-if="chore.qrToken"
                    name="i-lucide-qr-code"
                    class="h-4 w-4 text-gray-400"
                    title="Has QR code"
                  />
                  <UIcon
                    v-if="chore.nfcTagId"
                    name="i-lucide-nfc"
                    class="h-4 w-4 text-gray-400"
                    title="Has NFC tag"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </section>

        <!-- Available chores -->
        <section>
          <h2 class="mb-3 text-sm font-medium text-gray-500">
            Available chores ({{ availableChores.length }})
          </h2>

          <div v-if="availableChores.length === 0" class="rounded-lg bg-white p-6 text-center dark:bg-gray-800">
            <p class="text-gray-600 dark:text-gray-400">
              No available chores
            </p>
          </div>

          <div v-else class="space-y-3">
            <UCard
              v-for="chore in availableChores"
              :key="chore.id"
              class="transition-all hover:shadow-md"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ chore.title }}
                  </h3>
                  <p v-if="chore.description" class="mt-1 text-sm text-gray-500">
                    {{ chore.description }}
                  </p>
                  <p v-if="!chore.assigneeId" class="mt-1 text-xs text-blue-500">
                    Unassigned - anyone can complete
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="chore.points > 0"
                    class="rounded-full bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800"
                  >
                    {{ chore.points }} pts
                  </span>
                </div>
              </div>
            </UCard>
          </div>
        </section>
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
            class="flex flex-col items-center text-primary"
          >
            <UIcon name="i-lucide-list-checks" class="h-6 w-6" />
            <span class="mt-1 text-xs">My Chores</span>
          </NuxtLink>
          <NuxtLink
            to="/mobile/profile"
            class="flex flex-col items-center text-gray-500 hover:text-primary"
          >
            <UIcon name="i-lucide-user" class="h-6 w-6" />
            <span class="mt-1 text-xs">Profile</span>
          </NuxtLink>
        </div>
      </nav>
    </div>
  </div>
</template>
