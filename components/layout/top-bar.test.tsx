import { render, screen } from "@testing-library/react";

import { TopBar } from "./top-bar";

const mockPathname = jest.fn();
const mockRole = jest.fn();

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

  it("shows the admin entry only for admins", () => {
    mockRole.mockReturnValue("admin");
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "管理面板" })).toHaveAttribute(
      "href",
      "/admin",
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
