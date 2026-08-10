"use client";

import { useCallback } from "react";
import { useSWRConfig } from "swr";

import { profileKey } from "@/lib/api/profile";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { useUserListStore } from "@/store/use-user-list-store";

/**
 * Apply an uploaded avatar everywhere it is shown: the profile store (top bar,
 * profile card, pages), the account switcher entry, and the SWR cache so a
 * background revalidation does not flash the old URL back.
 */
export function useAvatarUpload() {
  const profile = useUserProfileStore((s) => s.profile);
  const updateProfile = useUserProfileStore((s) => s.updateProfile);
  const updateAccount = useUserListStore((s) => s.updateAccount);
  const { mutate } = useSWRConfig();

  return useCallback(
    (url: string) => {
      updateProfile({ avatar: url });
      updateAccount({ userId: profile.id, avatar: url });
      const key = profileKey();
      if (key) mutate(key);
    },
    [profile.id, updateProfile, updateAccount, mutate],
  );
}
