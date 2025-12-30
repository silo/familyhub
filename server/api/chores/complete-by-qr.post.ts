// server/api/chores/complete-by-qr.post.ts
import { z } from "zod";
import { requireAuth } from "../../utils/auth";
import {
  completeChore,
  findChoreByQrToken,
} from "../../utils/chore-completion";

const qrCompleteSchema = z.object({
  token: z.string().min(1, "QR token is required"),
});

export default defineEventHandler(async (event) => {
  // Require authenticated user
  const user = await requireAuth(event);

  const body = await readBody(event);
  const result = qrCompleteSchema.safeParse(body);

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || "Invalid input",
    };
  }

  const { token } = result.data;

  try {
    // Find chore by QR token
    const chore = await findChoreByQrToken(token);

    if (!chore) {
      return { error: "Invalid QR code or chore not found" };
    }

    // Complete the chore as the authenticated user
    const completion = await completeChore(chore.id, user.id);

    if (!completion.success) {
      return {
        error: completion.error,
        ...(completion.cooldownEndsAt && {
          cooldownEndsAt: completion.cooldownEndsAt,
        }),
      };
    }

    return {
      data: {
        completion: completion.completion,
        pointsEarned: completion.pointsEarned,
        choreName: completion.choreName,
        completedByName: completion.completedByName,
      },
    };
  } catch (error) {
    console.error("QR completion failed:", error);
    return { error: "Failed to complete chore" };
  }
});
