import { apiClient } from "./client";
import type { ApiEnvelope } from "./types";
import { API_BASE_URL } from "@/lib/config/public";

/** Personal badge sharing state. Key is present only while enabled — the
 * share URL is derived from it, and the client owns the API base it runs
 * against. */
export interface BadgeStatus {
  enabled: boolean;
  key?: string;
  enabled_at?: string;
}

export type BadgeSize = "sm" | "md" | "lg";
export type BadgeTheme = "auto" | "light" | "dark";
/** Which of the member's own pages a rendered badge click-through lands on.
 * Rides the URL like size/theme — the embedder may override it by hand. */
export type BadgeTarget = "blog" | "github";

/** GET /user/badge — the caller's badge sharing state. */
export function getBadgeStatus() {
  return apiClient.get<ApiEnvelope<BadgeStatus>>("/user/badge");
}

/** POST /user/badge — opt in. The capability key is returned here (and by the
 * status endpoint while enabled); every consumer derives share URLs from it. */
export function enableBadge() {
  return apiClient.post<ApiEnvelope<BadgeStatus>>("/user/badge");
}

/** DELETE /user/badge — opt out. Idempotent; every embedded link starts
 * answering 404 with the error card the moment this lands. */
export function disableBadge() {
  return apiClient.delete<ApiEnvelope<{ message: string }>>("/user/badge");
}

/** Builds the public embed URL for one badge key. The URL itself is the
 * credential — it is meant to be pasted into GitHub READMEs and friend-link
 * walls, so no secret ever rides beside it. Defaults to the one shipped
 * canvas size and the blog click-through. */
export function badgeUrl(
  key: string,
  size: BadgeSize = "sm",
  theme: BadgeTheme = "auto",
  target: BadgeTarget = "blog",
) {
  return `${API_BASE_URL}/badge/${key}.svg?size=${size}&theme=${theme}&target=${target}`;
}
