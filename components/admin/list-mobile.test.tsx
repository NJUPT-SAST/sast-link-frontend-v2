import { render, screen } from "@testing-library/react";

import { UserList } from "./user-list";
import { AuditLogList } from "./audit-log-list";
import type { AdminAuditLog, UserProfileData } from "@/lib/api/types";

/**
 * Both lists are one grid that switches between a desktop table and a mobile card.
 * The fixed columns only fit from lg (the user table's nine columns already add up
 * to ~968px before the flexible name column), and every cell needs the matching
 * data-label + admin-cell-label-lg pair, since that ::before label is the only
 * thing identifying a field once the row becomes a card.
 *
 * Regression guard: the user list used to switch at sm (640px), where the content
 * area is only 576px, and used admin-cell-label-sm, whose labels disappear at 640px
 * — so between 640px and 1024px the table was squeezed with no labels at all.
 */
function user(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 1,
    name: "张三",
    login_email: "b24040001@njupt.edu.cn",
    role: "member",
    state: "on_sast",
    email_type: "njupt_email",
    phone_number: "13800138000",
    qq_number: "10001",
    student_id: "B24040001",
    college: "计算机学院、软件学院、网络空间安全学院",
    major: "软件工程",
    profile: {
      nickname: "张三",
      department: "software",
      intro: null,
      email: "a@b.c",
      avatar: null,
      blog_url: null,
      github_url: null,
    },
    identities: [],
    profile_needs_completion: false,
    incomplete_fields: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function log(overrides: Partial<AdminAuditLog> = {}): AdminAuditLog {
  return {
    id: 1,
    user_id: 2,
    user_name: "Admin",
    action: "login",
    resource: "session",
    resource_id: "2",
    detail: { method: "password" },
    client_ip: "10.0.0.1",
    user_agent: "Mozilla/5.0",
    success: true,
    err_code: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** The row element that carries the responsive grid definition. */
function dataRow(container: HTMLElement) {
  return container.querySelector('[class*="lg:grid-cols-"]') as HTMLElement;
}

function labelledCells(row: HTMLElement) {
  return Array.from(row.querySelectorAll("[data-label]")) as HTMLElement[];
}

describe("admin list mobile layout", () => {
  describe.each([
    [
      "user list",
      () => render(<UserList users={[user()]} canManage />),
      ["ID", "姓名", "学号", "邮箱", "角色", "部门", "状态"],
    ],
    [
      "audit log list",
      () => render(<AuditLogList logs={[log()]} />),
      ["时间", "用户 ID", "操作", "资源", "结果", "信息"],
    ],
  ])("%s", (_name, renderList, expectedLabels) => {
    it("switches to the table only from lg, never at sm", () => {
      const { container } = renderList();
      const row = dataRow(container);

      expect(row.className).toMatch(/\blg:grid-cols-\[/);
      // sm:/md: variants would re-introduce the squeezed mid-width table.
      expect(row.className).not.toMatch(/\bsm:grid-cols-/);
      expect(row.className).not.toMatch(/\bmd:grid-cols-/);
    });

    it("lays the row out as a two-column card below lg", () => {
      const { container } = renderList();

      // grid-cols-1 would stack every field into one undifferentiated column.
      expect(dataRow(container).className).toMatch(/\bgrid-cols-2\b/);
    });

    it("labels every cell with the lg-scoped label utility", () => {
      const { container } = renderList();
      const cells = labelledCells(dataRow(container));

      expect(cells.map((cell) => cell.dataset.label)).toEqual(expectedLabels);
      for (const cell of cells) {
        // -sm hides the label at 640px, which is exactly the range that needs it.
        expect(cell.className).toContain("admin-cell-label-lg");
        expect(cell.className).not.toContain("admin-cell-label-sm");
      }
    });

    it("keeps the header row hidden until lg", () => {
      const { container } = renderList();
      const header = container.querySelector('[class*="lg:grid"]') as HTMLElement;

      expect(header.className).toMatch(/\bhidden\b/);
      expect(header.className).toMatch(/\blg:grid\b/);
    });
  });

  it("floats the user list checkbox out of the card grid flow", () => {
    // As a grid child it would claim a whole 1fr column and leave half of the
    // card's first row empty.
    const checkbox = render(<UserList users={[user()]} canManage />).container.querySelector(
      'input[aria-label^="选择"]',
    ) as HTMLElement;

    expect(checkbox.className).toMatch(/\babsolute\b/);
    expect(checkbox.className).toMatch(/\blg:static\b/);
  });

  it("omits the checkbox entirely in read-only mode", () => {
    render(<UserList users={[user()]} canManage={false} />);

    expect(screen.queryByLabelText(/^选择/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("全选本页用户")).not.toBeInTheDocument();
  });

  it("truncates the long free-text cells rather than letting them widen the row", () => {
    const { container } = render(<UserList users={[user()]} canManage />);
    const email = labelledCells(dataRow(container)).find(
      (cell) => cell.dataset.label === "邮箱",
    )!;

    expect(email.className).toMatch(/\btruncate\b/);
    // A truncated cell needs the full title as a tooltip to stay readable.
    expect(email).toHaveAttribute("title", "b24040001@njupt.edu.cn");
  });
});
