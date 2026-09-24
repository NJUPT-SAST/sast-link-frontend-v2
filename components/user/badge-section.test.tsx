import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BadgeSection } from "./badge-section";

const mockMutate = jest.fn();
let mockBadge: unknown = undefined;
let mockIsLoading = true;

jest.mock("@/hooks/use-badge", () => ({
  useBadge: () => ({
    badge: mockBadge,
    isLoading: mockIsLoading,
    mutate: mockMutate,
  }),
}));

const enableBadge = jest.fn();
const disableBadge = jest.fn();

jest.mock("@/lib/api/badge", () => ({
  badgeUrl: (key: string, size: string, theme: string) =>
    `/v2/badge/${key}.svg?size=${size}&theme=${theme}`,
  enableBadge: (...args: unknown[]) => enableBadge(...args),
  disableBadge: (...args: unknown[]) => disableBadge(...args),
}));

jest.mock("@/lib/api/errors", () => ({
  toApiError: (error: unknown) => error,
}));

jest.mock("@/lib/message", () => ({
  message: { success: jest.fn(), warning: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const clipboardWrite = jest.fn();

// navigator.clipboard is a getter-only property in jsdom; redefine it on the
// prototype so the component's navigator.clipboard.writeText lands on the mock.
beforeAll(() => {
  Object.defineProperty(Navigator.prototype, "clipboard", {
    value: { writeText: clipboardWrite },
    configurable: true,
  });
});

describe("BadgeSection", () => {
  beforeEach(() => {
    mockBadge = undefined;
    mockIsLoading = true;
    mockMutate.mockClear();
    enableBadge.mockReset();
    disableBadge.mockReset();
    clipboardWrite.mockClear();
    clipboardWrite.mockResolvedValue(undefined);
  });

  it("shows a loading state while resolving", () => {
    render(<BadgeSection />);
    expect(screen.getByText("正在加载徽标状态…")).toBeInTheDocument();
  });

  it("offers enablement while disabled and calls the API", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: false };
    enableBadge.mockResolvedValue({});

    render(<BadgeSection />);

    const user = setupUserWithClipboard();
    await user.click(screen.getByRole("button", { name: "开启徽标" }));

    await waitFor(() => {
      expect(enableBadge).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it("surfaces the enable failure message", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: false };
    const { message } = jest.requireMock("@/lib/message");
    enableBadge.mockRejectedValue({ message: "请先设置昵称再开启徽标" });

    render(<BadgeSection />);

    const user = setupUserWithClipboard();
    await user.click(screen.getByRole("button", { name: "开启徽标" }));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith("请先设置昵称再开启徽标");
    });
  });

  it("previews the badge and copies share snippets when enabled", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };

    render(<BadgeSection />);

    const preview = screen.getByTestId("badge-preview");
    expect(preview).toHaveAttribute(
      "src",
      "http://localhost/v2/badge/abc.svg?size=md&theme=auto",
    );

    // Size and theme selectors retarget the preview.
    const user = setupUserWithClipboard();
    await user.click(screen.getByRole("button", { name: "大图" }));
    await user.click(screen.getByRole("button", { name: "暗色" }));
    expect(screen.getByTestId("badge-preview")).toHaveAttribute(
      "src",
      "http://localhost/v2/badge/abc.svg?size=lg&theme=dark",
    );

    await user.click(screen.getByRole("button", { name: "复制 Markdown" }));
    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith(
        expect.stringContaining("/badge/abc.svg?size=lg&theme=dark"),
      );
    });
  });

  it("requires confirmation to disable and warns about broken links", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };
    disableBadge.mockResolvedValue({});

    render(<BadgeSection />);

    const user = setupUserWithClipboard();
    await user.click(screen.getByRole("button", { name: "关闭徽标" }));

    // The confirmation dialog states the consequence before the call fires.
    expect(screen.getByText("关闭个人徽标？")).toBeInTheDocument();
    expect(
      screen.getByText(/所有已嵌入的链接将立即失效/),
    ).toBeInTheDocument();
    expect(disableBadge).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确认关闭" }));
    await waitFor(() => {
      expect(disableBadge).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});

/** userEvent.setup() installs its own clipboard stub, shadowing the prototype
 * mock; re-stub on the navigator instance after setup so copy assertions see
 * our recorder. */
function setupUserWithClipboard() {
  const user = userEvent.setup();
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: clipboardWrite },
    configurable: true,
  });
  return user;
}
