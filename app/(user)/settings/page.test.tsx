import { render, screen } from "@testing-library/react";

import SettingsPage from "./page";

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

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: typeof profile }) => unknown) =>
    selector({ profile }),
}));

jest.mock("@/components/user/identity-list", () => ({
  IdentityList: () => <div data-testid="identity-list" />,
}));

jest.mock("@/components/user/bound-email-section", () => ({
  BoundEmailSection: () => <div data-testid="bound-email-section" />,
}));

describe("SettingsPage", () => {
  it("groups account actions into sections", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("link", { name: "修改密码" })).toHaveAttribute(
      "href",
      "/settings/password",
    );
    expect(screen.getByTestId("identity-list")).toBeInTheDocument();
    expect(screen.getByTestId("bound-email-section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "已授权应用" })).toHaveAttribute(
      "href",
      "/settings/apps",
    );
    expect(screen.getByRole("button", { name: "退出登录" })).toBeInTheDocument();
  });
});
