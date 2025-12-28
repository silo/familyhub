<script setup lang="ts">
import {
  PRIMARY_COLORS,
  NEUTRAL_COLORS,
  RADIUS_VALUES,
  COLOR_MODES,
  DEFAULT_THEME,
  type PrimaryColor,
  type NeutralColor,
  type ColorMode,
} from '~/types'
import { applyTheme, normalizeRadius, getColorClass, capitalize } from '~/composables/useTheme'

definePageMeta({
  layout: 'settings',
})

// Current theme state
const currentPrimary = ref<PrimaryColor>(DEFAULT_THEME.primaryColor)
const currentNeutral = ref<NeutralColor>(DEFAULT_THEME.neutralColor)
const currentRadius = ref<string>(DEFAULT_THEME.radius)
const currentColorMode = ref<ColorMode>(DEFAULT_THEME.colorMode)

// UI state
const error = ref<string | null>(null)
const isResetting = ref(false)

// Fetch current settings
const { data: settingsData } = await useFetch('/api/settings')

// Initialize with fetched data
watch(
  settingsData,
  (data) => {
    if (data && 'data' in data && data.data) {
      currentPrimary.value = (data.data.primaryColor as PrimaryColor) || DEFAULT_THEME.primaryColor
      currentNeutral.value = (data.data.neutralColor as NeutralColor) || DEFAULT_THEME.neutralColor
      currentRadius.value = normalizeRadius(data.data.radius)
      currentColorMode.value = (data.data.colorMode as ColorMode) || DEFAULT_THEME.colorMode
    }
  },
  { immediate: true }
)

// Apply current theme state
function applyCurrentTheme() {
  applyTheme({
    primaryColor: currentPrimary.value,
    neutralColor: currentNeutral.value,
    radius: currentRadius.value,
    colorMode: currentColorMode.value,
  })
}

// Save setting to server
async function saveSetting(field: string, value: string): Promise<boolean> {
  try {
    const response = await $fetch('/api/settings', {
      method: 'PUT',
      body: { [field]: value },
    })
    if ('error' in response) {
      error.value = response.error as string
      return false
    }
    return true
  } catch (err) {
    console.error(`Failed to save ${field}:`, err)
    error.value = 'Failed to save theme setting'
    return false
  }
}

// Selection handlers - apply immediately, save in background
function selectPrimaryColor(color: PrimaryColor) {
  error.value = null
  currentPrimary.value = color
  applyCurrentTheme()
  saveSetting('primaryColor', color)
}

function selectNeutralColor(color: NeutralColor) {
  error.value = null
  currentNeutral.value = color
  applyCurrentTheme()
  saveSetting('neutralColor', color)
}

function selectRadius(radius: string) {
  error.value = null
  currentRadius.value = radius
  applyCurrentTheme()
  saveSetting('radius', radius)
}

function selectColorMode(mode: ColorMode) {
  error.value = null
  currentColorMode.value = mode
  applyCurrentTheme()
  saveSetting('colorMode', mode)
}

// Reset to defaults
async function resetToDefaults() {
  isResetting.value = true
  error.value = null

  try {
    const response = await $fetch('/api/settings', {
      method: 'PUT',
      body: DEFAULT_THEME,
    })

    if ('error' in response) {
      error.value = response.error as string
      return
    }

    // Update local state
    currentPrimary.value = DEFAULT_THEME.primaryColor
    currentNeutral.value = DEFAULT_THEME.neutralColor
    currentRadius.value = DEFAULT_THEME.radius
    currentColorMode.value = DEFAULT_THEME.colorMode
    applyCurrentTheme()
  } catch (err) {
    console.error('Failed to reset theme:', err)
    error.value = 'Failed to reset theme'
  } finally {
    isResetting.value = false
  }
}

// Color mode icons
const colorModeIcons: Record<ColorMode, string> = {
  light: 'i-lucide-sun',
  dark: 'i-lucide-moon',
  system: 'i-lucide-monitor',
}
</script>

<template>
  <div class="p-6">
    <div class="mx-auto max-w-3xl space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-highlighted">
            Theme
          </h1>
          <p class="mt-1 text-sm text-muted">
            Customize the appearance of your FamilyHub
          </p>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-rotate-ccw"
          :loading="isResetting"
          @click="resetToDefaults"
        >
          Reset to Defaults
        </UButton>
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        :title="error"
        :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
        @close="error = null"
      />

      <!-- Primary Color -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="font-medium text-highlighted">Primary</span>
            <UTooltip text="The main accent color used throughout the app">
              <UIcon name="i-lucide-help-circle" class="size-4 text-dimmed" />
            </UTooltip>
          </div>
        </template>

        <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <button
            v-for="color in PRIMARY_COLORS"
            :key="color"
            class="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:border-accented"
            :class="[
              currentPrimary === color
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-default',
            ]"
            @click="selectPrimaryColor(color)"
          >
            <span
              class="size-3 shrink-0 rounded-full"
              :class="getColorClass(color)"
            />
            <span class="truncate text-sm text-muted">
              {{ capitalize(color) }}
            </span>
          </button>
        </div>
      </UCard>

      <!-- Neutral Color -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="font-medium text-highlighted">Neutral</span>
            <UTooltip text="The gray scale used for backgrounds, borders, and text">
              <UIcon name="i-lucide-help-circle" class="size-4 text-dimmed" />
            </UTooltip>
          </div>
        </template>

        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button
            v-for="color in NEUTRAL_COLORS"
            :key="color"
            class="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:border-accented"
            :class="[
              currentNeutral === color
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-default',
            ]"
            @click="selectNeutralColor(color)"
          >
            <span
              class="size-3 shrink-0 rounded-full"
              :class="getColorClass(color)"
            />
            <span class="truncate text-sm text-muted">
              {{ capitalize(color) }}
            </span>
          </button>
        </div>
      </UCard>

      <!-- Radius -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="font-medium text-highlighted">Radius</span>
            <UTooltip text="The border radius applied to UI components">
              <UIcon name="i-lucide-help-circle" class="size-4 text-dimmed" />
            </UTooltip>
          </div>
        </template>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="radius in RADIUS_VALUES"
            :key="radius"
            class="rounded-lg border px-4 py-2 text-sm transition-all hover:border-accented"
            :class="[
              currentRadius === radius
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'border-default text-muted',
            ]"
            @click="selectRadius(radius)"
          >
            {{ radius }}
          </button>
        </div>
      </UCard>

      <!-- Color Mode -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="font-medium text-highlighted">Color Mode</span>
            <UTooltip text="Choose between light, dark, or system preference">
              <UIcon name="i-lucide-help-circle" class="size-4 text-dimmed" />
            </UTooltip>
          </div>
        </template>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="mode in COLOR_MODES"
            :key="mode"
            class="flex items-center gap-2 rounded-lg border px-4 py-2 transition-all hover:border-accented"
            :class="[
              currentColorMode === mode
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'border-default text-muted',
            ]"
            @click="selectColorMode(mode)"
          >
            <UIcon :name="colorModeIcons[mode]" class="size-5" />
            <span class="text-sm">{{ capitalize(mode) }}</span>
          </button>
        </div>
      </UCard>

      <!-- Preview -->
      <UCard>
        <template #header>
          <span class="font-medium text-highlighted">Preview</span>
        </template>

        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UButton>Primary Button</UButton>
            <UButton color="neutral">Neutral Button</UButton>
            <UButton variant="outline">Outline Button</UButton>
            <UButton variant="soft">Soft Button</UButton>
          </div>

          <div class="flex flex-wrap gap-2">
            <UBadge>Badge</UBadge>
            <UBadge color="neutral">Neutral</UBadge>
            <UBadge variant="soft">Soft</UBadge>
          </div>

          <UInput placeholder="Sample input field" />
        </div>
      </UCard>
    </div>
  </div>
</template>
