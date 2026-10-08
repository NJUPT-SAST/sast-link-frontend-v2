import { render, screen } from "@testing-library/react";

import H5ProbePage from "./page";

jest.mock("./h5-probe", () => ({
  H5Probe: () => <div data-testid="real-probe" />,
}));

// The server page passes the runtime flag through, so the suite exercises
// the gate the same way a production build does: the notice renders and the
// probe (with its CDN loaders) is never imported.
describe("H5ProbePage gate", () => {
  it("renders the dev-only notice outside the dev runtime", () => {
    render(<H5ProbePage />);
    expect(
      screen.getByText("诊断探针仅在开发环境可用（pnpm dev）。"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("real-probe")).not.toBeInTheDocument();
  });
});
