/// <reference types="@capacitor/cli" />
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.familyhub.app',
  appName: 'FamilyHub',
  webDir: '.output/public',
  server: {
    // Use HTTP to allow connections to local dev servers
    androidScheme: 'http',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f9fafb',
      showSpinner: false,
    },
    // Hide system bars (status bar + navigation bar) for immersive experience
    SystemBars: {
      hidden: true,
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
