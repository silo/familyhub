// server/utils/avatar.ts
// Centralized avatar URL generation

const DICEBEAR_BASE_URL = "https://api.dicebear.com/9.x/personas/svg";

/**
 * Generate avatar URL based on avatar type and value
 */
export function getAvatarUrl(avatarType: string, avatarValue: string): string {
  if (avatarType === "custom") {
    return avatarValue;
  }
  return `${DICEBEAR_BASE_URL}?seed=${encodeURIComponent(avatarValue)}`;
}

/**
 * Add avatar URL to a family member object
 */
export function withAvatarUrl<
  T extends { avatarType: string; avatarValue: string }
>(member: T): T & { avatarUrl: string } {
  return {
    ...member,
    avatarUrl: getAvatarUrl(member.avatarType, member.avatarValue),
  };
}

/**
 * Add avatar URLs to an array of family members
 */
export function withAvatarUrls<
  T extends { avatarType: string; avatarValue: string }
>(members: T[]): (T & { avatarUrl: string })[] {
  return members.map(withAvatarUrl);
}
