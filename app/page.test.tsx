import { render, screen } from "@testing-library/react";
import Home from "./page";

// Mock useRouter
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock Zustand store + session so each case controls the signed-in state
const mockUseUserListStore = jest.fn();
jest.mock("@/store/use-user-list-store", () => ({
  useUserListStore: () => mockUseUserListStore(),
}));

const mockGetSession = jest.fn();
jest.mock("@/lib/token", () => ({
  clearSession: jest.fn(),
  getSession: () => mockGetSession(),
  setSession: jest.fn(),
}));

jest.mock("@/lib/api/user", () => ({ getUserProfile: jest.fn() }));
jest.mock("@/lib/message", () => ({ message: { error: jest.fn(), success: jest.fn() } }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

const ACCOUNT = {
  userId: 1,
  name: "Alice",
  loginEmail: "alice@example.com",
  session: { accessToken: "a", refreshToken: "r", expiresAt: 1 },
};

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue(null);
    mockUseUserListStore.mockReturnValue({ accounts: [], removeAccount: jest.fn() });
  });

  it("redirects to /home when already signed in", () => {
    mockGetSession.mockReturnValue({ accessToken: "a", refreshToken: "r", expiresAt: 1 });
    mockUseUserListStore.mockReturnValue({ accounts: [ACCOUNT], removeAccount: jest.fn() });
    render(<Home />);
    expect(mockReplace).toHaveBeenCalledWith("/home");
    expect(mockReplace).not.toHaveBeenCalledWith("/login");
  });

  it("redirects to login when signed out with no accounts", () => {
    render(<Home />);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("shows the account picker when signed out but accounts exist", () => {
    mockUseUserListStore.mockReturnValue({ accounts: [ACCOUNT], removeAccount: jest.fn() });
    render(<Home />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText("选择账号")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
