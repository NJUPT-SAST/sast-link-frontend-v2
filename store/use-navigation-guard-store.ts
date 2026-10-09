import { create } from "zustand";

interface NavigationGuardState {
  /** whether the currently mounted page has unsaved changes */
  blocked: boolean;
  /** path+search of the guarded page, used to restore the URL after a
   * popstate was cancelled — null while not blocked */
  guardUrl: string | null;
  setBlocked: (blocked: boolean) => void;
}

export const useNavigationGuardStore = create<NavigationGuardState>()(
  (set) => ({
    blocked: false,
    guardUrl: null,
    setBlocked: (blocked) =>
      set(
        blocked
          ? {
              blocked: true,
              // The guard state belongs to the currently dirty page, so the
              // URL is captured from live location, not from a route prop.
              guardUrl:
                window.location.pathname + window.location.search,
            }
          : { blocked: false, guardUrl: null },
      ),
  }),
);
