// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  // Disable SSR for Capacitor mobile app compatibility
  ssr: false,

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    public: {
      // API base URL for mobile app (override in production)
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
    },
  },

  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
    },
  },

  future: {
    compatibilityVersion: 4,
  },
})
