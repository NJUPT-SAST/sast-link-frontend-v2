import type { UserProfileType } from "@/lib/api/types";

/** Fallback avatar path when a user has no avatar set. */
export const DEFAULT_AVATAR = "/defaultAvatar.png";

/** Source image pick limit (5 MB): a memory guard for the cropper. The cropped
 * 200×200 result is what gets uploaded, so this is not an upload bound. */
export const MAX_AVATAR_SOURCE_BYTES = 5 * 1024 * 1024;

/** Upload cap (1 MB), matching the backend PUT /user/avatar contract. The
 * cropper's 200×200 output stays far under this; the bound guards a non-cropped
 * upload path. */
export const MAX_AVATAR_UPLOAD_BYTES = 1 * 1024 * 1024;

/** Initial character for avatar fallbacks. */
export function avatarFallbackChar(profile: Pick<UserProfileType, "nickname">): string {
  return profile.nickname?.charAt(0) || "U";
}

export const ROLE_LABELS: Record<string, string > = {
  freshman: "Freshman",
  member: "Member",
  lecturer: "Lecturer",
  admin: "Admin",
};

export const STATE_LABELS: Record<string, string > = {
  njupter: "NJUPTer",
  on_sast: "SASTer",
  retired_sast: "SAST专业养老团队",
  is_deleted: "滚木",
};
