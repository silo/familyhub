<script setup lang="ts">
// Skeleton for activity timeline item
</script>

<template>
  <div class="flex gap-4 animate-pulse">
    <!-- Icon -->
    <div class="flex-shrink-0">
      <USkeleton class="w-10 h-10 rounded-full" />
    </div>
    
    <!-- Content -->
    <div class="flex-1 min-w-0 pb-6">
      <div class="flex items-center gap-2 mb-1">
        <USkeleton class="w-8 h-8 rounded-full" />
        <USkeleton class="h-4 w-24" />
      </div>
      <USkeleton class="h-4 w-48 mb-1" />
      <USkeleton class="h-3 w-20" />
    </div>
  </div>
</template>
