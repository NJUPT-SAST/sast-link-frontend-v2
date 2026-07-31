import { render, screen } from "@testing-library/react";

import { Providers } from "./providers";

describe("Providers", () => {
  it("wraps children and renders them", () => {
    render(
      <Providers>
        <div>child content</div>
      </Providers>
    );

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders the toast notification area", () => {
    const { container } = render(
      <Providers>
        <div>test</div>
      </Providers>
    );

    // Sonner renders an aria-live region for notifications
    const notifications = container.querySelector('[aria-label]');
    expect(notifications).toBeInTheDocument();
  });

  it("does not depend on next-themes anymore", () => {
    render(
      <Providers>
        <div>theme child</div>
      </Providers>,
    );

    expect(screen.getByText("theme child")).toBeInTheDocument();
  });
});
