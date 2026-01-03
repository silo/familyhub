// server/utils/picsum.ts
// Lorem Picsum API utility for fetching random images (free, no API key required)

export async function fetchPicsumImage(): Promise<{ url: string; attribution: string } | { error: string }> {
  try {
    // Picsum returns a random image with specified dimensions
    // Using 1920x1080 for landscape orientation
    // Adding random query param to prevent caching
    const randomSeed = Math.random().toString(36).substring(7)
    const imageUrl = `https://picsum.photos/1920/1080?random=${randomSeed}`

    // Picsum redirects to the actual image URL, we can use the redirect URL directly
    // The browser will follow the redirect automatically
    return {
      url: imageUrl,
      attribution: 'Photo from Lorem Picsum',
    }
  } catch (error) {
    console.error('Failed to fetch Picsum image:', error)
    return { error: 'Failed to fetch image from Picsum' }
  }
}
