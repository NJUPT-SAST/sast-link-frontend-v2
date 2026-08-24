/** Support / operations contact, distinct from `LEGAL_CONTACT_EMAIL`.
 *
 *  The two addresses happen to be identical today, but they answer different
 *  questions — one is the privacy-policy contact of record, the other is where
 *  operational requests go. Keeping them apart means changing the support inbox
 *  cannot silently rewrite a legal document.
 */
export const SUPPORT_EMAIL = "link@sast.fun";

/** Stated turnaround for an alumni account request.
 *
 *  Copy only. Nothing enforces it: the backend does not expire pending requests,
 *  and no timer is shown. It exists so an applicant knows when to follow up
 *  instead of re-submitting.
 */
export const ALUMNI_REVIEW_WINDOW = "三个工作日";
