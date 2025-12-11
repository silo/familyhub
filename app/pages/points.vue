<script setup lang="ts">
// Points/Leaderboard page
definePageMeta({
  layout: 'default'
})

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

// Fetch leaderboard data
const { data: leaderboardData, status } = await useFetch<{ data: LeaderboardMember[] }>('/api/points/leaderboard')

const leaderboard = computed(() => leaderboardData.value?.data || [])

// Selected member for history view
const selectedMember = ref<LeaderboardMember | null>(null)

// Point history for selected member
const { data: historyData, refresh: refreshHistory } = await useFetch<{ data: PointTransaction[] }>(
  () => selectedMember.value ? `/api/points/history/${selectedMember.value.id}` : '/api/points/history/0',
  { immediate: false }
)

const pointHistory = computed(() => historyData.value?.data || [])

// Watch for member selection to fetch history
watch(selectedMember, async (member) => {
  if (member) {
    await refreshHistory()
  }
})

function selectMember(member: LeaderboardMember) {
  selectedMember.value = member
}

function closeMemberDetail() {
  selectedMember.value = null
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Points Leaderboard
          </h1>
          
          <UButton
            to="/settings"
            variant="ghost"
            color="neutral"
            icon="i-heroicons-cog-6-tooth"
            size="sm"
          />
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading state -->
      <div v-if="status === 'pending'" class="flex justify-center py-16">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- Empty state -->
      <div v-else-if="leaderboard.length === 0" class="text-center py-16">
        <UIcon 
          name="i-heroicons-star" 
          class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" 
        />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No points yet
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Complete some chores to start earning points!
        </p>
        <UButton
          to="/dashboard"
          color="primary"
        >
          Go to Chores
        </UButton>
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
            <div 
              class="w-16 h-16 rounded-full overflow-hidden mb-2"
              :class="getRankClass(1)"
            >
              <img
                :src="leaderboard[1].avatarUrl"
                :alt="leaderboard[1].name"
                class="w-full h-full object-cover"
              >
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
            <div 
              class="w-20 h-20 rounded-full overflow-hidden mb-2"
              :class="getRankClass(0)"
            >
              <img
                :src="leaderboard[0].avatarUrl"
                :alt="leaderboard[0].name"
                class="w-full h-full object-cover"
              >
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
            <div 
              class="w-16 h-16 rounded-full overflow-hidden mb-2"
              :class="getRankClass(2)"
            >
              <img
                :src="leaderboard[2].avatarUrl"
                :alt="leaderboard[2].name"
                class="w-full h-full object-cover"
              >
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
                >
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
    </main>

    <!-- Bottom navigation -->
    <nav class="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-pb">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-around py-2">
          <NuxtLink
            to="/dashboard"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <UIcon name="i-heroicons-home" class="w-6 h-6" />
            <span class="text-xs font-medium">Home</span>
          </NuxtLink>
          
          <NuxtLink
            to="/points"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-primary-600 dark:text-primary-400"
          >
            <UIcon name="i-heroicons-star" class="w-6 h-6" />
            <span class="text-xs font-medium">Points</span>
          </NuxtLink>
          
          <NuxtLink
            to="/activity"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <UIcon name="i-heroicons-clock" class="w-6 h-6" />
            <span class="text-xs font-medium">Activity</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Member detail modal -->
    <UModal :open="!!selectedMember" @close="closeMemberDetail">
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
                >
              </div>
              <div>
                <h3 class="text-xl font-semibold">{{ selectedMember.name }}</h3>
                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {{ selectedMember.totalPoints }} points
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
                  :name="transaction.type === 'earned' ? 'i-heroicons-plus-circle' : 'i-heroicons-minus-circle'"
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
            <div class="flex justify-end">
              <UButton
                variant="ghost"
                color="neutral"
                @click="closeMemberDetail"
              >
                Close
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
