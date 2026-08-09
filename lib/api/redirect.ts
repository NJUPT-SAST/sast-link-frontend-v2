import { stashAuthNext } from "@/lib/auth-next";

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  // Any 401-forced login (expired session, invalid token on a protected call)
  // should come back to the page the user was on — e.g. an OAuth consent page
  // — instead of dumping them on /home after they sign back in.
  stashAuthNext(window.location.pathname + window.location.search);
  redirectTo("/login");
}

/** Hard-navigate the browser to a URL (e.g. an OAuth callback carrying a code). */
export function redirectTo(url: string): void {
  if (typeof window !== "undefined") {
    window.location.assign(url);
  }
}
