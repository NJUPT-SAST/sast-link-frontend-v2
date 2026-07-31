import { render, screen } from "@testing-library/react";

import { GithubIcon, LarkIcon } from "./brand-icons";

describe("brand icons", () => {
  it("renders the Github svg icon", () => {
    const { container } = render(<GithubIcon />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("path")).toHaveAttribute("fill", "currentColor");
  });

  it("renders the Lark raster icon with the expected alt text and source", () => {
    render(<LarkIcon />);

    expect(screen.getByAltText("Feishu")).toHaveAttribute("src", "/svg/feishu.svg");
    expect(screen.getByAltText("Feishu")).toHaveClass("dark:invert");
  });
});
