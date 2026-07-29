import { render, screen } from "@testing-library/react";

import { TopBar } from "./top-bar";

jest.mock("@/components/layout/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="主题模式" />,
}));

describe("TopBar", () => {
  it("renders borderless tools and links settings", () => {
    const { container } = render(<TopBar />);

    expect(screen.getByText("SAST Link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设置" })).toHaveAttribute("href", "/settings");
    expect(container.querySelector("header")).not.toHaveClass("border-b");
    expect(container.querySelector("header")).not.toHaveClass("bg-background/70");
    expect(screen.queryByLabelText("Open profile")).not.toBeInTheDocument();
  });
});
