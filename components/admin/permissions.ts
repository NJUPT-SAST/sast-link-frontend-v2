/**
 * Whether the given role may manage (write) users. Lecturers have read-only
 * access to user management; only admins can edit / delete / batch-modify.
 */
export function canManageUsers(role?: string): boolean {
  return role === "admin";
}
