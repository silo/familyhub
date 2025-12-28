// server/api/setup/complete.post.ts
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '../../db'
import { settings, familyMembers, PASTEL_COLORS } from '../../db/schema'

const setupSchema = z.object({
  adminName: z.string().min(1).max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  currency: z.string().length(3).default('USD'),
  pointValue: z.coerce.number().positive().default(1),
})

export default defineEventHandler(async (event) => {
  // Parse and validate input
  const body = await readBody(event)
  const result = setupSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { adminName, password, currency, pointValue } = result.data

  try {
    // Check if already set up (by checking if any family member with isAdmin exists)
    const existingAdmin = await db.query.familyMembers.findFirst({
      where: (fm, { eq }) => eq(fm.isAdmin, true),
    })
    if (existingAdmin) {
      return {
        error: 'Setup has already been completed',
      }
    }

    // Hash the password
    const SALT_ROUNDS = 12
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Create settings record
    await db.insert(settings).values({
      currency,
      pointValue: pointValue.toString(),
    })

    // Create admin family member with random color and password
    const randomColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)] || '#FFB3BA'
    const avatarSeed = `${adminName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    await db.insert(familyMembers).values({
      name: adminName,
      avatarType: 'dicebear',
      avatarValue: avatarSeed,
      color: randomColor,
      isAdmin: true,
      passwordHash,
    })

    return {
      data: {
        success: true,
        message: 'Setup completed successfully',
      },
    }
  } catch (error) {
    console.error('Setup failed:', error)
    return {
      error: 'Setup failed. Please try again.',
    }
  }
})
