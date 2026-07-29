jest.mock("./client", () => ({
  apiClient: {
    delete: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

import { apiClient } from "./client";
import {
  bindEmail,
  bindGithub,
  bindLark,
  getUserIdentities,
  getUserProfile,
  unbindIdentity,
  updateUserProfile,
  uploadAvatar,
  verifyBindEmail,
} from "./user";

describe("lib/api/user v2", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses profile and identity routes from OpenAPI", () => {
    getUserProfile();
    updateUserProfile({ nickname: "Alice", intro: "Hello" });
    getUserIdentities();
    bindEmail("alice@example.com");
    verifyBindEmail("bind-ticket", "123456");
    bindGithub("github-code");
    bindLark("lark-code");
    unbindIdentity(3, "Password123");

    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/user/profile");
    expect(apiClient.put).toHaveBeenNthCalledWith(1, "/user/profile", {
      nickname: "Alice",
      intro: "Hello",
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/user/identities");
    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/user/identities/email", {
      email: "alice@example.com",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, "/user/identities/email/verify", {
      bind_ticket: "bind-ticket",
      code: "123456",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(3, "/user/identities/github", null, {
      params: { code: "github-code" },
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(4, "/user/identities/lark", null, {
      params: { code: "lark-code" },
    });
    expect(apiClient.delete).toHaveBeenCalledWith("/user/identities/3", {
      data: { password: "Password123" },
    });
  });

  it("uploads avatar with the OpenAPI multipart field", async () => {
    const file = new Blob(["avatar"], { type: "image/png" });
    uploadAvatar(file);

    const body = (apiClient.put as jest.Mock).mock.calls[0][1] as FormData;
    const uploaded = body.get("file") as File;
    expect(uploaded.type).toBe("image/png");
    await expect(uploaded.text()).resolves.toBe("avatar");
    expect(apiClient.put).toHaveBeenCalledWith("/user/avatar", body);
  });
});
