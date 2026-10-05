import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import { DEPARTMENT_KEYS } from "@/lib/api/types";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { withCors } from "./respond";

/** GET /departments — public catalogue mirroring backend PR #100's
 *  model.Departments (key + Chinese label, console display order). */
export const departmentHandlers = [
  http.get(`${API_BASE_URL}/departments`, () => {
    return HttpResponse.json({
      code: 0,
      message: "ok",
      data: {
        departments: DEPARTMENT_KEYS.map((key) => ({
          key,
          label: DEPARTMENT_LABELS[key],
        })),
      },
    }, { headers: withCors() });
  }),
];
