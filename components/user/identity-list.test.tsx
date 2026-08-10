import { render, screen } from "@testing-library/react";

import { IdentityList } from "./identity-list";

const mockMutate = jest.fn();
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
});
