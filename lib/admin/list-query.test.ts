import {
  DEFAULT_PAGE_SIZE,
  parseAdminAuditLogListParams,
  parseAdminUserListParams,
  serializeAdminAuditLogListParams,
  serializeAdminUserListParams,
} from "./list-query";

describe("admin user list query", () => {
  it("defaults to page 1 with the default page size", () => {
    expect(parseAdminUserListParams(new URLSearchParams())).toEqual({
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
      role: undefined,
      state: undefined,
      department: undefined,
      student_id: undefined,
      keyword: undefined,
      needs_completion: undefined,
    });
  });

  it("parses a full query", () => {
    const params = parseAdminUserListParams(
      new URLSearchParams(
        "page=3&page_size=50&role=admin&state=on_sast&department=software&student_id=B2100&keyword=%E5%BC%A0&needs_completion=true",
      ),
    );
    expect(params).toEqual({
      page: 3,
      page_size: 50,
      role: "admin",
      state: "on_sast",
      department: "software",
      student_id: "B2100",
      keyword: "张",
      needs_completion: true,
    });
  });

  it("drops illegal values instead of forwarding them", () => {
    const params = parseAdminUserListParams(
      new URLSearchParams(
        "page=0&page_size=999&role=root&state=nope&department=hr&needs_completion=maybe&keyword=%20%20",
      ),
    );
    expect(params).toEqual({
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
      role: undefined,
      state: undefined,
      department: undefined,
      student_id: undefined,
      keyword: undefined,
      needs_completion: undefined,
    });
  });

  it("omits defaults when serializing", () => {
    expect(
      serializeAdminUserListParams({ page: 1, page_size: DEFAULT_PAGE_SIZE }),
    ).toBe("");
  });

  it("round-trips through serialize/parse", () => {
    const original = {
      page: 4,
      page_size: 100,
      role: "lecturer" as const,
      state: "is_deleted" as const,
      department: "media" as const,
      student_id: "B21001",
      keyword: "李",
      needs_completion: false,
    };
    const restored = parseAdminUserListParams(
      new URLSearchParams(serializeAdminUserListParams(original)),
    );
    expect(restored).toEqual(original);
  });
});

describe("admin audit log list query", () => {
  it("parses and round-trips filters", () => {
    const original = {
      page: 2,
      page_size: 50,
      user_id: 12,
      action: "login",
      resource: "user",
      success: false,
      start_time: "2026-06-01T00:00:00+08:00",
      end_time: "2026-06-02T00:00:00+08:00",
    };
    const restored = parseAdminAuditLogListParams(
      new URLSearchParams(serializeAdminAuditLogListParams(original)),
    );
    expect(restored).toEqual(original);
  });

  it("falls back to defaults on garbage input", () => {
    expect(
      parseAdminAuditLogListParams(
        new URLSearchParams("page=-2&page_size=abc&user_id=0&success=1"),
      ),
    ).toEqual({
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
      user_id: undefined,
      action: undefined,
      resource: undefined,
      success: undefined,
      start_time: undefined,
      end_time: undefined,
    });
  });
});
