<script setup lang="ts">
// Skeleton for leaderboard member row
</script>

<template>
  <div class="flex items-center gap-4 p-3 animate-pulse">
    <!-- Rank -->
    <USkeleton class="w-10 h-6" />
    
    <!-- Avatar -->
    <USkeleton class="w-12 h-12 rounded-full" />
    
    <!-- Name -->
    <div class="flex-1">
      <USkeleton class="h-5 w-24 mb-1" />
      <USkeleton class="h-3 w-12" />
    </div>
    
    <!-- Points -->
    <div class="text-right">
      <USkeleton class="h-6 w-12 mb-1" />
      <USkeleton class="h-3 w-10" />
    </div>
    
    <!-- Chevron -->
    <USkeleton class="w-5 h-5" />
  </div>
</template>
