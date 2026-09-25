import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BadgeSection } from "./badge-section";

const mockMutate = jest.fn();
let mockBadge: unknown = undefined;
let mockIsLoading = true;
let mockProfile: { blogUrl: string | null; githubUrl: string | null } = {
  blogUrl: null,
  githubUrl: null,
};

jest.mock("@/hooks/use-badge", () => ({
  useBadge: () => ({
    badge: mockBadge,
    isLoading: mockIsLoading,
    mutate: mockMutate,
  }),
}));

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: typeof mockProfile }) => unknown) =>
    selector({ profile: mockProfile }),
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

// userEvent.setup() installs its own clipboard stub, shadowing the prototype
// mock; re-stub on the navigator instance after setup so copy assertions see
// our recorder.
function setupUserWithClipboard() {
  const user = userEvent.setup();
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: clipboardWrite },
    configurable: true,
  });
  return user;
}

function switchRole() {
  return screen.getByRole("switch", { name: "分享个人徽标" });
}

describe("BadgeSection", () => {
  beforeEach(() => {
    mockBadge = undefined;
    mockIsLoading = true;
    mockProfile = { blogUrl: null, githubUrl: null };
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

  it("shows the closed state with inert controls and no preview", () => {
    mockIsLoading = false;
    mockBadge = { enabled: false };

    render(<BadgeSection />);

    expect(screen.getByText("已关闭")).toBeInTheDocument();
    expect(switchRole()).toHaveAttribute("data-state", "unchecked");
    expect(screen.getByText("开启后这里会显示你的徽标预览")).toBeInTheDocument();

    // The selectors and copy button render but refuse interaction.
    expect(screen.getByRole("button", { name: "紧凑" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "亮色" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "复制链接" })).toBeDisabled();
  });

  it("enables through the switch and surfaces the failure message", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: false };
    enableBadge.mockRejectedValue({ message: "请先设置昵称再开启徽标" });
    const { message } = jest.requireMock("@/lib/message");

    render(<BadgeSection />);

    const user = setupUserWithClipboard();
    await user.click(switchRole());

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith("请先设置昵称再开启徽标");
    });
  });

  it("enables successfully through the switch", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: false };
    enableBadge.mockResolvedValue({});

    render(<BadgeSection />);

    const user = setupUserWithClipboard();
    await user.click(switchRole());

    await waitFor(() => {
      expect(enableBadge).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it("previews on the right and retargets on theme change", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };

    render(<BadgeSection />);

    const preview = screen.getByTestId("badge-preview");
    expect(preview).toHaveAttribute(
      "src",
      "http://localhost/v2/badge/abc.svg?size=sm&theme=auto",
    );

    const user = setupUserWithClipboard();
    await user.click(screen.getByRole("button", { name: "暗色" }));
    expect(screen.getByTestId("badge-preview")).toHaveAttribute(
      "src",
      "http://localhost/v2/badge/abc.svg?size=sm&theme=dark",
    );
  });

  it("wraps the preview in the member's own link, blog first", () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };
    mockProfile = { blogUrl: "https://blog.example.com", githubUrl: "https://github.com/a" };

    render(<BadgeSection />);

    const link = screen.getByTestId("badge-preview").closest("a");
    expect(link).toHaveAttribute("href", "https://blog.example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("falls back to the github link when no blog is set", () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };
    mockProfile = { blogUrl: null, githubUrl: "https://github.com/a" };

    render(<BadgeSection />);

    expect(screen.getByTestId("badge-preview").closest("a")).toHaveAttribute(
      "href",
      "https://github.com/a",
    );
  });

  it("renders the preview without a link when neither exists", () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };

    render(<BadgeSection />);

    expect(screen.getByTestId("badge-preview").closest("a")).toBeNull();
  });

  it("copies only the plain link", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };

    render(<BadgeSection />);

    const user = setupUserWithClipboard();
    await user.click(screen.getByRole("button", { name: "复制链接" }));

    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith(
        "http://localhost/v2/badge/abc.svg?size=sm&theme=auto",
      );
    });
  });

  it("requires confirmation to switch off and warns about broken links", async () => {
    mockIsLoading = false;
    mockBadge = { enabled: true, key: "abc" };
    disableBadge.mockResolvedValue({});

    render(<BadgeSection />);

    const user = setupUserWithClipboard();
    await user.click(switchRole());

    // The confirmation dialog states the consequence before the call fires.
    expect(screen.getByText("关闭个人徽标？")).toBeInTheDocument();
    expect(screen.getByText(/所有已嵌入的链接将立即失效/)).toBeInTheDocument();
    expect(disableBadge).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确认关闭" }));
    await waitFor(() => {
      expect(disableBadge).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});
