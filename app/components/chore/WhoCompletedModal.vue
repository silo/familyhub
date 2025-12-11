<script setup lang="ts">
// Modal for selecting who completed an unassigned chore
import type { FamilyMember } from '~/types'

const props = defineProps<{
  open: boolean
  choreName: string
  chorePoints: number
}>()

const emit = defineEmits<{
  close: []
  select: [memberId: number]
}>()

// Fetch family members
const { data: members, status } = await useLazyFetch<{ data: FamilyMember[] }>('/api/family')

const familyMembers = computed(() => members.value?.data || [])

function selectMember(memberId: number) {
  emit('select', memberId)
  emit('close')
}

function getDiceBearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}`
}
</script>

<template>
  <UModal :open="open" @update:open="(val) => !val && emit('close')">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">Who completed this?</h3>
              <p class="text-sm text-muted">{{ choreName }} • {{ chorePoints }} pts</p>
            </div>
          </div>
        </template>

        <div v-if="status === 'pending'" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-muted" />
        </div>

        <div v-else-if="familyMembers.length === 0" class="text-center py-8">
          <UIcon name="i-heroicons-users" class="w-12 h-12 mx-auto text-muted mb-2" />
          <p class="text-muted">No family members found</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            v-for="member in familyMembers"
            :key="member.id"
            class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            @click="selectMember(member.id)"
          >
            <!-- Avatar -->
            <div 
              class="w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2"
              :style="{ '--tw-ring-color': member.color }"
            >
              <img
                v-if="member.avatarType === 'custom'"
                :src="member.avatarValue"
                :alt="member.name"
                class="w-full h-full object-cover"
              >
              <img
                v-else
                :src="getDiceBearUrl(member.avatarValue)"
                :alt="member.name"
                class="w-full h-full"
              >
            </div>
            
            <!-- Name -->
            <span class="font-medium text-sm">{{ member.name }}</span>
          </button>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              variant="ghost"
              color="neutral"
              @click="emit('close')"
            >
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
