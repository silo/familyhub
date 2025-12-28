// app/composables/useScanner.ts
// Composable for QR and NFC scanning using Capacitor plugins

import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import type { ScanResult, CompletionResult, CompletionApiResponse, CompletionApiError } from '~/types'

export function useScanner() {
  const isScanning = ref(false)
  const lastScanResult = ref<ScanResult | null>(null)
  const error = ref<string | null>(null)

  const { getAuthHeaders } = useMobileAuth()
  const { apiUrl } = useMobileConfig()

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

  // Start QR code scanning using @capacitor/barcode-scanner
  async function startQrScan(): Promise<ScanResult | null> {
    if (!isNative.value) {
      error.value = 'QR scanning is only available on mobile devices'
      return null
    }

    isScanning.value = true
    error.value = null

    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHintALLOption } = await import('@capacitor/barcode-scanner')

      // scanBarcode is the correct API method
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
        scanInstructions: 'Point camera at QR code',
        scanButton: false,
        scanText: 'Scanning...',
        cameraDirection: 1, // BACK
        scanOrientation: 1, // PORTRAIT
        android: {
          scanningLibrary: 'zxing',
        },
      })

      if (result.ScanResult) {
        await vibrate('light')

        // Debug: Log raw scan result
        console.log('[Scanner] Raw scan result:', result.ScanResult)

        // Parse the QR code value
        // Format 1: Full URL - https://example.com/api/chores/complete-by-qr?token=<qr_token>
        // Format 2: Deep link - familyhub://chore/<qr_token>
        // Format 3: Raw token
        let qrToken = result.ScanResult

        // Try to extract token from URL query parameter
        try {
          const url = new URL(result.ScanResult)
          console.log('[Scanner] Parsed as URL, searchParams:', url.searchParams.toString())
          const tokenParam = url.searchParams.get('token')
          if (tokenParam) {
            qrToken = tokenParam
            console.log('[Scanner] Extracted token from URL:', qrToken)
          }
        } catch {
          // Not a URL, check for deep link format
          if (result.ScanResult.startsWith('familyhub://chore/')) {
            qrToken = result.ScanResult.replace('familyhub://chore/', '')
            console.log('[Scanner] Extracted token from deep link:', qrToken)
          } else {
            console.log('[Scanner] Using raw value as token:', qrToken)
          }
        }

        console.log('[Scanner] Final token to send:', qrToken)
        lastScanResult.value = { type: 'qr', value: qrToken }
        isScanning.value = false
        return lastScanResult.value
      }

      isScanning.value = false
      return null
    } catch (e: any) {
      console.error('QR scan failed:', e)
      error.value = e.message || 'QR scanning failed'
      isScanning.value = false
      return null
    }
  }

  // Stop QR scanning - not needed for this plugin as it uses native UI
  async function stopQrScan() {
    isScanning.value = false
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
        let listenerHandle: { remove: () => Promise<void> } | null = null

        CapacitorNfc.addListener('nfcEvent', async (event) => {
          if (event.tag?.id) {
            await vibrate('light')

            // Convert tag ID to hex string
            const tagId = Array.from(event.tag.id)
              .map((b: number) => b.toString(16).padStart(2, '0'))
              .join('')

            lastScanResult.value = { type: 'nfc', value: tagId }

            if (listenerHandle) {
              await listenerHandle.remove()
            }
            await CapacitorNfc.stopScanning()
            isScanning.value = false

            resolve(lastScanResult.value)
          }
        }).then((handle) => {
          listenerHandle = handle
        })

        // Timeout after 30 seconds
        setTimeout(async () => {
          if (listenerHandle) {
            await listenerHandle.remove()
          }
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
    console.log('[Scanner] completeByQr called with token:', token)
    try {
      const url = apiUrl('/api/chores/complete-by-qr')
      const headers = getAuthHeaders()
      console.log('[Scanner] API URL:', url)
      console.log('[Scanner] Headers:', JSON.stringify(headers))
      
      const response = await $fetch<CompletionApiResponse | CompletionApiError>(url, {
        method: 'POST',
        headers,
        body: { token },
      })

      console.log('[Scanner] API Response:', JSON.stringify(response))

      if ('error' in response) {
        console.log('[Scanner] API returned error:', response.error)
        await vibrate('error')
        return {
          success: false,
          error: response.error,
          cooldownEndsAt: response.cooldownEndsAt,
        }
      }

      await vibrate('success')
      return {
        success: true,
        choreName: response.data.choreName,
        pointsEarned: response.data.pointsEarned,
      }
    } catch (e: any) {
      console.error('[Scanner] QR completion failed:', e)
      console.error('[Scanner] Error details:', e.message, e.data)
      await vibrate('error')
      return { success: false, error: 'Failed to complete chore' }
    }
  }

  // Complete chore by NFC tag ID
  async function completeByNfc(tagId: string): Promise<CompletionResult> {
    try {
      const response = await $fetch<CompletionApiResponse | CompletionApiError>(apiUrl('/api/chores/complete-by-nfc'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: { tagId },
      })

      if ('error' in response) {
        await vibrate('error')
        return {
          success: false,
          error: response.error,
          cooldownEndsAt: response.cooldownEndsAt,
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
