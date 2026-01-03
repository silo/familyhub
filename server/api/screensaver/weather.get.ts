// server/api/screensaver/weather.get.ts
// Proxy endpoint for weather data using Open-Meteo (free, no API key)
import { db } from '../../db'
import { fetchWeather, getWeatherIconName } from '../../utils/weather'

export default defineEventHandler(async () => {
  try {
    // Get settings to retrieve location
    const settings = await db.query.settings.findFirst()

    if (!settings?.weatherLocation) {
      return {
        error: 'Weather location not configured',
      }
    }

    const units = (settings.weatherUnits as 'metric' | 'imperial') || 'metric'
    const result = await fetchWeather(settings.weatherLocation, units)

    if ('error' in result) {
      return { error: result.error }
    }

    // Map forecast icons to icon names
    const forecast = result.data.forecast.map((day) => ({
      ...day,
      iconName: getWeatherIconName(day.icon),
    }))

    return {
      data: {
        temp: result.data.temp,
        feelsLike: result.data.feelsLike,
        condition: result.data.condition,
        description: result.data.description,
        humidity: result.data.humidity,
        iconName: getWeatherIconName(result.data.icon),
        units,
        forecast,
      },
    }
  } catch (error) {
    console.error('Failed to fetch weather:', error)
    return {
      error: 'Failed to fetch weather data',
    }
  }
})
