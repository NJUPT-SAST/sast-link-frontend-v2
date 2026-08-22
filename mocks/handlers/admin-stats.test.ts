import { API_BASE_URL } from "@/lib/config/public";
import { mockUsers } from "@/mocks/data/users";

/**
 * Contract test for the mock GET /admin/stats aggregation. The overview page
 * test stubs the API module out entirely, so without this the handler's
 * incomplete-bucket rules would never actually run.
 */
interface UserStats {
  total: number;
  by_role: Record<string, number>;
  by_state: Record<string, number>;
  by_department: Record<string, number>;
  no_department: number;
  incomplete_by_role: Record<string, number>;
  incomplete_by_state: Record<string, number>;
}

async function fetchStats(): Promise<UserStats> {
  // Handlers authorize via the access-<id>- token shape; user 2 is the admin.
  const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: { Authorization: "Bearer access-2-0" },
  });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { data: { users: UserStats } };
  return body.data.users;
}

describe("mock GET /admin/stats user aggregation", () => {
  it("counts only the unfinished non-lecturer/admin accounts in the role bucket", async () => {
    const users = await fetchStats();

    // Derive the expectation from the fixtures so demo-volume changes to the
    // seed do not have to be mirrored here as hand-counted literals.
    const live = mockUsers
      .map((user) => user.profile)
      .filter((profile) => profile.state !== "is_deleted");
    const expectedByRole: Record<string, number> = {};
    const expectedByState: Record<string, number> = {};
    for (const profile of live) {
      if (!profile.profile_needs_completion) continue;
      if (profile.role !== "lecturer" && profile.role !== "admin") {
        expectedByRole[profile.role] = (expectedByRole[profile.role] ?? 0) + 1;
      }
      if (profile.state === "njupter") {
        expectedByState[profile.state] = (expectedByState[profile.state] ?? 0) + 1;
      }
    }

    expect(users.incomplete_by_role).toEqual(expectedByRole);
    expect(users.incomplete_by_state).toEqual(expectedByState);
    // The seed must actually exercise both the fold and the exclusions.
    expect(Object.keys(users.incomplete_by_role).length).toBeGreaterThan(0);
    expect(users.incomplete_by_role.lecturer).toBeUndefined();
    expect(users.incomplete_by_role.admin).toBeUndefined();
    expect(Object.keys(users.incomplete_by_state)).toEqual(["njupter"]);
  });

  it("keeps every incomplete count inside its own true bucket", async () => {
    const users = await fetchStats();

    for (const [role, count] of Object.entries(users.incomplete_by_role)) {
      expect(users.by_role[role] ?? 0).toBeGreaterThanOrEqual(count);
    }
    for (const [state, count] of Object.entries(users.incomplete_by_state)) {
      expect(users.by_state[state] ?? 0).toBeGreaterThanOrEqual(count);
    }
  });

  it("excludes deleted accounts from total and the incomplete buckets, but keeps them in by_state", async () => {
    const before = await fetchStats();
    // Pick a live flagged njupter freshman so both buckets must lose exactly one.
    const flagged = mockUsers.find(
      (user) =>
        user.profile.profile_needs_completion &&
        user.profile.state === "njupter" &&
        user.profile.role === "freshman",
    );
    expect(flagged).toBeDefined();

    // Soft deletion is a state bit, matching the backend's model. Mutate through
    // the handler rather than the fixture so jest.setup's resetUsers() undoes it
    // (the array is module-level state shared by every suite in this worker).
    const deletion = await fetch(`${API_BASE_URL}/admin/users/${flagged!.profile.id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer access-2-0" },
    });
    expect(deletion.status).toBe(200);

    const after = await fetchStats();

    expect(after.total).toBe(before.total - 1);
    expect(after.incomplete_by_role.freshman).toBe(
      (before.incomplete_by_role.freshman ?? 0) - 1,
    );
    expect(after.incomplete_by_state.njupter).toBe(
      (before.incomplete_by_state.njupter ?? 0) - 1,
    );
    // by_state deliberately spans every state so the deleted count stays visible.
    expect(after.by_state.is_deleted).toBe((before.by_state.is_deleted ?? 0) + 1);
    expect(
      Object.values(after.by_state).reduce((sum, count) => sum + count, 0),
    ).toBe(Object.values(before.by_state).reduce((sum, count) => sum + count, 0));
  });

  it("splits department counts across by_department and no_department", async () => {
    const users = await fetchStats();

    const withDepartment = Object.values(users.by_department).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(withDepartment + users.no_department).toBe(users.total);
  });
});
