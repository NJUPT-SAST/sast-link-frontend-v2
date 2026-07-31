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

  const swr = useSWR(
    () => {
      const session = getSession();
      if (!session) return null;
      // Fingerprint the key by session so switching accounts or logging in
      // again invalidates the previous account's cached profile instead of
      // showing stale data under the new session.
      return `user-profile:${session.accessToken.slice(0, 16)}`;
    },
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

  return { ...swr, isLoading: swr.isLoading };
}
