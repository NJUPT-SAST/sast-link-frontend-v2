jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
  },
}));

import { toast } from "sonner";

import { message } from "./message";

describe("message", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards toast calls with the default duration", () => {
    message.success("ok");
    message.error("boom");
    message.warning("warn");
    message.info("note");
    message.loading("wait");

    expect(toast.success).toHaveBeenCalledWith("ok", { duration: 3000 });
    expect(toast.error).toHaveBeenCalledWith("boom", { duration: 3000 });
    expect(toast.warning).toHaveBeenCalledWith("warn", { duration: 3000 });
    expect(toast.info).toHaveBeenCalledWith("note", { duration: 3000 });
    expect(toast.loading).toHaveBeenCalledWith("wait", { duration: Infinity });
  });

  it("uses the custom duration when provided", () => {
    message.success("ok", 1500);

    expect(toast.success).toHaveBeenCalledWith("ok", { duration: 1500 });
  });
});
