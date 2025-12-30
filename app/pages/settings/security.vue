<script setup lang="ts">
definePageMeta({
  layout: 'settings',
})

// Form state
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loading = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

// Validation
const isValid = computed(() => {
  if (!form.currentPassword) return false
  if (!form.newPassword) return false
  if (form.newPassword !== form.confirmPassword) return false
  return form.newPassword.length >= 6
})

async function handleSave() {
  if (!isValid.value) {
    error.value = 'Please fill in all fields correctly'
    return
  }

  loading.value = true
  success.value = false
  error.value = null

  try {
    const response = await $fetch('/api/settings/security', {
      method: 'PUT',
      body: {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      },
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    success.value = true

    // Reset form
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''

    // Clear success after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch {
    error.value = 'Failed to update password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Change your admin password</p>
    </div>

    <UCard class="max-w-lg">
      <form class="space-y-6" @submit.prevent="handleSave">
        <!-- Current Password -->
        <UFormField label="Current Password" name="currentPassword" required>
          <UInput
            v-model="form.currentPassword"
            type="password"
            placeholder="Enter current password"
            icon="i-lucide-lock"
          />
        </UFormField>

        <USeparator label="New Password" />

        <!-- New Password -->
        <UFormField
          label="New Password"
          name="newPassword"
          required
          hint="Must be at least 6 characters"
        >
          <UInput
            v-model="form.newPassword"
            type="password"
            placeholder="Enter new password"
            icon="i-lucide-lock"
          />
        </UFormField>

        <!-- Confirm Password -->
        <UFormField label="Confirm New Password" name="confirmPassword" required>
          <UInput
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirm new password"
            icon="i-lucide-lock"
          />
        </UFormField>

        <!-- Mismatch Warning -->
        <UAlert
          v-if="
            form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword
          "
          color="warning"
          icon="i-lucide-alert-triangle"
          title="Passwords don't match"
        />

        <!-- Messages -->
        <UAlert
          v-if="success"
          color="success"
          icon="i-lucide-check-circle"
          title="Password updated successfully"
        />

        <UAlert v-if="error" color="error" icon="i-lucide-alert-circle" :title="error" />

        <!-- Submit -->
        <UButton type="submit" :loading="loading" :disabled="!isValid"> Update Password </UButton>
      </form>
    </UCard>
  </div>
</template>
