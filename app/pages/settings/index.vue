<script setup lang="ts">
definePageMeta({
  layout: 'settings',
})

// Redirect to family members page
await navigateTo('/settings/family-members', { replace: true })
</script>

<template>
  <div>Redirecting...</div>
</template>
