import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { BoundEmailSection } from "./bound-email-section";

type OtherMail = {
  id: number;
  provider: string;
  provider_id: string;
  identity_data: null;
  token_expires_at: null;
  created_at: string;
  updated_at: string;
};

// Named `mock*` so babel-plugin-jest-hoist lets the jest.mock factory
// reference it (variables not prefixed with `mock` are rejected).
let mockIdentities = [] as OtherMail[];

const mockMutate = jest.fn();
const mockBindEmail = jest.fn();
const mockVerifyBindEmail = jest.fn();
const mockUnbindIdentity = jest.fn();

jest.mock("@/hooks/use-identities", () => ({
  useIdentities: () => ({ identities: mockIdentities, mutate: mockMutate }),
}));

jest.mock("@/lib/api/user", () => ({
  bindEmail: (...a: unknown[]) => mockBindEmail(...a),
  verifyBindEmail: (...a: unknown[]) => mockVerifyBindEmail(...a),
  unbindIdentity: (...a: unknown[]) => mockUnbindIdentity(...a),
}));

jest.mock("@/lib/message", () => ({
  message: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const oneMail: OtherMail = {
  id: 1,
  provider: "other_mail",
  provider_id: "alice@example.com",
  identity_data: null,
  token_expires_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const twoMails: OtherMail[] = [
  oneMail,
  { ...oneMail, id: 2, provider_id: "work@gmail.com" },
];

describe("BoundEmailSection", () => {
  beforeEach(() => {
    mockIdentities = [oneMail];
    mockMutate.mockReset();
    mockBindEmail.mockReset();
    mockVerifyBindEmail.mockReset();
    mockUnbindIdentity.mockReset();
  });

  it("renders the empty state with an add button when nothing is bound", () => {
    mockIdentities = [];
    render(<BoundEmailSection />);
    expect(screen.getByText("你还没有绑定其他邮箱哦")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加邮箱" })).toBeInTheDocument();
  });

  it("renders bound emails as a list with unbind buttons", () => {
    render(<BoundEmailSection />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "解绑" })).toBeInTheDocument();
  });

  it("hides the add button when at the 2-email limit", () => {
    mockIdentities = twoMails;
    render(<BoundEmailSection />);
    expect(screen.getByText("work@gmail.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "添加邮箱" })).not.toBeInTheDocument();
  });

  it("sends the verification code when adding an email", async () => {
    mockBindEmail.mockResolvedValueOnce({ data: { data: { bind_ticket: "ticket-1" } } });
    render(<BoundEmailSection />);
    fireEvent.click(screen.getByRole("button", { name: "添加邮箱" }));
    fireEvent.change(screen.getByLabelText("邮箱地址"), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }));

    await waitFor(() =>
      expect(mockBindEmail).toHaveBeenCalledWith("new@example.com"),
    );
    expect(screen.getByText("验证码已发送至 new@example.com")).toBeInTheDocument();
  });

  it("confirms the binding with the verification code", async () => {
    mockBindEmail.mockResolvedValueOnce({ data: { data: { bind_ticket: "ticket-1" } } });
    mockVerifyBindEmail.mockResolvedValueOnce({ data: { data: { message: "ok" } } });
    render(<BoundEmailSection />);
    fireEvent.click(screen.getByRole("button", { name: "添加邮箱" }));
    fireEvent.change(screen.getByLabelText("邮箱地址"), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }));

    await waitFor(() =>
      expect(screen.getByLabelText("验证码")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("验证码"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "确认绑定" }));

    await waitFor(() =>
      expect(mockVerifyBindEmail).toHaveBeenCalledWith("ticket-1", "123456"),
    );
    expect(mockMutate).toHaveBeenCalled();
  });

  it("unbinds an email after password confirmation", async () => {
    mockUnbindIdentity.mockResolvedValueOnce({ data: { data: { message: "ok" } } });
    render(<BoundEmailSection />);
    fireEvent.click(screen.getByRole("button", { name: "解绑" }));
    fireEvent.change(screen.getByLabelText("当前密码"), {
      target: { value: "OldPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认解绑" }));

    await waitFor(() =>
      expect(mockUnbindIdentity).toHaveBeenCalledWith(1, "OldPass123"),
    );
    expect(mockMutate).toHaveBeenCalled();
  });
});
