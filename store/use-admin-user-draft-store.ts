import { create } from "zustand";

import type { AdminUpdateUserFormValues } from "@/lib/validations/admin";
import { useUserProfileStore } from "./use-user-profile-store";

type Draft = Partial<AdminUpdateUserFormValues>;

interface AdminUserDraftState {
  drafts: Record<number, Draft>;
  getDraft: (viewerId: number, userId: number) => Draft | undefined;
  setDraft: (viewerId: number, userId: number, draft: Draft | null) => void;
}

// Memory only. Profile identity changes invalidate every target's draft, even
// while the editor is unmounted; a stale callback cannot write for another user.
export const useAdminUserDraftStore = create<AdminUserDraftState>()((set, get) => ({
  drafts: {},
  getDraft: (viewerId, userId) =>
    viewerId > 0 && viewerId === useUserProfileStore.getState().profile.id
      ? get().drafts[userId]
      : undefined,
  setDraft: (viewerId, userId, draft) => {
    if (viewerId <= 0 || viewerId !== useUserProfileStore.getState().profile.id) return;
    set((state) => {
      const drafts = { ...state.drafts };
      if (draft && Object.keys(draft).length) drafts[userId] = { ...draft };
      else delete drafts[userId];
      return { drafts };
    });
  },
}));

useUserProfileStore.subscribe((state, previous) => {
  if (state.profile.id !== previous.profile.id) {
    useAdminUserDraftStore.setState({ drafts: {} });
  }
});
