<script setup lang="ts">
import type { FamilyMember, FamilyMemberWithPassword, MembersResponse } from '~/types'

definePageMeta({
  layout: 'settings',
})

// Pastel colors from schema
const PASTEL_COLORS = [
  { value: '#FFB3BA', label: 'Pink' },
  { value: '#FFDFBA', label: 'Peach' },
  { value: '#FFFFBA', label: 'Yellow' },
  { value: '#BAFFC9', label: 'Mint' },
  { value: '#BAE1FF', label: 'Sky Blue' },
  { value: '#E0BBE4', label: 'Lavender' },
  { value: '#D4A5A5', label: 'Dusty Rose' },
  { value: '#A5D4D4', label: 'Teal' },
  { value: '#C9C9FF', label: 'Periwinkle' },
  { value: '#FFD4BA', label: 'Apricot' },
  { value: '#D4BAFF', label: 'Lilac' },
  { value: '#BAFFD4', label: 'Seafoam' },
]

// Fetch family members
const { data: membersData, refresh } = await useFetch<MembersResponse>('/api/family-members')
const members = computed(() => membersData.value?.data || [])

// Modal state
const isModalOpen = ref(false)
const editingMember = ref<FamilyMember | null>(null)
const isDeleteModalOpen = ref(false)
const deletingMember = ref<FamilyMember | null>(null)
const isPasswordModalOpen = ref(false)
const passwordMember = ref<FamilyMemberWithPassword | null>(null)

// Form state
const form = reactive({
  name: '',
  avatarType: 'dicebear' as 'dicebear' | 'custom',
  avatarValue: '',
  color: PASTEL_COLORS[0]?.value || '#FFB3BA' as string,
})

// Password form state
const passwordForm = reactive({
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const error = ref<string | null>(null)
const toast = useToast()

// Generate DiceBear avatar URL
function getDiceBearUrl(seed: string) {
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}`
}

// Randomize avatar seed
function randomizeAvatar() {
  form.avatarValue = `${form.name || 'user'}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Open modal for creating
function openCreate() {
  editingMember.value = null
  form.name = ''
  form.avatarType = 'dicebear'
  form.avatarValue = `new-user-${Date.now()}`
  form.color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]?.value || '#FFB3BA'
  error.value = null
  isModalOpen.value = true
}

// Open modal for editing
function openEdit(member: FamilyMember) {
  editingMember.value = member
  form.name = member.name
  form.avatarType = member.avatarType as 'dicebear' | 'custom'
  form.avatarValue = member.avatarValue
  form.color = member.color
  error.value = null
  isModalOpen.value = true
}

// Open delete confirmation
function openDelete(member: FamilyMember) {
  deletingMember.value = member
  isDeleteModalOpen.value = true
}

// Save (create or update)
async function handleSave() {
  if (!form.name.trim()) {
    error.value = 'Name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    const payload = {
      name: form.name.trim(),
      avatarType: form.avatarType,
      avatarValue: form.avatarValue,
      color: form.color,
    }

    if (editingMember.value) {
      // Update
      const response = await $fetch(`/api/family-members/${editingMember.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      if ('error' in response) {
        error.value = response.error
        return
      }
    } else {
      // Create
      const response = await $fetch('/api/family-members', {
        method: 'POST',
        body: payload,
      })
      if ('error' in response) {
        error.value = response.error
        return
      }
    }

    isModalOpen.value = false
    await refresh()
  } catch (e) {
    error.value = 'Failed to save family member'
  } finally {
    loading.value = false
  }
}

// Delete member
async function handleDelete() {
  if (!deletingMember.value) return

  loading.value = true

  try {
    const response = await $fetch(`/api/family-members/${deletingMember.value.id}`, {
      method: 'DELETE',
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    isDeleteModalOpen.value = false
    deletingMember.value = null
    await refresh()
  } catch (e) {
    error.value = 'Failed to delete family member'
  } finally {
    loading.value = false
  }
}

// Open password modal
function openPasswordModal(member: FamilyMember) {
  passwordMember.value = member
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  error.value = null
  isPasswordModalOpen.value = true
}

// Set password
async function handleSetPassword() {
  if (!passwordMember.value) return
  
  if (!passwordForm.password) {
    error.value = 'Password is required'
    return
  }
  
  if (passwordForm.password.length < 4) {
    error.value = 'Password must be at least 4 characters'
    return
  }
  
  if (passwordForm.password !== passwordForm.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await $fetch(`/api/family-members/${passwordMember.value.id}/password`, {
      method: 'PUT',
      body: {
        password: passwordForm.password,
      },
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    isPasswordModalOpen.value = false
    passwordMember.value = null
    toast.add({
      title: 'Password Set',
      description: 'Password has been updated successfully',
      color: 'success',
    })
    await refresh()
  } catch (e) {
    error.value = 'Failed to set password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Family Members
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your family members and their profiles
        </p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Add Member
      </UButton>
    </div>

    <!-- Members Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard
        v-for="member in members"
        :key="member.id"
        class="relative"
      >
        <!-- Admin Badge -->
        <div
          v-if="member.isAdmin"
          class="absolute right-3 top-3"
        >
          <UBadge color="primary" variant="subtle">
            Admin
          </UBadge>
        </div>

        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="size-16 overflow-hidden rounded-full ring-4"
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

          <!-- Info -->
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ member.name }}
            </h3>
            <div class="mt-1 flex items-center gap-2">
              <div
                class="inline-block size-4 rounded-full"
                :style="{ backgroundColor: member.color }"
              />
              <UBadge 
                v-if="member.passwordHash" 
                color="success" 
                variant="subtle"
                size="xs"
              >
                <UIcon name="i-lucide-key" class="mr-1 size-3" />
                Password set
              </UBadge>
              <UBadge 
                v-else 
                color="warning" 
                variant="subtle"
                size="xs"
              >
                <UIcon name="i-lucide-alert-triangle" class="mr-1 size-3" />
                No password
              </UBadge>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-key"
              size="sm"
              @click="openPasswordModal(member)"
            >
              Password
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              size="sm"
              @click="openEdit(member)"
            >
              Edit
            </UButton>
            <UButton
              v-if="!member.isAdmin"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              size="sm"
              @click="openDelete(member)"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Empty State -->
    <div
      v-if="members.length === 0"
      class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
    >
      <UIcon name="i-lucide-users" class="mx-auto size-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        No family members
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Get started by adding your first family member
      </p>
      <UButton class="mt-4" @click="openCreate">
        Add Family Member
      </UButton>
    </div>

    <!-- Create/Edit Modal -->
    <UModal 
      v-model:open="isModalOpen"
      :title="editingMember ? 'Edit Family Member' : 'Add Family Member'"
      :description="editingMember ? 'Update family member details' : 'Add a new family member'"
    >
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingMember ? 'Edit Family Member' : 'Add Family Member' }}
              </h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="isModalOpen = false"
              />
            </div>
          </template>

          <form class="space-y-6" @submit.prevent="handleSave">
            <!-- Name -->
            <UFormField label="Name" name="name" required>
              <UInput
                v-model="form.name"
                placeholder="Enter name"
                icon="i-lucide-user"
              />
            </UFormField>

            <!-- Avatar Preview & Randomize -->
            <UFormField label="Avatar" name="avatar">
              <div class="flex items-center gap-4">
                <div
                  class="size-20 overflow-hidden rounded-full ring-4"
                  :style="{ '--tw-ring-color': form.color }"
                >
                  <img
                    :src="getDiceBearUrl(form.avatarValue)"
                    alt="Avatar preview"
                    class="size-full object-cover"
                  />
                </div>
                <UButton
                  type="button"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-shuffle"
                  @click="randomizeAvatar"
                >
                  Randomize
                </UButton>
              </div>
            </UFormField>

            <!-- Color Picker -->
            <UFormField label="Color" name="color">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="color in PASTEL_COLORS"
                  :key="color.value"
                  type="button"
                  class="size-8 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110"
                  :class="form.color === color.value ? 'ring-primary-500' : 'ring-transparent'"
                  :style="{ backgroundColor: color.value }"
                  :title="color.label"
                  @click="form.color = color.value"
                />
              </div>
            </UFormField>

            <!-- Error -->
            <UAlert
              v-if="error"
              color="error"
              icon="i-lucide-alert-circle"
              :title="error"
            />

            <!-- Actions -->
            <div class="flex justify-end gap-2">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                @click="isModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton type="submit" :loading="loading">
                {{ editingMember ? 'Save Changes' : 'Add Member' }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal 
      v-model:open="isDeleteModalOpen"
      title="Delete Family Member"
      :description="`Permanently delete ${deletingMember?.name || 'this member'} and all their data`"
    >
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-error-600">
              Delete Family Member
            </h3>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ deletingMember?.name }}</strong>?
            This will permanently remove all their chore completions, points, and activity history.
          </p>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="outline"
                @click="isDeleteModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                :loading="loading"
                @click="handleDelete"
              >
                Delete
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Password Modal -->
    <UModal 
      v-model:open="isPasswordModalOpen"
      title="Set Password"
      :description="`Set login password for ${passwordMember?.name || 'member'}`"
    >
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                Set Password for {{ passwordMember?.name }}
              </h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="isPasswordModalOpen = false"
              />
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="handleSetPassword">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ passwordMember?.passwordHash ? 'Update the password for this family member.' : 'Set a password so this family member can log in to the mobile app.' }}
            </p>

            <!-- Password -->
            <UFormField label="New Password" name="password" required>
              <UInput
                v-model="passwordForm.password"
                type="password"
                placeholder="Enter password"
                icon="i-lucide-lock"
              />
            </UFormField>

            <!-- Confirm Password -->
            <UFormField label="Confirm Password" name="confirmPassword" required>
              <UInput
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="Confirm password"
                icon="i-lucide-lock"
              />
            </UFormField>

            <!-- Error -->
            <UAlert
              v-if="error"
              color="error"
              icon="i-lucide-alert-circle"
              :title="error"
            />

            <!-- Actions -->
            <div class="flex justify-end gap-2">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                @click="isPasswordModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton type="submit" :loading="loading">
                {{ passwordMember?.passwordHash ? 'Update Password' : 'Set Password' }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
