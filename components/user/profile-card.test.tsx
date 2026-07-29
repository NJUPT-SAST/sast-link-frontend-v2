import { fireEvent, render, screen } from "@testing-library/react";

import { ProfileCard } from "./profile-card";

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
  state: "njupter",
  emailType: "njupt_email",
  createdAt: "2026-05-28T12:00:00Z",
  department: "software",
  avatar: null,
  intro: null,
  blogUrl: null,
  githubUrl: null,
  identities: [],
};

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: Object.assign(
    (selector: (state: { profile: typeof profile }) => unknown) => selector({ profile }),
    { getState: () => ({ setProfile: jest.fn() }) },
  ),
}));

jest.mock("@/lib/api/user", () => ({ updateUserProfile: jest.fn() }));

beforeEach(() => {
  class IntersectionObserverMock {
    observe() {}
    disconnect() {}
  }
  global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
});

describe("ProfileCard", () => {
  it("renders the selected card fields and empty signature", () => {
    render(<ProfileCard />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getByText("计算机学院、软件学院、网络空间安全学院")).toBeInTheDocument();
    expect(screen.getByText("软件工程")).toBeInTheDocument();
    expect(screen.getByText("你还没留下签名哦～")).toBeInTheDocument();
    expect(screen.getByText("签名")).toBeInTheDocument();
  });

  it("enters inline editing on signature double click", () => {
    render(<ProfileCard />);
    fireEvent.doubleClick(screen.getByText("你还没留下签名哦～"));
    expect(screen.getByRole("textbox", { name: "签名" })).toBeInTheDocument();
  });
});
