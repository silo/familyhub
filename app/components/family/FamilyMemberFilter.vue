<script setup lang="ts">
import type { FamilyMember } from '~/types'

const props = defineProps<{
  members: FamilyMember[]
  modelValue: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [id: number | null]
}>()

// DiceBear avatar URL
function getDiceBearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}`
}

function selectMember(id: number | null) {
  if (id === props.modelValue) {
    // Clicking the same member again clears the filter
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', id)
  }
}
</script>

<template>
  <div class="flex items-center gap-2 overflow-x-auto pb-2">
    <!-- All Button -->
    <button
      class="flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors"
      :class="modelValue === null
        ? 'bg-primary-100 dark:bg-primary-900/30'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
      @click="selectMember(null)"
    >
      <div class="flex size-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <UIcon name="i-heroicons-users" class="size-5" />
      </div>
      <span class="text-xs font-medium">All</span>
    </button>

    <!-- Member Avatars -->
    <button
      v-for="member in members"
      :key="member.id"
      class="flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors"
      :class="modelValue === member.id || modelValue === null
        ? 'bg-primary-100/50 dark:bg-primary-900/20'
        : 'opacity-50 hover:opacity-75'"
      @click="selectMember(member.id)"
    >
      <div class="relative">
        <div
          class="size-10 overflow-hidden rounded-full ring-2"
          :style="{ '--tw-ring-color': member.color }"
        >
          <img
            v-if="member.avatarType === 'dicebear'"
            :src="getDiceBearUrl(member.avatarValue)"
            :alt="member.name"
            class="size-full object-cover"
          />
          <img
            v-else
            :src="member.avatarValue"
            :alt="member.name"
            class="size-full object-cover"
          />
        </div>
        <!-- Selected indicator -->
        <div
          v-if="modelValue === member.id"
          class="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary-500"
        >
          <UIcon name="i-heroicons-check" class="size-3 text-white" />
        </div>
      </div>
      <span class="max-w-16 truncate text-xs font-medium">{{ member.name }}</span>
    </button>
  </div>
</template>
