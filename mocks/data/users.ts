import type {
  College,
  Department,
  Identity,
  UserProfileData,
  UserRole,
  UserState,
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

// --- Demo volume ---------------------------------------------------------
//
// The four hand-written accounts above are the ones tests and flows log in as;
// they are too few to read as a distribution in the admin overview donuts. The
// seed below pads the set so the role / state / department mix (and the folded
// 未补全 slice) is legible while developing against the mock.
//
// Deterministic on purpose: every field is derived from the index, so a reload
// shows the same numbers and the donut percentages do not drift between runs.
interface SeedSpec {
  count: number;
  role: UserRole;
  state: UserState;
  department: Department | null;
  /** Migration debris (V010): blank required fields and name equal to student_id. */
  incomplete?: boolean;
}

// Chosen so each donut has a clear majority plus a visible 未补全 slice:
// roles freshman 18 / member 22 / lecturer 4 / admin 2 (+ the 4 fixtures),
// states njupter 20 / on_sast 20 / retired_sast 4 / is_deleted 2,
// unfinished 9 = 7 freshman + 2 member, of which 7 are njupter.
const SEED_SPECS: SeedSpec[] = [
  { count: 11, role: "freshman", state: "njupter", department: null },
  { count: 7, role: "freshman", state: "njupter", department: null, incomplete: true },
  { count: 9, role: "member", state: "on_sast", department: "software" },
  { count: 7, role: "member", state: "on_sast", department: "media" },
  { count: 2, role: "member", state: "on_sast", department: "software", incomplete: true },
  { count: 4, role: "member", state: "retired_sast", department: "software" },
  { count: 3, role: "lecturer", state: "on_sast", department: "software" },
  // An unfinished lecturer and admin: both must stay out of the 未补全 slice,
  // so the mock exercises the exclusion rather than only the happy path.
  { count: 1, role: "lecturer", state: "on_sast", department: "media", incomplete: true },
  { count: 1, role: "admin", state: "on_sast", department: "software" },
  { count: 1, role: "admin", state: "on_sast", department: "software", incomplete: true },
  // Soft-deleted accounts are a state bit, not a deleted_at column: they must
  // drop out of total / by_role yet stay visible in by_state.
  { count: 1, role: "member", state: "is_deleted", department: "software" },
  { count: 1, role: "freshman", state: "is_deleted", department: null, incomplete: true },
];

const SEED_COLLEGE: College = "计算机学院、软件学院、网络空间安全学院";
const SEED_MAJORS = ["软件工程", "计算机科学与技术", "信息安全", "网络工程"];
const SEED_SURNAMES = ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈"];
const SEED_GIVEN_NAMES = ["子轩", "雨桐", "思远", "欣怡", "浩然", "梦琪", "宇航", "佳怡"];

function seedUser(index: number, spec: SeedSpec): MockUser {
  // Ids continue after the hand-written fixtures so login tokens stay stable.
  const id = 100 + index;
  const studentId = `B240${String(41000 + index)}`;
  const loginEmail = `${studentId.toLowerCase()}@njupt.edu.cn`;
  const name = spec.incomplete
    ? studentId // V010 flags name === student_id as debris
    : `${SEED_SURNAMES[index % SEED_SURNAMES.length]}${SEED_GIVEN_NAMES[index % SEED_GIVEN_NAMES.length]}`;

  return {
    id,
    loginEmail,
    password: "Password123",
    refreshToken: `refresh-${studentId.toLowerCase()}`,
    profile: {
      id,
      name,
      login_email: loginEmail,
      role: spec.role,
      state: spec.state,
      email_type: "njupt_email",
      phone_number: spec.incomplete ? "" : `138${String(10000000 + index * 7)}`,
      qq_number: spec.incomplete ? "" : String(100000 + index * 13),
      student_id: studentId,
      college: SEED_COLLEGE,
      major: spec.incomplete ? "" : SEED_MAJORS[index % SEED_MAJORS.length],
      profile: {
        nickname: spec.incomplete ? "" : name,
        department: spec.department,
        intro: null,
        email: loginEmail,
        avatar: DEFAULT_AVATAR,
        blog_url: null,
        github_url: null,
      },
      identities: [],
      profile_needs_completion: spec.incomplete === true,
      incomplete_fields: spec.incomplete
        ? ["name", "phone_number", "qq_number", "major"]
        : [],
      created_at: createdAt,
      updated_at: createdAt,
    },
  };
}

let seedIndex = 0;
for (const spec of SEED_SPECS) {
  for (let n = 0; n < spec.count; n += 1) {
    mockUsers.push(seedUser(seedIndex, spec));
    seedIndex += 1;
  }
}

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

