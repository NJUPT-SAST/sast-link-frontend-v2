import { render, screen } from "@testing-library/react";

import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("renders children and the brand logo", () => {
    render(
      <AuthShell>
        <div>step content</div>
      </AuthShell>,
    );

    expect(screen.getByRole("link", { name: "返回首页" })).toBeInTheDocument();
    expect(screen.getByText("step content")).toBeInTheDocument();
  });

  it("centers the panel with a scrollable single column", () => {
    const { container } = render(
      <AuthShell>
        <div>step content</div>
      </AuthShell>,
    );

    const section = container.querySelector("section");
    expect(section).toHaveClass("flex", "min-h-screen", "overflow-y-auto");
    // First child is the absolute top-left logo; second is the centered panel.
    expect(section?.children[1]).toHaveClass("m-auto", "items-center");
  });
});
