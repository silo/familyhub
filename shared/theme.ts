// shared/theme.ts
// Shared theme constants used by both server and client

export const PRIMARY_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'black',
] as const

export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

export const RADIUS_VALUES = ['0', '0.125', '0.25', '0.375', '0.5'] as const

export const COLOR_MODES = ['light', 'dark', 'system'] as const

export const DEFAULT_THEME = {
  primaryColor: 'indigo',
  neutralColor: 'slate',
  radius: '0.25',
  colorMode: 'system',
} as const

export type PrimaryColor = (typeof PRIMARY_COLORS)[number]
export type NeutralColor = (typeof NEUTRAL_COLORS)[number]
export type RadiusValue = (typeof RADIUS_VALUES)[number]
export type ColorMode = (typeof COLOR_MODES)[number]

// ============================================================================
// Screensaver Constants
// ============================================================================
export const SCREENSAVER_CLOCK_FORMATS = ['12h', '24h', 'auto'] as const
export const SCREENSAVER_CATEGORIES = ['nature', 'architecture', 'abstract', 'minimal', 'wallpapers', 'space', 'animals'] as const
export const SCREENSAVER_TRANSITIONS = ['fade', 'slide', 'zoom'] as const
export const WEATHER_UNITS = ['metric', 'imperial'] as const
export const IMAGE_SOURCES = ['unsplash', 'picsum'] as const

export const DEFAULT_SCREENSAVER = {
  enabled: false,
  timeout: 300, // 5 minutes
  interval: 30, // 30 seconds
  timezone: 'UTC',
  clockFormat: 'auto',
  category: 'nature',
  transition: 'fade',
  dimEnabled: false,
  dimStart: '23:00',
  dimEnd: '06:00',
  dimOpacity: 70,
  weatherUnits: 'metric',
  imageSource: 'picsum', // default to picsum (no API key needed)
} as const

export type ScreensaverClockFormat = (typeof SCREENSAVER_CLOCK_FORMATS)[number]
export type ScreensaverCategory = (typeof SCREENSAVER_CATEGORIES)[number]
export type ScreensaverTransition = (typeof SCREENSAVER_TRANSITIONS)[number]
export type WeatherUnits = (typeof WEATHER_UNITS)[number]
export type ImageSource = (typeof IMAGE_SOURCES)[number]

// Common timezone list for UI selection
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
] as const
