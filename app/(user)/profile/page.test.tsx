import { render, screen } from "@testing-library/react";

import ProfilePage from "./page";

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

describe("ProfilePage", () => {
  it("renders the complete profile grouped into sections", () => {
    render(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getByText("B24040001")).toBeInTheDocument();
    expect(screen.getByText("计算机学院、软件学院、网络空间安全学院")).toBeInTheDocument();
    expect(screen.getByText("软件工程")).toBeInTheDocument();
    expect(screen.getByText("b24040001@njupt.edu.cn")).toBeInTheDocument();
    expect(screen.getByText("13800138000")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("https://blog.example.com")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/alice")).toBeInTheDocument();
    expect(screen.getByText("正在四处游荡中...")).toBeInTheDocument();
    expect(screen.getByText("注册邮箱")).toBeInTheDocument();
  });

  it("shows the empty signature placeholder when intro is missing", () => {
    profile.intro = null as unknown as string;
    render(<ProfilePage />);
    expect(screen.getByText("你还没留下签名哦～")).toBeInTheDocument();
    profile.intro = "正在四处游荡中...";
  });

  it("renders edit profile link pointing to /profile/edit", () => {
    render(<ProfilePage />);

    const link = screen.getByRole("link", { name: "编辑" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/profile/edit");
  });
});
