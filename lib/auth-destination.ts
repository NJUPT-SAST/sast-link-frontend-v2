import type { AuthResultData } from "@/lib/api/types";
import { consumeAuthNext } from "@/lib/auth-next";

/**
 * Post-login landing for a just-completed authentication, honouring a pending
 * auth-next destination (e.g. an OAuth consent request) first, then degrading
 * to the completion page for accounts still carrying legacy migration debris,
 * then the provided fallback (normally the homepage).
 *
 * The completion flag on the authenticated `user` is the frontend's cue to
 * route these accounts to the guided completion page. It is a soft hint only —
 * the backend never refuses a request on account of it — so a pending authNext
 * still wins (an account mid-consent should finish the authorization before
 * being asked to complete its profile). New signups and third-party logins
 * that submitted a full profile already return needs_completion=false and land
 * on the homepage as before.
 */
export function postAuthDestination(
  authResult: Pick<AuthResultData, "user">,
  fallback: string,
): string {
  return consumeAuthNext(
    authResult.user.profile_needs_completion ? "/profile/complete" : fallback,
  );
}
