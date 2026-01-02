<script setup lang="ts">
import type { Chore, FamilyMember, Category } from '~/types'

interface ChoreAssignee {
  familyMemberId: number
  familyMember?: FamilyMember | null
}

interface Props {
  chore: Chore & {
    category?: Category | null
    assignees?: ChoreAssignee[]
  }
  isOverdue?: boolean
  onCooldown?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOverdue: false,
  onCooldown: false,
})

const emit = defineEmits<{
  complete: [chore: Props['chore']]
}>()

// DiceBear avatar URL
function getDiceBearUrl(seed: string) {
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}`
}

// Get assignees with their family member info
const assignees = computed(() => {
  return props.chore.assignees?.map(a => a.familyMember).filter(Boolean) as FamilyMember[] || []
})
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
    :class="{
      'border-l-4 border-l-red-500': isOverdue,
      'opacity-60': onCooldown,
    }"
  >
    <!-- Assignee Avatar(s) -->
    <div class="flex-shrink-0">
      <!-- Multiple assignees: stacked avatars -->
      <div v-if="assignees.length > 1" class="flex -space-x-1">
        <div
          v-for="(assignee, index) in assignees.slice(0, 2)"
          :key="assignee.id"
          class="size-7 overflow-hidden rounded-full ring-1 ring-white dark:ring-gray-900"
          :style="{ zIndex: 2 - index }"
        >
          <img
            v-if="assignee.avatarType === 'dicebear'"
            :src="getDiceBearUrl(assignee.avatarValue)"
            :alt="assignee.name"
            class="size-full object-cover"
          />
          <img
            v-else
            :src="assignee.avatarValue"
            :alt="assignee.name"
            class="size-full object-cover"
          />
        </div>
        <div
          v-if="assignees.length > 2"
          class="flex size-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 ring-1 ring-white dark:ring-gray-900 text-xs font-medium"
        >
          +{{ assignees.length - 2 }}
        </div>
      </div>
      <!-- Single assignee -->
      <div
        v-else-if="assignees.length === 1"
        class="size-8 overflow-hidden rounded-full ring-2"
        :style="{ '--tw-ring-color': assignees[0].color }"
      >
        <img
          v-if="assignees[0].avatarType === 'dicebear'"
          :src="getDiceBearUrl(assignees[0].avatarValue)"
          :alt="assignees[0].name"
          class="size-full object-cover"
        />
      </div>
      <!-- No assignees (Anyone) -->
      <div
        v-else
        class="flex size-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
      >
        <UIcon name="i-lucide-users" class="size-4 text-gray-400" />
      </div>
    </div>

    <!-- Title -->
    <div class="min-w-0 flex-1">
      <span class="font-medium text-gray-900 dark:text-white">
        {{ chore.title }}
      </span>
    </div>

    <!-- Category -->
    <div v-if="chore.category" class="flex-shrink-0">
      <div
        class="flex size-6 items-center justify-center rounded"
        :style="{ backgroundColor: chore.category.color || '#888888' }"
      >
        <UIcon :name="chore.category.icon || 'i-heroicons-folder'" class="size-4 text-white" />
      </div>
    </div>

    <!-- Points -->
    <div v-if="chore.points > 0" class="flex-shrink-0">
      <UBadge color="warning" variant="subtle" size="xs"> {{ chore.points }} pts </UBadge>
    </div>

    <!-- Overdue Badge -->
    <UBadge v-if="isOverdue" color="error" variant="subtle" size="xs"> Overdue </UBadge>

    <!-- Complete Button -->
    <UButton
      icon="i-lucide-check"
      size="xs"
      :disabled="onCooldown"
      @click="emit('complete', chore)"
    />
  </div>
</template>
