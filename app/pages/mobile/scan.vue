<script setup lang="ts">
// Mobile scan page - main screen for QR/NFC scanning
definePageMeta({
  layout: 'default',
})

const { user, isAuthenticated, logout, loadSession, isLoading: authLoading } = useMobileAuth()
const { startQrScan, stopQrScan, startNfcScan, isScanning, error: scanError, handleScanAndComplete, isNative } = useScanner()

// Check authentication
onMounted(async () => {
  await loadSession()
  if (!isAuthenticated.value) {
    await navigateTo('/mobile/login')
  }
})

// Scan result state
const showResult = ref(false)
const resultSuccess = ref(false)
const resultMessage = ref('')
const resultPoints = ref(0)
const resultCooldown = ref<string | null>(null)

// Handle QR scan - native scanner takes over the screen
async function handleQrScan() {
  const result = await startQrScan()
  if (result) {
    const completion = await handleScanAndComplete(result)
    showCompletionResult(completion)
  }
}

// Handle NFC scan
async function handleNfcScan() {
  const result = await startNfcScan()
  if (result) {
    const completion = await handleScanAndComplete(result)
    showCompletionResult(completion)
  }
}

// Format cooldown time remaining
function formatCooldownRemaining(cooldownEndsAt: string): string {
  const endTime = new Date(cooldownEndsAt)
  const now = new Date()
  const diffMs = endTime.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'Ready now'
  
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  
  if (diffHours > 0) {
    const remainingMins = diffMins % 60
    return `${diffHours}h ${remainingMins}m remaining`
  }
  return `${diffMins}m remaining`
}

// Show completion result
function showCompletionResult(result: { success: boolean; choreName?: string; pointsEarned?: number; error?: string; cooldownEndsAt?: string }) {
  showResult.value = true
  resultSuccess.value = result.success
  resultCooldown.value = null

  if (result.success) {
    resultMessage.value = result.choreName || 'Chore completed!'
    resultPoints.value = result.pointsEarned || 0
  } else {
    // Check for cooldown error
    if (result.cooldownEndsAt) {
      resultMessage.value = 'Chore is on cooldown'
      resultCooldown.value = formatCooldownRemaining(result.cooldownEndsAt)
    } else {
      resultMessage.value = result.error || 'Failed to complete chore'
    }
    resultPoints.value = 0
  }

  // Auto-hide after 3 seconds
  setTimeout(() => {
    showResult.value = false
  }, 3000)
}

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
    <div v-if="authLoading" class="flex min-h-screen items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary" />
    </div>

    <div v-else-if="isAuthenticated" class="flex min-h-screen flex-col">
      <!-- Header -->
      <header class="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img
              :src="getAvatarUrl()"
              :alt="user?.name"
              class="h-10 w-10 rounded-full"
              :style="{ backgroundColor: user?.color }"
            >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ user?.name }}
              </p>
              <p class="text-sm text-gray-500">
                Ready to scan
              </p>
            </div>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            @click="handleLogout"
          />
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex flex-1 flex-col items-center justify-center p-6">
        <!-- Result Overlay -->
        <Transition name="fade">
          <div
            v-if="showResult"
            class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
          >
            <div class="text-center">
              <div
                class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
                :class="resultSuccess ? 'bg-green-500' : resultCooldown ? 'bg-yellow-500' : 'bg-red-500'"
              >
                <UIcon
                  :name="resultSuccess ? 'i-lucide-check' : resultCooldown ? 'i-lucide-clock' : 'i-lucide-x'"
                  class="h-10 w-10 text-white"
                />
              </div>
              <h2 class="text-2xl font-bold text-white">
                {{ resultSuccess ? 'Completed!' : resultCooldown ? 'On Cooldown' : 'Error' }}
              </h2>
              <p class="mt-2 text-lg text-gray-300">
                {{ resultMessage }}
              </p>
              <p v-if="resultCooldown" class="mt-2 text-lg text-yellow-400">
                {{ resultCooldown }}
              </p>
              <p v-if="resultSuccess && resultPoints > 0" class="mt-2 text-xl font-bold text-yellow-400">
                +{{ resultPoints }} points
              </p>
            </div>
          </div>
        </Transition>

        <!-- Not Native Warning -->
        <UAlert
          v-if="!isNative"
          color="warning"
          icon="i-lucide-smartphone"
          class="mb-6 max-w-md"
        >
          <template #title>
            Mobile App Required
          </template>
          <template #description>
            QR and NFC scanning only works in the mobile app.
            Install FamilyHub on your phone to use this feature.
          </template>
        </UAlert>

        <!-- Scan Error -->
        <UAlert
          v-if="scanError"
          color="error"
          icon="i-lucide-alert-circle"
          class="mb-6 max-w-md"
          :title="scanError"
        />

        <!-- Scan Buttons -->
        <div class="flex flex-col gap-6">
          <!-- QR Scan Button -->
          <button
            type="button"
            class="flex h-40 w-40 flex-col items-center justify-center rounded-2xl bg-primary text-white shadow-lg transition-transform active:scale-95"
            :disabled="isScanning || !isNative"
            :class="{ 'opacity-50': isScanning || !isNative }"
            @click="handleQrScan"
          >
            <UIcon
              :name="isScanning ? 'i-lucide-loader-2' : 'i-lucide-qr-code'"
              class="h-16 w-16"
              :class="{ 'animate-spin': isScanning }"
            />
            <span class="mt-2 font-medium">
              {{ isScanning ? 'Scanning...' : 'Scan QR' }}
            </span>
          </button>

          <!-- NFC Scan Button -->
          <button
            type="button"
            class="flex h-40 w-40 flex-col items-center justify-center rounded-2xl bg-secondary text-white shadow-lg transition-transform active:scale-95"
            :disabled="isScanning || !isNative"
            :class="{ 'opacity-50': isScanning || !isNative }"
            @click="handleNfcScan"
          >
            <UIcon
              :name="isScanning ? 'i-lucide-loader-2' : 'i-lucide-nfc'"
              class="h-16 w-16"
              :class="{ 'animate-spin': isScanning }"
            />
            <span class="mt-2 font-medium">
              {{ isScanning ? 'Scanning...' : 'Tap NFC' }}
            </span>
          </button>
        </div>

        <p class="mt-8 text-center text-sm text-gray-500">
          Scan a QR code or tap an NFC tag to complete a chore
        </p>
      </main>

      <!-- Bottom Navigation -->
      <nav class="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="flex justify-around py-3">
          <NuxtLink
            to="/mobile/scan"
            class="flex flex-col items-center text-primary"
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
