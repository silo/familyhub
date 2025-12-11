<script setup lang="ts">
import type { Category } from '~/server/db/schema'

definePageMeta({
  layout: 'settings',
})

// Some common category colors
const CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
]

// Common icons for categories
const CATEGORY_ICONS = [
  { value: 'i-lucide-home', label: 'Home' },
  { value: 'i-lucide-utensils', label: 'Kitchen' },
  { value: 'i-lucide-shirt', label: 'Laundry' },
  { value: 'i-lucide-trash-2', label: 'Trash' },
  { value: 'i-lucide-dog', label: 'Pets' },
  { value: 'i-lucide-car', label: 'Car' },
  { value: 'i-lucide-trees', label: 'Yard' },
  { value: 'i-lucide-shopping-cart', label: 'Shopping' },
  { value: 'i-lucide-book-open', label: 'Study' },
  { value: 'i-lucide-sparkles', label: 'Cleaning' },
]

// Fetch categories
const { data: categoriesData, refresh } = await useFetch('/api/categories')
const allCategories = computed(() => categoriesData.value?.data || [])

// Modal state
const isModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const isDeleteModalOpen = ref(false)
const deletingCategory = ref<Category | null>(null)

// Form state
const form = reactive({
  name: '',
  color: CATEGORY_COLORS[0],
  icon: CATEGORY_ICONS[0].value,
})

const loading = ref(false)
const error = ref<string | null>(null)

// Open modal for creating
function openCreate() {
  editingCategory.value = null
  form.name = ''
  form.color = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]
  form.icon = CATEGORY_ICONS[0].value
  error.value = null
  isModalOpen.value = true
}

// Open modal for editing
function openEdit(category: Category) {
  editingCategory.value = category
  form.name = category.name
  form.color = category.color || CATEGORY_COLORS[0]
  form.icon = category.icon || CATEGORY_ICONS[0].value
  error.value = null
  isModalOpen.value = true
}

// Open delete confirmation
function openDelete(category: Category) {
  deletingCategory.value = category
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
      color: form.color,
      icon: form.icon,
    }

    if (editingCategory.value) {
      const response = await $fetch(`/api/categories/${editingCategory.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      if ('error' in response) {
        error.value = response.error
        return
      }
    } else {
      const response = await $fetch('/api/categories', {
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
    error.value = 'Failed to save category'
  } finally {
    loading.value = false
  }
}

// Delete category
async function handleDelete() {
  if (!deletingCategory.value) return

  loading.value = true

  try {
    const response = await $fetch(`/api/categories/${deletingCategory.value.id}`, {
      method: 'DELETE',
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    isDeleteModalOpen.value = false
    deletingCategory.value = null
    await refresh()
  } catch (e) {
    error.value = 'Failed to delete category'
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
          Categories
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Organize your chores into categories
        </p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Add Category
      </UButton>
    </div>

    <!-- Categories List -->
    <div class="space-y-2">
      <UCard
        v-for="category in allCategories"
        :key="category.id"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg"
              :style="{ backgroundColor: category.color || '#6B7280' }"
            >
              <UIcon
                :name="category.icon || 'i-lucide-folder'"
                class="size-5 text-white"
              />
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ category.name }}
            </span>
          </div>

          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              size="sm"
              @click="openEdit(category)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              size="sm"
              @click="openDelete(category)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div
      v-if="allCategories.length === 0"
      class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
    >
      <UIcon name="i-lucide-folder" class="mx-auto size-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        No categories
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Categories help organize your chores (optional)
      </p>
      <UButton class="mt-4" @click="openCreate">
        Add Category
      </UButton>
    </div>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingCategory ? 'Edit Category' : 'Add Category' }}
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
                placeholder="e.g., Kitchen, Yard, Pets"
              />
            </UFormField>

            <!-- Icon -->
            <UFormField label="Icon" name="icon">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="icon in CATEGORY_ICONS"
                  :key="icon.value"
                  type="button"
                  class="flex size-10 items-center justify-center rounded-lg border-2 transition-colors"
                  :class="form.icon === icon.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'"
                  :title="icon.label"
                  @click="form.icon = icon.value"
                >
                  <UIcon :name="icon.value" class="size-5" />
                </button>
              </div>
            </UFormField>

            <!-- Color -->
            <UFormField label="Color" name="color">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="color in CATEGORY_COLORS"
                  :key="color"
                  type="button"
                  class="size-8 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110"
                  :class="form.color === color ? 'ring-primary-500' : 'ring-transparent'"
                  :style="{ backgroundColor: color }"
                  @click="form.color = color"
                />
              </div>
            </UFormField>

            <!-- Preview -->
            <div class="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div
                class="flex size-10 items-center justify-center rounded-lg"
                :style="{ backgroundColor: form.color }"
              >
                <UIcon :name="form.icon" class="size-5 text-white" />
              </div>
              <span class="font-medium">
                {{ form.name || 'Category Name' }}
              </span>
            </div>

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
                {{ editingCategory ? 'Save Changes' : 'Add Category' }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-error-600">
              Delete Category
            </h3>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ deletingCategory?.name }}</strong>?
            Chores in this category will become uncategorized.
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
