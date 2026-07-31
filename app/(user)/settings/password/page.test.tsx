import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SettingsPasswordPage from "./page";

const profile = {
  id: 1,
  nickname: "Alice",
  name: "张三",
  loginEmail: "b24040001@njupt.edu.cn",
  email: "display@example.com",
  phoneNumber: "13800138000",
  qqNumber: "1234567890",
  studentId: "B24040001",
  college: "计算机学院、软件学院、网络空间安全学院",
  major: "软件工程",
  role: "member",
  state: "njupter",
  emailType: "njupt_email",
  createdAt: "2026-05-28T12:00:00Z",
  department: "软件研发部",
  avatar: null,
  intro: "正在四处游荡中...",
  blogUrl: "https://blog.example.com",
  githubUrl: "https://github.com/alice",
  identities: [],
};

const mockChangePassword = jest.fn();

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: typeof profile }) => unknown) =>
    selector({ profile }),
}));

jest.mock("@/lib/api/auth", () => ({
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
}));

jest.mock("@/lib/message", () => ({
  message: { success: jest.fn(), error: jest.fn() },
}));

describe("SettingsPasswordPage", () => {
  beforeEach(() => mockChangePassword.mockReset());

  it("rejects mismatched passwords before calling the API", async () => {
    render(<SettingsPasswordPage />);
    fireEvent.change(screen.getByLabelText("当前密码"), { target: { value: "OldPass123" } });
    fireEvent.change(screen.getByLabelText("新密码"), { target: { value: "NewPass123" } });
    fireEvent.change(screen.getByLabelText("确认新密码"), { target: { value: "OtherPass123" } });
    fireEvent.click(screen.getByRole("button", { name: "更新密码" }));

    await waitFor(() => expect(screen.getByText("密码不一致")).toBeInTheDocument());
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("submits a valid password change", async () => {
    mockChangePassword.mockResolvedValueOnce({});
    render(<SettingsPasswordPage />);
    fireEvent.change(screen.getByLabelText("当前密码"), { target: { value: "OldPass123" } });
    fireEvent.change(screen.getByLabelText("新密码"), { target: { value: "NewPass123" } });
    fireEvent.change(screen.getByLabelText("确认新密码"), { target: { value: "NewPass123" } });
    fireEvent.click(screen.getByRole("button", { name: "更新密码" }));

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith("OldPass123", "NewPass123"),
    );
  });
});
