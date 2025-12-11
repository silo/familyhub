// server/api/settings/index.get.ts
import { db } from '../../db'

export default defineEventHandler(async () => {
  try {
    const settingsRecord = await db.query.settings.findFirst()

    if (!settingsRecord) {
      return {
        error: 'Settings not found',
      }
    }

    return {
      data: settingsRecord,
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return {
      error: 'Failed to fetch settings',
    }
  }
})
