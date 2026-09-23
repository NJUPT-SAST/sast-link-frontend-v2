import type { UserProfileData } from "@/lib/api/types";

/**
 * A student mailbox is the student id verbatim: one letter then eight digits
 * (lib/validations/auth.ts studentIdPattern), addressed at the school domain.
 * The enrollment year is digits 2-3 (B24040101 -> 24). Anything else — sast.fun
 * aliases, other_mail logins, dotted school addresses — is not a student
 * mailbox and folds into 其他.
 */
const STUDENT_EMAIL_PATTERN = /^[A-Za-z](\d{2})\d{6}@njupt\.edu\.cn$/;

/** Bucket shown when the login email is not a student mailbox. */
export const GRADE_OTHER_LABEL = "其他";

/** Maps a login email to its grade bucket label ("24级") or 其他. */
export function gradeBucketOfLoginEmail(email: string): string {
  const match = STUDENT_EMAIL_PATTERN.exec(email);
  return match ? `${match[1]}级` : GRADE_OTHER_LABEL;
}

/**
 * Counts live accounts per grade bucket from an already-fetched user list.
 *
 * /admin/stats has no grade dimension, so the overview pages through
 * /admin/users and computes this client-side. Deleted accounts are skipped to
 * match the backend's ByRole / ByDepartment aggregates, which also count live
 * users only (repository/admin_user.go liveUser). The Donut sorts and totals
 * the items itself, so insertion order here is arbitrary.
 */
export function computeGradeDistribution(
  users: Pick<UserProfileData, "login_email" | "state">[],
): [string, number][] {
  const counts = new Map<string, number>();
  for (const user of users) {
    if (user.state === "is_deleted") continue;
    const bucket = gradeBucketOfLoginEmail(user.login_email);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return [...counts.entries()];
}
