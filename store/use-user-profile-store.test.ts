import { useUserProfileStore, initialProfile } from "./use-user-profile-store";

const alice = { ...initialProfile, id: 1, nickname: "Alice", name: "Alice", email: "alice@example.com", intro: "Hello" };

describe("useUserProfileStore", () => {
  beforeEach(() => useUserProfileStore.getState().resetProfile());

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

  it("keeps an account's draft across profile refreshes and partial updates", () => {
    const store = useUserProfileStore.getState();
    store.setProfile(alice);
    store.setProfileDraft(alice.id, { nickname: "  draft  ", intro: "" });
    store.setProfile({ ...alice, name: "Updated" });
    store.updateProfile({ avatar: "avatar.png" });
    expect(useUserProfileStore.getState().profileDraft).toEqual({ nickname: "  draft  ", intro: "" });
  });

  it("clears drafts on logout or account changes", () => {
    const store = useUserProfileStore.getState();
    store.setProfile(alice);
    store.setProfileDraft(alice.id, { nickname: "private draft" });
    store.resetProfile();
    expect(useUserProfileStore.getState().profileDraft).toBeNull();
    store.setProfile(alice);
    store.setProfileDraft(alice.id, { nickname: "private draft" });
    store.setProfile({ ...alice, id: 2 });
    expect(useUserProfileStore.getState().profileDraft).toBeNull();
    store.setProfileDraft(2, { intro: "another draft" });
    store.updateProfile({ id: 3 });
    expect(useUserProfileStore.getState().profileDraft).toBeNull();
  });

  it("rejects drafts from an unloaded or different account", () => {
    const store = useUserProfileStore.getState();
    store.setProfileDraft(0, { nickname: "unloaded" });
    expect(useUserProfileStore.getState().profileDraft).toBeNull();
    store.setProfile(alice);
    store.setProfileDraft(2, { nickname: "wrong account" });
    expect(useUserProfileStore.getState().profileDraft).toBeNull();
  });
});
