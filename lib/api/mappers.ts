import type { UserProfileData, UserProfileType } from "./types";

export function mapProfile(data: UserProfileData): UserProfileType {
  return {
    id: data.id,
    nickname: data.profile?.nickname || data.name,
    name: data.name,
    loginEmail: data.login_email,
    email: data.profile?.email || data.login_email,
    phoneNumber: data.phone_number ?? null,
    qqNumber: data.qq_number ?? null,
    studentId: data.student_id ?? null,
    college: data.college ?? null,
    major: data.major ?? null,
    role: data.role,
    state: data.state,
    emailType: data.email_type,
    createdAt: data.created_at,
    department: data.profile?.department ?? null,
    avatar: data.profile?.avatar ?? null,
    intro: data.profile?.intro ?? null,
    blogUrl: data.profile?.blog_url ?? null,
    githubUrl: data.profile?.github_url ?? null,
    identities: data.identities ?? [],
    // Backend guarantees an array (never null); the ?? [] is defensive for
    // responses from a backend that predates V010.
    profileNeedsCompletion: data.profile_needs_completion ?? false,
    incompleteFields: data.incomplete_fields ?? [],
  };
}
