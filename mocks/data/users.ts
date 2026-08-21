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
        department: "software",
        intro: "Full-stack developer",
        email: "alice@example.com",
        avatar: DEFAULT_AVATAR,
        blog_url: "https://example.com",
        github_url: "https://github.com/alice",
      },
      identities: [identity(1, "github", "alice")],
      profile_needs_completion: false,
      incomplete_fields: [],
      created_at: createdAt,
      updated_at: createdAt,
    },
  },
  {
    id: 2,
    loginEmail: "admin@njupt.edu.cn",
    password: "Password123",
    refreshToken: "refresh-admin",
    profile: {
      id: 2,
      name: "Admin",
      login_email: "admin@njupt.edu.cn",
      role: "admin",
      state: "on_sast",
      email_type: "njupt_email",
      phone_number: "13800000000",
      qq_number: "10000",
      student_id: "B24040002",
      college: "计算机学院、软件学院、网络空间安全学院",
      major: "软件工程",
      profile: {
        nickname: "Admin",
        department: "software",
        intro: null,
        email: "admin@example.com",
        avatar: DEFAULT_AVATAR,
        blog_url: null,
        github_url: null,
      },
      identities: [],
      profile_needs_completion: false,
      incomplete_fields: [],
      created_at: createdAt,
      updated_at: createdAt,
    },
  },
  {
    id: 3,
    loginEmail: "lecturer@njupt.edu.cn",
    password: "Password123",
    refreshToken: "refresh-lecturer",
    profile: {
      id: 3,
      name: "Lecturer",
      login_email: "lecturer@njupt.edu.cn",
      role: "lecturer",
      state: "on_sast",
      email_type: "njupt_email",
      phone_number: "13800000001",
      qq_number: "10001",
      student_id: "B24040003",
      college: "通信与信息工程学院",
      major: "通信工程",
      profile: {
        nickname: "Lecturer",
        department: null,
        intro: null,
        email: "lecturer@example.com",
        avatar: DEFAULT_AVATAR,
        blog_url: null,
        github_url: null,
      },
      identities: [],
      profile_needs_completion: false,
      incomplete_fields: [],
      created_at: createdAt,
      updated_at: createdAt,
    },
  },
  {
    id: 4,
    loginEmail: "bob@njupt.edu.cn",
    password: "Password123",
    refreshToken: "refresh-bob",
    profile: {
      id: 4,
      name: "Bob",
      login_email: "bob@njupt.edu.cn",
      role: "admin",
      state: "on_sast",
      email_type: "njupt_email",
      phone_number: "13800000002",
      qq_number: "10002",
      student_id: "B24040004",
      college: "计算机学院、软件学院、网络空间安全学院",
      major: "信息安全",
      profile: {
        nickname: "Bob",
        department: "software",
        intro: "Platform admin",
        email: "bob@example.com",
        avatar: DEFAULT_AVATAR,
        blog_url: null,
        github_url: "https://github.com/bob",
      },
      identities: [identity(4, "github", "bob")],
      profile_needs_completion: false,
      incomplete_fields: [],
      created_at: createdAt,
      updated_at: createdAt,
    },
  },
  {
    id: 5,
    loginEmail: "b24040525@njupt.edu.cn",
    password: "Password123",
    refreshToken: "refresh-b24040525",
    profile: {
      // Migration-debris account (V010): blank major/phone/qq and name equal to
      // student_id, kept live in the njupter state so it exercises the admin
      // overview's "未补全" fold (GET /admin/stats incomplete_by_role /
      // incomplete_by_state) against the same shape the backend flags.
      id: 5,
      name: "B24040525",
      login_email: "b24040525@njupt.edu.cn",
      role: "freshman",
      state: "njupter",
      email_type: "njupt_email",
      phone_number: "",
      qq_number: "",
      student_id: "B24040525",
      college: "计算机学院、软件学院、网络空间安全学院",
      major: "",
      profile: {
        nickname: "",
        department: null,
        intro: null,
        email: "b24040525@njupt.edu.cn",
        avatar: DEFAULT_AVATAR,
        blog_url: null,
        github_url: null,
      },
      identities: [],
      profile_needs_completion: true,
      incomplete_fields: ["name", "phone_number", "qq_number", "major"],
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
    profile: { id, name: input.name, login_email: input.loginEmail, role: "freshman", state: "njupter", email_type: input.loginEmail.endsWith("@sast.fun") ? "sast_email" : "njupt_email", phone_number: input.phoneNumber, qq_number: input.qqNumber, student_id: input.studentId, college: input.college, major: input.major, profile: { nickname: input.name, department: null, intro: null, email: input.loginEmail, avatar: null, blog_url: null, github_url: null }, identities: [], profile_needs_completion: false, incomplete_fields: [], created_at: createdAt, updated_at: createdAt },
  };
  mockUsers.push(user);
  return user;
}

// The shared mockUser array is mutated by handlers (token rotation, password
// changes, new registrations). Tests run in parallel workers, so a mutation in
// one suite leaks into the next unless the array is restored per test. The
// snapshot is deep-cloned on first use so later resets never alias it.
let usersSnapshot: MockUser[] | null = null;

export function resetUsers() {
  if (!usersSnapshot) {
    usersSnapshot = structuredClone(mockUsers);
  }
  mockUsers.length = 0;
  mockUsers.push(...structuredClone(usersSnapshot));
}

