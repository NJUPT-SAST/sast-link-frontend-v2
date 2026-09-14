import { render, screen } from "@testing-library/react";

import HomePage from "./page";

const mockUseFetchProfile = jest.fn();

jest.mock("@/hooks/use-fetch-profile", () => ({
  useFetchProfile: () => mockUseFetchProfile(),
}));

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: typeof testProfile }) => unknown) =>
    selector({ profile: testProfile }),
}));

jest.mock("@/components/user/profile-card", () => ({
  ProfileCard: () => <section aria-label="个人名片">名片</section>,
}));

const profile = {
  id: 1,
  nickname: "Alice",
  name: "张三",
  loginEmail: "alice@example.com",
  email: "alice@example.com",
  phoneNumber: "13800138000",
  qqNumber: "1234567890",
  studentId: "B24040001",
  college: "计算机学院、软件学院、网络空间安全学院",
  major: "软件工程",
  role: "member",
  state: "on_sast",
  emailType: "njupt_email",
  createdAt: "2026-05-28T12:00:00Z",
  department: "软件研发部",
  avatar: null,
  intro: null,
  blogUrl: null,
  githubUrl: null,
  identities: [],
};
let testProfile = profile;

describe("HomePage", () => {
  beforeEach(() => {
    testProfile = profile;
  });

  it("renders skeleton while profile is loading", () => {
    mockUseFetchProfile.mockReturnValue({ isLoading: true });
    render(<HomePage />);

    expect(screen.getByTestId("home-skeleton")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders hero with greeting, name and action links when loaded", () => {
    mockUseFetchProfile.mockReturnValue({ isLoading: false });
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: /Alice/ })).toBeInTheDocument();
    expect(screen.queryByText("成员 · SAST 成员")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "编辑资料" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "个人资料" })).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("link", { name: "查看名片" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看个人名片" })).toHaveAttribute("href", "#profile-card");
    expect(screen.getByRole("region", { name: "个人名片" })).toBeInTheDocument();
  });

  it.each(["freshman", "member"] as const)("shows the recruitment link to %s", (role) => {
    testProfile = { ...profile, role };
    render(<HomePage />);

    const recruit = screen.getByRole("link", { name: "进入招新平台" });
    expect(recruit).toHaveAttribute("href", "https://people.sast.fun");
    expect(recruit).toHaveAttribute("target", "_blank");
  });

  it.each(["lecturer", "admin"] as const)("hides the recruitment link from %s", (role) => {
    testProfile = { ...profile, role };
    render(<HomePage />);

    expect(screen.queryByRole("link", { name: "进入招新平台" })).not.toBeInTheDocument();
  });

  it("does not flash the recruitment link on the store's initial profile", () => {
    mockUseFetchProfile.mockReturnValue({ isLoading: false });
    testProfile = { ...profile, id: 0, role: "freshman" as const };
    render(<HomePage />);

    expect(screen.queryByRole("link", { name: "进入招新平台" })).not.toBeInTheDocument();
  });
});
