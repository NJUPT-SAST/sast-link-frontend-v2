import type {
  ApiEnvelope,
  AuthResultData,
  RegisterRequest,
  TokenData,
} from "./types";
import { apiClient } from "./client";

export function registerSendCode(loginEmail: string) {
  return apiClient.post<ApiEnvelope<{ message: string; expires_in: number }>>(
    "/auth/register/send-code",
    { login_email: loginEmail },
  );
}

export function registerVerifyCode(loginEmail: string, code: string) {
  return apiClient.post<
    ApiEnvelope<{ register_ticket: string; expires_in: number }>
  >("/auth/register/verify-code", { login_email: loginEmail, code });
}

export function completeRegister(data: RegisterRequest) {
  return apiClient.post<ApiEnvelope<AuthResultData>>("/auth/register", data);
}

export function passwordLogin(loginEmail: string, password: string) {
  return apiClient.post<ApiEnvelope<AuthResultData>>("/user/login", {
    login_email: loginEmail,
    password,
  });
}

/**
 * Cold-tab session bootstrap. A fresh tab holds no sessionStorage session, but
 * the browser still carries the backend's httpOnly session cookie (set on
 * login/refresh) on this same-origin call. The backend treats the cookie as the
 * refresh credential and rotates it — 200 returns a fresh token pair the
 * frontend rebuilds its session from; 401 means no (or dead) cookie, so the
 * visitor is genuinely signed out. A POST keeps it side-effect-free of the
 * GET-CSRF class, and the existing 30s refresh-grace window absorbs concurrent
 * cold starts from several tabs. The short timeout bounds how long a dead
 * backend can leave a page on its loading state.
 */
export function refreshFromCookie() {
  return apiClient.post<ApiEnvelope<TokenData>>("/auth/refresh", {}, { timeout: 5_000 });
}

export function logout() {
  // The refresh token lives only in the httpOnly session cookie, which this
  // call carries (empty body); the backend revokes the session family and
  // clears the cookie. No stored token is sent.
  return apiClient.post<ApiEnvelope<{ message: string }>>("/auth/logout", {});
}

export function changePassword(oldPassword: string, newPassword: string) {
  return apiClient.post<ApiEnvelope<{ message: string }>>(
    "/auth/change-password",
    { old_password: oldPassword, new_password: newPassword },
  );
}

export function forgotPasswordSendCode(loginEmail: string) {
  return apiClient.post<ApiEnvelope<{ message: string; expires_in: number }>>(
    "/auth/forgot-password/send-code",
    { login_email: loginEmail },
  );
}

export function resetPassword(
  loginEmail: string,
  code: string,
  newPassword: string,
) {
  return apiClient.post<ApiEnvelope<{ message: string }>>(
    "/auth/reset-password",
    {
      login_email: loginEmail,
      code,
      new_password: newPassword,
    },
  );
}
