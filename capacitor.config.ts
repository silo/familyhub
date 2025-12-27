import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.familyhub.app',
  appName: 'FamilyHub',
  webDir: '.output/public',
  server: {
    // For development, point to your local server
    // url: 'http://192.168.1.x:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    CapacitorNfc: {
      // NFC configuration
    },
    BarcodeScanner: {
      // MLKit Barcode Scanner configuration
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
