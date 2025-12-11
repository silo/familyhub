<script setup lang="ts">
import type { Chore, FamilyMember, Category } from '~/types'

interface Props {
  chore: Chore & {
    category?: Category | null
    assignee?: FamilyMember | null
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
</script>

<template>
  <UCard
    class="transition-all"
    :class="{
      'border-l-4 border-l-red-500': isOverdue,
      'opacity-60': onCooldown,
    }"
  >
    <div class="flex items-start gap-4">
      <!-- Assignee Avatar or Anyone Icon -->
      <div class="flex-shrink-0">
        <div
          v-if="chore.assignee"
          class="size-12 overflow-hidden rounded-full ring-2"
          :style="{ '--tw-ring-color': chore.assignee.color }"
        >
          <img
            v-if="chore.assignee.avatarType === 'dicebear'"
            :src="getDiceBearUrl(chore.assignee.avatarValue)"
            :alt="chore.assignee.name"
            class="size-full object-cover"
          />
          <img
            v-else
            :src="chore.assignee.avatarValue"
            :alt="chore.assignee.name"
            class="size-full object-cover"
          />
        </div>
        <div
          v-else
          class="flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <UIcon name="i-lucide-users" class="size-6 text-gray-400" />
        </div>
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ chore.title }}
            </h3>
            <p v-if="chore.description" class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ chore.description }}
            </p>
          </div>

          <!-- Points Badge -->
          <div v-if="chore.points > 0" class="flex-shrink-0">
            <UBadge color="warning" variant="solid" size="lg">
              <UIcon name="i-lucide-coins" class="mr-1 size-3" />
              {{ chore.points }}
            </UBadge>
          </div>
        </div>

        <!-- Meta Info -->
        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <!-- Category -->
          <span
            v-if="chore.category"
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
            :style="{ backgroundColor: (chore.category.color || '#888888') + '20', color: chore.category.color || '#888888' }"
          >
            <UIcon :name="chore.category.icon || 'i-heroicons-folder'" class="size-3" />
            {{ chore.category.name }}
          </span>

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
            {{ chore.assignee?.name || 'Anyone' }}
          </span>
        </div>
      </div>

      <!-- Complete Button -->
      <div class="flex-shrink-0">
        <UButton
          icon="i-lucide-check"
          color="primary"
          :disabled="onCooldown"
          @click="emit('complete', chore)"
        >
          Done
        </UButton>
      </div>
    </div>
  </UCard>
</template>
