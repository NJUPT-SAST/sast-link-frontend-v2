/** Backend business error codes this app branches on.
 *
 *  Only codes that drive distinct UI behaviour belong here — everything else is
 *  rendered from the envelope's own message. The backend's rule is that its
 *  constant set is exactly what clients can observe, so a code absent here is
 *  either never emitted or needs no special handling.
 */

/** Human verification ran and did not pass. Recoverable: the widget issues a
 *  fresh token, so the user should try again. */
export const CODE_CAPTCHA_FAILED = 40021;

/** An email address is already taken. The alumni flow reuses this for both
 *  `login_email` and `personal_email` — the outcome a client must handle is the
 *  same, so the backend deliberately did not mint a second code. It follows that
 *  the frontend cannot tell which of the two addresses collided. */
export const CODE_EMAIL_ALREADY_REGISTERED = 40901;

/** The student id already has an account. */
export const CODE_STUDENT_ID_OCCUPIED = 40902;

/** The student id already has a ticket awaiting review. Distinct from 40901/40902:
 *  nothing is registered yet, the earlier application is simply still open. */
export const CODE_ALUMNI_REQUEST_PENDING = 40906;

/** A verdict was already recorded — typically a double click, or a colleague who
 *  ruled on the same ticket first. */
export const CODE_ALUMNI_REQUEST_REVIEWED = 42204;

/** The request channel cannot accept submissions at all: no captcha secret is
 *  configured, or Cloudflare is unreachable.
 *
 *  The opposite of CODE_CAPTCHA_FAILED and must not be confused with it. Here the
 *  check could not be performed, so asking the user to solve the challenge again
 *  is meaningless — the entry point should be hidden instead. */
export const CODE_ALUMNI_REQUEST_UNAVAILABLE = 50301;
