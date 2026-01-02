<script setup lang="ts">
// Modal for selecting who completed an unassigned chore
import type { FamilyMember } from '~/types'

const props = defineProps<{
  open: boolean
  choreName: string
  chorePoints: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  select: [memberId: number]
}>()

// Fetch family members
const { data: members, status } = await useLazyFetch<{ data: FamilyMember[] }>('/api/family-members')

const familyMembers = computed(() => members.value?.data || [])

function selectMember(memberId: number) {
  emit('select', memberId)
  emit('update:open', false)
  emit('close')
}

function closeModal() {
  emit('update:open', false)
  emit('close')
}

function getDiceBearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}`
}

function getAvatarUrl(member: FamilyMember) {
  if (member.avatarType === 'dicebear') {
    return getDiceBearUrl(member.avatarValue)
  }
  return member.avatarValue
}
</script>

<template>
  <UModal
    :open="open"
    :title="`Who completed ${choreName}?`"
    :description="`Select who completed this chore • ${chorePoints} pts`"
    @update:open="val => !val && closeModal()"
  >
    <template #body>
      <!-- Loading state -->
      <div v-if="status === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
      </div>

      <!-- Empty state -->
      <div v-else-if="familyMembers.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-users" class="size-12 mx-auto text-muted mb-2" />
        <p class="text-muted">No family members found</p>
      </div>

      <!-- Family members grid -->
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          v-for="member in familyMembers"
          :key="member.id"
          class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
          @click="selectMember(member.id)"
        >
          <!-- Avatar -->
          <UAvatar
            size="xl"
            :src="getAvatarUrl(member)"
            :alt="member.name"
          />

          <!-- Name -->
          <span class="font-medium text-sm">{{ member.name }}</span>
        </button>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton variant="ghost" color="neutral" @click="closeModal">
          Cancel
        </UButton>
      </div>
    </template>
  </UModal>
</template>
