import { renderHook } from "@testing-library/react";

import { useCompletionRedirect } from "./use-completion-redirect";

const mockRouterReplace = jest.fn();
let mockPathname = "/home";
let mockNeedsCompletion = false;
let mockIncompleteFields: string[] = [];

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => mockPathname,
}));

jest.mock("@/hooks/use-fetch-profile", () => ({
  useFetchProfile: () => ({}),
}));

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: unknown }) => unknown) =>
    selector({
      profile: {
        profileNeedsCompletion: mockNeedsCompletion,
        incompleteFields: mockIncompleteFields,
      },
    }),
}));

describe("useCompletionRedirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/home";
    mockNeedsCompletion = false;
    mockIncompleteFields = [];
  });

  it("redirects an incomplete account to the completion page", () => {
    mockNeedsCompletion = true;
    mockIncompleteFields = ["name"];
    renderHook(() => useCompletionRedirect());
    expect(mockRouterReplace).toHaveBeenCalledWith("/profile/complete");
  });

  it("does not redirect a complete account", () => {
    renderHook(() => useCompletionRedirect());
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("does not redirect on the completion page itself (no loop)", () => {
    mockPathname = "/profile/complete";
    mockNeedsCompletion = true;
    mockIncompleteFields = ["name"];
    renderHook(() => useCompletionRedirect());
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("does not redirect while editing the profile (exempt)", () => {
    mockPathname = "/profile/edit";
    mockNeedsCompletion = true;
    mockIncompleteFields = ["name"];
    renderHook(() => useCompletionRedirect());
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
