// server/utils/weather.ts
// Open-Meteo API utility for fetching current weather and forecast (free, no API key required)

interface WeatherData {
  temp: number
  feelsLike: number
  condition: string
  description: string
  icon: string
  humidity: number
  forecast: ForecastDay[]
}

interface ForecastDay {
  date: string
  dayName: string
  tempHigh: number
  tempLow: number
  condition: string
  icon: string
}

interface GeocodingResponse {
  results?: Array<{
    latitude: number
    longitude: number
    name: string
    country: string
  }>
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    weather_code: number
    is_day: number
  }
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
  }
  error?: boolean
  reason?: string
}

// Weather code to condition mapping (WMO codes)
// https://open-meteo.com/en/docs
const weatherCodeMap: Record<number, { condition: string; description: string; iconDay: string; iconNight: string }> = {
  0: { condition: 'Clear', description: 'Clear sky', iconDay: '01d', iconNight: '01n' },
  1: { condition: 'Clear', description: 'Mainly clear', iconDay: '01d', iconNight: '01n' },
  2: { condition: 'Clouds', description: 'Partly cloudy', iconDay: '02d', iconNight: '02n' },
  3: { condition: 'Clouds', description: 'Overcast', iconDay: '04d', iconNight: '04n' },
  45: { condition: 'Fog', description: 'Fog', iconDay: '50d', iconNight: '50n' },
  48: { condition: 'Fog', description: 'Depositing rime fog', iconDay: '50d', iconNight: '50n' },
  51: { condition: 'Drizzle', description: 'Light drizzle', iconDay: '09d', iconNight: '09n' },
  53: { condition: 'Drizzle', description: 'Moderate drizzle', iconDay: '09d', iconNight: '09n' },
  55: { condition: 'Drizzle', description: 'Dense drizzle', iconDay: '09d', iconNight: '09n' },
  56: { condition: 'Drizzle', description: 'Freezing drizzle', iconDay: '09d', iconNight: '09n' },
  57: { condition: 'Drizzle', description: 'Dense freezing drizzle', iconDay: '09d', iconNight: '09n' },
  61: { condition: 'Rain', description: 'Slight rain', iconDay: '10d', iconNight: '10n' },
  63: { condition: 'Rain', description: 'Moderate rain', iconDay: '10d', iconNight: '10n' },
  65: { condition: 'Rain', description: 'Heavy rain', iconDay: '10d', iconNight: '10n' },
  66: { condition: 'Rain', description: 'Freezing rain', iconDay: '10d', iconNight: '10n' },
  67: { condition: 'Rain', description: 'Heavy freezing rain', iconDay: '10d', iconNight: '10n' },
  71: { condition: 'Snow', description: 'Slight snow', iconDay: '13d', iconNight: '13n' },
  73: { condition: 'Snow', description: 'Moderate snow', iconDay: '13d', iconNight: '13n' },
  75: { condition: 'Snow', description: 'Heavy snow', iconDay: '13d', iconNight: '13n' },
  77: { condition: 'Snow', description: 'Snow grains', iconDay: '13d', iconNight: '13n' },
  80: { condition: 'Rain', description: 'Slight rain showers', iconDay: '09d', iconNight: '09n' },
  81: { condition: 'Rain', description: 'Moderate rain showers', iconDay: '09d', iconNight: '09n' },
  82: { condition: 'Rain', description: 'Violent rain showers', iconDay: '09d', iconNight: '09n' },
  85: { condition: 'Snow', description: 'Slight snow showers', iconDay: '13d', iconNight: '13n' },
  86: { condition: 'Snow', description: 'Heavy snow showers', iconDay: '13d', iconNight: '13n' },
  95: { condition: 'Thunderstorm', description: 'Thunderstorm', iconDay: '11d', iconNight: '11n' },
  96: { condition: 'Thunderstorm', description: 'Thunderstorm with hail', iconDay: '11d', iconNight: '11n' },
  99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail', iconDay: '11d', iconNight: '11n' },
}

// Geocode a location name to lat/lon coordinates using Open-Meteo geocoding
async function geocodeLocation(
  location: string
): Promise<{ lat: number; lon: number } | { error: string }> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    )

    if (!response.ok) {
      return { error: `Geocoding API error: ${response.status}` }
    }

    const data = (await response.json()) as GeocodingResponse

    if (!data.results || data.results.length === 0) {
      return { error: 'Weather location not found' }
    }

    return { lat: data.results[0].latitude, lon: data.results[0].longitude }
  } catch (error) {
    console.error('Failed to geocode location:', error)
    return { error: 'Failed to geocode location' }
  }
}

export async function fetchWeather(
  location: string,
  units: 'metric' | 'imperial' = 'metric'
): Promise<{ data: WeatherData } | { error: string }> {
  if (!location) {
    return { error: 'Weather location not configured' }
  }

  try {
    // First, geocode the location to get lat/lon
    const geoResult = await geocodeLocation(location)
    if ('error' in geoResult) {
      return geoResult
    }

    const { lat, lon } = geoResult

    // Build temperature unit parameter
    const temperatureUnit = units === 'imperial' ? 'fahrenheit' : 'celsius'

    // Use Open-Meteo API (free, no API key required)
    // Include daily forecast for next 6 days (today + 5 days)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=${temperatureUnit}&forecast_days=6`
    )

    if (!response.ok) {
      return { error: `Weather API error: ${response.status}` }
    }

    const data = (await response.json()) as OpenMeteoResponse

    if (data.error) {
      return { error: data.reason || 'Weather API error' }
    }

    const current = data.current
    const weatherInfo = weatherCodeMap[current.weather_code] || weatherCodeMap[0]
    const isDay = current.is_day === 1

    // Parse forecast data (skip today, get next 5 days)
    const forecast: ForecastDay[] = []
    if (data.daily) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      // Start from index 1 to skip today
      for (let i = 1; i <= 5 && i < data.daily.time.length; i++) {
        const date = new Date(data.daily.time[i])
        const forecastWeatherInfo = weatherCodeMap[data.daily.weather_code[i]] || weatherCodeMap[0]
        forecast.push({
          date: data.daily.time[i],
          dayName: dayNames[date.getDay()],
          tempHigh: Math.round(data.daily.temperature_2m_max[i]),
          tempLow: Math.round(data.daily.temperature_2m_min[i]),
          condition: forecastWeatherInfo.condition,
          icon: forecastWeatherInfo.iconDay, // Use day icon for forecast
        })
      }
    }

    return {
      data: {
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        condition: weatherInfo.condition,
        description: weatherInfo.description,
        icon: isDay ? weatherInfo.iconDay : weatherInfo.iconNight,
        humidity: current.relative_humidity_2m,
        forecast,
      },
    }
  } catch (error) {
    console.error('Failed to fetch weather:', error)
    return { error: 'Failed to fetch weather data' }
  }
}

// Map weather icon codes to Lucide icon names
// Using only verified Lucide icons: sun, moon, cloud, cloud-sun, cloud-moon, cloud-rain, cloud-snow, cloud-lightning, cloudy
export function getWeatherIconName(iconCode: string): string {
  const iconMap: Record<string, string> = {
    '01d': 'i-lucide-sun', // clear sky day
    '01n': 'i-lucide-moon', // clear sky night
    '02d': 'i-lucide-cloud-sun', // few clouds day
    '02n': 'i-lucide-cloud-moon', // few clouds night
    '03d': 'i-lucide-cloud', // scattered clouds
    '03n': 'i-lucide-cloud',
    '04d': 'i-lucide-cloudy', // broken/overcast clouds
    '04n': 'i-lucide-cloudy',
    '09d': 'i-lucide-cloud-rain', // shower rain
    '09n': 'i-lucide-cloud-rain',
    '10d': 'i-lucide-cloud-rain', // rain day
    '10n': 'i-lucide-cloud-rain', // rain night
    '11d': 'i-lucide-cloud-lightning', // thunderstorm
    '11n': 'i-lucide-cloud-lightning',
    '13d': 'i-lucide-cloud-snow', // snow
    '13n': 'i-lucide-cloud-snow',
    '50d': 'i-lucide-cloud', // mist/fog (no fog icon, use cloud)
    '50n': 'i-lucide-cloud',
  }
  return iconMap[iconCode] || 'i-lucide-cloud'
}
