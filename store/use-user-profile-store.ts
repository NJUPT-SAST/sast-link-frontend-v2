import { create } from "zustand";

import type { UserProfileType } from "@/lib/api/types";
import type { ProfileEditFormValues } from "@/lib/validations/profile";

export type ProfileDraft = Partial<ProfileEditFormValues>;

interface UserProfileState {
  profile: UserProfileType;
  profileDraft: ProfileDraft | null;
  setProfileDraft: (userId: number, draft: ProfileDraft | null) => void;
  setProfile: (profile: UserProfileType) => void;
  updateProfile: (fields: Partial<UserProfileType>) => void;
  resetProfile: () => void;
}

export const initialProfile: UserProfileType = {
  id: 0,
  nickname: "",
  name: "",
  loginEmail: "",
  email: "",
  phoneNumber: null,
  qqNumber: null,
  studentId: null,
  college: null,
  major: null,
  role: "freshman",
  state: "njupter",
  emailType: "njupt_email",
  createdAt: "",
  department: null,
  avatar: null,
  intro: null,
  blogUrl: null,
  githubUrl: null,
  identities: [],
  profileNeedsCompletion: false,
  incompleteFields: [],
};

export const useUserProfileStore = create<UserProfileState>()((set) => ({
  profile: initialProfile,
  // Deliberately memory-only: personal edits survive SPA navigation, not logout.
  profileDraft: null,
  setProfileDraft: (userId, profileDraft) =>
    set((state) => userId !== 0 && userId === state.profile.id ? { profileDraft } : state),
  setProfile: (profile) => set((state) => ({
    profile,
    profileDraft: profile.id === state.profile.id ? state.profileDraft : null,
  })),
  updateProfile: (fields) =>
    set((state) => ({
      profile: { ...state.profile, ...fields },
      profileDraft: fields.id === undefined || fields.id === state.profile.id ? state.profileDraft : null,
    })),
  resetProfile: () => set({ profile: initialProfile, profileDraft: null }),
}));
