import type {
  AlumniNotifyResult,
  AlumniRequest,
  AlumniRequestListData,
  AlumniRequestListParams,
  ApiEnvelope,
  ApproveAlumniRequestData,
  RejectAlumniRequestRequest,
  SubmitAlumniRequestData,
  SubmitAlumniRequestRequest,
} from "./types";
import { apiClient } from "./client";

/** Submit an alumni provisioning request.
 *
 *  Unauthenticated by design: the applicant has no account yet — that is the
 *  whole point of the channel. The backend gates it on a Turnstile token plus a
 *  fixed-window rate limit, and answers 50301 when no captcha secret is
 *  configured (an always-refusing verifier, never a bypass), so the caller must
 *  always carry `captcha_token`.
 */
export function submitAlumniRequest(data: SubmitAlumniRequestRequest) {
  return apiClient.post<ApiEnvelope<SubmitAlumniRequestData>>("/alumni-requests", data);
}

export function getAlumniRequests(params?: AlumniRequestListParams) {
  return apiClient.get<ApiEnvelope<AlumniRequestListData>>("/admin/alumni-requests", {
    params,
  });
}

/** One request, same shape as a list item.
 *
 *  The review dialog re-fetches through this rather than approving from the list
 *  snapshot: acting on a stale row is exactly what produces a 42204 (someone else
 *  already ruled on it).
 */
export function getAlumniRequest(id: number) {
  return apiClient.get<ApiEnvelope<AlumniRequest>>(`/admin/alumni-requests/${id}`);
}

/** Approve a request: the backend provisions the account in one transaction
 *  (binding `personal_email` as an `other_mail` identity) and mails the applicant
 *  a pointer to `/reset`. No password crosses the wire.
 */
export function approveAlumniRequest(id: number) {
  return apiClient.post<ApiEnvelope<ApproveAlumniRequestData>>(
    `/admin/alumni-requests/${id}/approve`,
    {},
  );
}

/** Reject a request. The reason is mailed to the applicant verbatim, so it is
 *  required rather than optional — a bare rejection leaves nothing to act on. */
export function rejectAlumniRequest(id: number, data: RejectAlumniRequestRequest) {
  return apiClient.post<ApiEnvelope<AlumniNotifyResult>>(
    `/admin/alumni-requests/${id}/reject`,
    data,
  );
}

/** Re-queue the result email.
 *
 *  Allowed even when `notified_at` is already set: a reviewer asking for a resend
 *  knows something the system does not (usually that the alumnus never got it).
 *  A ticket still pending answers 42200 — there is no verdict to announce yet.
 */
export function resendAlumniRequestNotification(id: number) {
  return apiClient.post<ApiEnvelope<AlumniNotifyResult>>(
    `/admin/alumni-requests/${id}/resend-notification`,
    {},
  );
}
