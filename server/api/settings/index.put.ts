// server/api/settings/index.put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, settings } from '../../db'

const updateSchema = z.object({
  currency: z.string().length(3),
  pointValue: z.coerce.number().positive(),
  qrBaseUrl: z.string().url().optional().nullable().or(z.literal('')),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { currency, pointValue, qrBaseUrl } = result.data

  try {
    const existingSettings = await db.query.settings.findFirst()

    if (!existingSettings) {
      return { error: 'Settings not found' }
    }

    const [updated] = await db
      .update(settings)
      .set({
        currency,
        pointValue: pointValue.toString(),
        qrBaseUrl: qrBaseUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, existingSettings.id))
      .returning()

    return { data: updated }
  } catch (error) {
    console.error('Failed to update settings:', error)
    return { error: 'Failed to update settings' }
  }
})
