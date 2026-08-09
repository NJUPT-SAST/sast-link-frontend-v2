import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";

/** Demo consent endpoint so the consent page can be exercised without a
 *  backend. Accepts any request_id and bounces to Evento's callback with a
 *  fake code (or an access_denied error when the user declines). */
const MOCK_CLIENT_REDIRECT_URI = "https://evento.sast.fun/oauth/callback";

export const oauthHandlers = [
  http.post(`${API_BASE_URL}/oauth/authorize/consent`, async ({ request }) => {
    const body = (await request.json()) as {
      request_id?: string;
      approve?: boolean;
    };
    if (!body.request_id) {
      return HttpResponse.json(
        { code: 40000, message: "缺少授权请求标识", data: null },
        { status: 400 },
      );
    }
    const params = new URLSearchParams({ state: "mock-state" });
    if (body.approve) params.set("code", "mock-auth-code");
    else params.set("error", "access_denied");
    return HttpResponse.json({
      code: 0,
      message: "ok",
      data: { redirect_uri: `${MOCK_CLIENT_REDIRECT_URI}?${params.toString()}` },
    });
  }),
];
