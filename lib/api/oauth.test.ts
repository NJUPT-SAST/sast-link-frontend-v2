jest.mock("./client", () => ({
  apiClient: { post: jest.fn() },
}));

import { apiClient } from "./client";
import {
  buildOAuthLoginUrl,
  exchangeLoginCode,
} from "./oauth";

describe("lib/api/oauth v2", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses same-origin provider login routes", () => {
    expect(buildOAuthLoginUrl("github")).toBe("/apis/oauth/github");
    expect(buildOAuthLoginUrl("lark")).toBe("/apis/oauth/lark");
  });

  it("exchanges the one-time login code", () => {
    exchangeLoginCode("login-code");
    expect(apiClient.post).toHaveBeenCalledWith("/oauth/exchange-code", {
      code: "login-code",
    });
  });
});
