import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { AdminUpdateUserRequest, UserProfileData } from "@/lib/api/types";
import { UserEditForm } from "./user-edit-form";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
}));

const createdAt = "2026-01-01T00:00:00Z";

function makeUser(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 7,
    name: "张三",
    login_email: "b18040101@njupt.edu.cn",
    role: "member",
    state: "retired_sast",
    email_type: "njupt_email",
    phone_number: "13800000001",
    qq_number: "100001",
    student_id: "B18040101",
    college: "计算机学院、软件学院、网络空间安全学院",
    major: "软件工程",
    profile: null,
    identities: [],
    profile_needs_completion: false,
    state_manual: false,
    incomplete_fields: [],
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  };
}

/** axios-shaped rejection so toApiError() can read the business code. */
function apiFailure(status: number, code: number, message: string) {
  return {
    isAxiosError: true,
    response: { status, data: { code, message, data: null }, headers: {} },
    message,
  };
}

function setup(overrides: { user?: UserProfileData; onSubmit?: jest.Mock } = {}) {
  const onSubmit =
    overrides.onSubmit ?? jest.fn().mockResolvedValue(undefined);
  render(<UserEditForm user={overrides.user ?? makeUser()} onSubmit={onSubmit} />);
  return { onSubmit };
}

describe("UserEditForm role options per viewer", () => {
  it("offers the full ladder including manager to an admin viewer", () => {
    render(<UserEditForm user={makeUser()} onSubmit={jest.fn()} />);
    const select = screen.getByLabelText("角色") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["freshman", "member", "manager", "lecturer", "admin"]);
  });

  it("withholds the admin option from a manager viewer", () => {
    render(
      <UserEditForm user={makeUser()} onSubmit={jest.fn()} viewerRole="manager" />,
    );
    const select = screen.getByLabelText("角色") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["freshman", "member", "manager", "lecturer"]);
  });
});

describe("UserEditForm", () => {
  it("binds a personal email when filled", async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByRole("textbox", { name: "新增个人邮箱" }), {
      target: { value: "alumni@gmail.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const request = onSubmit.mock.calls[0][0] as AdminUpdateUserRequest;
    expect(request.personal_email).toBe("alumni@gmail.com");
  });

  // A blank bind is withheld entirely — sending "" would be a bind request of
  // nothing, and the backend has no such concept.
  it("omits personal_email when left blank", async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const request = onSubmit.mock.calls[0][0] as AdminUpdateUserRequest;
    expect(request.personal_email).toBeUndefined();
  });

  it("withholds the deleted option from the state select", () => {
    render(<UserEditForm user={makeUser()} onSubmit={jest.fn()} />);
    const select = screen.getByRole("combobox", { name: "状态" }) as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["njupter", "on_sast", "retired_sast"]);
  });

  it("explains the bind cap failure with its own copy", async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValue(apiFailure(409, 40905, "该账号的邮箱绑定数量已达上限"));
    setup({ onSubmit });
    fireEvent.change(screen.getByRole("textbox", { name: "新增个人邮箱" }), {
      target: { value: "alumni@gmail.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    expect(
      await screen.findByText(
        "该账号的邮箱绑定数量已达上限（最多 2 个），如需更换请先解绑现有绑定",
      ),
    ).toBeInTheDocument();
  });
});