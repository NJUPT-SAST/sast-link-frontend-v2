import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AuthorizedApps } from "./authorized-apps";

const mockGrants = [
  {
    client_id: 1,
    client_key: "evento",
    client_name: "Evento",
    client_type: "third_party",
    redirect_uris: ["https://evento.sast.fun/oauth"],
    is_active: true,
    scopes: ["openid", "profile"],
    last_authorized_at: "2026-08-01T00:00:00Z",
  },
];

const mockGetGrants = jest.fn();
const mockRevokeGrant = jest.fn();

jest.mock("@/lib/api/oauth", () => ({
  getGrants: (...args: unknown[]) => mockGetGrants(...args),
  revokeGrant: (...args: unknown[]) => mockRevokeGrant(...args),
}));

jest.mock("@/lib/api/errors", () => ({
  toApiError: (error: { message?: string }) => ({
    message: error?.message ?? "操作失败",
  }),
}));

jest.mock("@/lib/message", () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

import { message } from "@/lib/message";

const mockMessageSuccess = message.success as jest.Mock;

describe("AuthorizedApps", () => {
  beforeEach(() => {
    mockGetGrants.mockReset();
    mockGetGrants.mockResolvedValue({ data: { data: { grants: mockGrants } } });
    mockRevokeGrant.mockReset();
    mockMessageSuccess.mockClear();
  });

  it("renders the list of authorized apps", async () => {
    render(<AuthorizedApps />);

    expect(await screen.findByText("Evento")).toBeInTheDocument();
    expect(
      screen.getByText("身份标识（OpenID） · 基本资料（昵称、姓名、签名等）"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看" })).toBeInTheDocument();
  });

  it("requires confirmation before revoking from the list", async () => {
    render(<AuthorizedApps />);
    await screen.findByText("Evento");

    fireEvent.click(screen.getByRole("button", { name: "撤销授权" }));

    expect(mockRevokeGrant).not.toHaveBeenCalled();
    expect(
      screen.getByText(/撤销后将失去对「Evento」的登录授权/),
    ).toBeInTheDocument();
  });

  it("revokes after confirming in the dialog", async () => {
    mockRevokeGrant.mockResolvedValue({ data: { data: { message: "ok" } } });

    render(<AuthorizedApps />);
    await screen.findByText("Evento");

    fireEvent.click(screen.getByRole("button", { name: "撤销授权" }));
    fireEvent.click(screen.getByRole("button", { name: "确认撤销" }));

    await waitFor(() => {
      expect(mockRevokeGrant).toHaveBeenCalledWith(1);
    });
    await waitFor(() => {
      expect(mockMessageSuccess).toHaveBeenCalledWith("已撤销 Evento 的授权");
    });
  });

  it("cancelling the confirm dialog does not revoke", async () => {
    render(<AuthorizedApps />);
    await screen.findByText("Evento");

    fireEvent.click(screen.getByRole("button", { name: "撤销授权" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(mockRevokeGrant).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/撤销后将失去对/),
    ).not.toBeInTheDocument();
  });

  it("opens the same confirmation from the detail dialog", async () => {
    render(<AuthorizedApps />);
    await screen.findByText("Evento");

    fireEvent.click(screen.getByRole("button", { name: "查看" }));
    fireEvent.click(screen.getByRole("button", { name: "撤销授权" }));

    expect(mockRevokeGrant).not.toHaveBeenCalled();
    expect(
      screen.getByText(/撤销后将失去对「Evento」的登录授权/),
    ).toBeInTheDocument();
  });
});
