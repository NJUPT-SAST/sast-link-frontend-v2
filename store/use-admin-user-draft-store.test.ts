import { useAdminUserDraftStore } from "./use-admin-user-draft-store";
import { initialProfile, useUserProfileStore } from "./use-user-profile-store";

const setViewer = (id: number) => useUserProfileStore.getState().setProfile({ ...initialProfile, id, role: "admin" });

beforeEach(() => {
  useUserProfileStore.getState().resetProfile();
  setViewer(2);
});

it("keeps each target's changed fields separate", () => {
  const store = useAdminUserDraftStore.getState();
  store.setDraft(2, 7, { name: "张三" });
  store.setDraft(2, 8, { major: "软件工程" });
  expect(store.getDraft(2, 7)).toEqual({ name: "张三" });
  expect(store.getDraft(2, 8)).toEqual({ major: "软件工程" });
  store.setDraft(2, 7, null);
  expect(store.getDraft(2, 7)).toBeUndefined();
  expect(store.getDraft(2, 8)).toEqual({ major: "软件工程" });
});

it("clears drafts on account switch and refuses writes from the previous viewer", () => {
  const store = useAdminUserDraftStore.getState();
  store.setDraft(2, 7, { name: "张三" });
  setViewer(3);
  store.setDraft(2, 7, { name: "旧请求" });
  expect(store.getDraft(3, 7)).toBeUndefined();
  setViewer(2);
  expect(store.getDraft(2, 7)).toBeUndefined();
});

it("clears drafts when the current profile is reset", () => {
  const store = useAdminUserDraftStore.getState();
  store.setDraft(2, 7, { name: "张三" });
  useUserProfileStore.getState().resetProfile();
  setViewer(2);
  expect(store.getDraft(2, 7)).toBeUndefined();
});
