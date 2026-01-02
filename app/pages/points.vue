<script setup lang="ts">
// Points/Leaderboard page
import { formatRelativeDate } from '~/utils/date'

definePageMeta({
  layout: false,
})

const toast = useToast()
const { isAuthenticated, verify } = useSettingsAuth()

interface LeaderboardMember {
  id: number
  name: string
  avatarType: string
  avatarValue: string
  avatarUrl: string
  color: string
  isAdmin: boolean
  totalPoints: number
}

interface PointTransaction {
  id: number
  familyMemberId: number
  amount: number
  type: 'earned' | 'redeemed'
  description: string | null
  createdAt: string
}

// Time period filter
const selectedPeriod = ref<'all' | 'month' | 'week' | 'today'>('all')

const periodOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' },
  { label: 'Today', value: 'today' },
]

// Fetch settings for currency info
const { data: settingsData } = await useFetch<{
  data: { currency: string; pointValue: string }
}>('/api/settings')
const currency = computed(() => settingsData.value?.data?.currency || 'USD')
const pointValue = computed(() => parseFloat(settingsData.value?.data?.pointValue || '1.00'))

// Fetch leaderboard data with period filter
const {
  data: leaderboardData,
  status,
  refresh: refreshLeaderboard,
} = await useFetch<{ data: LeaderboardMember[] }>(() => `/api/points/leaderboard?period=${selectedPeriod.value}`, {
  watch: [selectedPeriod],
})

const leaderboard = computed(() => leaderboardData.value?.data || [])

// Selected member for history view
const selectedMember = ref<LeaderboardMember | null>(null)

// Auth modal state for redemption
const showAuthModal = ref(false)
const authCredential = ref('')
const authError = ref('')
const authLoading = ref(false)

// Redemption confirmation modal
const showRedeemConfirm = ref(false)
const redeemLoading = ref(false)

// Computed money value for selected member
const selectedMemberMoneyValue = computed(() => {
  if (!selectedMember.value) return '0.00'
  return (selectedMember.value.totalPoints * pointValue.value).toFixed(2)
})

// Point history for selected member
const historyMemberId = ref<number | null>(null)
const { data: historyData, refresh: refreshHistory } = await useFetch<{
  data: PointTransaction[]
}>(() => (historyMemberId.value ? `/api/points/history/${historyMemberId.value}` : ''), {
  immediate: false,
  watch: false, // Don't auto-watch, we'll manually refresh
})

const pointHistory = computed(() => historyData.value?.data || [])

// Watch for member selection to fetch history
watch(selectedMember, async member => {
  if (member) {
    historyMemberId.value = member.id
    await refreshHistory()
  } else {
    historyMemberId.value = null
  }
})

function selectMember(member: LeaderboardMember) {
  selectedMember.value = member
}

function closeMemberDetail() {
  selectedMember.value = null
  showRedeemConfirm.value = false
}

// Handle redeem button click
function handleRedeemClick() {
  if (isAuthenticated.value) {
    // Already authenticated, show confirmation
    showRedeemConfirm.value = true
  } else {
    // Need to authenticate first
    showAuthModal.value = true
    authCredential.value = ''
    authError.value = ''
  }
}

// Handle auth submission
async function handleAuthSubmit() {
  if (!authCredential.value) return

  authLoading.value = true
  authError.value = ''

  const result = await verify(authCredential.value)

  authLoading.value = false

  if (result.success) {
    showAuthModal.value = false
    authCredential.value = ''
    // Now show confirmation modal
    showRedeemConfirm.value = true
  } else {
    authError.value = result.error || 'Invalid credentials'
  }
}

// Handle redemption confirmation
async function confirmRedeem() {
  if (!selectedMember.value) return

  redeemLoading.value = true

  try {
    const response = await $fetch<{
      data?: { memberName: string; pointsRedeemed: number; moneyValue: string }
      error?: string
    }>('/api/points/redeem', {
      method: 'POST',
      body: { familyMemberId: selectedMember.value.id },
    })

    if (response.error) {
      toast.add({
        title: 'Error',
        description: response.error,
        icon: 'i-heroicons-exclamation-circle',
        color: 'error',
        duration: 3000,
      })
    } else {
      toast.add({
        title: 'Points Redeemed!',
        description: `${response.data?.memberName} redeemed ${response.data?.pointsRedeemed} points for ${response.data?.moneyValue}`,
        icon: 'i-heroicons-gift',
        color: 'success',
        duration: 5000,
      })

      // Refresh data
      await refreshLeaderboard()
      await refreshHistory()

      // Update selected member with new balance
      const updatedMember = leaderboard.value.find(m => m.id === selectedMember.value?.id)
      if (updatedMember) {
        selectedMember.value = updatedMember
      }

      showRedeemConfirm.value = false
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        (error as { data?: { error?: string } }).data?.error || 'Failed to redeem points',
      icon: 'i-heroicons-exclamation-circle',
      color: 'error',
      duration: 3000,
    })
  } finally {
    redeemLoading.value = false
  }
}

// Use centralized date formatting
const formatDate = formatRelativeDate

function getRankEmoji(index: number) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `#${index + 1}`
}

function getRankClass(index: number) {
  if (index === 0) return 'ring-4 ring-yellow-400'
  if (index === 1) return 'ring-4 ring-gray-400'
  if (index === 2) return 'ring-4 ring-amber-600'
  return ''
}
</script>

<template>
  <NuxtLayout name="app">
    <!-- Header -->
    <template #header>
      <header class="bg-white dark:bg-gray-800 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-3">
          <div class="flex items-center justify-between gap-4">
            <!-- Period filter (left) -->
            <div class="flex-1">
              <UFieldGroup size="sm">
                <UButton
                  v-for="option in periodOptions"
                  :key="option.value"
                  :color="selectedPeriod === option.value ? 'primary' : 'neutral'"
                  :variant="selectedPeriod === option.value ? 'solid' : 'ghost'"
                  @click="selectedPeriod = option.value as typeof selectedPeriod"
                >
                  {{ option.label }}
                </UButton>
              </UFieldGroup>
            </div>

            <!-- Settings (right) -->
            <UButton
              to="/settings"
              variant="ghost"
              color="neutral"
              icon="i-lucide-settings"
              size="sm"
            />
          </div>
        </div>
      </header>
    </template>

    <!-- Main content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading state -->
      <div v-if="status === 'pending'" class="space-y-4">
        <!-- Podium skeleton -->
        <div class="flex justify-center items-end gap-4 mb-8 pt-8">
          <div class="flex flex-col items-center">
            <USkeleton class="w-16 h-16 rounded-full mb-2" />
            <USkeleton class="w-6 h-6 mb-1" />
            <USkeleton class="w-16 h-4 mb-1" />
            <USkeleton class="w-12 h-5" />
          </div>
          <div class="flex flex-col items-center -mt-4">
            <USkeleton class="w-20 h-20 rounded-full mb-2" />
            <USkeleton class="w-8 h-8 mb-1" />
            <USkeleton class="w-20 h-5 mb-1" />
            <USkeleton class="w-16 h-6" />
          </div>
          <div class="flex flex-col items-center">
            <USkeleton class="w-16 h-16 rounded-full mb-2" />
            <USkeleton class="w-6 h-6 mb-1" />
            <USkeleton class="w-16 h-4 mb-1" />
            <USkeleton class="w-12 h-5" />
          </div>
        </div>

        <!-- List skeleton -->
        <UCard>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <PointsLeaderboardSkeleton v-for="i in 5" :key="i" />
          </div>
        </UCard>
      </div>

      <!-- Empty state -->
      <div v-else-if="leaderboard.length === 0" class="text-center py-16">
        <UIcon
          name="i-heroicons-star"
          class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
        />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">No points yet</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Complete some chores to start earning points!
        </p>
        <UButton to="/dashboard" color="primary"> Go to Chores </UButton>
      </div>

      <!-- Leaderboard -->
      <div v-else class="space-y-4">
        <!-- Top 3 podium (if we have at least 1) -->
        <div v-if="leaderboard.length > 0" class="flex justify-center items-end gap-4 mb-8 pt-8">
          <!-- Second place -->
          <div
            v-if="leaderboard[1]"
            class="flex flex-col items-center cursor-pointer"
            @click="selectMember(leaderboard[1])"
          >
            <div class="w-16 h-16 rounded-full overflow-hidden mb-2" :class="getRankClass(1)">
              <img
                :src="leaderboard[1].avatarUrl"
                :alt="leaderboard[1].name"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="text-2xl">🥈</span>
            <span class="font-medium text-sm mt-1">{{ leaderboard[1].name }}</span>
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
              {{ leaderboard[1].totalPoints }} pts
            </span>
          </div>

          <!-- First place (center, larger) -->
          <div
            v-if="leaderboard[0]"
            class="flex flex-col items-center cursor-pointer -mt-4"
            @click="selectMember(leaderboard[0])"
          >
            <div class="w-20 h-20 rounded-full overflow-hidden mb-2" :class="getRankClass(0)">
              <img
                :src="leaderboard[0].avatarUrl"
                :alt="leaderboard[0].name"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="text-3xl">🥇</span>
            <span class="font-semibold mt-1">{{ leaderboard[0].name }}</span>
            <span class="text-xl font-bold text-primary-600 dark:text-primary-400">
              {{ leaderboard[0].totalPoints }} pts
            </span>
          </div>

          <!-- Third place -->
          <div
            v-if="leaderboard[2]"
            class="flex flex-col items-center cursor-pointer"
            @click="selectMember(leaderboard[2])"
          >
            <div class="w-16 h-16 rounded-full overflow-hidden mb-2" :class="getRankClass(2)">
              <img
                :src="leaderboard[2].avatarUrl"
                :alt="leaderboard[2].name"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="text-2xl">🥉</span>
            <span class="font-medium text-sm mt-1">{{ leaderboard[2].name }}</span>
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
              {{ leaderboard[2].totalPoints }} pts
            </span>
          </div>
        </div>

        <!-- Full list -->
        <UCard>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="(member, index) in leaderboard"
              :key="member.id"
              class="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
              @click="selectMember(member)"
            >
              <!-- Rank -->
              <div class="w-10 text-center font-bold text-lg">
                {{ getRankEmoji(index) }}
              </div>

              <!-- Avatar -->
              <div
                class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2"
                :style="{ '--tw-ring-color': member.color }"
              >
                <img
                  :src="member.avatarUrl"
                  :alt="member.name"
                  class="w-full h-full object-cover"
                />
              </div>

              <!-- Name -->
              <div class="flex-1">
                <div class="font-medium">{{ member.name }}</div>
                <div v-if="member.isAdmin" class="text-xs text-gray-500">Admin</div>
              </div>

              <!-- Points -->
              <div class="text-right">
                <div class="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {{ member.totalPoints }}
                </div>
                <div class="text-xs text-gray-500">points</div>
              </div>

              <!-- Chevron -->
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Member detail modal -->
    <UModal
      :open="!!selectedMember && !showRedeemConfirm && !showAuthModal"
      :title="selectedMember?.name || 'Member Details'"
      :description="`View points and history for ${selectedMember?.name || 'member'}`"
      @close="closeMemberDetail"
    >
      <template #content>
        <UCard v-if="selectedMember">
          <template #header>
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2"
                :style="{ '--tw-ring-color': selectedMember.color }"
              >
                <img
                  :src="selectedMember.avatarUrl"
                  :alt="selectedMember.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 class="text-xl font-semibold">{{ selectedMember.name }}</h3>
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {{ selectedMember.totalPoints }} points
                </div>
                <div class="text-sm text-gray-500">
                  ≈ {{ currency }} {{ selectedMemberMoneyValue }}
                </div>
              </div>
            </div>
          </template>

          <h4 class="font-semibold mb-3">Recent Activity</h4>

          <div v-if="pointHistory.length === 0" class="text-center py-6 text-gray-500">
            No point history yet
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="transaction in pointHistory"
              :key="transaction.id"
              class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  :name="
                    transaction.type === 'earned'
                      ? 'i-heroicons-plus-circle'
                      : 'i-heroicons-minus-circle'
                  "
                  :class="transaction.type === 'earned' ? 'text-green-500' : 'text-red-500'"
                  class="w-5 h-5"
                />
                <span class="text-sm">{{ transaction.description || 'Points transaction' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="font-bold"
                  :class="transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'"
                >
                  {{ transaction.type === 'earned' ? '+' : '-' }}{{ transaction.amount }}
                </span>
                <span class="text-xs text-gray-500">{{ formatDate(transaction.createdAt) }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between gap-3">
              <UButton
                v-if="selectedMember.totalPoints > 0"
                color="primary"
                icon="i-heroicons-gift"
                @click="handleRedeemClick"
              >
                Redeem All Points
              </UButton>
              <div class="flex-1" />
              <UButton variant="ghost" color="neutral" @click="closeMemberDetail"> Close </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Admin auth modal -->
    <UModal
      :open="showAuthModal"
      title="Admin Authentication Required"
      description="Enter your credentials to redeem points"
      @close="showAuthModal = false"
    >
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Admin Authentication Required</h3>
            <p class="text-sm text-gray-500">Enter your password to redeem points</p>
          </template>

          <form @submit.prevent="handleAuthSubmit">
            <UFormField label="Password" :error="authError">
              <UInput
                v-model="authCredential"
                type="password"
                placeholder="Enter password"
                autofocus
                size="lg"
              />
            </UFormField>
          </form>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" color="neutral" @click="showAuthModal = false">
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="authLoading"
                :disabled="!authCredential"
                @click="handleAuthSubmit"
              >
                Verify
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Redemption confirmation modal -->
    <UModal
      :open="showRedeemConfirm"
      title="Confirm Redemption"
      :description="`Redeem all points for ${selectedMember?.name || 'member'}`"
      @close="showRedeemConfirm = false"
    >
      <template #content>
        <UCard v-if="selectedMember">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-gift"
                  class="w-6 h-6 text-purple-600 dark:text-purple-400"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold">Confirm Redemption</h3>
                <p class="text-sm text-gray-500">
                  This will redeem all points for {{ selectedMember.name }}
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {{ selectedMember.totalPoints }} points
              </div>
              <div class="text-xl font-semibold text-gray-600 dark:text-gray-300 mt-1">
                = {{ currency }} {{ selectedMemberMoneyValue }}
              </div>
            </div>

            <div class="text-sm text-gray-500 text-center">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-4 h-4 inline mr-1 text-amber-500"
              />
              All points will be redeemed. Please transfer the money manually.
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                variant="ghost"
                color="neutral"
                :disabled="redeemLoading"
                @click="showRedeemConfirm = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                icon="i-heroicons-gift"
                :loading="redeemLoading"
                @click="confirmRedeem"
              >
                Confirm Redemption
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </NuxtLayout>
</template>
