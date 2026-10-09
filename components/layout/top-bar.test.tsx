import { fireEvent, render, screen } from "@testing-library/react";

import { TopBar } from "./top-bar";

const mockPathname = jest.fn();
const mockRole = jest.fn();
const mockScrollDirection = jest.fn();
jest.mock("@/hooks/use-scroll-direction", () => ({ useScrollDirection: () => mockScrollDirection() }));

jest.mock("@/components/layout/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="主题模式" />,
}));

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: { role: string } }) => unknown) =>
    selector({ profile: { role: mockRole() } }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("TopBar", () => {
  beforeEach(() => {
    mockRole.mockReturnValue("member");
  });

  it("renders borderless tools and links settings", () => {
    mockPathname.mockReturnValue("/settings");
    const { container } = render(<TopBar />);

    expect(screen.getByText("SAST Link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设置" })).toHaveAttribute("href", "/settings");
    expect(container.querySelector("header")).not.toHaveClass("border-b");
    expect(container.querySelector("header")).not.toHaveClass("bg-background/70");
    expect(screen.queryByLabelText("Open profile")).not.toBeInTheDocument();
  });

  it("shows the admin entry for admins, pointing at the overview", () => {
    mockRole.mockReturnValue("admin");
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "管理面板" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("routes a lecturer to the read-only user management", () => {
    mockRole.mockReturnValue("lecturer");
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "管理面板" })).toHaveAttribute(
      "href",
      "/admin/users",
    );
  });

  it("hides the admin entry for non-admins", () => {
    mockRole.mockReturnValue("member");
    render(<TopBar />);
    expect(screen.queryByRole("link", { name: "管理面板" })).not.toBeInTheDocument();
  });

  it("labels the home link as 首页 when already on /home", () => {
    mockPathname.mockReturnValue("/home");
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "首页" })).toHaveAttribute("href", "/home");
  });

  it("labels the home link as 返回首页 when elsewhere", () => {
    mockPathname.mockReturnValue("/settings");
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute("href", "/home");
  });
});

it("reveals a hidden header immediately while keyboard focus is inside", () => {
  mockScrollDirection.mockReturnValue("down");
  mockPathname.mockReturnValue("/profile/edit");
  render(<TopBar />);
  const header = screen.getByRole("banner");
  expect(header).toHaveStyle({ transform: "translateY(-100%)" });
  const home = screen.getByRole("link", { name: "返回首页" });
  fireEvent.focus(home);
  expect(header).toHaveStyle({ transform: "translateY(0)" });
  expect(header.style.transitionDuration).toBe("0ms");
  fireEvent.blur(home, { relatedTarget: screen.getByRole("link", { name: "设置" }) });
  expect(header).toHaveStyle({ transform: "translateY(0)" });
  fireEvent.blur(home, { relatedTarget: document.body });
  expect(header).toHaveStyle({ transform: "translateY(-100%)" });
});

it("uses icon-only navigation while preserving accessible names and touch targets", () => {
  mockRole.mockReturnValue("admin");
  mockPathname.mockReturnValue("/settings");
  mockScrollDirection.mockReturnValue("up");
  render(<TopBar />);
  for (const name of ["个人资料", "管理面板", "设置"]) {
    const link = screen.getByRole("link", { name });
    expect(link.textContent).toBe("");
    expect(link.querySelector("svg")).toBeInTheDocument();
    expect(link).toHaveClass("size-11", "items-center", "justify-center");
  }
  expect(screen.getByRole("button", { name: "主题模式" })).toBeInTheDocument();
});
