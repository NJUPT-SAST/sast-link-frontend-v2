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
