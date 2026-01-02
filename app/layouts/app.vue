<script setup lang="ts">
// App layout - main tablet/desktop layout with bottom navigation
</script>

<template>
  <div class="h-dvh flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <!-- Header slot area -->
    <div class="shrink-0 z-40">
      <slot name="header" />
    </div>

    <!-- Main content area (scrollable) -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>

    <!-- Bottom Navigation (fixed at bottom) -->
    <UiBottomNavigation />
  </div>
</template>
