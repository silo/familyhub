<script setup lang="ts">
definePageMeta({
  layout: 'settings',
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Backup & Restore
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Export your data or restore from a backup
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Backup -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-download" class="size-5 text-primary-500" />
            <h3 class="text-lg font-semibold">Backup Data</h3>
          </div>
        </template>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          Download a complete backup of all your family data including members, chores,
          points, and activity history.
        </p>

        <template #footer>
          <UButton icon="i-lucide-download" disabled>
            Download Backup
          </UButton>
          <p class="mt-2 text-xs text-gray-500">
            Coming soon
          </p>
        </template>
      </UCard>

      <!-- Restore -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-upload" class="size-5 text-warning-500" />
            <h3 class="text-lg font-semibold">Restore Data</h3>
          </div>
        </template>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          Restore your data from a previous backup. This will overwrite all current data.
        </p>

        <template #footer>
          <UButton icon="i-lucide-upload" color="warning" disabled>
            Restore from Backup
          </UButton>
          <p class="mt-2 text-xs text-gray-500">
            Coming soon
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>
