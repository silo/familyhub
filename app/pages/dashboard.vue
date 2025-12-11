<script setup lang="ts">
// Dashboard page - main view for completing chores
import type { Chore, FamilyMember, Category, ChoreCompletion } from '~/types'
import { checkCooldownStatus, shouldShowRecurringChore } from '~/utils/cooldown'

definePageMeta({
  layout: 'default'
})

// View mode: card or list
const viewMode = ref<'card' | 'list'>('card')

// Selected family member filter (null = all)
const selectedMemberId = ref<number | null>(null)

// Chore completion composable
const { 
  showCelebration, 
  completeChore, 
  onCelebrationComplete 
} = useChoreCompletion()

// Who completed modal state
const whoCompletedModal = ref(false)
const choreToComplete = ref<(Chore & { category?: Category | null }) | null>(null)

// Fetch data
const { data: choresData, refresh: refreshChores } = await useFetch<{ 
  data: Array<Chore & { 
    category?: Category | null
    assignee?: FamilyMember | null
    lastCompletion?: ChoreCompletion | null
  }> 
}>('/api/chores')

const { data: membersData } = await useFetch<{ data: FamilyMember[] }>('/api/family-members')

const chores = computed(() => choresData.value?.data || [])
const familyMembers = computed(() => membersData.value?.data || [])

// Filter chores
const filteredChores = computed(() => {
  let result = chores.value

  // Filter out deleted chores
  result = result.filter(c => !c.deletedAt)

  // Filter by assignee if selected
  if (selectedMemberId.value !== null) {
    result = result.filter(c => 
      c.assigneeId === selectedMemberId.value || c.assigneeId === null
    )
  }

  // Filter recurring chores by today's schedule
  result = result.filter(c => shouldShowRecurringChore(c))

  // Sort: assigned chores first, then by points (highest first)
  result.sort((a, b) => {
    // Assigned to selected member first
    if (selectedMemberId.value !== null) {
      if (a.assigneeId === selectedMemberId.value && b.assigneeId !== selectedMemberId.value) return -1
      if (b.assigneeId === selectedMemberId.value && a.assigneeId !== selectedMemberId.value) return 1
    }
    // Then by points (highest first)
    return b.points - a.points
  })

  return result
})

// Get cooldown status for a chore
function getCooldownForChore(chore: Chore & { lastCompletion?: ChoreCompletion | null }) {
  return checkCooldownStatus(chore, chore.lastCompletion)
}

// Handle chore completion
async function handleComplete(chore: Chore & { category?: Category | null }) {
  if (chore.assigneeId) {
    // Assigned chore - complete directly
    await completeChore(chore.id, chore.assigneeId)
    await refreshChores()
  } else {
    // Unassigned - show modal to ask who completed it
    choreToComplete.value = chore
    whoCompletedModal.value = true
  }
}

// Handle member selection from modal
async function handleMemberSelected(memberId: number) {
  if (choreToComplete.value) {
    await completeChore(choreToComplete.value.id, memberId)
    await refreshChores()
    choreToComplete.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Chores
          </h1>
          
          <div class="flex items-center gap-3">
            <!-- View toggle -->
            <UFieldGroup>
              <UButton
                :color="viewMode === 'card' ? 'primary' : 'neutral'"
                :variant="viewMode === 'card' ? 'solid' : 'ghost'"
                icon="i-heroicons-squares-2x2"
                size="sm"
                @click="viewMode = 'card'"
              />
              <UButton
                :color="viewMode === 'list' ? 'primary' : 'neutral'"
                :variant="viewMode === 'list' ? 'solid' : 'ghost'"
                icon="i-heroicons-list-bullet"
                size="sm"
                @click="viewMode = 'list'"
              />
            </UFieldGroup>
            
            <!-- Settings link -->
            <UButton
              to="/settings"
              variant="ghost"
              color="neutral"
              icon="i-heroicons-cog-6-tooth"
              size="sm"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Family member filter -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <FamilyMemberFilter
          v-model="selectedMemberId"
          :members="familyMembers"
        />
      </div>
    </div>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Empty state -->
      <div 
        v-if="filteredChores.length === 0" 
        class="text-center py-16"
      >
        <UIcon 
          name="i-heroicons-clipboard-document-list" 
          class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" 
        />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No chores to show
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ selectedMemberId ? 'No chores assigned to this person' : 'Add some chores in settings to get started' }}
        </p>
        <UButton
          to="/settings/chores"
          color="primary"
          icon="i-heroicons-plus"
        >
          Add Chores
        </UButton>
      </div>

      <!-- Card view -->
      <div 
        v-else-if="viewMode === 'card'" 
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <ChoreCard
          v-for="chore in filteredChores"
          :key="chore.id"
          :chore="chore"
          :cooldown-status="getCooldownForChore(chore)"
          @complete="handleComplete(chore)"
        />
      </div>

      <!-- List view -->
      <div 
        v-else 
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <ChoreListItem
            v-for="chore in filteredChores"
            :key="chore.id"
            :chore="chore"
            :cooldown-status="getCooldownForChore(chore)"
            @complete="handleComplete(chore)"
          />
        </div>
      </div>
    </main>

    <!-- Bottom navigation -->
    <nav class="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-pb">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-around py-2">
          <NuxtLink
            to="/dashboard"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-primary-600 dark:text-primary-400"
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
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <UIcon name="i-heroicons-clock" class="w-6 h-6" />
            <span class="text-xs font-medium">Activity</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Celebration animation -->
    <UiCelebrationAnimation
      :show="showCelebration"
      @complete="onCelebrationComplete"
    />

    <!-- Who completed modal -->
    <ChoreWhoCompletedModal
      v-if="choreToComplete"
      :open="whoCompletedModal"
      :chore-name="choreToComplete.title"
      :chore-points="choreToComplete.points"
      @close="whoCompletedModal = false; choreToComplete = null"
      @select="handleMemberSelected"
    />
  </div>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
