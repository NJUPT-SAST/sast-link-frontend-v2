jest.mock("./client", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

import { apiClient } from "./client";
import {
  changePassword,
  completeRegister,
  forgotPasswordSendCode,
  logout,
  passwordLogin,
  registerSendCode,
  registerVerifyCode,
  resetPassword,
} from "./auth";

const registration = {
  register_ticket: "reg-ticket",
  password: "Password123",
  name: "张三",
  phone_number: "13800138000",
  qq_number: "123456789",
  college: "计算机学院、软件学院、网络空间安全学院" as const,
  major: "软件工程",
  student_id: "B24040001",
};

describe("lib/api/auth v2", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses the OpenAPI auth routes and JSON bodies", () => {
    registerSendCode("student@njupt.edu.cn");
    registerVerifyCode("student@njupt.edu.cn", "123456");
    completeRegister(registration);
    passwordLogin("student@njupt.edu.cn", "Password123");
    forgotPasswordSendCode("student@njupt.edu.cn");
    resetPassword("student@njupt.edu.cn", "123456", "NewPassword123");
    changePassword("OldPassword123", "NewPassword123");
    logout("refresh-token");

    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/auth/register/send-code", {
      login_email: "student@njupt.edu.cn",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, "/auth/register/verify-code", {
      login_email: "student@njupt.edu.cn",
      code: "123456",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(3, "/auth/register", registration);
    expect(apiClient.post).toHaveBeenNthCalledWith(4, "/user/login", {
      login_email: "student@njupt.edu.cn",
      password: "Password123",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(5, "/auth/forgot-password/send-code", {
      login_email: "student@njupt.edu.cn",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(6, "/auth/reset-password", {
      login_email: "student@njupt.edu.cn",
      code: "123456",
      new_password: "NewPassword123",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(7, "/auth/change-password", {
      old_password: "OldPassword123",
      new_password: "NewPassword123",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(8, "/auth/logout", {
      refresh_token: "refresh-token",
    });
  });
});
