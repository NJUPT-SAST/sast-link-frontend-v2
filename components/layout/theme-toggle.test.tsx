import { render, screen } from "@testing-library/react";
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
    const darkOption = await screen.findByRole("menuitemradio", { name: "深色" }, { timeout: 3000 });
    await user.click(darkOption);

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("lets the user switch back to light mode", async () => {
    const user = userEvent.setup();
    currentTheme = "dark";
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "主题模式" }));
    const lightOption = await screen.findByRole("menuitemradio", { name: "浅色" }, { timeout: 3000 });
    await user.click(lightOption);

    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("lets the user choose follow-system mode", async () => {
    const user = userEvent.setup();
    currentTheme = "light";
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "主题模式" }));
    const systemOption = await screen.findByRole("menuitemradio", { name: "跟随系统" }, { timeout: 3000 });
    await user.click(systemOption);

    expect(setTheme).toHaveBeenCalledWith("system");
  });
});
