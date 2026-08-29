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
      await screen.findByText(
        "该学号或常用邮箱已有待审核的申请，请等待处理；如被驳回，可修改后重新提交",
      ),
    ).toBeInTheDocument();
  });

  // 40902 means the student id already has an account, so the copy invites the
  // applicant to switch to the recover intent rather than telling them to log
  // in (they are here precisely because they cannot).
  it("reports an occupied student id and offers the recover switch", async () => {
    mockSubmit.mockRejectedValueOnce(apiFailure(409, 40902, "学号已被占用"));
    render(<AlumniRequestForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    expect(
      await screen.findByText(/该学号已有账号。若这是您本人且无法登录/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "切换为「恢复已有账号访问」" }),
    ).toBeInTheDocument();

    // The banner's action actually switches the intent for the next submit.
    await userEvent.click(
      screen.getByRole("button", { name: "切换为「恢复已有账号访问」" }),
    );
    expect(
      screen.getByRole("radio", { name: /恢复已有账号访问/ }),
    ).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(2));
    expect(mockSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ intent: "recover" }),
    );
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

  describe("intent switch", () => {
    it("carries intent only for recover, and swaps the mailbox copy", async () => {
      render(<AlumniRequestForm />);
      await userEvent.click(
        screen.getByRole("radio", { name: /恢复已有账号访问/ }),
      );

      // The school mailbox description now explains the backend re-check.
      expect(
        screen.getByText(/填写旧账号注册时使用的学校邮箱/),
      ).toBeInTheDocument();

      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

      await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ intent: "recover" }),
      );
    });

    // Omission means provision: leaving the form untouched submits a request
    // byte-for-byte identical to the historical one.
    it("omits intent for the default provision intent", async () => {
      render(<AlumniRequestForm />);
      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

      await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.not.objectContaining({ intent: expect.anything() }),
      );
    });

    // Recover is refused with plain 40000 and two fixed messages: no account
    // for the student id, or a school mailbox that does not match the account.
    // The frontend cannot tell them apart by code, so it keys off the message.
    it("offers a switch back to provision when recover finds no account", async () => {
      mockSubmit.mockRejectedValueOnce(
        apiFailure(400, 40000, "该学号尚无账号，如需新开账号请使用普通申请"),
      );
      render(<AlumniRequestForm />);
      await userEvent.click(
        screen.getByRole("radio", { name: /恢复已有账号访问/ }),
      );
      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

      expect(
        await screen.findByText(/该学号下暂无账号，没有可恢复的账号/),
      ).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("button", { name: "切换为「新开账号」" }),
      );
      expect(screen.getByRole("radio", { name: /新开账号/ })).toBeChecked();
    });

    it("points at the school mailbox when it mismatches the account", async () => {
      mockSubmit.mockRejectedValueOnce(
        apiFailure(400, 40000, "login_email 与该学号登记的登录邮箱不一致"),
      );
      render(<AlumniRequestForm />);
      await userEvent.click(
        screen.getByRole("radio", { name: /恢复已有账号访问/ }),
      );
      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

      expect(
        await screen.findByText("原学号邮箱与该学号账号登记的不一致，请核对后重试"),
      ).toBeInTheDocument();
    });

    // 40906 also guards the personal mailbox now; the code-level handling is
    // unchanged, so the same copy applies whichever address collided.
    it("reports a personal mailbox with an open ticket as pending", async () => {
      mockSubmit.mockRejectedValueOnce(
        apiFailure(409, 40906, "该邮箱已有待审申请，请等待处理"),
      );
      render(<AlumniRequestForm />);
      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: "提交申请" }));

      expect(
        await screen.findByText(
          "该学号或常用邮箱已有待审核的申请，请等待处理；如被驳回，可修改后重新提交",
        ),
      ).toBeInTheDocument();
    });
  });
});
