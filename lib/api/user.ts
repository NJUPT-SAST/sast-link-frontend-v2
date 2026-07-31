import type {
  ApiEnvelope,
  Identity,
  UpdateProfileRequest,
  UserProfileData,
} from "./types";
import { apiClient } from "./client";

export function getUserProfile() {
  return apiClient.get<ApiEnvelope<UserProfileData>>("/user/profile");
}

export function updateUserProfile(data: UpdateProfileRequest) {
  return apiClient.put<
    ApiEnvelope<{ message: string; user: UserProfileData }>
  >("/user/profile", data);
}

export function uploadAvatar(file: Blob) {
  const formData = new FormData();
  formData.append("file", file, "avatar.png");
  return apiClient.put<ApiEnvelope<{ avatar_url: string }>>(
    "/user/avatar",
    formData,
  );
}

export function getUserIdentities() {
  return apiClient.get<ApiEnvelope<{ identities: Identity[] }>>(
    "/user/identities",
  );
}

/**
 * Bind a third-party account to the current user. `redirectUri` must echo the
 * one used when the authorize URL was built — the backend exchanges the code
 * against it.
 */
export function bindGithub(code: string, redirectUri?: string) {
  return apiClient.post<ApiEnvelope<{ identity: Identity }>>(
    "/user/identities/github",
    null,
    { params: { code, redirect_uri: redirectUri } },
  );
}

export function bindLark(code: string, redirectUri?: string) {
  return apiClient.post<ApiEnvelope<{ identity: Identity }>>(
    "/user/identities/lark",
    null,
    { params: { code, redirect_uri: redirectUri } },
  );
}

export function bindEmail(email: string) {
  return apiClient.post<ApiEnvelope<{ bind_ticket: string; expires_in: number }>>(
    "/user/identities/email",
    { email },
  );
}

export function verifyBindEmail(bindTicket: string, code: string) {
  return apiClient.post<ApiEnvelope<{ message: string; identity: Identity }>>(
    "/user/identities/email/verify",
    { bind_ticket: bindTicket, code },
  );
}

export function unbindIdentity(id: number, password: string) {
  return apiClient.delete<ApiEnvelope<{ message: string }>>(
    `/user/identities/${id}`,
    { data: { password } },
  );
}
