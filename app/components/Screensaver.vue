<script setup lang="ts">
// Screensaver component with fading background images, time/date, and weather display

const {
  isActive,
  settings,
  currentImage,
  attribution,
  weather,
  isDimmed,
  initialize,
  cleanup,
  checkTimeout,
  fetchImage,
  fetchWeather,
  deactivate,
} = useScreensaver()

// Interval refs
let timeoutInterval: ReturnType<typeof setInterval> | null = null
let imageInterval: ReturnType<typeof setInterval> | null = null
let weatherInterval: ReturnType<typeof setInterval> | null = null
let clockInterval: ReturnType<typeof setInterval> | null = null

// Display state
const currentTime = ref('')
const currentDate = ref('')
const showImage = ref(false)
const transitionClass = ref('screensaver-fade')

// Format time based on settings
function updateClock() {
  const timezone = settings.value?.screensaverTimezone || 'UTC'
  const clockFormat = settings.value?.screensaverClockFormat || 'auto'

  try {
    const now = new Date()
    const hour12 = clockFormat === '12h' ? true : clockFormat === '24h' ? false : undefined

    currentTime.value = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    }).format(now)

    currentDate.value = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now)
  } catch {
    currentTime.value = new Date().toLocaleTimeString()
    currentDate.value = new Date().toLocaleDateString()
  }
}

// Get transition class from settings
function getTransitionClass(): string {
  const transition = settings.value?.screensaverTransition || 'fade'
  return `screensaver-${transition}`
}

// Clear all content intervals
function clearContentIntervals() {
  if (imageInterval) {
    clearInterval(imageInterval)
    imageInterval = null
  }
  if (weatherInterval) {
    clearInterval(weatherInterval)
    weatherInterval = null
  }
}

// Start content updates (images and weather)
async function startContentUpdates() {
  clearContentIntervals()
  transitionClass.value = getTransitionClass()

  // Fetch initial content
  await Promise.all([fetchImage(), fetchWeather()])
  showImage.value = true

  // Image rotation
  const interval = (settings.value?.screensaverInterval || 30) * 1000
  imageInterval = setInterval(async () => {
    showImage.value = false
    await new Promise((r) => setTimeout(r, 1000)) // Wait for fade out
    await fetchImage()
    showImage.value = true
  }, interval)

  // Weather updates (every 10 minutes)
  weatherInterval = setInterval(fetchWeather, 600_000)
}

// Handle activation changes
watch(isActive, async (active, prevActive) => {
  if (active === prevActive) return

  if (active) {
    await startContentUpdates()
  } else {
    clearContentIntervals()
    showImage.value = false
  }
})

// Initialize on mount
onMounted(async () => {
  await initialize()
  updateClock()

  // Core intervals (always running)
  timeoutInterval = setInterval(checkTimeout, 1000)
  clockInterval = setInterval(updateClock, 1000)
})

// Cleanup on unmount
onUnmounted(() => {
  cleanup()
  clearContentIntervals()
  if (timeoutInterval) clearInterval(timeoutInterval)
  if (clockInterval) clearInterval(clockInterval)
})

// Computed
const tempUnit = computed(() => weather.value?.units === 'imperial' ? '°F' : '°C')

const dimBrightness = computed(() => {
  if (!isDimmed.value) return 1
  const opacity = settings.value?.screensaverDimOpacity || 70
  return (100 - opacity) / 100
})
</script>

<template>
  <Teleport to="body">
    <Transition name="screensaver">
      <div
        v-if="isActive"
        class="fixed inset-0 z-[100] cursor-none bg-black"
        @click="deactivate"
        @touchstart="deactivate"
        @keydown="deactivate"
      >
        <!-- Main content with dim effect -->
        <div
          class="absolute inset-0 transition-[filter] duration-1000"
          :style="{ filter: `brightness(${dimBrightness})` }"
        >
          <!-- Background image -->
          <div class="absolute inset-0 overflow-hidden">
            <Transition :name="transitionClass" mode="out-in">
              <div
                v-if="showImage && currentImage"
                :key="currentImage"
                class="absolute inset-0 bg-cover bg-center bg-no-repeat"
                :style="{ backgroundImage: `url(${currentImage})` }"
              />
            </Transition>

            <!-- Fallback gradient -->
            <div
              v-if="!currentImage"
              class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            />
          </div>

          <!-- Text readability overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          <!-- Content -->
          <div class="relative flex h-full flex-col justify-between p-8 text-white">
            <!-- Weather (top right) -->
            <div class="flex justify-end">
              <div v-if="weather" class="rounded-2xl bg-black/30 px-4 py-3 backdrop-blur-sm">
                <!-- Current -->
                <div class="flex items-center gap-3">
                  <UIcon :name="weather.iconName" class="size-10" />
                  <div class="text-right">
                    <div class="text-3xl font-light">{{ weather.temp }}{{ tempUnit }}</div>
                    <div class="text-sm text-white/70">{{ weather.condition }}</div>
                  </div>
                </div>

                <!-- Forecast -->
                <div v-if="weather.forecast?.length" class="mt-3 border-t border-white/20 pt-3">
                  <div class="flex justify-between gap-4">
                    <div
                      v-for="day in weather.forecast"
                      :key="day.date"
                      class="flex flex-col items-center"
                    >
                      <span class="text-xs font-medium text-white/70">{{ day.dayName }}</span>
                      <UIcon :name="day.iconName" class="my-1 size-5" />
                      <div class="flex gap-1 text-xs">
                        <span class="text-white">{{ day.tempHigh }}°</span>
                        <span class="text-white/50">{{ day.tempLow }}°</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Time and Date (bottom left) -->
            <div class="space-y-2">
              <div class="text-8xl font-thin tracking-tight drop-shadow-lg md:text-9xl">
                {{ currentTime }}
              </div>
              <div class="text-2xl font-light text-white/80 drop-shadow-md md:text-3xl">
                {{ currentDate }}
              </div>
              <div v-if="attribution" class="mt-4 text-xs text-white/40">
                {{ attribution }}
              </div>
            </div>
          </div>
        </div>

        <!-- Dismiss hint -->
        <div class="absolute inset-x-0 bottom-4 text-center">
          <span class="animate-pulse text-sm text-white/30">Tap anywhere to dismiss</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Screensaver enter/leave */
.screensaver-enter-active,
.screensaver-leave-active {
  transition: opacity 0.5s ease;
}
.screensaver-enter-from,
.screensaver-leave-to {
  opacity: 0;
}

/* Image transitions */
.screensaver-fade-enter-active,
.screensaver-fade-leave-active {
  transition: opacity 1s ease;
}
.screensaver-fade-enter-from,
.screensaver-fade-leave-to {
  opacity: 0;
}

.screensaver-slide-enter-active,
.screensaver-slide-leave-active {
  transition: all 1s ease;
}
.screensaver-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.screensaver-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.screensaver-zoom-enter-active,
.screensaver-zoom-leave-active {
  transition: all 1s ease;
}
.screensaver-zoom-enter-from {
  opacity: 0;
  transform: scale(1.1);
}
.screensaver-zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
