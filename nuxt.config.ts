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

  // For Capacitor: generate static files to dist folder
  nitro: {
    output: {
      publicDir: '.output/public',
    },
    prerender: {
      // Generate index.html for SPA fallback
      routes: ['/', '/mobile', '/mobile/setup', '/mobile/login', '/mobile/scan', '/mobile/chores', '/mobile/profile'],
    },
    // Enable CORS for mobile app development
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    },
  },

  future: {
    compatibilityVersion: 4,
  },
})
