import type { UserProfileType } from "@/lib/api/types";

/** Fallback avatar path when a user has no avatar set. */
export const DEFAULT_AVATAR = "/defaultAvatar.png";

/** Fallback display name when a user has no name. */
export const DEFAULT_NAME = "NJUPTer";

/** Max accepted avatar upload size (5 MB). Shared with mock handlers. */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** Bio length over which the homepage truncates with an expand toggle. */
export const BIO_TRUNCATE_LENGTH = 120;

/** Initial character for avatar fallbacks. */
export function avatarFallbackChar(profile: Pick<UserProfileType, "nickname">): string {
  return profile.nickname?.charAt(0) ?? "U";
}
