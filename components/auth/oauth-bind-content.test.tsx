jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams(),
}));

jest.mock("@/hooks/use-identities", () => ({
  useIdentities: () => ({ identities: [], mutate: mockMutate }),
}));

jest.mock("@/lib/api/user", () => ({
  bindLark: (...args: unknown[]) => mockBindLark(...args),
  bindGithub: jest.fn(),
}));

jest.mock("@/lib/config/public", () => ({
  FEISHU_BIND_REDIRECT_URI: "http://localhost:3000/oauth/bind/lark",
  GITHUB_BIND_REDIRECT_URI: "http://localhost:3000/oauth/bind/github",
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader" />,
}));

import { render, screen, waitFor } from "@testing-library/react";
import { OAuthBindContent } from "./oauth-bind-content";

const mockReplace = jest.fn();
const mockMutate = jest.fn();
const mockBindLark = jest.fn();
let mockSearchParams: () => URLSearchParams;

function setup(params: string) {
  mockSearchParams = () => new URLSearchParams(params);
  mockReplace.mockClear();
  mockMutate.mockClear();
  mockBindLark.mockClear();
}

describe("OAuthBindContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("binds with the code and redirect_uri, then redirects to settings", async () => {
    sessionStorage.setItem("sast:oauth-bind:state:lark", "st1");
    setup("code=abc&state=st1");
    mockBindLark.mockResolvedValue({ data: { data: { identity: {} } } });

    render(<OAuthBindContent provider="lark" providerName="飞书" icon={null} />);

    await waitFor(() => expect(mockBindLark).toHaveBeenCalledTimes(1));
    expect(mockBindLark).toHaveBeenCalledWith(
      "abc",
      "http://localhost:3000/oauth/bind/lark",
    );
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/settings");
  });

  it("shows an error and does not bind when state mismatches", async () => {
    sessionStorage.setItem("sast:oauth-bind:state:lark", "st1");
    setup("code=abc&state=WRONG");

    render(<OAuthBindContent provider="lark" providerName="飞书" icon={null} />);

    expect(mockBindLark).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/settings");
  });

  it("bounces back to settings when code is missing", () => {
    setup("state=st1");

    render(<OAuthBindContent provider="github" providerName="GitHub" icon={null} />);

    expect(mockBindLark).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/settings");
  });

  it("surfaces a bind failure from the API", async () => {
    sessionStorage.setItem("sast:oauth-bind:state:lark", "st1");
    setup("code=abc&state=st1");
    mockBindLark.mockRejectedValue({
      response: { data: { code: 42200, message: "该第三方账号已被其他用户绑定" } },
    });

    render(<OAuthBindContent provider="lark" providerName="飞书" icon={null} />);

    await waitFor(() =>
      expect(screen.getByText(/该第三方账号已被其他用户绑定/)).toBeInTheDocument(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
