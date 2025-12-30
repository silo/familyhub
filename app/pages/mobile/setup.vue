<script setup lang="ts">
// Mobile server setup page - First screen on fresh app install
definePageMeta({
  layout: false,
})

const { setServerUrl, isConfigured } = useMobileConfig()
const router = useRouter()

const serverUrl = ref('')
const loading = ref(false)
const error = ref('')

// Example URLs for user reference
const exampleUrls = [
  'http://192.168.1.100:3000',
  'http://familyhub.local:3000',
  'https://familyhub.example.com',
]

async function handleSubmit() {
  if (!serverUrl.value.trim()) {
    error.value = 'Please enter the server URL'
    return
  }

  loading.value = true
  error.value = ''

  const result = await setServerUrl(serverUrl.value.trim())

  loading.value = false

  if (result.success) {
    // Navigate to login
    router.replace('/mobile/login')
  } else {
    error.value = result.error || 'Failed to connect to server'
  }
}

// If already configured, redirect to login
onMounted(async () => {
  if (isConfigured.value) {
    router.replace('/mobile/login')
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="flex flex-1 flex-col items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <!-- Logo/Title -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500 text-white">
            <UIcon name="i-lucide-home" class="h-10 w-10" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            FamilyHub
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect to your FamilyHub server
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <UFormField label="Server URL" name="serverUrl" :error="error">
            <UInput
              v-model="serverUrl"
              type="url"
              placeholder="http://192.168.1.100:3000"
              size="lg"
              autofocus
              :disabled="loading"
            />
          </UFormField>

          <!-- Example URLs -->
          <div class="space-y-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Examples:
            </p>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="url in exampleUrls"
                :key="url"
                color="neutral"
                variant="subtle"
                class="cursor-pointer text-xs"
                @click="serverUrl = url"
              >
                {{ url }}
              </UBadge>
            </div>
          </div>

          <!-- Help text -->
          <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p class="text-xs text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Enter the URL where your FamilyHub web app is running. 
              This is usually your home server's IP address followed by the port number.
            </p>
          </div>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
          >
            Connect
          </UButton>
        </form>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 text-center">
      <p class="text-xs text-gray-400">
        FamilyHub Mobile App
      </p>
    </div>
  </div>
</template>
