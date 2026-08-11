import { create } from "zustand";

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

// In-memory only. The store used to persist `accounts` (each carrying a session
// with refresh tokens) to localStorage via zustand persist — that put a
// permanent copy of the token outside the tab-scoped sessionStorage that
// lib/token.ts is designed around. Nothing reads `accounts` (the account
// switcher is gone), so keeping it in memory removes the token leak with no
// user-visible change. If a multi-account picker ever returns, sessions must be
// stored separately from the picker metadata.
export const useUserListStore = create<UserListState>((set) => ({
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
}));
