import { render, screen } from "@testing-library/react";

import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("renders step marker and step content region", () => {
    render(
      <AuthShell tech="Sign in / 01">
        <div>step content</div>
      </AuthShell>,
    );

    expect(screen.getByText("Sign in / 01")).toBeInTheDocument();
    expect(screen.getByText("step content")).toBeInTheDocument();
  });

  it("clips the brand column so wide content cannot blow the grid", () => {
    const { container } = render(
      <AuthShell tech="Sign in / 01">
        <div>step content</div>
      </AuthShell>,
    );

    const section = container.querySelector("section");
    expect(section).toHaveClass("md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]");
    expect(section?.firstElementChild).toHaveClass("overflow-hidden");
  });
});
