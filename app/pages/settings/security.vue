<script setup lang="ts">
definePageMeta({
  layout: 'settings',
})

const { authType, fetchAuthType } = useSettingsAuth()

// Form state
const form = reactive({
  currentCredential: '',
  newAuthType: 'password' as 'password' | 'pin',
  newCredential: '',
  confirmCredential: '',
})

const loading = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

// Initialize form with current auth type
onMounted(async () => {
  await fetchAuthType()
  form.newAuthType = authType.value
})

// Auth type options
const authTypeOptions = [
  { label: 'Password', value: 'password' },
  { label: '4-Digit PIN', value: 'pin' },
]

// Validation
const isValid = computed(() => {
  if (!form.currentCredential) return false
  if (!form.newCredential) return false
  if (form.newCredential !== form.confirmCredential) return false

  if (form.newAuthType === 'password') {
    return form.newCredential.length >= 6
  }
  if (form.newAuthType === 'pin') {
    return /^\d{4}$/.test(form.newCredential)
  }
  return false
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
        currentCredential: form.currentCredential,
        newAuthType: form.newAuthType,
        newCredential: form.newCredential,
      },
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    success.value = true

    // Reset form
    form.currentCredential = ''
    form.newCredential = ''
    form.confirmCredential = ''

    // Refresh auth type
    await fetchAuthType()

    // Clear success after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (e) {
    error.value = 'Failed to update security settings'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Security Settings
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Change your password or switch to PIN authentication
      </p>
    </div>

    <UCard class="max-w-lg">
      <form class="space-y-6" @submit.prevent="handleSave">
        <!-- Current Auth Info -->
        <UAlert
          color="info"
          icon="i-lucide-info"
        >
          <template #title>
            Currently using: <strong>{{ authType === 'pin' ? '4-Digit PIN' : 'Password' }}</strong>
          </template>
        </UAlert>

        <!-- Current Credential -->
        <UFormField
          :label="authType === 'pin' ? 'Current PIN' : 'Current Password'"
          name="currentCredential"
          required
        >
          <UInput
            v-model="form.currentCredential"
            type="password"
            :placeholder="authType === 'pin' ? 'Enter current PIN' : 'Enter current password'"
            :icon="authType === 'pin' ? 'i-lucide-key' : 'i-lucide-lock'"
            :maxlength="authType === 'pin' ? 4 : undefined"
            :inputmode="authType === 'pin' ? 'numeric' : 'text'"
          />
        </UFormField>

        <USeparator label="New Authentication" />

        <!-- New Auth Type -->
        <UFormField label="Authentication Method" name="newAuthType">
          <URadioGroup
            v-model="form.newAuthType"
            :items="authTypeOptions"
          />
        </UFormField>

        <!-- New Credential -->
        <UFormField
          :label="form.newAuthType === 'pin' ? 'New PIN' : 'New Password'"
          name="newCredential"
          required
          :hint="form.newAuthType === 'pin' ? 'Must be exactly 4 digits' : 'Must be at least 6 characters'"
        >
          <UInput
            v-model="form.newCredential"
            type="password"
            :placeholder="form.newAuthType === 'pin' ? 'Enter new PIN' : 'Enter new password'"
            :icon="form.newAuthType === 'pin' ? 'i-lucide-key' : 'i-lucide-lock'"
            :maxlength="form.newAuthType === 'pin' ? 4 : undefined"
            :inputmode="form.newAuthType === 'pin' ? 'numeric' : 'text'"
          />
        </UFormField>

        <!-- Confirm Credential -->
        <UFormField
          :label="form.newAuthType === 'pin' ? 'Confirm New PIN' : 'Confirm New Password'"
          name="confirmCredential"
          required
        >
          <UInput
            v-model="form.confirmCredential"
            type="password"
            :placeholder="form.newAuthType === 'pin' ? 'Confirm new PIN' : 'Confirm new password'"
            :icon="form.newAuthType === 'pin' ? 'i-lucide-key' : 'i-lucide-lock'"
            :maxlength="form.newAuthType === 'pin' ? 4 : undefined"
            :inputmode="form.newAuthType === 'pin' ? 'numeric' : 'text'"
          />
        </UFormField>

        <!-- Mismatch Warning -->
        <UAlert
          v-if="form.newCredential && form.confirmCredential && form.newCredential !== form.confirmCredential"
          color="warning"
          icon="i-lucide-alert-triangle"
          title="Credentials don't match"
        />

        <!-- Messages -->
        <UAlert
          v-if="success"
          color="success"
          icon="i-lucide-check-circle"
          title="Security settings updated successfully"
        />

        <UAlert
          v-if="error"
          color="error"
          icon="i-lucide-alert-circle"
          :title="error"
        />

        <!-- Submit -->
        <UButton
          type="submit"
          :loading="loading"
          :disabled="!isValid"
        >
          Update Security Settings
        </UButton>
      </form>
    </UCard>
  </div>
</template>
