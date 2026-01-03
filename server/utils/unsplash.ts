// server/utils/unsplash.ts
// Unsplash API utility for fetching random images

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
  }
  description: string | null
  alt_description: string | null
}

export async function fetchUnsplashImage(
  apiKey: string,
  category: string = 'nature'
): Promise<{ url: string; attribution: string } | { error: string }> {
  if (!apiKey) {
    return { error: 'Unsplash API key not configured' }
  }

  try {
    // Use Unsplash random photo endpoint with query for category
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(category)}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Unsplash API error:', response.status, errorBody)
      
      if (response.status === 401) {
        return { error: 'Invalid Unsplash API key. Make sure you are using the "Access Key" (not Secret Key) from unsplash.com/oauth/applications' }
      }
      if (response.status === 403) {
        return { error: 'Unsplash API rate limit exceeded' }
      }
      return { error: `Unsplash API error: ${response.status}` }
    }

    const photo = (await response.json()) as UnsplashPhoto

    return {
      url: photo.urls.regular, // 1080px width, good for most screens
      attribution: `Photo by ${photo.user.name} on Unsplash`,
    }
  } catch (error) {
    console.error('Failed to fetch Unsplash image:', error)
    return { error: 'Failed to fetch image from Unsplash' }
  }
}
