import type { AuthResultData } from "@/lib/api/types";

jest.mock("@/lib/auth-next", () => ({
  consumeAuthNext: jest.fn((fallback: string) => fallback),
}));

import { consumeAuthNext } from "@/lib/auth-next";
import { postAuthDestination } from "@/lib/auth-destination";

const mockedConsume = consumeAuthNext as jest.Mock;

function authResult(needs: boolean): Pick<AuthResultData, "user"> {
  return {
    user: {
      id: 1,
      login_email: "a@njupt.edu.cn",
      name: "Alice",
      role: "member",
      state: "on_sast",
      email_type: "njupt_email",
      created_at: "2026-01-01T00:00:00Z",
      profile_needs_completion: needs,
      incomplete_fields: needs ? ["phone_number"] : [],
    },
  };
}

describe("postAuthDestination", () => {
  beforeEach(() => mockedConsume.mockClear());

  it("routes an incomplete account to the completion page", () => {
    expect(postAuthDestination(authResult(true), "/home")).toBe("/profile/complete");
  });

  it("lands a complete account on the fallback", () => {
    expect(postAuthDestination(authResult(false), "/home")).toBe("/home");
  });

  it("passes the chosen destination through consumeAuthNext", () => {
    postAuthDestination(authResult(true), "/x");
    expect(mockedConsume).toHaveBeenCalledWith("/profile/complete");
  });

  it("honours the fallback so a custom authNext can override", () => {
    postAuthDestination(authResult(false), "/somewhere");
    expect(mockedConsume).toHaveBeenCalledWith("/somewhere");
  });
});
