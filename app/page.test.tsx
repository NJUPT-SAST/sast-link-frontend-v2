import { render, screen } from "@testing-library/react";
import Home from "./page";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

const mockGetSession = jest.fn();
jest.mock("@/lib/token", () => ({
  getSession: () => mockGetSession(),
}));

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue(null);
  });

  it("redirects to /home when already signed in", () => {
    mockGetSession.mockReturnValue({ accessToken: "a", refreshToken: "r", expiresAt: 1 });
    render(<Home />);
    expect(mockReplace).toHaveBeenCalledWith("/home");
    expect(mockReplace).not.toHaveBeenCalledWith("/login");
  });

  it("shows the starfield landing with login and register entry when signed out", () => {
    render(<Home />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "SAST Link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "登录" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "注册" })).toHaveAttribute("href", "/register");
  });
});
