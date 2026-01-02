// server/api/points/leaderboard.get.ts
// Get family members with their points totals for leaderboard
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { db, familyMembers, pointTransactions } from "../../db";
import { withAvatarUrls } from "../../utils/avatar";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const period = (query.period as string) || "all";

  // Calculate date filter based on period
  let dateFilter = null;
  const now = new Date();

  if (period === "month") {
    // Start of current month
    dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "week") {
    // Start of current week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    dateFilter = new Date(now.getFullYear(), now.getMonth(), diff);
    dateFilter.setHours(0, 0, 0, 0);
  } else if (period === "today") {
    // Start of today
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Build the query with optional date filter (only count earned points, not redeemed)
  const pointsSubquery = dateFilter
    ? sql`COALESCE(SUM(CASE WHEN ${pointTransactions.type} = 'earned' AND ${pointTransactions.createdAt} >= ${dateFilter.toISOString()} THEN ${pointTransactions.amount} ELSE 0 END), 0)::int`
    : sql`COALESCE(SUM(CASE WHEN ${pointTransactions.type} = 'earned' THEN ${pointTransactions.amount} ELSE 0 END), 0)::int`;

  // Get all family members with their point totals
  const members = await db
    .select({
      id: familyMembers.id,
      name: familyMembers.name,
      avatarType: familyMembers.avatarType,
      avatarValue: familyMembers.avatarValue,
      color: familyMembers.color,
      isAdmin: familyMembers.isAdmin,
      totalPoints: pointsSubquery,
    })
    .from(familyMembers)
    .leftJoin(
      pointTransactions,
      eq(familyMembers.id, pointTransactions.familyMemberId)
    )
    .groupBy(familyMembers.id)
    .orderBy(desc(pointsSubquery));

  // Add avatar URLs using centralized utility
  return { data: withAvatarUrls(members) };
});
