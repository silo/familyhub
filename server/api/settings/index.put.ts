// server/api/settings/index.put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, settings } from '../../db'
import {
  PRIMARY_COLORS,
  NEUTRAL_COLORS,
  RADIUS_VALUES,
  COLOR_MODES,
  SCREENSAVER_CLOCK_FORMATS,
  SCREENSAVER_CATEGORIES,
  SCREENSAVER_TRANSITIONS,
  WEATHER_UNITS,
  IMAGE_SOURCES,
} from '~~/shared/theme'

const updateSchema = z.object({
  currency: z.string().length(3).optional(),
  pointValue: z.coerce.number().positive().optional(),
  qrBaseUrl: z.string().url().optional().nullable().or(z.literal('')),
  // Theme settings
  primaryColor: z.enum(PRIMARY_COLORS).optional(),
  neutralColor: z.enum(NEUTRAL_COLORS).optional(),
  radius: z.enum(RADIUS_VALUES).optional(),
  colorMode: z.enum(COLOR_MODES).optional(),
  // Screensaver settings
  screensaverEnabled: z.boolean().optional(),
  screensaverTimeout: z.coerce.number().int().min(30).max(3600).optional(), // 30s to 1 hour
  screensaverInterval: z.coerce.number().int().min(5).max(300).optional(), // 5s to 5 minutes
  screensaverTimezone: z.string().min(1).max(50).optional(),
  screensaverClockFormat: z.enum(SCREENSAVER_CLOCK_FORMATS).optional(),
  screensaverCategory: z.enum(SCREENSAVER_CATEGORIES).optional(),
  screensaverTransition: z.enum(SCREENSAVER_TRANSITIONS).optional(),
  screensaverImageSource: z.enum(IMAGE_SOURCES).optional(),
  screensaverDimEnabled: z.boolean().optional(),
  screensaverDimStart: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(), // HH:MM or HH:MM:SS
  screensaverDimEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  screensaverDimOpacity: z.coerce.number().int().min(0).max(100).optional(),
  // API keys
  unsplashApiKey: z.string().max(100).optional().nullable().or(z.literal('')),
  weatherApiKey: z.string().max(100).optional().nullable().or(z.literal('')),
  weatherLocation: z.string().max(100).optional().nullable().or(z.literal('')),
  weatherUnits: z.enum(WEATHER_UNITS).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const {
    currency,
    pointValue,
    qrBaseUrl,
    primaryColor,
    neutralColor,
    radius,
    colorMode,
    screensaverEnabled,
    screensaverTimeout,
    screensaverInterval,
    screensaverTimezone,
    screensaverClockFormat,
    screensaverCategory,
    screensaverTransition,
    screensaverImageSource,
    screensaverDimEnabled,
    screensaverDimStart,
    screensaverDimEnd,
    screensaverDimOpacity,
    unsplashApiKey,
    weatherApiKey,
    weatherLocation,
    weatherUnits,
  } = result.data

  try {
    const existingSettings = await db.query.settings.findFirst()

    if (!existingSettings) {
      return { error: 'Settings not found' }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (currency !== undefined) updateData.currency = currency
    if (pointValue !== undefined) updateData.pointValue = pointValue.toString()
    if (qrBaseUrl !== undefined) updateData.qrBaseUrl = qrBaseUrl || null
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (neutralColor !== undefined) updateData.neutralColor = neutralColor
    if (radius !== undefined) updateData.radius = radius
    if (colorMode !== undefined) updateData.colorMode = colorMode
    // Screensaver settings
    if (screensaverEnabled !== undefined) updateData.screensaverEnabled = screensaverEnabled
    if (screensaverTimeout !== undefined) updateData.screensaverTimeout = screensaverTimeout
    if (screensaverInterval !== undefined) updateData.screensaverInterval = screensaverInterval
    if (screensaverTimezone !== undefined) updateData.screensaverTimezone = screensaverTimezone
    if (screensaverClockFormat !== undefined) updateData.screensaverClockFormat = screensaverClockFormat
    if (screensaverCategory !== undefined) updateData.screensaverCategory = screensaverCategory
    if (screensaverTransition !== undefined) updateData.screensaverTransition = screensaverTransition
    if (screensaverImageSource !== undefined) updateData.screensaverImageSource = screensaverImageSource
    if (screensaverDimEnabled !== undefined) updateData.screensaverDimEnabled = screensaverDimEnabled
    if (screensaverDimStart !== undefined) updateData.screensaverDimStart = screensaverDimStart
    if (screensaverDimEnd !== undefined) updateData.screensaverDimEnd = screensaverDimEnd
    if (screensaverDimOpacity !== undefined) updateData.screensaverDimOpacity = screensaverDimOpacity
    // API keys
    if (unsplashApiKey !== undefined) updateData.unsplashApiKey = unsplashApiKey || null
    if (weatherApiKey !== undefined) updateData.weatherApiKey = weatherApiKey || null
    if (weatherLocation !== undefined) updateData.weatherLocation = weatherLocation || null
    if (weatherUnits !== undefined) updateData.weatherUnits = weatherUnits

    const [updated] = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.id, existingSettings.id))
      .returning()

    return { data: updated }
  } catch (error) {
    console.error('Failed to update settings:', error)
    return { error: 'Failed to update settings' }
  }
})
