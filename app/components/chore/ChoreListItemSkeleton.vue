<script setup lang="ts">
// Skeleton loading state for ChoreListItem
</script>

<template>
  <div class="flex items-center gap-4 p-4 animate-pulse">
    <!-- Category icon skeleton -->
    <USkeleton class="h-10 w-10 rounded-lg flex-shrink-0" />
    
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <USkeleton class="h-5 w-48" />
        <USkeleton class="h-5 w-12 rounded-full" />
      </div>
      <USkeleton class="h-4 w-32" />
    </div>
    
    <!-- Points and button -->
    <div class="flex items-center gap-3 flex-shrink-0">
      <USkeleton class="h-6 w-16" />
      <USkeleton class="h-8 w-16 rounded-lg" />
    </div>
  </div>
</template>
