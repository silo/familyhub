<script setup lang="ts">
// Dashboard page - main view
definePageMeta({
  layout: 'default',
})

const appConfig = useAppConfig()
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ appConfig.ui?.appName || 'FamilyHub' }}
        </h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Welcome to FamilyHub!</h2>
        </template>

        <p class="text-gray-600 dark:text-gray-400">
          Your family chore tracker is ready. Start by adding family members and chores in the settings.
        </p>

        <template #footer>
          <div class="flex gap-2">
            <UButton to="/settings" variant="outline">
              Go to Settings
            </UButton>
          </div>
        </template>
      </UCard>
    </main>
  </div>
</template>
