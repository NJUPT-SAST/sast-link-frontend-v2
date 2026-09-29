/** Mirror of the backend's `validate.IsNjuptEmailLocalAllowed` (PR #101): an
 *  @njupt.edu.cn local part must be one letter + eight digits, or bare eight
 *  digits — judged lowercased, subaddressing (`b24040525+x`) refused because
 *  login_email is the account's own address, not a delivery alias. Addresses
 *  on any other domain (incl. @sast.fun) are unconstrained. Handlers chain it
 *  exactly where the service layer does, ahead of uniqueness checks. */
export function njuptLocalAllowed(email: string): boolean {
  const domain = "@njupt.edu.cn";
  if (!email.toLowerCase().endsWith(domain)) return true;
  const local = email.slice(0, email.length - domain.length).toLowerCase();
  return /^[a-z]\d{8}$/.test(local) || /^\d{8}$/.test(local);
}

/** Backend `validate.MaxLoginEmailLength` (255). */
export const MAX_LOGIN_EMAIL_LENGTH = 255;
