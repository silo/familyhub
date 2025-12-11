<script setup lang="ts">
import type { Chore, Category, FamilyMember } from '~/types'

definePageMeta({
  layout: 'settings',
})

// Fetch data
const { data: choresData, refresh: refreshChores } = await useFetch('/api/chores')
const { data: categoriesData } = await useFetch('/api/categories')
const { data: membersData } = await useFetch('/api/family-members')

const allChores = computed(() => choresData.value?.data || [])
const allCategories = computed(() => categoriesData.value?.data || [])
const allMembers = computed(() => membersData.value?.data || [])

// Category and member options for select
const categoryOptions = computed(() => [
  { label: 'No Category', value: null },
  ...allCategories.value.map(c => ({ label: c.name, value: c.id })),
])

const memberOptions = computed(() => [
  { label: 'Anyone', value: null },
  ...allMembers.value.map(m => ({ label: m.name, value: m.id })),
])

// Modal state
const isModalOpen = ref(false)
const editingChore = ref<(Chore & { category?: Category | null; assignee?: FamilyMember | null }) | null>(null)
const isDeleteModalOpen = ref(false)
const deletingChore = ref<Chore | null>(null)

// Form state
const form = reactive({
  title: '',
  description: '',
  points: 0,
  categoryId: null as number | null,
  assigneeId: null as number | null,
  isPermanent: false,
  recurringType: null as string | null,
  dueDate: '',
  dueTime: '',
  endDate: '',
  cooldownType: 'unlimited' as string,
  cooldownHours: 24,
})

const loading = ref(false)
const error = ref<string | null>(null)

// Recurring type options
const recurringOptions = [
  { label: 'Not Recurring', value: null },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'biweekly' },
]

// Cooldown options
const cooldownOptions = [
  { label: 'Unlimited (no cooldown)', value: 'unlimited' },
  { label: 'Once per day', value: 'daily' },
  { label: 'Custom hours', value: 'hours' },
]

// Days of week for recurring
const daysOfWeek = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

const selectedDayOfWeek = ref(1) // Monday default

function resetForm() {
  form.title = ''
  form.description = ''
  form.points = 0
  form.categoryId = null
  form.assigneeId = null
  form.isPermanent = false
  form.recurringType = null
  form.dueDate = ''
  form.dueTime = ''
  form.endDate = ''
  form.cooldownType = 'unlimited'
  form.cooldownHours = 24
  selectedDayOfWeek.value = 1
}

function openCreate() {
  editingChore.value = null
  resetForm()
  error.value = null
  isModalOpen.value = true
}

function openEdit(chore: typeof allChores.value[0]) {
  editingChore.value = chore
  form.title = chore.title
  form.description = chore.description || ''
  form.points = chore.points
  form.categoryId = chore.categoryId
  form.assigneeId = chore.assigneeId
  form.isPermanent = chore.isPermanent
  form.recurringType = chore.recurringType
  form.dueDate = chore.dueDate || ''
  form.dueTime = chore.dueTime || ''
  form.endDate = chore.endDate || ''
  form.cooldownType = chore.cooldownType || 'unlimited'
  form.cooldownHours = chore.cooldownHours || 24

  // Extract day of week from recurring config
  if (chore.recurringConfig && typeof chore.recurringConfig === 'object') {
    const config = chore.recurringConfig as any
    if ('dayOfWeek' in config) {
      selectedDayOfWeek.value = config.dayOfWeek
    }
  }

  error.value = null
  isModalOpen.value = true
}

function openDelete(chore: Chore) {
  deletingChore.value = chore
  isDeleteModalOpen.value = true
}

async function handleSave() {
  if (!form.title.trim()) {
    error.value = 'Title is required'
    return
  }

  loading.value = true
  error.value = null

  // Build recurring config
  let recurringConfig = null
  if (form.recurringType === 'daily') {
    recurringConfig = { type: 'daily' }
  } else if (form.recurringType === 'weekly') {
    recurringConfig = { type: 'weekly', dayOfWeek: selectedDayOfWeek.value }
  } else if (form.recurringType === 'biweekly') {
    recurringConfig = {
      type: 'biweekly',
      dayOfWeek: selectedDayOfWeek.value,
      startDate: form.dueDate || new Date().toISOString().split('T')[0],
    }
  }

  const payload = {
    title: form.title.trim(),
    description: form.description || null,
    points: form.points,
    categoryId: form.categoryId,
    assigneeId: form.assigneeId,
    isPermanent: form.isPermanent,
    recurringType: form.recurringType,
    recurringConfig,
    dueDate: form.dueDate || null,
    dueTime: form.dueTime || null,
    endDate: form.endDate || null,
    cooldownType: form.isPermanent ? form.cooldownType : null,
    cooldownHours: form.cooldownType === 'hours' ? form.cooldownHours : null,
  }

  try {
    if (editingChore.value) {
      const response = await $fetch(`/api/chores/${editingChore.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      if ('error' in response) {
        error.value = response.error
        return
      }
    } else {
      const response = await $fetch('/api/chores', {
        method: 'POST',
        body: payload,
      })
      if ('error' in response) {
        error.value = response.error
        return
      }
    }

    isModalOpen.value = false
    await refreshChores()
  } catch (e) {
    error.value = 'Failed to save chore'
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!deletingChore.value) return

  loading.value = true

  try {
    const response = await $fetch(`/api/chores/${deletingChore.value.id}`, {
      method: 'DELETE',
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    isDeleteModalOpen.value = false
    deletingChore.value = null
    await refreshChores()
  } catch (e) {
    error.value = 'Failed to delete chore'
  } finally {
    loading.value = false
  }
}

// Helper to get chore type label
function getChoreTypeLabel(chore: Chore) {
  if (chore.isPermanent) return 'Permanent'
  if (chore.recurringType) return 'Recurring'
  return 'One-time'
}

function getChoreTypeBadgeColor(chore: Chore) {
  if (chore.isPermanent) return 'primary'
  if (chore.recurringType) return 'info'
  return 'neutral'
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Chores
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage chores and tasks for your family
        </p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Add Chore
      </UButton>
    </div>

    <!-- Chores List -->
    <div class="space-y-3">
      <UCard
        v-for="chore in allChores"
        :key="chore.id"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ chore.title }}
              </h3>
              <UBadge :color="getChoreTypeBadgeColor(chore)" variant="subtle" size="xs">
                {{ getChoreTypeLabel(chore) }}
              </UBadge>
              <UBadge v-if="chore.points > 0" color="warning" variant="subtle" size="xs">
                {{ chore.points }} pts
              </UBadge>
            </div>

            <p v-if="chore.description" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ chore.description }}
            </p>

            <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
              <span v-if="chore.category" class="flex items-center gap-1">
                <UIcon :name="chore.category.icon || 'i-lucide-folder'" class="size-3" />
                {{ chore.category.name }}
              </span>
              <span v-if="chore.assignee" class="flex items-center gap-1">
                <UIcon name="i-lucide-user" class="size-3" />
                {{ chore.assignee.name }}
              </span>
              <span v-else class="flex items-center gap-1">
                <UIcon name="i-lucide-users" class="size-3" />
                Anyone
              </span>
              <span v-if="chore.dueDate" class="flex items-center gap-1">
                <UIcon name="i-lucide-calendar" class="size-3" />
                {{ chore.dueDate }}
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              size="sm"
              @click="openEdit(chore)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              size="sm"
              @click="openDelete(chore)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div
      v-if="allChores.length === 0"
      class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
    >
      <UIcon name="i-lucide-list-checks" class="mx-auto size-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        No chores yet
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Create your first chore to get started
      </p>
      <UButton class="mt-4" @click="openCreate">
        Add Chore
      </UButton>
    </div>

    <!-- Create/Edit Modal -->
    <UModal 
      v-model:open="isModalOpen"
      :title="editingChore ? 'Edit Chore' : 'Add Chore'"
      :description="editingChore ? 'Update chore details' : 'Create a new chore'"
    >
      <template #content>
        <UCard class="max-h-[90vh] overflow-y-auto">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingChore ? 'Edit Chore' : 'Add Chore' }}
              </h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="isModalOpen = false"
              />
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="handleSave">
            <!-- Title -->
            <UFormField label="Title" name="title" required>
              <UInput
                v-model="form.title"
                placeholder="e.g., Take out trash"
              />
            </UFormField>

            <!-- Description -->
            <UFormField label="Description" name="description">
              <UTextarea
                v-model="form.description"
                placeholder="Optional details..."
                :rows="2"
              />
            </UFormField>

            <!-- Points -->
            <UFormField label="Points" name="points">
              <UInput
                v-model="form.points"
                type="number"
                min="0"
                icon="i-lucide-coins"
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Category -->
              <UFormField label="Category" name="categoryId">
                <USelect
                  v-model="form.categoryId"
                  :items="categoryOptions"
                />
              </UFormField>

              <!-- Assignee -->
              <UFormField label="Assigned To" name="assigneeId">
                <USelect
                  v-model="form.assigneeId"
                  :items="memberOptions"
                />
              </UFormField>
            </div>

            <USeparator />

            <!-- Chore Type -->
            <UFormField label="Chore Type" name="isPermanent">
              <div class="space-y-2">
                <UCheckbox
                  v-model="form.isPermanent"
                  label="Permanent chore (always visible, can be done repeatedly)"
                />
              </div>
            </UFormField>

            <!-- Cooldown (for permanent chores) -->
            <UFormField
              v-if="form.isPermanent"
              label="Cooldown"
              name="cooldownType"
            >
              <USelect
                v-model="form.cooldownType"
                :items="cooldownOptions"
              />
              <UInput
                v-if="form.cooldownType === 'hours'"
                v-model="form.cooldownHours"
                type="number"
                min="1"
                class="mt-2"
                placeholder="Hours between completions"
              />
            </UFormField>

            <!-- Recurring (for non-permanent) -->
            <UFormField
              v-if="!form.isPermanent"
              label="Recurring Schedule"
              name="recurringType"
            >
              <USelect
                v-model="form.recurringType"
                :items="recurringOptions"
              />

              <!-- Day of week selection -->
              <USelect
                v-if="form.recurringType === 'weekly' || form.recurringType === 'biweekly'"
                v-model="selectedDayOfWeek"
                :items="daysOfWeek"
                class="mt-2"
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Due Date -->
              <UFormField label="Due Date" name="dueDate">
                <UInput
                  v-model="form.dueDate"
                  type="date"
                />
              </UFormField>

              <!-- Due Time -->
              <UFormField label="Due Time" name="dueTime">
                <UInput
                  v-model="form.dueTime"
                  type="time"
                />
              </UFormField>
            </div>

            <!-- End Date (for recurring) -->
            <UFormField
              v-if="form.recurringType"
              label="End Date (optional)"
              name="endDate"
              hint="Chore will auto-archive after this date"
            >
              <UInput
                v-model="form.endDate"
                type="date"
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
            <div class="flex justify-end gap-2 pt-4">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                @click="isModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton type="submit" :loading="loading">
                {{ editingChore ? 'Save Changes' : 'Add Chore' }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal 
      v-model:open="isDeleteModalOpen"
      title="Delete Chore"
      :description="`Delete ${deletingChore?.title || 'this chore'}`"
    >
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-error-600">
              Delete Chore
            </h3>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ deletingChore?.title }}</strong>?
            This will archive the chore but preserve completion history.
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
  </div>
</template>
