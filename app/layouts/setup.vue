<script setup lang="ts">
// Setup layout - minimal, centered layout for first-run setup
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <slot />
    </div>
  </div>
</template>
