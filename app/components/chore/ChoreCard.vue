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
  cooldownEndsAt?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  isOverdue: false,
  onCooldown: false,
  cooldownEndsAt: null,
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

// Format cooldown time remaining
const cooldownText = computed(() => {
  if (!props.cooldownEndsAt) return ''
  const now = new Date()
  const diff = props.cooldownEndsAt.getTime() - now.getTime()
  if (diff <= 0) return ''
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

// Chore type badge
const choreTypeBadge = computed(() => {
  if (props.chore.isPermanent) {
    return { label: 'Permanent', color: 'primary' as const }
  }
  if (props.chore.recurringType) {
    return { label: 'Recurring', color: 'info' as const }
  }
  return null
})

// Assignee names display
const assigneeNames = computed(() => {
  if (assignees.value.length === 0) return 'Anyone'
  return assignees.value.map(a => a.name).join(', ')
})
</script>

<template>
  <UCard
    :class="{
      'border-l-4 border-l-red-500': isOverdue,
      'opacity-60': onCooldown,
    }"
  >
    <div class="flex flex-col gap-3">
      <!-- Top row: Avatar and Content -->
      <div class="flex items-start gap-4">
        <!-- Assignee Avatar(s) or Anyone Icon -->
        <div class="flex-shrink-0">
          <!-- Multiple assignees: use AvatarGroup -->
          <UAvatarGroup v-if="assignees.length > 0" size="lg" :max="3">
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
            size="lg"
            icon="i-lucide-users"
          />
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ chore.title }}
          </h3>
          <p v-if="chore.description" class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ chore.description }}
          </p>

          <!-- Meta Info -->
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <!-- Category -->
            <UBadge
              v-if="chore.category"
              variant="subtle"
              color="neutral"
            >
              <UIcon :name="chore.category.icon || 'i-lucide-folder'" class="mr-1 size-3" />
              {{ chore.category.name }}
            </UBadge>

            <!-- Type Badge -->
            <UBadge
              v-if="choreTypeBadge"
              :color="choreTypeBadge.color"
              variant="subtle"
              size="xs"
            >
              {{ choreTypeBadge.label }}
            </UBadge>

            <!-- Overdue -->
            <UBadge v-if="isOverdue" color="error" variant="subtle" size="xs">
              <UIcon name="i-lucide-alert-circle" class="mr-1 size-3" />
              Overdue
            </UBadge>

            <!-- Cooldown -->
            <UBadge v-if="onCooldown" color="neutral" variant="subtle" size="xs">
              <UIcon name="i-lucide-clock" class="mr-1 size-3" />
              {{ cooldownText }}
            </UBadge>

            <!-- Assignee Name -->
            <span class="text-gray-500">
              {{ assigneeNames }}
            </span>
          </div>
        </div>
      </div>

      <!-- Bottom row: Points and Done button -->
      <div class="flex items-center justify-between pt-2">
        <!-- Points Badge -->
        <div>
          <UBadge v-if="chore.points > 0" color="warning" variant="solid" size="lg">
            <UIcon name="i-lucide-coins" class="mr-1 size-3" />
            {{ chore.points }} pts
          </UBadge>
        </div>

        <!-- Complete Button -->
        <UButton
          icon="i-lucide-check"
          color="primary"
          size="lg"
          :disabled="onCooldown"
          @click="emit('complete', chore)"
        >
          Done
        </UButton>
      </div>
    </div>
  </UCard>
</template>
