import type {
  ApiEnvelope,
  AuthResultData,
  RegisterRequest,
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

export function logout(refreshTokenValue: string) {
  return apiClient.post<ApiEnvelope<{ message: string }>>("/auth/logout", {
    refresh_token: refreshTokenValue,
  });
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
