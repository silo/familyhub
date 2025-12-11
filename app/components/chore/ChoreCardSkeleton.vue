<script setup lang="ts">
// Skeleton loading state for ChoreCard
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
    <!-- Header with category badge skeleton -->
    <div class="flex items-start justify-between mb-3">
      <USkeleton class="h-5 w-20 rounded-full" />
      <USkeleton class="h-6 w-12 rounded-lg" />
    </div>
    
    <!-- Title skeleton -->
    <USkeleton class="h-5 w-3/4 mb-2" />
    
    <!-- Description skeleton -->
    <USkeleton class="h-4 w-full mb-1" />
    <USkeleton class="h-4 w-2/3 mb-4" />
    
    <!-- Footer with avatar and button -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <USkeleton class="h-8 w-8 rounded-full" />
        <USkeleton class="h-4 w-16" />
      </div>
      <USkeleton class="h-8 w-16 rounded-lg" />
    </div>
  </div>
</template>
