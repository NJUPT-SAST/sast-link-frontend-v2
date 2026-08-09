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

interface AuthUser {
  id: number;
  login_email: string;
  name: string;
  role: UserRole;
  state: UserState;
  email_type: EmailType;
  created_at: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
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
}

export interface UserAccount {
  userId: number;
  loginEmail: string;
  name: string;
  avatar: string | null;
  session: import("@/lib/token").TokenPair;
}

/**
 * Public profile card. GET /card/:id returns this as a **bare JSON object**,
 * not wrapped in the standard ApiEnvelope envelope (only error responses go
 * through the envelope). Mirrors backend cardDTO (card.go:16).
 */
export interface CardData {
  id: number;
  nickname: string | null;
  department: string | null;
  intro: string | null;
  avatar: string | null;
  blog_url: string | null;
  github_url: string | null;
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
export type Scope = "openid" | "profile" | "email";

export interface AdminUserListParams {
  page?: number;
  page_size?: number;
  role?: UserRole;
  state?: UserState;
  department?: Department;
  student_id?: string;
  keyword?: string;
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
  client_type?: ClientType;
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
