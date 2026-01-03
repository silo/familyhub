// server/api/screensaver/image.get.ts
// Proxy endpoint for screensaver images - supports Unsplash and Picsum
import { db } from '../../db'
import { fetchUnsplashImage } from '../../utils/unsplash'
import { fetchPicsumImage } from '../../utils/picsum'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = (query.category as string) || 'nature'

  try {
    // Get settings to retrieve image source and API key
    const settings = await db.query.settings.findFirst()
    const imageSource = settings?.screensaverImageSource || 'picsum'

    // Use Picsum (no API key required)
    if (imageSource === 'picsum') {
      const result = await fetchPicsumImage()

      if ('error' in result) {
        return {
          error: result.error,
          fallback: true,
        }
      }

      return {
        data: {
          url: result.url,
          attribution: result.attribution,
        },
      }
    }

    // Use Unsplash (requires API key)
    if (!settings?.unsplashApiKey) {
      return {
        error: 'Unsplash API key not configured',
        fallback: true,
      }
    }

    const result = await fetchUnsplashImage(settings.unsplashApiKey, category)

    if ('error' in result) {
      return {
        error: result.error,
        fallback: true,
      }
    }

    return {
      data: {
        url: result.url,
        attribution: result.attribution,
      },
    }
  } catch (error) {
    console.error('Failed to fetch screensaver image:', error)
    return {
      error: 'Failed to fetch image',
      fallback: true,
    }
  }
})
