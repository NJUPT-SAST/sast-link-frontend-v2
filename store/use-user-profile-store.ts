import { create } from "zustand";

import type { UserProfileType } from "@/lib/api/types";

interface UserProfileState {
  profile: UserProfileType;
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
  setProfile: (profile) => set({ profile }),
  updateProfile: (fields) =>
    set((state) => ({ profile: { ...state.profile, ...fields } })),
  resetProfile: () => set({ profile: initialProfile }),
}));
