// server/api/setup/complete.post.ts
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db, admin, settings, familyMembers, PASTEL_COLORS } from '../../db'

const setupSchema = z.object({
  adminName: z.string().min(1).max(100),
  authType: z.enum(['password', 'pin']),
  password: z.string().optional(),
  pin: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  pointValue: z.coerce.number().positive().default(1),
}).refine((data) => {
  // Validate password if password auth
  if (data.authType === 'password') {
    return data.password && data.password.length >= 6
  }
  // Validate PIN if pin auth
  if (data.authType === 'pin') {
    return data.pin && /^\d{4}$/.test(data.pin)
  }
  return false
}, {
  message: 'Password must be at least 6 characters, or PIN must be exactly 4 digits',
  path: ['password'],
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

  const { adminName, authType, password, pin, currency, pointValue } = result.data

  try {
    // Check if already set up
    const existingAdmin = await db.query.admin.findFirst()
    if (existingAdmin) {
      return {
        error: 'Setup has already been completed',
      }
    }

    // Hash the password or PIN
    const SALT_ROUNDS = 12
    let passwordHash: string | null = null
    let pinHash: string | null = null

    if (authType === 'password' && password) {
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    } else if (authType === 'pin' && pin) {
      pinHash = await bcrypt.hash(pin, SALT_ROUNDS)
    }

    // Create admin record
    await db.insert(admin).values({
      authType,
      passwordHash,
      pinHash,
    })

    // Create settings record
    await db.insert(settings).values({
      currency,
      pointValue: pointValue.toString(),
    })

    // Create admin family member with random color
    const randomColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]
    const avatarSeed = `${adminName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    await db.insert(familyMembers).values({
      name: adminName,
      avatarType: 'dicebear',
      avatarValue: avatarSeed,
      color: randomColor,
      isAdmin: true,
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
