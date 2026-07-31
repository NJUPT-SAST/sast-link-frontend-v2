import { useUserProfileStore, initialProfile } from "./use-user-profile-store";

const alice = { ...initialProfile, id: 1, nickname: "Alice", name: "Alice", email: "alice@example.com", intro: "Hello" };

describe("useUserProfileStore", () => {
  beforeEach(() => useUserProfileStore.setState({ profile: initialProfile }));

  it("sets and partially updates v2 profile fields", () => {
    useUserProfileStore.getState().setProfile(alice);
    useUserProfileStore.getState().updateProfile({ intro: "Updated", blogUrl: "https://example.com" });
    expect(useUserProfileStore.getState().profile).toEqual({ ...alice, intro: "Updated", blogUrl: "https://example.com" });
  });

  it("resets the profile", () => {
    useUserProfileStore.getState().setProfile(alice);
    useUserProfileStore.getState().resetProfile();
    expect(useUserProfileStore.getState().profile).toEqual(initialProfile);
  });
});
