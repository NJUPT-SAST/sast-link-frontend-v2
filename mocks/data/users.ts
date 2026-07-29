import type {
  College,
  Identity,
  UserProfileData,
} from "@/lib/api/types";
import { DEFAULT_AVATAR } from "@/lib/constants/profile";

export interface MockUser {
  id: number;
  loginEmail: string;
  password: string;
  refreshToken: string;
  profile: UserProfileData;
}

const createdAt = "2026-01-01T00:00:00Z";

export const mockUsers: MockUser[] = [
  {
    id: 1,
    loginEmail: "alice@njupt.edu.cn",
    password: "Password123",
    refreshToken: "refresh-alice",
    profile: {
      id: 1,
      name: "Alice",
      login_email: "alice@njupt.edu.cn",
      role: "member",
      state: "on_sast",
      email_type: "njupt_email",
      phone_number: "13800138000",
      qq_number: "123456789",
      student_id: "B24040001",
      college: "计算机学院、软件学院、网络空间安全学院",
      major: "软件工程",
      profile: {
        nickname: "Alice",
        department: "软件研发部",
        intro: "Full-stack developer",
        email: "alice@example.com",
        avatar: DEFAULT_AVATAR,
        blog_url: "https://example.com",
        github_url: "https://github.com/alice",
      },
      identities: [identity(1, "github", "alice")],
      created_at: createdAt,
      updated_at: createdAt,
    },
  },
];

export function identity(id: number, provider: Identity["provider"], providerId: string): Identity {
  return { id, provider, provider_id: providerId, identity_data: null, token_expires_at: null, created_at: createdAt, updated_at: createdAt };
}

export function findUserByEmail(email: string) {
  return mockUsers.find((user) => user.loginEmail === email);
}

export function findUserByAccessToken(token: string) {
  const match = /^access-(\d+)-/.exec(token);
  return match ? mockUsers.find((user) => user.id === Number(match[1])) : undefined;
}

export function issueTokens(user: MockUser) {
  user.refreshToken = `refresh-${user.id}-${Date.now()}`;
  return { access_token: `access-${user.id}-${Date.now()}`, refresh_token: user.refreshToken, token_type: "Bearer" as const, expires_in: 3600 };
}

export function createMockUser(input: { loginEmail: string; password: string; name: string; phoneNumber: string; qqNumber: string; college: College; major: string; studentId: string }) {
  const id = Math.max(0, ...mockUsers.map((user) => user.id)) + 1;
  const user: MockUser = {
    id, loginEmail: input.loginEmail, password: input.password, refreshToken: "",
    profile: { id, name: input.name, login_email: input.loginEmail, role: "freshman", state: "njupter", email_type: input.loginEmail.endsWith("@sast.fun") ? "sast_email" : "njupt_email", phone_number: input.phoneNumber, qq_number: input.qqNumber, student_id: input.studentId, college: input.college, major: input.major, profile: { nickname: input.name, department: null, intro: null, email: input.loginEmail, avatar: null, blog_url: null, github_url: null }, identities: [], created_at: createdAt, updated_at: createdAt },
  };
  mockUsers.push(user);
  return user;
}
