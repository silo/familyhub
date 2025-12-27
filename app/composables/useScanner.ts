// app/composables/useScanner.ts
// Composable for QR and NFC scanning using Capacitor plugins

import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface ScanResult {
  type: 'qr' | 'nfc'
  value: string
}

interface CompletionResult {
  success: boolean
  choreName?: string
  pointsEarned?: number
  error?: string
  cooldownEndsAt?: string
}

export function useScanner() {
  const isScanning = ref(false)
  const lastScanResult = ref<ScanResult | null>(null)
  const error = ref<string | null>(null)

  const { getAuthHeaders } = useMobileAuth()

  // Check if running on native platform
  const isNative = computed(() => Capacitor.isNativePlatform())

  // Haptic feedback
  async function vibrate(style: 'success' | 'error' | 'light' = 'light') {
    if (!isNative.value) return

    try {
      switch (style) {
        case 'success':
          await Haptics.impact({ style: ImpactStyle.Medium })
          break
        case 'error':
          await Haptics.impact({ style: ImpactStyle.Heavy })
          break
        default:
          await Haptics.impact({ style: ImpactStyle.Light })
      }
    } catch (e) {
      console.warn('Haptics not available:', e)
    }
  }

  // Start QR code scanning
  async function startQrScan(): Promise<ScanResult | null> {
    if (!isNative.value) {
      error.value = 'QR scanning is only available on mobile devices'
      return null
    }

    isScanning.value = true
    error.value = null

    try {
      const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')

      // Check permissions
      const { camera } = await BarcodeScanner.checkPermissions()
      if (camera !== 'granted') {
        const { camera: newPermission } = await BarcodeScanner.requestPermissions()
        if (newPermission !== 'granted') {
          error.value = 'Camera permission is required for QR scanning'
          return null
        }
      }

      // Start scanning
      const { barcodes } = await BarcodeScanner.scan()

      if (barcodes.length > 0) {
        const barcode = barcodes[0]
        await vibrate('light')

        // Parse the QR code value
        // Expected format: familyhub://chore/<qr_token>
        const value = barcode.rawValue || ''
        let qrToken = value

        if (value.startsWith('familyhub://chore/')) {
          qrToken = value.replace('familyhub://chore/', '')
        }

        lastScanResult.value = { type: 'qr', value: qrToken }
        return lastScanResult.value
      }

      return null
    } catch (e) {
      console.error('QR scan failed:', e)
      error.value = 'QR scanning failed'
      return null
    } finally {
      isScanning.value = false
    }
  }

  // Stop QR scanning
  async function stopQrScan() {
    if (!isNative.value) return

    try {
      const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
      await BarcodeScanner.stopScan()
    } catch (e) {
      console.warn('Failed to stop scan:', e)
    } finally {
      isScanning.value = false
    }
  }

  // Start NFC scanning
  async function startNfcScan(): Promise<ScanResult | null> {
    if (!isNative.value) {
      error.value = 'NFC scanning is only available on mobile devices'
      return null
    }

    isScanning.value = true
    error.value = null

    try {
      const { CapacitorNfc } = await import('@capgo/capacitor-nfc')

      // Start scanning
      await CapacitorNfc.startScanning({
        invalidateAfterFirstRead: true,
        alertMessage: 'Hold your device near the NFC tag',
      })

      return new Promise((resolve) => {
        const listener = CapacitorNfc.addListener('nfcEvent', async (event) => {
          if (event.tag?.id) {
            await vibrate('light')
            
            // Convert tag ID to hex string
            const tagId = Array.from(event.tag.id)
              .map((b: number) => b.toString(16).padStart(2, '0'))
              .join('')

            lastScanResult.value = { type: 'nfc', value: tagId }
            
            await listener.remove()
            await CapacitorNfc.stopScanning()
            isScanning.value = false
            
            resolve(lastScanResult.value)
          }
        })

        // Timeout after 30 seconds
        setTimeout(async () => {
          await listener.remove()
          await CapacitorNfc.stopScanning()
          isScanning.value = false
          resolve(null)
        }, 30000)
      })
    } catch (e) {
      console.error('NFC scan failed:', e)
      error.value = 'NFC scanning failed'
      isScanning.value = false
      return null
    }
  }

  // Stop NFC scanning
  async function stopNfcScan() {
    if (!isNative.value) return

    try {
      const { CapacitorNfc } = await import('@capgo/capacitor-nfc')
      await CapacitorNfc.stopScanning()
    } catch (e) {
      console.warn('Failed to stop NFC scan:', e)
    } finally {
      isScanning.value = false
    }
  }

  // Complete chore by QR token
  async function completeByQr(token: string): Promise<CompletionResult> {
    try {
      const response = await $fetch('/api/chores/complete-by-qr', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: { token },
      })

      if ('error' in response) {
        await vibrate('error')
        return {
          success: false,
          error: response.error,
          cooldownEndsAt: (response as any).cooldownEndsAt,
        }
      }

      await vibrate('success')
      return {
        success: true,
        choreName: response.data.choreName,
        pointsEarned: response.data.pointsEarned,
      }
    } catch (e) {
      console.error('QR completion failed:', e)
      await vibrate('error')
      return { success: false, error: 'Failed to complete chore' }
    }
  }

  // Complete chore by NFC tag ID
  async function completeByNfc(tagId: string): Promise<CompletionResult> {
    try {
      const response = await $fetch('/api/chores/complete-by-nfc', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: { tagId },
      })

      if ('error' in response) {
        await vibrate('error')
        return {
          success: false,
          error: response.error,
          cooldownEndsAt: (response as any).cooldownEndsAt,
        }
      }

      await vibrate('success')
      return {
        success: true,
        choreName: response.data.choreName,
        pointsEarned: response.data.pointsEarned,
      }
    } catch (e) {
      console.error('NFC completion failed:', e)
      await vibrate('error')
      return { success: false, error: 'Failed to complete chore' }
    }
  }

  // Handle scan result and complete chore
  async function handleScanAndComplete(result: ScanResult): Promise<CompletionResult> {
    if (result.type === 'qr') {
      return completeByQr(result.value)
    } else {
      return completeByNfc(result.value)
    }
  }

  return {
    isScanning: readonly(isScanning),
    lastScanResult: readonly(lastScanResult),
    error: readonly(error),
    isNative,
    startQrScan,
    stopQrScan,
    startNfcScan,
    stopNfcScan,
    completeByQr,
    completeByNfc,
    handleScanAndComplete,
    vibrate,
  }
}
