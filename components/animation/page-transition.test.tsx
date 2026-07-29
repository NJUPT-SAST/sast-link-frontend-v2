import { render } from "@testing-library/react";

import { PageTransition } from "./page-transition";

describe("PageTransition", () => {
  it("renders children with the transition class and default offset", () => {
    const { container } = render(<PageTransition>content</PageTransition>);
    const div = container.querySelector("div")!;
    expect(div).toHaveClass("pt-transition");
    expect(div).toHaveTextContent("content");
    expect(div.style.getPropertyValue("--pt-x")).toBe("10px");
    expect(div.style.getPropertyValue("--pt-y")).toBe("0");
  });

  it("passes style, className and the selected position offset", () => {
    const { container } = render(
      <PageTransition position="topToBottom" className="panel" style={{ opacity: 0.5 }}>
        animated
      </PageTransition>,
    );
    const div = container.querySelector("div")!;
    expect(div).toHaveClass("pt-transition");
    expect(div).toHaveClass("panel");
    expect(div).toHaveStyle({ opacity: "0.5" });
    expect(div.style.getPropertyValue("--pt-x")).toBe("0");
    expect(div.style.getPropertyValue("--pt-y")).toBe("-10px");
  });
});
