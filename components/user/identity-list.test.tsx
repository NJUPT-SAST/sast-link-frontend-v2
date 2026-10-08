import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { unbindIdentity } from "@/lib/api/user";

import { IdentityList } from "./identity-list";

const mockMutate = jest.fn();
const mockUnbindIdentity = jest.mocked(unbindIdentity);
let mockIdentities: unknown[] = [];
let mockIsLoading = false;

jest.mock("@/hooks/use-identities", () => ({
  useIdentities: () => ({
    identities: mockIdentities,
    isLoading: mockIsLoading,
    mutate: mockMutate,
  }),
}));

jest.mock("@/lib/api/oauth", () => ({
  buildBindOAuthUrl: jest.fn(),
}));

jest.mock("@/lib/api/user", () => ({
  unbindIdentity: jest.fn(),
}));

jest.mock("@/lib/api/errors", () => ({
  toApiError: (error: unknown) => error,
}));

jest.mock("@/lib/message", () => ({
  message: { success: jest.fn(), warning: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

describe("IdentityList", () => {
  beforeEach(() => {
    mockIdentities = [];
    mockIsLoading = false;
    mockMutate.mockClear();
    mockUnbindIdentity.mockClear();
  });

  it("renders bound status for each provider when loaded", () => {
    render(<IdentityList actionable />);

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("飞书")).toBeInTheDocument();
    expect(screen.getAllByText("未绑定")).toHaveLength(2);
  });

  it("shows a loading placeholder instead of 未绑定 while identities load", () => {
    mockIsLoading = true;

    render(<IdentityList actionable />);

    expect(screen.getAllByText("加载中")).toHaveLength(2);
    expect(screen.queryByText("未绑定")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "绑定" })[0]).toBeDisabled();
  });

  it("renders bound providers with an unbind action", () => {
    mockIdentities = [
      { id: 1, provider: "github", provider_id: "octocat" },
    ];

    render(<IdentityList actionable />);

    expect(screen.getByText("已绑定")).toBeInTheDocument();
    expect(screen.getByText("未绑定")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "解绑" })).toBeInTheDocument();
  });

  // 40105 means the unbind password check failed. The backend has no
  // set-initial-password endpoint, so the email-code reset flow is the only
  // passwordless exit — the dialog must point there, not leave a retry loop.
  it("links to the email-code reset flow when the password check fails (40105)", async () => {
    mockIdentities = [{ id: 1, provider: "github", provider_id: "octocat" }];
    mockUnbindIdentity.mockRejectedValueOnce({ code: 40105, message: "密码错误" });

    render(<IdentityList actionable />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "解绑" }));
    await user.type(screen.getByLabelText("当前密码"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "确认解绑" }));

    expect(await screen.findByText("密码错误")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "通过邮箱验证码重置" })).toHaveAttribute(
      "href",
      "/reset",
    );
  });

  it("offers no reset link for unbind failures other than 40105", async () => {
    mockIdentities = [{ id: 1, provider: "github", provider_id: "octocat" }];
    mockUnbindIdentity.mockRejectedValueOnce({ code: 40905, message: "绑定数量已达上限" });

    render(<IdentityList actionable />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "解绑" }));
    await user.type(screen.getByLabelText("当前密码"), "correct-password");
    await user.click(screen.getByRole("button", { name: "确认解绑" }));

    expect(await screen.findByText("绑定数量已达上限")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "通过邮箱验证码重置" }),
    ).not.toBeInTheDocument();
  });

  // Unbinding the only third-party identity still succeeds on the backend
  // (login email is enough), so the dialog must warn instead of blocking.
  it("warns when unbinding the only bound third-party identity", async () => {
    mockIdentities = [{ id: 1, provider: "github", provider_id: "octocat" }];

    render(<IdentityList actionable />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "解绑" }));

    expect(
      await screen.findByText(
        "这是当前唯一的第三方绑定，解绑后将只能使用邮箱密码登录。",
      ),
    ).toBeInTheDocument();
  });

  it("does not warn when multiple third-party identities are bound", async () => {
    mockIdentities = [
      { id: 1, provider: "github", provider_id: "octocat" },
      { id: 2, provider: "lark", provider_id: "feishu" },
    ];

    render(<IdentityList actionable />);
    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: "解绑" })[0]);

    expect(
      screen.queryByText(
        "这是当前唯一的第三方绑定，解绑后将只能使用邮箱密码登录。",
      ),
    ).not.toBeInTheDocument();
  });
});
