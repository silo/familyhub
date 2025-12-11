<script setup lang="ts">
// Activity log page
definePageMeta({
  layout: 'default'
})

interface ActivityEntry {
  id: number
  type: string
  familyMemberId: number | null
  choreId: number | null
  metadata: Record<string, unknown> | null
  createdAt: string
  familyMember: {
    name: string
    color: string
    avatarUrl: string
  } | null
  chore: {
    title: string
  } | null
}

// Fetch activity data
const { data: activityData, status } = await useFetch<{ data: ActivityEntry[] }>('/api/activity')

const activities = computed(() => activityData.value?.data || [])

function formatTimestamp(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'chore_completed':
      return 'i-heroicons-check-circle'
    case 'points_redeemed':
      return 'i-heroicons-gift'
    case 'member_added':
      return 'i-heroicons-user-plus'
    case 'chore_created':
      return 'i-heroicons-plus-circle'
    default:
      return 'i-heroicons-bell'
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'chore_completed':
      return 'text-green-500 bg-green-100 dark:bg-green-900/30'
    case 'points_redeemed':
      return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
    case 'member_added':
      return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
    case 'chore_created':
      return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-700'
  }
}

function getActivityDescription(activity: ActivityEntry) {
  const metadata = activity.metadata as Record<string, unknown> | null
  
  switch (activity.type) {
    case 'chore_completed':
      const choreName = metadata?.choreName || activity.chore?.title || 'a chore'
      const points = metadata?.points as number
      return `Completed "${choreName}"${points ? ` (+${points} pts)` : ''}`
    case 'points_redeemed':
      const amount = metadata?.amount as number
      const moneyValue = metadata?.moneyValue as string
      return `Redeemed ${amount} points${moneyValue ? ` for ${moneyValue}` : ''}`
    case 'member_added':
      return 'Joined the family'
    case 'chore_created':
      return `Created chore "${activity.chore?.title || 'unknown'}"`
    default:
      return activity.type.replace(/_/g, ' ')
  }
}

// Group activities by date
const groupedActivities = computed(() => {
  const groups: { date: string; items: ActivityEntry[] }[] = []
  let currentDate = ''
  let currentGroup: ActivityEntry[] = []

  for (const activity of activities.value) {
    const activityDate = new Date(activity.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })

    if (activityDate !== currentDate) {
      if (currentGroup.length > 0) {
        groups.push({ date: currentDate, items: currentGroup })
      }
      currentDate = activityDate
      currentGroup = [activity]
    } else {
      currentGroup.push(activity)
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ date: currentDate, items: currentGroup })
  }

  return groups
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Activity
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
      <div v-else-if="activities.length === 0" class="text-center py-16">
        <UIcon 
          name="i-heroicons-clock" 
          class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" 
        />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No activity yet
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Complete some chores to see your activity here!
        </p>
        <UButton
          to="/dashboard"
          color="primary"
        >
          Go to Chores
        </UButton>
      </div>

      <!-- Activity timeline -->
      <div v-else class="space-y-8">
        <div v-for="group in groupedActivities" :key="group.date">
          <!-- Date header -->
          <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">
            {{ group.date }}
          </h3>

          <!-- Activity items -->
          <div class="space-y-3">
            <div
              v-for="activity in group.items"
              :key="activity.id"
              class="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
            >
              <!-- Activity icon -->
              <div 
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                :class="getActivityColor(activity.type)"
              >
                <UIcon 
                  :name="getActivityIcon(activity.type)" 
                  class="w-5 h-5" 
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <!-- Member avatar (if applicable) -->
                  <div 
                    v-if="activity.familyMember"
                    class="w-6 h-6 rounded-full overflow-hidden ring-1"
                    :style="{ '--tw-ring-color': activity.familyMember.color }"
                  >
                    <img
                      :src="activity.familyMember.avatarUrl"
                      :alt="activity.familyMember.name"
                      class="w-full h-full object-cover"
                    >
                  </div>
                  
                  <!-- Member name -->
                  <span v-if="activity.familyMember" class="font-medium text-sm">
                    {{ activity.familyMember.name }}
                  </span>
                </div>

                <!-- Description -->
                <p class="text-gray-600 dark:text-gray-300 mt-1">
                  {{ getActivityDescription(activity) }}
                </p>
              </div>

              <!-- Timestamp -->
              <div class="text-xs text-gray-400 whitespace-nowrap">
                {{ formatTimestamp(activity.createdAt) }}
              </div>
            </div>
          </div>
        </div>
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
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <UIcon name="i-heroicons-star" class="w-6 h-6" />
            <span class="text-xs font-medium">Points</span>
          </NuxtLink>
          
          <NuxtLink
            to="/activity"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-primary-600 dark:text-primary-400"
          >
            <UIcon name="i-heroicons-clock" class="w-6 h-6" />
            <span class="text-xs font-medium">Activity</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
