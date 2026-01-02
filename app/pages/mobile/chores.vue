<script setup lang="ts">
// Mobile chores page - shows chores assigned to current user
import type { Chore, ChoresResponse } from '~/types'

definePageMeta({
  layout: 'mobile',
})

const toast = useToast()
const { user, isAuthenticated, loadSession, isLoading, getAuthHeaders } = useMobileAuth()
const { apiUrl } = useMobileConfig()

// State
const completing = ref<number | null>(null)

// Check authentication
onMounted(async () => {
  await loadSession()
  if (!isAuthenticated.value) {
    await navigateTo('/mobile/login')
  }
})

// Fetch chores
const { data: choresResponse, refresh: refreshChores } = await useFetch<ChoresResponse>(
  () => apiUrl('/api/chores'),
  {
    headers: getAuthHeaders(),
    watch: [user],
  }
)

// Filter chores assigned to current user
const myChores = computed(() => {
  if (!choresResponse.value || !('data' in choresResponse.value) || !user.value) {
    return []
  }
  return choresResponse.value.data?.filter(chore => chore.assigneeId === user.value?.id) || []
})

// Open chores (unassigned - anyone can complete)
const openChores = computed(() => {
  if (!choresResponse.value || !('data' in choresResponse.value)) {
    return []
  }
  return choresResponse.value.data?.filter(chore => !chore.assigneeId) || []
})

// Complete a chore manually
async function completeChore(chore: Chore) {
  if (completing.value) return

  completing.value = chore.id

  try {
    const response = await $fetch<{ data: unknown } | { error: string }>(
      apiUrl(`/api/chores/${chore.id}/complete`),
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          completedById: user.value?.id,
        },
      }
    )

    if ('error' in response) {
      toast.add({
        title: 'Error',
        description: response.error,
        color: 'error',
      })
    } else {
      toast.add({
        title: 'Chore Completed!',
        description: `+${chore.points} points`,
        color: 'success',
      })
      await refreshChores()
    }
  } catch (error: unknown) {
    const err = error as { data?: { error?: string } }
    toast.add({
      title: 'Error',
      description: err.data?.error || 'Failed to complete chore',
      color: 'error',
    })
  } finally {
    completing.value = null
  }
}

// Wrapper for refresh button click
function handleRefresh() {
  refreshChores()
}
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary" />
    </div>

    <template v-else-if="isAuthenticated">
      <!-- Header -->
      <header class="shrink-0 border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">My Chores</h1>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            @click="handleRefresh"
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

          <div
            v-if="myChores.length === 0"
            class="rounded-lg bg-white p-6 text-center dark:bg-gray-800"
          >
            <UIcon name="i-lucide-check-circle" class="mx-auto h-12 w-12 text-green-500" />
            <p class="mt-2 text-gray-600 dark:text-gray-400">No chores assigned to you!</p>
          </div>

          <div v-else class="space-y-3">
            <UCard v-for="chore in myChores" :key="chore.id" class="transition-all hover:shadow-md">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ chore.title }}
                  </h3>
                  <p v-if="chore.description" class="mt-1 text-sm text-gray-500">
                    {{ chore.description }}
                  </p>
                  <div class="mt-2 flex items-center gap-2">
                    <span
                      v-if="chore.points > 0"
                      class="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
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
                <UButton
                  color="primary"
                  size="sm"
                  icon="i-lucide-check"
                  :loading="completing === chore.id"
                  @click="completeChore(chore)"
                >
                  Done
                </UButton>
              </div>
            </UCard>
          </div>
        </section>

        <!-- Open chores -->
        <section>
          <h2 class="mb-3 text-sm font-medium text-gray-500">
            Open Chores ({{ openChores.length }})
          </h2>

          <div
            v-if="openChores.length === 0"
            class="rounded-lg bg-white p-6 text-center dark:bg-gray-800"
          >
            <p class="text-gray-600 dark:text-gray-400">No open chores available</p>
          </div>

          <div v-else class="space-y-3">
            <UCard
              v-for="chore in openChores"
              :key="chore.id"
              class="transition-all hover:shadow-md"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ chore.title }}
                  </h3>
                  <p v-if="chore.description" class="mt-1 text-sm text-gray-500">
                    {{ chore.description }}
                  </p>
                  <div class="mt-2 flex items-center gap-2">
                    <span class="text-xs text-blue-500"> Open - anyone can complete </span>
                    <span
                      v-if="chore.points > 0"
                      class="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                    >
                      {{ chore.points }} pts
                    </span>
                  </div>
                </div>
                <UButton
                  color="primary"
                  size="sm"
                  icon="i-lucide-check"
                  :loading="completing === chore.id"
                  @click="completeChore(chore)"
                >
                  Done
                </UButton>
              </div>
            </UCard>
          </div>
        </section>
      </main>

      <!-- Bottom Navigation -->
      <nav class="shrink-0 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="flex justify-around py-3">
          <NuxtLink
            to="/mobile/scan"
            class="flex flex-col items-center text-gray-500 hover:text-primary"
          >
            <UIcon name="i-lucide-scan" class="h-6 w-6" />
            <span class="mt-1 text-xs">Scan</span>
          </NuxtLink>
          <NuxtLink to="/mobile/chores" class="flex flex-col items-center text-primary">
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
    </template>
  </div>
</template>
