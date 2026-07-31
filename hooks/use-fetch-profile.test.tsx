import { renderHook } from "@testing-library/react";

const mockSWR = jest.fn();
const getUserProfile = jest.fn();
const getSession = jest.fn();
const setProfile = jest.fn();
const updateAccount = jest.fn();

jest.mock("swr", () => ({ __esModule: true, default: (...args: unknown[]) => mockSWR(...args) }));
jest.mock("@/lib/api/user", () => ({ getUserProfile: (...args: unknown[]) => getUserProfile(...args) }));
jest.mock("@/lib/token", () => ({ getSession: () => getSession() }));
jest.mock("@/store/use-user-profile-store", () => ({ useUserProfileStore: (selector: (state: { setProfile: typeof setProfile }) => unknown) => selector({ setProfile }) }));
jest.mock("@/store/use-user-list-store", () => ({ useUserListStore: (selector: (state: { updateAccount: typeof updateAccount }) => unknown) => selector({ updateAccount }) }));

import { useFetchProfile } from "./use-fetch-profile";

const data = { id: 1, name: "Alice", login_email: "alice@njupt.edu.cn", role: "member", state: "on_sast", email_type: "njupt_email", phone_number: "", qq_number: "", student_id: "B24040001", college: "其他", major: "软件工程", profile: { nickname: "Alice", avatar: "/avatar.png", email: "alice@example.com" }, identities: [], created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };

describe("useFetchProfile", () => {
  beforeEach(() => { jest.clearAllMocks(); mockSWR.mockReturnValue({}); });

  it("disables fetching without a session", () => {
    getSession.mockReturnValue(null);
    renderHook(() => useFetchProfile());
    expect((mockSWR.mock.calls[0][0] as () => string | null)()).toBeNull();
  });

  it("maps v2 profile and synchronizes stores", async () => {
    getSession.mockReturnValue({ accessToken: "access" });
    getUserProfile.mockResolvedValue({ data: { data } });
    mockSWR.mockImplementation((key, fetcher, options) => ({ key: key(), fetcher, options }));
    const { result } = renderHook(() => useFetchProfile());
    const swr = result.current as unknown as { fetcher: () => Promise<unknown> };
    await swr.fetcher();
    expect(setProfile).toHaveBeenCalledWith(expect.objectContaining({ id: 1, nickname: "Alice", email: "alice@example.com" }));
    expect(updateAccount).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, loginEmail: "alice@njupt.edu.cn" }));
  });
});
