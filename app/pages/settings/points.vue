<script setup lang="ts">
import type { SettingsResponse } from '~/types'

definePageMeta({
  layout: 'settings',
})

// Fetch settings
const { data: settingsData, refresh } = await useFetch<SettingsResponse>('/api/settings')

// Form state
const form = reactive({
  currency: 'USD',
  pointValue: 1,
  qrBaseUrl: '',
})

// Sync form with fetched data
watch(
  settingsData,
  data => {
    if (data?.data) {
      form.currency = data.data.currency
      form.pointValue = Number(data.data.pointValue)
      form.qrBaseUrl = data.data.qrBaseUrl || ''
    }
  },
  { immediate: true }
)

const loading = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

// Currency options
const currencies = [
  { label: 'USD ($) - US Dollar', value: 'USD' },
  { label: 'EUR (€) - Euro', value: 'EUR' },
  { label: 'GBP (£) - British Pound', value: 'GBP' },
  { label: 'DKK (kr) - Danish Krone', value: 'DKK' },
  { label: 'SEK (kr) - Swedish Krona', value: 'SEK' },
  { label: 'NOK (kr) - Norwegian Krone', value: 'NOK' },
  { label: 'CAD ($) - Canadian Dollar', value: 'CAD' },
  { label: 'AUD ($) - Australian Dollar', value: 'AUD' },
  { label: 'CHF (Fr) - Swiss Franc', value: 'CHF' },
  { label: 'JPY (¥) - Japanese Yen', value: 'JPY' },
]

// Currency symbol helper
const currencySymbol = computed(() => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    DKK: 'kr',
    SEK: 'kr',
    NOK: 'kr',
    CAD: '$',
    AUD: '$',
    CHF: 'Fr',
    JPY: '¥',
  }
  return symbols[form.currency] || '$'
})

async function handleSave() {
  loading.value = true
  success.value = false
  error.value = null

  try {
    const response = await $fetch('/api/settings', {
      method: 'PUT',
      body: {
        currency: form.currency,
        pointValue: form.pointValue,
        qrBaseUrl: form.qrBaseUrl || null,
      },
    })

    if ('error' in response) {
      error.value = response.error
      return
    }

    success.value = true
    await refresh()

    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch {
    error.value = 'Failed to save settings'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Points Configuration</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Configure how points are valued and displayed
      </p>
    </div>

    <UCard class="max-w-lg">
      <form class="space-y-6" @submit.prevent="handleSave">
        <!-- Currency -->
        <UFormField label="Currency" name="currency" hint="Currency used for point redemption">
          <USelect v-model="form.currency" :items="currencies" />
        </UFormField>

        <!-- Point Value -->
        <UFormField
          label="Point Value"
          name="pointValue"
          hint="How much is 1 point worth in your currency?"
        >
          <UInput v-model="form.pointValue" type="number" min="0.01" step="0.01">
            <template #leading>
              <span class="text-gray-500">{{ currencySymbol }}</span>
            </template>
          </UInput>
        </UFormField>

        <!-- Preview -->
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Example: <strong>100 points</strong> =
            <strong>{{ currencySymbol }}{{ (100 * form.pointValue).toFixed(2) }}</strong>
          </p>
        </div>

        <USeparator label="QR Code Settings" />

        <!-- QR Base URL -->
        <UFormField
          label="QR Code Base URL"
          name="qrBaseUrl"
          hint="Server URL for generated QR codes (e.g., http://192.168.1.100:3001). Leave empty to use the current browser URL."
        >
          <UInput
            v-model="form.qrBaseUrl"
            type="url"
            placeholder="http://192.168.1.100:3001"
            icon="i-lucide-qr-code"
          />
        </UFormField>

        <UAlert
          v-if="!form.qrBaseUrl"
          color="warning"
          icon="i-lucide-alert-triangle"
          title="QR codes will use the current browser URL"
          description="If you access settings from localhost, QR codes won't work from mobile devices. Set a network-accessible URL for mobile scanning."
        />

        <!-- Messages -->
        <UAlert
          v-if="success"
          color="success"
          icon="i-lucide-check-circle"
          title="Settings saved successfully"
        />

        <UAlert v-if="error" color="error" icon="i-lucide-alert-circle" :title="error" />

        <!-- Submit -->
        <UButton type="submit" :loading="loading"> Save Changes </UButton>
      </form>
    </UCard>
  </div>
</template>
