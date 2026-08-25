import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { submitAlumniRequest } from "@/lib/api/alumni";
import { useTurnstileScript, useTurnstileWidget } from "@/hooks/use-turnstile";
import AlumniRequestForm from "./alumni-request-form";

jest.mock("@/lib/api/alumni", () => ({
  submitAlumniRequest: jest.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
}));

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/hooks/use-turnstile", () => ({
  useTurnstileScript: jest.fn(),
  useTurnstileWidget: jest.fn(),
}));

const mockSubmit = submitAlumniRequest as jest.MockedFunction<typeof submitAlumniRequest>;
const mockScript = useTurnstileScript as jest.MockedFunction<typeof useTurnstileScript>;
const mockWidget = useTurnstileWidget as jest.MockedFunction<typeof useTurnstileWidget>;

const mockReset = jest.fn();

/** An axios-shaped rejection so toApiError() can read the business code, which is
 *  what every branch under test keys off. */
function apiFailure(status: number, code: number, message: string) {
  return {
    isAxiosError: true,
    response: { status, data: { code, message, data: null }, headers: {} },
    message,
  };
}

function widgetReturning(token: string) {
  return {
    containerRef: { current: null },
    token,
    reset: mockReset,
  } as unknown as ReturnType<typeof useTurnstileWidget>;
}

async function fillForm() {
  await userEvent.type(screen.getByLabelText("真实姓名"), "张三");
  await userEvent.type(screen.getByLabelText("学号"), "B18040101");
  await userEvent.type(screen.getByLabelText("常用邮箱"), "zhangsan@qq.com");
  await userEvent.type(screen.getByLabelText("手机号"), "13800000001");
  await userEvent.type(screen.getByLabelText("QQ 号"), "100001");
  await userEvent.type(screen.getByLabelText("专业"), "软件工程");
  await userEvent.type(screen.getByLabelText("入会年份"), "2018");
}

describe("AlumniRequestForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScript.mockReturnValue("ready");
    mockWidget.mockReturnValue(widgetReturning("captcha-token"));
  });

  // The backend verifies the captcha unconditionally, so a form with no solvable
  // challenge could only collect submissions certain to be refused.
  it("hides the form and shows the fallback mailbox when no site key is configured", () => {
    mockScript.mockReturnValue("disabled");
    mockWidget.mockReturnValue(widgetReturning(""));
    render(<AlumniRequestForm />);

    expect(screen.getByText("申请通道暂不可用")).toBeInTheDocument();
    expect(screen.getByText("link@sast.fun")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "提交申请" })).not.toBeInTheDocument();
  });

  it("hides the form when the captcha script fails to load", () => {
    mockScript.mockReturnValue("unavailable");
    mockWidget.mockReturnValue(widgetReturning(""));
    render(<AlumniRequestForm />);

    expect(screen.getByText("申请通道暂不可用")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "提交申请" })).not.toBeInTheDocument();
  });

  it("keeps submit disabled until the captcha yields a token", () => {
    mockWidget.mockReturnValue(widgetReturning(""));
    render(<AlumniRequestForm />);

    expect(screen.getByRole("button", { name: "提交申请" })).toBeDisabled();
  });

  // The school mailbox is the account identifier and is conventionally the
  // student id, so it is offered rather than demanded from memory.
  it("autofills the school mailbox from a well-formed student id", async () => {
    render(<AlumniRequestForm />);
    const studentId = screen.getByLabelText("学号");
    await userEvent.type(studentId, "B18040101");
    await userEvent.tab();

    await waitFor(() =>
      expect(screen.getByLabelText("原学号邮箱")).toHaveValue(
        "b18040101@njupt.edu.cn",
      ),
    );
  });

  it("submits the request with the captcha token and redirects", async () => {
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "B18040101",
        login_email: "b18040101@njupt.edu.cn",
        personal_email: "zhangsan@qq.com",
        major: "软件工程",
        captcha_token: "captcha-token",
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith("/register/alumni/success");
  });

  // A Turnstile token is single-use; retrying with a spent one would fail
  // verification for a reason unrelated to the form.
  it("resets the captcha after a failed submit", async () => {
    mockSubmit.mockRejectedValueOnce(new Error("boom"));
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    await waitFor(() => expect(mockReset).toHaveBeenCalledTimes(1));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // 40021 and 50301 are opposites and are the easiest pair in this feature to get
  // backwards: the first means the check ran and failed (retry the widget), the
  // second means it could not run at all (retrying is meaningless).
  it("keeps the form and asks to re-verify on 40021", async () => {
    mockSubmit.mockRejectedValueOnce(
      apiFailure(400, 40021, "人机校验未通过"),
    );
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    expect(
      await screen.findByText("人机验证未通过，请重新验证后提交"),
    ).toBeInTheDocument();
    // Still the form, not the unavailable view.
    expect(screen.queryByText("申请通道暂不可用")).not.toBeInTheDocument();
    expect(mockReset).toHaveBeenCalled();
  });

  it("switches to the unavailable view on 50301", async () => {
    mockSubmit.mockRejectedValueOnce(
      apiFailure(503, 50301, "申请通道暂不可用"),
    );
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    expect(await screen.findByText("申请通道暂不可用")).toBeInTheDocument();
    expect(screen.getByText("link@sast.fun")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "提交申请" })).not.toBeInTheDocument();
  });

  // 40906 is "your earlier application is still open", not "you already have an
  // account" (40902) — telling them to log in would be wrong.
  it("distinguishes a pending application from an existing account", async () => {
    mockSubmit.mockRejectedValueOnce(
      apiFailure(409, 40906, "该学号已有待审申请"),
    );
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    expect(
      await screen.findByText("该学号已有待审核的申请，请等待处理，无需重复提交"),
    ).toBeInTheDocument();
  });

  it("reports an occupied student id separately", async () => {
    mockSubmit.mockRejectedValueOnce(apiFailure(409, 40902, "学号已被占用"));
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    expect(
      await screen.findByText("该学号已有账号，请直接登录或找回密码"),
    ).toBeInTheDocument();
  });

  // The backend uses one code for both mailboxes, so the copy must not claim to
  // know which one collided.
  it("names both mailboxes when the address is occupied", async () => {
    mockSubmit.mockRejectedValueOnce(apiFailure(409, 40901, "邮箱已被注册"));
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    expect(
      await screen.findByText(
        "邮箱已被占用，请检查学号邮箱与常用邮箱；若你已有账号，请直接找回密码",
      ),
    ).toBeInTheDocument();
  });

  it("rejects a personal mailbox identical to the school mailbox", async () => {
    render(<AlumniRequestForm />);
    await userEvent.type(screen.getByLabelText("真实姓名"), "张三");
    // Typing the id and tabbing away autofills the school mailbox, so the
    // personal mailbox below is deliberately the same address.
    await userEvent.type(screen.getByLabelText("学号"), "B18040101");
    await userEvent.tab();
    await waitFor(() =>
      expect(screen.getByLabelText("原学号邮箱")).toHaveValue(
        "b18040101@njupt.edu.cn",
      ),
    );
    await userEvent.type(
      screen.getByLabelText("常用邮箱"),
      "b18040101@njupt.edu.cn",
    );
    await userEvent.type(screen.getByLabelText("手机号"), "13800000001");
    await userEvent.type(screen.getByLabelText("QQ 号"), "100001");
    await userEvent.type(screen.getByLabelText("专业"), "软件工程");
    await userEvent.type(screen.getByLabelText("入会年份"), "2018");
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    expect(await screen.findByText("常用邮箱不能与学号邮箱相同")).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
