import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BackButton } from "./back-button";

const back = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back, replace }),
}));

function setHistoryLength(value: number) {
  Object.defineProperty(window.history, "length", { value, configurable: true });
}

describe("BackButton", () => {
  beforeEach(() => {
    back.mockClear();
    replace.mockClear();
  });

  it("navigates backward when there is history", async () => {
    setHistoryLength(2);
    const user = userEvent.setup();
    render(<BackButton />);

    await user.click(screen.getByRole("button", { name: "返回" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it("falls back to /settings when there is no history", async () => {
    setHistoryLength(1);
    const user = userEvent.setup();
    render(<BackButton />);

    await user.click(screen.getByRole("button", { name: "返回" }));
    expect(replace).toHaveBeenCalledWith("/settings");
    expect(back).not.toHaveBeenCalled();
  });
});
