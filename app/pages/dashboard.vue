<script setup lang="ts">
// Dashboard page - main view for completing chores
import type { Chore, FamilyMember, Category, ChoreCompletion } from "~/types";
import {
  checkCooldownStatus,
  shouldShowRecurringChore,
} from "~/utils/cooldown";

definePageMeta({
  layout: false,
});

// View mode: card or list
const viewMode = ref<"card" | "list">("card");

// Selected family member filter (null = all)
const selectedMemberId = ref<number | null>(null);

// Chore completion composable
const { showCelebration, completeChore, onCelebrationComplete } =
  useChoreCompletion();

// Who completed modal state
const whoCompletedModal = ref(false);
const choreToComplete = ref<(Chore & { category?: Category | null }) | null>(
  null
);

// Fetch data
const {
  data: choresData,
  status: choresStatus,
  refresh: refreshChores,
} = await useFetch<{
  data: Array<
    Chore & {
      category?: Category | null;
      assignees?: Array<{ familyMemberId: number; familyMember?: FamilyMember | null }>;
      lastCompletion?: ChoreCompletion | null;
    }
  >;
}>("/api/chores");

const { data: membersData, status: membersStatus } = await useFetch<{
  data: FamilyMember[];
}>("/api/family-members");

const isLoading = computed(
  () => choresStatus.value === "pending" || membersStatus.value === "pending"
);
const chores = computed(() => choresData.value?.data || []);
const familyMembers = computed(() => membersData.value?.data || []);

// Helper to check if a chore is assigned to a specific member
function isAssignedToMember(chore: { assignees?: Array<{ familyMemberId: number }> }, memberId: number): boolean {
  return chore.assignees?.some(a => a.familyMemberId === memberId) || false;
}

// Helper to check if chore has any assignees
function hasAssignees(chore: { assignees?: Array<unknown> }): boolean {
  return (chore.assignees?.length ?? 0) > 0;
}

// Filter chores
const filteredChores = computed(() => {
  let result = chores.value;

  // Filter out deleted chores
  result = result.filter((c) => !c.deletedAt);

  // Filter by assignee if selected
  if (selectedMemberId.value !== null) {
    result = result.filter(
      (c) => isAssignedToMember(c, selectedMemberId.value!) || !hasAssignees(c)
    );
  }

  // Filter recurring chores by today's schedule
  result = result.filter((c) => shouldShowRecurringChore(c));

  // Sort: assigned chores first, then by points (highest first)
  result.sort((a, b) => {
    // Assigned to selected member first
    if (selectedMemberId.value !== null) {
      const aAssigned = isAssignedToMember(a, selectedMemberId.value);
      const bAssigned = isAssignedToMember(b, selectedMemberId.value);
      if (aAssigned && !bAssigned) return -1;
      if (bAssigned && !aAssigned) return 1;
    }
    // Then by points (highest first)
    return b.points - a.points;
  });

  return result;
});

// Get cooldown status for a chore
function getCooldownForChore(
  chore: Chore & { lastCompletion?: ChoreCompletion | null }
) {
  return checkCooldownStatus(chore, chore.lastCompletion);
}

// Handle chore completion
async function handleComplete(chore: Chore & { category?: Category | null; assignees?: Array<{ familyMemberId: number }> }) {
  // If chore has exactly one assignee, complete directly
  if (chore.assignees && chore.assignees.length === 1) {
    await completeChore(chore.id, chore.assignees[0].familyMemberId);
    await refreshChores();
  } else {
    // Multiple assignees or unassigned - show modal to ask who completed it
    choreToComplete.value = chore;
    whoCompletedModal.value = true;
  }
}

// Handle member selection from modal
async function handleMemberSelected(memberId: number) {
  if (choreToComplete.value) {
    await completeChore(choreToComplete.value.id, memberId);
    await refreshChores();
    choreToComplete.value = null;
  }
}
</script>

<template>
  <NuxtLayout name="app">
    <!-- Header -->
    <template #header>
      <header class="bg-white dark:bg-gray-800 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-3">
          <div class="flex items-center justify-between gap-4">
            <!-- Family member filter (left) -->
            <div class="flex-1 min-w-0">
              <FamilyMemberFilter
                v-model="selectedMemberId"
                :members="familyMembers"
              />
            </div>

            <!-- Icons (right) -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- View toggle -->
              <UFieldGroup>
                <UButton
                  :color="viewMode === 'card' ? 'primary' : 'neutral'"
                  :variant="viewMode === 'card' ? 'solid' : 'ghost'"
                  icon="i-lucide-layout-grid"
                  size="sm"
                  @click="viewMode = 'card'"
                />
                <UButton
                  :color="viewMode === 'list' ? 'primary' : 'neutral'"
                  :variant="viewMode === 'list' ? 'solid' : 'ghost'"
                  icon="i-lucide-list"
                  size="sm"
                  @click="viewMode = 'list'"
                />
              </UFieldGroup>

              <!-- Settings link -->
              <UButton
                to="/settings"
                variant="ghost"
                color="neutral"
                icon="i-lucide-settings"
                size="sm"
              />
            </div>
          </div>
        </div>
      </header>
    </template>

    <!-- Main content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading state -->
      <div v-if="isLoading">
        <!-- Card view skeleton -->
        <div
          v-if="viewMode === 'card'"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <ChoreCardSkeleton v-for="i in 8" :key="i" />
        </div>
        <!-- List view skeleton -->
        <div
          v-else
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
        >
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <ChoreListItemSkeleton v-for="i in 6" :key="i" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredChores.length === 0" class="text-center py-16">
        <UIcon
          name="i-heroicons-clipboard-document-list"
          class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
        />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No chores to show
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{
            selectedMemberId
              ? "No chores assigned to this person"
              : "Add some chores in settings to get started"
          }}
        </p>
        <UButton to="/settings/chores" color="primary" icon="i-heroicons-plus">
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
    </div>

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
      @close="
        whoCompletedModal = false;
        choreToComplete = null;
      "
      @select="handleMemberSelected"
    />
  </NuxtLayout>
</template>
