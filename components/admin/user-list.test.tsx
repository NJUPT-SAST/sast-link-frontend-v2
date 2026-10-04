import { render, screen } from "@testing-library/react";

import { UserList } from "./user-list";
import type { AdminUserListItem } from "@/lib/api/types";

/**
 * The list row is the backend's adminUserDTO: department rides at the top level
 * and there is no profile object (unlike detail reads). Regression guard: the
 * column used to read profile.department, which the list never sends, so every
 * row showed "-" even under ?department=software.
 */
function user(overrides: Partial<AdminUserListItem> = {}): AdminUserListItem {
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
    department: null,
    profile_needs_completion: false,
    state_manual: false,
    incomplete_fields: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function departmentCell(container: HTMLElement) {
  return container.querySelector('[data-label="部门"]') as HTMLElement;
}

describe("UserList department column", () => {
  it("renders the label from the row's top-level department", () => {
    const { container } = render(<UserList users={[user({ department: "software" })]} />);

    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(departmentCell(container)).toHaveTextContent("软件研发部");
  });

  it("renders an unknown key as the raw value", () => {
    const { container } = render(
      <UserList users={[user({ department: "future_dept" as AdminUserListItem["department"] })]} />,
    );

    expect(departmentCell(container)).toHaveTextContent("future_dept");
  });

  it("renders - when the department is unset", () => {
    const { container } = render(<UserList users={[user()]} />);

    expect(departmentCell(container)).toHaveTextContent("-");
  });
});
