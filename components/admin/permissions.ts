/**
 * Whether the given role may manage (write) users. Lecturers have read-only
 * access to user management; admins and managers can edit / delete /
 * batch-modify.
 */
export function canManageUsers(role?: string): boolean {
  return role === "admin" || role === "manager";
}

/**
 * Whether `viewerRole` may write this specific user record. A manager runs
 * member management but is bounded one level down (backend PR #98): it may
 * not touch an admin's account — edit, role change, delete and restore all
 * answer 403. Mirrors the backend's transaction-time re-check client-side so
 * the UI never offers an action the API would refuse.
 */
export function canWriteTargetUser(
  viewerRole: string | undefined,
  targetRole: string | undefined,
): boolean {
  if (!canManageUsers(viewerRole)) return false;
  return viewerRole === "admin" || targetRole !== "admin";
}
