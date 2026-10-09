import { render, screen } from "@testing-library/react";

import type { UserProfileData } from "@/lib/api/types";
import { UserDetailCard } from "./user-detail-card";

function makeUser(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 1,
    name: "张三",
    login_email: "b18040101@njupt.edu.cn",
    role: "member",
    state: "on_sast",
    email_type: "njupt_email",
    phone_number: "13800000001",
    qq_number: "100001",
    student_id: "B18040101",
    college: "其他",
    major: "软件工程",
    profile: null,
    identities: [],
    profile_needs_completion: false,
    incomplete_fields: [],
    state_manual: false,
    deleted_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("UserDetailCard", () => {
  // Backend V023: deleted_at is the physical-purge clock, shown only on closed
  // accounts — an active row carries null and the field is meaningless there.
  it("shows the deletion time and purge warning on a closed account", () => {
    render(
      <UserDetailCard
        user={makeUser({
          state: "is_deleted",
          deleted_at: "2026-02-01T03:00:00Z",
        })}
      />,
    );

    expect(screen.getByText("注销时间")).toBeInTheDocument();
    expect(screen.getByText("已注销")).toBeInTheDocument();
    expect(screen.getByText("成员")).toBeInTheDocument();
    expect(screen.queryByText("滚木")).not.toBeInTheDocument();
    expect(screen.getByText(/超过宽限期后数据将被永久删除/)).toBeInTheDocument();
  });

  it("hides the deletion time on an active account", () => {
    render(<UserDetailCard user={makeUser()} />);

    expect(screen.queryByText("注销时间")).not.toBeInTheDocument();
  });
});
