export const COLLEGES = [
  "贝尔英才学院",
  "通信与信息工程学院",
  "电光柔学院",
  "集成电路科学与工程学院（产教融合学院）",
  "计算机学院、软件学院、网络空间安全学院",
  "自动化学院",
  "人工智能学院",
  "材料科学与工程学院",
  "化学与生命科学学院",
  "物联网学院",
  "理学院",
  "现代邮政学院、智慧交通学院",
  "数字媒体与设计艺术学院",
  "管理学院",
  "经济学院",
  "社会与人口学院、社会工作学院",
  "外国语学院",
  "教育科学与技术学院",
  "波特兰学院",
  "其他",
] as const;

export type College = (typeof COLLEGES)[number];
export type Department =
  | "software"
  | "media"
  | "electronics"
  | "office"
  | "publicity"
  | "outreach";
type LoginMethod = "github" | "lark" | "other_mail";
export type UserRole = "freshman" | "member" | "lecturer" | "admin";
export type UserState = "njupter" | "on_sast" | "retired_sast" | "is_deleted";
type EmailType = "njupt_email" | "sast_email";

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export type ApiFailure = ApiEnvelope<null>;

export type IncompleteProfileField =
  | "name"
  | "phone_number"
  | "qq_number"
  | "major";

interface AuthUser {
  id: number;
  login_email: string;
  name: string;
  role: UserRole;
  state: UserState;
  email_type: EmailType;
  created_at: string;
  /**
   * Flag from backend V010: the account still carries required profile fields
   * left blank by the legacy import, or a name equal to its student_id. A pure
   * display hint — no request is ever refused on account of it. The client
   * decides whether to route the user to the completion page.
   */
  profile_needs_completion: boolean;
  /** Field names still to be completed (PUT /user/profile keys). Empty array,
   * never null. */
  incomplete_fields: IncompleteProfileField[];
}

export interface TokenData {
  access_token: string;
  // The refresh token is optional: the frontend no longer stores it (it lives
  // in the backend's httpOnly cookie), so the backend may stop echoing it in
  // refresh responses. Login/register/exchange-code still return it today.
  refresh_token?: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface AuthResultData extends TokenData {
  user: AuthUser;
}

interface ProfileData {
  nickname?: string | null;
  department?: Department | null;
  intro?: string | null;
  email?: string | null;
  avatar?: string | null;
  blog_url?: string | null;
  github_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Identity {
  id: number;
  provider: LoginMethod;
  provider_id: string;
  identity_data: Record<string, unknown> | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileData {
  id: number;
  name: string;
  login_email: string;
  role: UserRole;
  state: UserState;
  email_type: EmailType;
  phone_number: string;
  qq_number: string;
  student_id: string;
  college: College;
  major: string;
  profile: ProfileData | null;
  identities: Identity[];
  /** Same semantics as AuthUser.profile_needs_completion, present on profile
   *  reads and the admin user list/detail. */
  profile_needs_completion: boolean;
  incomplete_fields: IncompleteProfileField[];
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  register_ticket: string;
  password: string;
  name: string;
  phone_number: string;
  qq_number: string;
  college: College;
  major: string;
  student_id: string;
  registration_state?: string;
  oauth_state?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone_number?: string;
  qq_number?: string;
  college?: College;
  major?: string;
  student_id?: string;
  nickname?: string;
  department?: Department | "";
  intro?: string;
  email?: string;
  blog_url?: string;
  github_url?: string;
}

export interface UserProfileType {
  id: number;
  nickname: string;
  name: string;
  loginEmail: string;
  email: string;
  phoneNumber: string | null;
  qqNumber: string | null;
  studentId: string | null;
  college: College | null;
  major: string | null;
  role: UserRole;
  state: UserState;
  emailType: EmailType;
  createdAt: string;
  department: Department | null;
  avatar: string | null;
  intro: string | null;
  blogUrl: string | null;
  githubUrl: string | null;
  identities: Identity[];
  /** Whether the account still carries incomplete required profile fields
   *  (backend V010 flag). Drives the completion-page routing. */
  profileNeedsCompletion: boolean;
  incompleteFields: IncompleteProfileField[];
}

export interface UserAccount {
  userId: number;
  loginEmail: string;
  name: string;
  avatar: string | null;
  session: import("@/lib/token").Session;
}

/**
 * Service health. GET /health returns this as a **bare JSON object**, not
 * wrapped in ApiEnvelope. Mirrors backend healthResponse (health/handler.go:48).
 */
export interface HealthData {
  status: "ok" | "error";
  db: "ok" | "error" | "degraded";
  redis: "ok" | "degraded";
}

// --- Admin ---

export type ClientType = "first_party" | "third_party";
export type GrantType = "authorization_code" | "refresh_token";
export type Scope = "openid" | "profile" | "email" | "admin:read" | "admin:write" | "user:read" | "user:write";

export interface AdminUserListParams {
  page?: number;
  page_size?: number;
  role?: UserRole;
  state?: UserState;
  department?: Department;
  student_id?: string;
  keyword?: string;
  /** Backend tri-state filter: absent = no filter; true = only accounts still
   *  needing completion; false = only complete accounts. */
  needs_completion?: boolean;
}

export interface AdminUserListData {
  users: UserProfileData[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminUpdateUserRequest {
  name?: string;
  phone_number?: string;
  qq_number?: string;
  college?: College;
  major?: string;
  student_id?: string;
  login_email?: string;
  role?: UserRole;
  state?: UserState;
  email_type?: EmailType;
  department?: Department;
}

/** States an admin may provision a new account in. `is_deleted` is never a
 *  creation state — a fresh account is not a deletion (backend 422). */
export const CREATE_USER_STATES = ["njupter", "on_sast", "retired_sast"] as const;
export type CreateUserState = (typeof CREATE_USER_STATES)[number];

/** Request body for `POST /admin/users` — admin provisions an account for a
 *  member who can no longer self-register (the fallback for graduated members
 *  whose school mailbox is dead). `login_email` is restricted to the
 *  registration whitelist domains; an optional `personal_email` is bound as an
 *  `other_mail` login identity in the same transaction. */
export interface AdminCreateUserRequest {
  name: string;
  phone_number: string;
  qq_number: string;
  student_id: string;
  login_email: string;
  /** Optional; backend default "" — the profile's declared major. */
  major?: string;
  /** Optional; backend default 「其他」. */
  college?: College;
  /** Optional. When supplied, bound as an `other_mail` login identity
   *  (admin-vouched, no verification) in the same transaction. */
  personal_email?: string;
  /** Optional; backend default `member`. */
  role?: UserRole;
  /** Optional; backend default `retired_sast`. */
  state?: CreateUserState;
}

/** `POST /admin/users` success payload. `initial_password` is returned exactly
 *  once — never stored, never audited — and must be captured before leaving. */
export interface AdminCreateUserData {
  id: number;
  login_email: string;
  initial_password: string;
}

export interface AdminBatchRoleUpdateRequest {
  ids: number[];
  role: UserRole;
}

export interface AdminBatchRoleUpdateResult {
  id: number;
  success: boolean;
  role?: UserRole;
  reason?: string;
}

export interface AdminBatchRoleUpdateData {
  results: AdminBatchRoleUpdateResult[];
}

export interface AdminBatchUsersData {
  users: UserProfileData[];
}

export interface AdminOAuthClient {
  id: number;
  client_id: string;
  client_name: string;
  client_type: ClientType;
  redirect_uris: string[];
  grant_types: GrantType[];
  scopes: Scope[];
  is_active: boolean;
  client_secret?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCreateOAuthClientRequest {
  client_name: string;
  client_type: ClientType;
  redirect_uris: string[];
  grant_types: GrantType[];
  scopes: Scope[];
}

export interface AdminUpdateOAuthClientRequest {
  client_name?: string;
  redirect_uris?: string[];
  is_active?: boolean;
  grant_types?: GrantType[];
  scopes?: Scope[];
}

export interface AdminAuditLogListParams {
  page?: number;
  page_size?: number;
  user_id?: number;
  action?: string;
  resource?: string;
  success?: boolean;
  start_time?: string;
  end_time?: string;
}

export interface AdminAuditLog {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  detail: Record<string, unknown> | null;
  client_ip: string | null;
  user_agent: string | null;
  success: boolean;
  err_code: number | null;
  created_at: string;
}

export interface AdminAuditLogListData {
  logs: AdminAuditLog[];
  total: number;
  page: number;
  page_size: number;
}

// --- Alumni provisioning requests ---

/** Lifecycle of an alumni account request. `pending` rows are never swept by
 *  retention — the "three working days" figure is copy, not an enforced deadline. */
export const ALUMNI_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type AlumniRequestStatus = (typeof ALUMNI_REQUEST_STATUSES)[number];

/** Body of the unauthenticated `POST /alumni-requests`.
 *
 *  Two mailboxes are mandatory and serve different purposes: `login_email` is the
 *  account identifier and stays bound by the registration whitelist (the backend
 *  derives `email_type` from it via a V001 trigger), while `personal_email` becomes
 *  an `other_mail` identity — the address the alumnus can actually receive at and
 *  the one they use to set a password through `/reset`.
 *
 *  `major` is required even though `POST /admin/users` allows it empty: V010's
 *  generated `profile_needs_completion` column flags a blank major, which would
 *  divert the new account to `/profile/complete` on its first login. */
export interface SubmitAlumniRequestRequest {
  name: string;
  student_id: string;
  login_email: string;
  personal_email: string;
  phone_number: string;
  qq_number: string;
  college: College;
  major: string;
  join_year: string;
  department_note?: string;
  note?: string;
  /** Turnstile token. The backend verifies unconditionally — there is no skip
   *  path — so a request without one is refused. */
  captcha_token: string;
}

export interface SubmitAlumniRequestData {
  id: number;
}

export interface AlumniRequest {
  id: number;
  name: string;
  student_id: string;
  login_email: string;
  personal_email: string;
  phone_number: string;
  qq_number: string;
  college: College;
  major: string;
  join_year: string;
  department_note: string;
  note: string;
  status: AlumniRequestStatus;
  reject_reason: string;
  /** Set once approved; nulled if that account is later deleted, so the request
   *  history outlives the account. */
  created_user_id: number | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  /** When the result email was accepted by SMTP. `null` means it has not landed.
   *
   *  Pairs with `notify_attempts` to separate "never tried" from "tried and did
   *  not confirm": the worker increments attempts before each delivery and writes
   *  `notified_at` only once SMTP accepts, so `notify_attempts > 0` with a null
   *  `notified_at` is a delivery that failed. */
  notified_at: string | null;
  notify_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface AlumniRequestListParams {
  page?: number;
  page_size?: number;
  status?: AlumniRequestStatus;
  keyword?: string;
  /** Filter on notification delivery. The backend accepts only true/false and
   *  answers 40000 for anything else rather than silently ignoring it, so a
   *  mistyped `notified=ture` cannot return the opposite of what was asked. */
  notified?: boolean;
}

export interface AlumniRequestListData {
  requests: AlumniRequest[];
  total: number;
  page: number;
  page_size: number;
}

/** `POST /admin/alumni-requests/:id/approve` result.
 *
 *  Deliberately carries no initial password: the approval mails the alumnus a
 *  pointer to `/reset` instead, so no plaintext credential is ever transmitted. */
export interface ApproveAlumniRequestData extends AlumniNotifyResult {
  user_id: number;
  login_email: string;
}

/** Whether a result notification made it into the delivery queue.
 *
 *  This answers a different question from `notified_at`: enqueued means the job
 *  was accepted (false when the bounded queue was full), delivered means SMTP
 *  took it. Both approve and reject report it, and the account/verdict stands
 *  either way — so a false here is something the reviewer must act on by hand. */
export interface AlumniNotifyResult {
  notify_enqueued: boolean;
}

export interface RejectAlumniRequestRequest {
  reject_reason: string;
}
