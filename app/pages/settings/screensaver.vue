<script setup lang="ts">
import {
  SCREENSAVER_CLOCK_FORMATS,
  SCREENSAVER_CATEGORIES,
  SCREENSAVER_TRANSITIONS,
  WEATHER_UNITS,
  IMAGE_SOURCES,
  type Settings,
} from '~/types'

definePageMeta({
  layout: 'settings',
})

// Form state
const loading = ref(false)
const saving = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

// Form data
const form = ref<{
  screensaverEnabled: boolean
  screensaverTimeout: number
  screensaverTimezone: string
  screensaverClockFormat: 'auto' | '12h' | '24h'
  screensaverImageSource: 'unsplash' | 'picsum'
  unsplashApiKey: string
  screensaverCategory: string
  screensaverInterval: number
  screensaverTransition: 'fade' | 'slide' | 'zoom'
  weatherLocation: string
  weatherUnits: 'metric' | 'imperial'
  screensaverDimEnabled: boolean
  screensaverDimStart: string
  screensaverDimEnd: string
  screensaverDimOpacity: number
}>({
  // General
  screensaverEnabled: false,
  screensaverTimeout: 300,
  screensaverTimezone: 'UTC',
  screensaverClockFormat: 'auto',
  // Images
  screensaverImageSource: 'picsum',
  unsplashApiKey: '',
  screensaverCategory: 'nature',
  screensaverInterval: 30,
  screensaverTransition: 'fade',
  // Weather
  weatherLocation: '',
  weatherUnits: 'metric',
  // Night Dimming
  screensaverDimEnabled: false,
  screensaverDimStart: '23:00',
  screensaverDimEnd: '06:00',
  screensaverDimOpacity: 70,
})

// Options for selects
const clockFormatOptions = SCREENSAVER_CLOCK_FORMATS.map((format) => ({
  value: format as string,
  label: format === 'auto' ? 'Auto (Browser locale)' : format === '12h' ? '12-hour (AM/PM)' : '24-hour',
}))

const categoryOptions = SCREENSAVER_CATEGORIES.map((cat) => ({
  value: cat as string,
  label: cat.charAt(0).toUpperCase() + cat.slice(1),
}))

const transitionOptions = SCREENSAVER_TRANSITIONS.map((t) => ({
  value: t as string,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}))

const weatherUnitOptions = WEATHER_UNITS.map((unit) => ({
  value: unit as string,
  label: unit === 'metric' ? 'Celsius (°C)' : 'Fahrenheit (°F)',
}))

const imageSourceOptions = IMAGE_SOURCES.map((source) => ({
  value: source as string,
  label: source === 'unsplash' ? 'Unsplash (requires API key)' : 'Picsum (free, no API key)',
}))

// Get all available timezones from the browser
const timezoneOptions = Intl.supportedValuesOf('timeZone').map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, ' '),
}))

// Timeout options (in seconds)
const timeoutOptions = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 180, label: '3 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
]

// Image interval options (in seconds)
const intervalOptions = [
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
]

// Fetch current settings
async function fetchSettings() {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<{ data?: Settings; error?: string }>('/api/settings')

    if (response.error) {
      error.value = response.error
      return
    }

    if (response.data) {
      const data = response.data
      form.value.screensaverEnabled = data.screensaverEnabled ?? false
      form.value.screensaverTimeout = data.screensaverTimeout ?? 300
      form.value.screensaverTimezone = data.screensaverTimezone ?? 'UTC'
      form.value.screensaverClockFormat = (data.screensaverClockFormat as 'auto' | '12h' | '24h') || 'auto'
      form.value.screensaverImageSource = (data.screensaverImageSource as 'unsplash' | 'picsum') || 'picsum'
      form.value.unsplashApiKey = data.unsplashApiKey ?? ''
      form.value.screensaverCategory = data.screensaverCategory ?? 'nature'
      form.value.screensaverInterval = data.screensaverInterval ?? 30
      form.value.screensaverTransition = (data.screensaverTransition as 'fade' | 'slide' | 'zoom') || 'fade'
      form.value.weatherLocation = data.weatherLocation ?? ''
      form.value.weatherUnits = (data.weatherUnits as 'metric' | 'imperial') || 'metric'
      form.value.screensaverDimEnabled = data.screensaverDimEnabled ?? false
      form.value.screensaverDimStart = data.screensaverDimStart?.slice(0, 5) ?? '23:00'
      form.value.screensaverDimEnd = data.screensaverDimEnd?.slice(0, 5) ?? '06:00'
      form.value.screensaverDimOpacity = data.screensaverDimOpacity ?? 70
    }
  } catch (err) {
    error.value = 'Failed to load settings'
    console.error('Failed to fetch settings:', err)
  } finally {
    loading.value = false
  }
}

// Save settings
async function handleSave() {
  saving.value = true
  success.value = false
  error.value = null

  try {
    const response = await $fetch<{ data?: Settings; error?: string }>('/api/settings', {
      method: 'PUT',
      body: {
        screensaverEnabled: form.value.screensaverEnabled,
        screensaverTimeout: form.value.screensaverTimeout,
        screensaverTimezone: form.value.screensaverTimezone,
        screensaverClockFormat: form.value.screensaverClockFormat,
        screensaverImageSource: form.value.screensaverImageSource,
        unsplashApiKey: form.value.unsplashApiKey || null,
        screensaverCategory: form.value.screensaverCategory,
        screensaverInterval: form.value.screensaverInterval,
        screensaverTransition: form.value.screensaverTransition,
        weatherLocation: form.value.weatherLocation || null,
        weatherUnits: form.value.weatherUnits,
        screensaverDimEnabled: form.value.screensaverDimEnabled,
        screensaverDimStart: form.value.screensaverDimStart,
        screensaverDimEnd: form.value.screensaverDimEnd,
        screensaverDimOpacity: form.value.screensaverDimOpacity,
      },
    })

    if (response.error) {
      error.value = response.error
      return
    }

    success.value = true

    // Refresh screensaver settings
    const { fetchSettings: refreshScreensaver } = useScreensaver()
    await refreshScreensaver()

    // Auto-hide success message
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = 'Failed to save settings'
    console.error('Failed to save settings:', err)
  } finally {
    saving.value = false
  }
}

// Load settings on mount
onMounted(fetchSettings)
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Screensaver</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Configure the screensaver with background images, clock display, and weather.
      </p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <form v-else class="space-y-8" @submit.prevent="handleSave">
      <!-- Success/Error Messages -->
      <UAlert v-if="success" color="success" icon="i-lucide-check-circle" title="Settings saved!" />
      <UAlert v-if="error" color="error" icon="i-lucide-alert-circle" :title="error" />

      <!-- General Settings -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-settings" class="size-5 text-gray-500" />
            <span class="font-medium text-highlighted">General</span>
          </div>
        </template>

        <div class="space-y-6">
          <UFormField name="screensaverEnabled">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Enable Screensaver</p>
                <p class="text-sm text-gray-500">Activate screensaver after period of inactivity</p>
              </div>
              <USwitch v-model="form.screensaverEnabled" />
            </div>
          </UFormField>

          <UFormField label="Inactivity Timeout" name="screensaverTimeout" hint="How long before screensaver activates">
            <USelect
              v-model="form.screensaverTimeout"
              :items="timeoutOptions"
              :disabled="!form.screensaverEnabled"
              :ui="{ content: 'min-w-fit' }"
            />
          </UFormField>

          <UFormField label="Timezone" name="screensaverTimezone" hint="Timezone for clock display">
            <USelect
              v-model="form.screensaverTimezone"
              :items="timezoneOptions"
              :disabled="!form.screensaverEnabled"
              :ui="{ content: 'min-w-fit' }"
            />
          </UFormField>

          <UFormField label="Clock Format" name="screensaverClockFormat">
            <USelect
              v-model="form.screensaverClockFormat"
              :items="clockFormatOptions"
              :disabled="!form.screensaverEnabled"
              :ui="{ content: 'min-w-fit' }"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Image Settings -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-image" class="size-5 text-gray-500" />
            <span class="font-medium text-highlighted">Background Images</span>
          </div>
        </template>

        <div class="space-y-6">
          <UFormField label="Image Source" name="screensaverImageSource" hint="Choose where to get background images">
            <USelect
              v-model="form.screensaverImageSource"
              :items="imageSourceOptions"
              :disabled="!form.screensaverEnabled"
              :ui="{ content: 'min-w-fit' }"
            />
          </UFormField>

          <UAlert
            v-if="form.screensaverImageSource === 'picsum' && form.screensaverEnabled"
            color="info"
            icon="i-lucide-info"
            title="Picsum - Free random images"
            description="Lorem Picsum provides free random images. No API key required, but no category filtering available."
          />

          <!-- Unsplash-specific settings -->
          <template v-if="form.screensaverImageSource === 'unsplash'">
            <UFormField label="Unsplash API Key" name="unsplashApiKey" hint="Get a free key at unsplash.com/developers">
              <UInput
                v-model="form.unsplashApiKey"
                type="password"
                placeholder="Enter your Unsplash API key"
                :disabled="!form.screensaverEnabled"
              />
            </UFormField>

            <UAlert
              v-if="!form.unsplashApiKey && form.screensaverEnabled"
              color="warning"
              icon="i-lucide-alert-triangle"
              title="API key required"
              description="Unsplash requires an API key. Get one free at unsplash.com/developers"
            />

            <UFormField label="Image Category" name="screensaverCategory">
              <USelect
                v-model="form.screensaverCategory"
                :items="categoryOptions"
                :disabled="!form.screensaverEnabled || !form.unsplashApiKey"
                :ui="{ content: 'min-w-fit' }"
              />
            </UFormField>
          </template>

          <UFormField label="Image Change Interval" name="screensaverInterval" hint="How often to change background image">
            <USelect
              v-model="form.screensaverInterval"
              :items="intervalOptions"
              :disabled="!form.screensaverEnabled"
              :ui="{ content: 'min-w-fit' }"
            />
          </UFormField>

          <UFormField label="Transition Effect" name="screensaverTransition">
            <USelect
              v-model="form.screensaverTransition"
              :items="transitionOptions"
              :disabled="!form.screensaverEnabled"
              :ui="{ content: 'min-w-fit' }"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Weather Settings -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-cloud-sun" class="size-5 text-gray-500" />
            <span class="font-medium text-highlighted">Weather Display</span>
          </div>
        </template>

        <div class="space-y-6">
          <UAlert
            color="info"
            icon="i-lucide-info"
            title="Powered by Open-Meteo"
            description="Weather data is provided by Open-Meteo, a free and open-source weather API. No API key required!"
          />

          <UFormField label="Location" name="weatherLocation" hint="City name (e.g., 'New York' or 'London')">
            <UInput
              v-model="form.weatherLocation"
              placeholder="Enter city name"
              :disabled="!form.screensaverEnabled"
            />
          </UFormField>

          <UFormField label="Temperature Units" name="weatherUnits">
            <USelect
              v-model="form.weatherUnits"
              :items="weatherUnitOptions"
              :disabled="!form.screensaverEnabled || !form.weatherLocation"
              :ui="{ content: 'min-w-fit' }"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Night Dimming Settings -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-moon" class="size-5 text-gray-500" />
            <span class="font-medium text-highlighted">Night Dimming</span>
          </div>
        </template>

        <div class="space-y-6">
          <UFormField name="screensaverDimEnabled">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Enable Night Dimming</p>
                <p class="text-sm text-gray-500">Dim the screen during scheduled hours</p>
              </div>
              <USwitch v-model="form.screensaverDimEnabled" :disabled="!form.screensaverEnabled" />
            </div>
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Dim Start Time" name="screensaverDimStart">
              <UInput
                v-model="form.screensaverDimStart"
                type="time"
                :disabled="!form.screensaverEnabled || !form.screensaverDimEnabled"
              />
            </UFormField>

            <UFormField label="Dim End Time" name="screensaverDimEnd">
              <UInput
                v-model="form.screensaverDimEnd"
                type="time"
                :disabled="!form.screensaverEnabled || !form.screensaverDimEnabled"
              />
            </UFormField>
          </div>

          <UFormField label="Dim Opacity" name="screensaverDimOpacity" :hint="`${form.screensaverDimOpacity}% dimming`">
            <USlider
              v-model="form.screensaverDimOpacity"
              :min="0"
              :max="100"
              :step="5"
              :disabled="!form.screensaverEnabled || !form.screensaverDimEnabled"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Actions -->
      <div class="flex items-center gap-4">
        <UButton type="submit" :loading="saving">
          Save Settings
        </UButton>
      </div>
    </form>
  </div>
</template>
