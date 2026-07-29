"use client";

import useSWR from "swr";

import { mapProfile } from "@/lib/api/mappers";
import { getUserProfile } from "@/lib/api/user";
import { getSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";

export function useFetchProfile() {
  const setProfile = useUserProfileStore((state) => state.setProfile);
  const updateAccount = useUserListStore((state) => state.updateAccount);

  return useSWR(
    () => (getSession() ? "user-profile" : null),
    async () => {
      const response = await getUserProfile();
      const data = response.data.data;
      const profile = mapProfile(data);

      setProfile(profile);
      updateAccount({
        userId: profile.id,
        name: profile.nickname,
        loginEmail: data.login_email,
        avatar: profile.avatar,
      });
      return profile;
    },
    { revalidateOnFocus: false },
  );
}
