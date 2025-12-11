<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'setup',
})

// Form schema
const schema = z.object({
  adminName: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  authType: z.enum(['password', 'pin']),
  password: z.string().optional(),
  pin: z.string().optional(),
  currency: z.string().default('USD'),
  pointValue: z.coerce.number().positive('Point value must be positive').default(1),
}).refine((data) => {
  if (data.authType === 'password') {
    return data.password && data.password.length >= 6
  }
  if (data.authType === 'pin') {
    return data.pin && /^\d{4}$/.test(data.pin)
  }
  return false
}, {
  message: 'Password must be at least 6 characters, or PIN must be exactly 4 digits',
  path: ['password'],
})

type Schema = z.output<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
  adminName: '',
  authType: 'password',
  password: '',
  pin: '',
  currency: 'USD',
  pointValue: 1,
})

const loading = ref(false)
const error = ref<string | null>(null)

// Currency options
const currencies = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'DKK (kr)', value: 'DKK' },
  { label: 'SEK (kr)', value: 'SEK' },
  { label: 'NOK (kr)', value: 'NOK' },
]

// Auth type options
const authTypes = [
  { label: 'Password', value: 'password' },
  { label: '4-Digit PIN', value: 'pin' },
]

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch('/api/setup/complete', {
      method: 'POST',
      body: event.data,
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    // Redirect to dashboard
    await navigateTo('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Setup failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to FamilyHub
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Let's set up your family chore tracker
        </p>
      </div>
    </template>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-6"
      @submit="onSubmit"
    >
      <!-- Admin Name -->
      <UFormField label="Your Name" name="adminName" required>
        <UInput
          v-model="state.adminName"
          placeholder="Enter your name"
          icon="i-lucide-user"
        />
      </UFormField>

      <!-- Auth Type Selection -->
      <UFormField label="Security Method" name="authType">
        <URadioGroup
          v-model="state.authType"
          :items="authTypes"
        />
      </UFormField>

      <!-- Password (if password auth) -->
      <UFormField
        v-if="state.authType === 'password'"
        label="Password"
        name="password"
        required
      >
        <UInput
          v-model="state.password"
          type="password"
          placeholder="Enter password (min 6 characters)"
          icon="i-lucide-lock"
        />
      </UFormField>

      <!-- PIN (if PIN auth) -->
      <UFormField
        v-if="state.authType === 'pin'"
        label="4-Digit PIN"
        name="pin"
        required
      >
        <UInput
          v-model="state.pin"
          type="password"
          placeholder="Enter 4-digit PIN"
          icon="i-lucide-key"
          maxlength="4"
          inputmode="numeric"
        />
      </UFormField>

      <USeparator label="Settings" />

      <!-- Currency -->
      <UFormField label="Currency" name="currency">
        <USelect
          v-model="state.currency"
          :items="currencies"
        />
      </UFormField>

      <!-- Point Value -->
      <UFormField
        label="Point Value"
        name="pointValue"
        hint="How much is 1 point worth?"
      >
        <UInput
          v-model="state.pointValue"
          type="number"
          min="0.01"
          step="0.01"
          icon="i-lucide-coins"
        />
      </UFormField>

      <!-- Error Message -->
      <UAlert
        v-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        :title="error"
      />

      <!-- Submit Button -->
      <UButton
        type="submit"
        block
        size="lg"
        :loading="loading"
      >
        Complete Setup
      </UButton>
    </UForm>
  </UCard>
</template>
