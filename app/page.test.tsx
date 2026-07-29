import { render } from "@testing-library/react";
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

// Mock Zustand store
jest.mock("@/store/use-user-list-store", () => ({
  useUserListStore: () => ({
    accounts: [],
    removeAccount: jest.fn(),
  }),
}));

describe("Home Page", () => {
  it("redirects to login when no accounts exist", () => {
    render(<Home />);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
