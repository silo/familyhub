// server/api/chores/index.get.ts
import { db, chores } from '../../db'
import { isNull, desc } from 'drizzle-orm'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const includeDeleted = query.includeDeleted === 'true'

  try {
    const allChores = await db.query.chores.findMany({
      where: includeDeleted ? undefined : isNull(chores.deletedAt),
      with: {
        category: true,
        assignees: {
          with: {
            familyMember: true,
          },
        },
      },
      orderBy: [desc(chores.createdAt)],
    })

    return {
      data: allChores,
    }
  } catch (error) {
    console.error('Failed to fetch chores:', error)
    return {
      error: 'Failed to fetch chores',
    }
  }
})
