import {
  clearPKCEVerifier,
  exchangeLoginCode,
  readPKCEVerifier,
} from "@/lib/api/oauth";
import { clearAccountDataCache } from "@/lib/api/session-keys";
import { postAuthDestination } from "@/lib/auth-destination";
import { createSession, setSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";

/**
 * Redeem a one-time login_code into this tab's session: cache the tokens,
 * reset the (stale) profile snapshot, register the account in the account
 * switcher, and compute where the user should land.
 *
 * Both OAuth entrances share this leg — the authorize-page callback
 * (/oauth/callback) and the Feishu in-client app-code login — so their
 * session semantics cannot drift apart. The PKCE verifier staged at
 * initiation rides along (the backend, PR #111, refuses redemption without
 * it). It is peeked rather than consumed: a transient network failure leaves
 * the code unconsumed server-side and the retry needs the same verifier; it
 * is cleared only after definitive success.
 */
export async function establishLoginCodeSession(loginCode: string): Promise<string> {
  const response = await exchangeLoginCode(loginCode, readPKCEVerifier());
  clearPKCEVerifier();
  const data = response.data.data;
  const session = createSession(data.access_token, data.expires_in);
  setSession(session);
  // The account just changed: drop the previous account's SWR cache
  // (identities/grants/badge) so the new account never renders its data.
  void clearAccountDataCache();
  useUserProfileStore.getState().resetProfile();
  useUserListStore.getState().addAccount({
    userId: data.user.id,
    loginEmail: data.user.login_email,
    name: data.user.name,
    avatar: null,
    session,
  });
  return postAuthDestination(data, "/home");
}
