import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserAccount } from "@/lib/api/types";

interface AccountUpdate {
  userId: number;
  name?: string;
  loginEmail?: string;
  avatar?: string | null;
  session?: UserAccount["session"];
}

interface UserListState {
  accounts: UserAccount[];
  addAccount: (account: UserAccount) => void;
  updateAccount: (update: AccountUpdate) => void;
  removeAccount: (identifier: number | string) => void;
}

export const useUserListStore = create<UserListState>()(
  persist(
    (set) => ({
      accounts: [],

      addAccount: (account) =>
        set((state) => {
          const index = state.accounts.findIndex(
            (item) => item.userId === account.userId,
          );
          if (index < 0) return { accounts: [...state.accounts, account] };

          return {
            accounts: state.accounts.map((item, itemIndex) =>
              itemIndex === index ? account : item,
            ),
          };
        }),

      updateAccount: (update) =>
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.userId === update.userId
              ? { ...account, ...update }
              : account,
          ),
        })),

      removeAccount: (identifier) =>
        set((state) => ({
          accounts: state.accounts.filter((account, index) =>
            typeof identifier === "number"
              ? index !== identifier
              : account.loginEmail !== identifier,
          ),
        })),
    }),
    {
      name: "user-list-store",
      version: 2,
      migrate: () => ({ accounts: [] }),
    },
  ),
);
