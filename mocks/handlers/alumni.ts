import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import type {
  AlumniRequestStatus,
  RejectAlumniRequestRequest,
  SubmitAlumniRequestRequest,
} from "@/lib/api/types";
import { alumniMockRequests } from "../data/alumni";
import { findUserByAccessToken } from "../data/users";

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ code: 0, message: "ok", data }, { status });
}

function fail(status: number, code: number, message: string) {
  return HttpResponse.json({ code, message, data: null }, { status });
}

/** Mirrors the backend split: listing and detail admit lecturers, every write is
 *  admin-only. */
function authenticate(request: Request, allowLecturer: boolean) {
  const value = request.headers.get("Authorization");
  const user = value?.startsWith("Bearer ") ? findUserByAccessToken(value.slice(7)) : undefined;
  if (!user) return { response: fail(401, 40100, "未登录") };
  const role = user.profile.role;
  if (role !== "admin" && !(allowLecturer && role === "lecturer")) {
    return { response: fail(403, 40300, "无权限") };
  }
  return { user };
}

/** Drive the submit endpoint's error branches from the form itself, so the two
 *  opposite captcha outcomes (40021 recoverable vs 50301 channel down) can both
 *  be exercised without a backend.
 *
 *  Cloudflare's own test keys make the widget succeed or fail client-side; these
 *  cover what only the server can answer.
 */
function injectedFailure(body: SubmitAlumniRequestRequest) {
  const note = body.note ?? "";
  if (note.includes("!captcha")) return fail(400, 40021, "人机校验未通过");
  if (note.includes("!down")) return fail(503, 50301, "申请通道暂不可用");
  if (note.includes("!email")) return fail(409, 40901, "邮箱已被注册");
  if (note.includes("!student")) return fail(409, 40902, "学号已被占用");
  // Recover-only submission failures — the backend answers both with plain
  // 40000, distinguished by the fixed message text, which the form keys off.
  if (body.intent === "recover" && note.includes("!recover-none")) {
    return fail(400, 40000, "该学号尚无账号，如需新开账号请使用普通申请");
  }
  if (body.intent === "recover" && note.includes("!recover-mismatch")) {
    return fail(400, 40000, "login_email 与该学号登记的登录邮箱不一致");
  }
  if (note.includes("!limit")) return fail(429, 42900, "请求过于频繁");
  return undefined;
}

export const alumniHandlers = [
  http.post(`${API_BASE_URL}/alumni-requests`, async ({ request }) => {
    const body = (await request.json()) as SubmitAlumniRequestRequest;

    const injected = injectedFailure(body);
    if (injected) return injected;

    // The real endpoint verifies unconditionally and has no skip path, so a
    // tokenless submission is refused the same way.
    if (!body.captcha_token) {
      return fail(400, 40021, "人机校验未通过");
    }
    if (
      alumniMockRequests.some(
        (item) =>
          item.status === "pending" &&
          item.student_id.toLowerCase() === body.student_id.trim().toLowerCase(),
      )
    ) {
      return fail(409, 40906, "该学号已有待审申请");
    }
    // 40906 also guards the personal mailbox: an address with an open ticket
    // cannot be filed under again, whichever intent the new one carries.
    if (
      alumniMockRequests.some(
        (item) =>
          item.status === "pending" &&
          item.personal_email.toLowerCase() === body.personal_email.trim().toLowerCase(),
      )
    ) {
      return fail(409, 40906, "该邮箱已有待审申请，请等待处理");
    }
    const now = new Date().toISOString();
    const created = {
      id: Math.max(0, ...alumniMockRequests.map((item) => item.id)) + 1,
      name: body.name,
      student_id: body.student_id,
      login_email: body.login_email,
      personal_email: body.personal_email,
      intent: body.intent ?? "provision",
      phone_number: body.phone_number,
      qq_number: body.qq_number,
      college: body.college,
      major: body.major,
      join_year: body.join_year,
      department_note: body.department_note ?? "",
      note: body.note ?? "",
      status: "pending" as AlumniRequestStatus,
      reject_reason: "",
      created_user_id: null,
      reviewed_by: null,
      reviewed_at: null,
      notified_at: null,
      notify_attempts: 0,
      created_at: now,
      updated_at: now,
    };
    alumniMockRequests.push(created);
    return ok({ id: created.id });
  }),

  http.get(`${API_BASE_URL}/admin/alumni-requests`, ({ request }) => {
    const auth = authenticate(request, true);
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const notified = url.searchParams.get("notified");
    const keyword = url.searchParams.get("keyword")?.trim().toLowerCase();
    const page = Number(url.searchParams.get("page") ?? 1) || 1;
    const pageSize = Number(url.searchParams.get("page_size") ?? 20) || 20;

    // The backend rejects anything that is not true/false rather than silently
    // treating it as false, so a typo cannot return the opposite set.
    if (notified !== null && notified !== "true" && notified !== "false") {
      return fail(400, 40000, "notified 取值非法");
    }

    let items = [...alumniMockRequests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    if (status) items = items.filter((item) => item.status === status);
    if (notified !== null) {
      const want = notified === "true";
      items = items.filter((item) => (item.notified_at !== null) === want);
    }
    if (keyword) {
      items = items.filter((item) =>
        [item.name, item.student_id, item.login_email, item.personal_email].some((field) =>
          field.toLowerCase().includes(keyword),
        ),
      );
    }
    const start = (page - 1) * pageSize;
    return ok({
      requests: items.slice(start, start + pageSize),
      total: items.length,
      page,
      page_size: pageSize,
    });
  }),

  http.get(`${API_BASE_URL}/admin/alumni-requests/:id`, ({ request, params }) => {
    const auth = authenticate(request, true);
    if (auth.response) return auth.response;

    const target = alumniMockRequests.find((item) => item.id === Number(params.id));
    if (!target) return fail(404, 40403, "建号申请不存在");
    return ok(target);
  }),

  http.post(`${API_BASE_URL}/admin/alumni-requests/:id/approve`, ({ request, params }) => {
    const auth = authenticate(request, false);
    if (auth.response) return auth.response;

    const target = alumniMockRequests.find((item) => item.id === Number(params.id));
    if (!target) return fail(404, 40403, "建号申请不存在");
    if (target.status !== "pending") return fail(422, 42204, "申请已被处理");

    // Recover approval failure branches, injected via the ticket's note so a
    // reviewer test can exercise each without a backend. The note also serves
    // as the trigger for the real submit endpoint's injection, so keep the two
    // spellings distinct.
    if (target.intent === "recover") {
      const trigger = target.note ?? "";
      if (trigger.includes("!approve-no-account")) {
        return fail(409, 40900, "该学号当前没有对应账号，请刷新后核对工单");
      }
      if (trigger.includes("!approve-deleted")) {
        return fail(422, 42200, "该学号的账号已注销，无法恢复访问方式");
      }
      if (trigger.includes("!approve-mismatch")) {
        return fail(422, 42200, "工单中的 login_email 与该学号现有账号的登录邮箱不一致，请驳回后由申请人重新提交");
      }
      if (trigger.includes("!approve-bind-limit")) {
        return fail(409, 40905, "该账号的邮箱绑定数量已达上限");
      }
    }

    target.status = "approved";
    target.created_user_id = 9000 + target.id;
    target.reviewed_by = auth.user?.profile.id ?? 1;
    target.reviewed_at = new Date().toISOString();
    target.updated_at = target.reviewed_at;
    target.notify_attempts += 1;
    target.notified_at = target.reviewed_at;

    return ok({
      user_id: target.created_user_id,
      login_email: target.login_email,
      notify_enqueued: true,
    });
  }),

  http.post(`${API_BASE_URL}/admin/alumni-requests/:id/reject`, async ({ request, params }) => {
    const auth = authenticate(request, false);
    if (auth.response) return auth.response;

    const target = alumniMockRequests.find((item) => item.id === Number(params.id));
    if (!target) return fail(404, 40403, "建号申请不存在");
    if (target.status !== "pending") return fail(422, 42204, "申请已被处理");

    const body = (await request.json()) as RejectAlumniRequestRequest;
    if (!body.reject_reason?.trim()) return fail(400, 40000, "请填写驳回理由");

    target.status = "rejected";
    target.reject_reason = body.reject_reason.trim();
    target.reviewed_by = auth.user?.profile.id ?? 1;
    target.reviewed_at = new Date().toISOString();
    target.updated_at = target.reviewed_at;
    target.notify_attempts += 1;
    target.notified_at = target.reviewed_at;

    return ok({ notify_enqueued: true });
  }),

  http.post(
    `${API_BASE_URL}/admin/alumni-requests/:id/resend-notification`,
    ({ request, params }) => {
      const auth = authenticate(request, false);
      if (auth.response) return auth.response;

      const target = alumniMockRequests.find((item) => item.id === Number(params.id));
      if (!target) return fail(404, 40403, "建号申请不存在");
      // Nothing to announce until there is a verdict.
      if (target.status === "pending") return fail(422, 42200, "申请尚未处理");

      target.notify_attempts += 1;
      target.notified_at = new Date().toISOString();
      target.updated_at = target.notified_at;
      return ok({ notify_enqueued: true });
    },
  ),
];
