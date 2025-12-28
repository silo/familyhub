// server/api/settings/index.put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, settings } from '../../db'
import { PRIMARY_COLORS, NEUTRAL_COLORS, RADIUS_VALUES, COLOR_MODES } from '~~/shared/theme'

const updateSchema = z.object({
  currency: z.string().length(3).optional(),
  pointValue: z.coerce.number().positive().optional(),
  qrBaseUrl: z.string().url().optional().nullable().or(z.literal('')),
  // Theme settings
  primaryColor: z.enum(PRIMARY_COLORS).optional(),
  neutralColor: z.enum(NEUTRAL_COLORS).optional(),
  radius: z.enum(RADIUS_VALUES).optional(),
  colorMode: z.enum(COLOR_MODES).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { currency, pointValue, qrBaseUrl, primaryColor, neutralColor, radius, colorMode } = result.data

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
