import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import { mockUsers } from "../data/users";

/**
 * GET /card/:id returns a **bare** cardDTO on success (no envelope); only
 * errors use the `{ code, message, data }` envelope. Mirrors backend
 * internal/web/sessionhandler/card.go.
 */
export const cardHandlers = [
  http.get(`${API_BASE_URL}/card/:id`, ({ params }) => {
    const id = params.id as string;
    if (!/^\d+$/.test(id)) {
      return HttpResponse.json(
        { code: 40400, message: "资源不存在", data: null },
        { status: 404 },
      );
    }
    const user = mockUsers.find((item) => item.id === Number(id));
    if (!user) {
      return HttpResponse.json(
        { code: 40401, message: "用户不存在", data: null },
        { status: 404 },
      );
    }
    const detail = user.profile.profile;
    return HttpResponse.json({
      id: user.id,
      nickname: detail?.nickname ?? null,
      department: detail?.department ?? null,
      intro: detail?.intro ?? null,
      avatar: detail?.avatar ?? null,
      blog_url: detail?.blog_url ?? null,
      github_url: detail?.github_url ?? null,
    });
  }),
];
