import { fireEvent, render, screen } from "@testing-library/react";

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

describe("UserList selection write guard", () => {
  const memberRow = user({ id: 1, name: "张三", role: "member" });
  const adminRow = user({ id: 2, name: "管理员甲", role: "admin" });

  // A manager cannot write admin rows (403), so the row offers no checkbox,
  // matching the edit button's visibility bar.
  it("hides checkboxes on rows the manager cannot write", () => {
    render(<UserList users={[adminRow, memberRow]} viewerRole="manager" />);

    expect(screen.queryByLabelText("选择 管理员甲")).not.toBeInTheDocument();
    expect(screen.getByLabelText("选择 张三")).toBeInTheDocument();
  });

  it("selects only writable rows on select-all for a manager", () => {
    const onToggleSelect = jest.fn();
    render(
      <UserList
        users={[adminRow, memberRow]}
        viewerRole="manager"
        onToggleSelect={onToggleSelect}
      />,
    );

    fireEvent.click(screen.getByLabelText("全选本页用户"));
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(onToggleSelect).toHaveBeenCalledWith(1);
  });

  it("marks the header checked once every writable row is selected", () => {
    render(
      <UserList users={[adminRow, memberRow]} viewerRole="manager" selectedIds={new Set([1])} />,
    );

    // The admin row must not block the header's checked state.
    expect(screen.getByLabelText("全选本页用户")).toBeChecked();
  });

  it("keeps whole-page selection for an admin viewer", () => {
    const onToggleSelect = jest.fn();
    render(
      <UserList
        users={[adminRow, memberRow]}
        viewerRole="admin"
        onToggleSelect={onToggleSelect}
      />,
    );

    fireEvent.click(screen.getByLabelText("全选本页用户"));
    expect(onToggleSelect).toHaveBeenCalledTimes(2);
  });
});
