import { exchangeLoginCode } from "@/lib/api/oauth";
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
 * session semantics cannot drift apart.
 */
export async function establishLoginCodeSession(loginCode: string): Promise<string> {
  const response = await exchangeLoginCode(loginCode);
  const data = response.data.data;
  const session = createSession(data.access_token, data.expires_in);
  setSession(session);
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
