<script setup lang="ts">
// Bottom navigation component - shared across main pages

const route = useRoute();

const navItems = [
  { to: "/dashboard", icon: "i-heroicons-home", label: "Home" },
  { to: "/points", icon: "i-heroicons-star", label: "Points" },
  { to: "/activity", icon: "i-heroicons-clock", label: "Activity" },
];

function isActive(path: string) {
  return route.path === path;
}
</script>

<template>
  <nav
    class="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 h-16"
  >
    <div class="max-w-7xl mx-auto px-4 h-full">
      <div class="flex items-center justify-around h-full">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
          :class="
            isActive(item.to)
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          "
        >
          <UIcon :name="item.icon" class="w-6 h-6" />
          <span class="text-xs font-medium">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
