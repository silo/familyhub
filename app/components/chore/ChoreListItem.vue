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

// Get avatar URL for a family member
function getAvatarUrl(member: FamilyMember) {
  if (member.avatarType === 'dicebear') {
    return getDiceBearUrl(member.avatarValue)
  }
  return member.avatarValue
}

// Get assignees with their family member info
const assignees = computed(() => {
  return props.chore.assignees?.map(a => a.familyMember).filter(Boolean) as FamilyMember[] || []
})
</script>

<template>
  <UCard
    :ui="{ body: 'p-3' }"
    :class="{
      'border-l-4 border-l-red-500': isOverdue,
      'opacity-60': onCooldown,
    }"
  >
    <div class="flex items-center gap-3">
      <!-- Assignee Avatar(s) -->
      <div class="flex-shrink-0">
        <!-- Multiple assignees: use AvatarGroup -->
        <UAvatarGroup v-if="assignees.length > 0" size="sm" :max="2">
          <UAvatar
            v-for="assignee in assignees"
            :key="assignee.id"
            :src="getAvatarUrl(assignee)"
            :alt="assignee.name"
          />
        </UAvatarGroup>
        <!-- No assignees (Anyone) -->
        <UAvatar
          v-else
          size="sm"
          icon="i-lucide-users"
        />
      </div>

      <!-- Title -->
      <div class="min-w-0 flex-1">
        <span class="font-medium text-gray-900 dark:text-white">
          {{ chore.title }}
        </span>
      </div>

      <!-- Category -->
      <UBadge
        v-if="chore.category"
        variant="subtle"
        color="neutral"
        size="xs"
      >
        <UIcon :name="chore.category.icon || 'i-lucide-folder'" class="mr-1 size-3" />
        {{ chore.category.name }}
      </UBadge>

      <!-- Points -->
      <UBadge v-if="chore.points > 0" color="warning" variant="subtle" size="xs">
        {{ chore.points }} pts
      </UBadge>

      <!-- Overdue Badge -->
      <UBadge v-if="isOverdue" color="error" variant="subtle" size="xs">
        Overdue
      </UBadge>

      <!-- Complete Button -->
      <UButton
        icon="i-lucide-check"
        size="xs"
        :disabled="onCooldown"
        @click="emit('complete', chore)"
      />
    </div>
  </UCard>
</template>
