import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeToggle } from "./theme-toggle";

const setTheme = jest.fn();
let currentTheme = "system";

jest.mock("@/lib/theme", () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
    currentTheme = "system";
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the current theme mode label", () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "主题模式" }),
    ).toHaveAttribute("title", "当前主题：跟随系统");
  });

  it("lets the user switch to dark mode", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "主题模式" }));

    const darkOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitemradio", { name: "深色" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(darkOption);

    expect(setTheme).toHaveBeenCalledWith("dark");
  }, 60000);

  it("lets the user switch back to light mode", async () => {
    const user = userEvent.setup();
    currentTheme = "dark";
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "主题模式" }));

    const lightOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitemradio", { name: "浅色" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(lightOption);

    expect(setTheme).toHaveBeenCalledWith("light");
  }, 60000);

  it("lets the user choose follow-system mode", async () => {
    const user = userEvent.setup();
    currentTheme = "light";
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "主题模式" }));

    const systemOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitemradio", { name: "跟随系统" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(systemOption);

    expect(setTheme).toHaveBeenCalledWith("system");
  }, 60000);
});
