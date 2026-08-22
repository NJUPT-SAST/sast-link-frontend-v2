import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RegisterDetailsForm from "./register-details-form";

const mockCompleteRegister = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/api/auth", () => ({
  completeRegister: (...args: unknown[]) => mockCompleteRegister(...args),
}));

// The success path also patches the profile; stub it so the real axios client
// never runs (it would try a jsdom navigation on error).
jest.mock("@/lib/api/user", () => ({
  updateUserProfile: jest.fn().mockResolvedValue({ data: { data: {} } }),
}));

jest.mock(
  "next/link",
  () =>
    function Link({ children, href }: { children: React.ReactNode; href: string }) {
      return <a href={href}>{children}</a>;
    },
);

function renderForm() {
  return render(
    <RegisterDetailsForm
      loginEmail="B23011234@njupt.edu.cn"
      registerTicket="ticket-1"
      onBack={jest.fn()}
    />,
  );
}

/** Fills every field the schema requires except the consent checkbox. */
async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText("密码"), "Passw0rd!");
  await userEvent.type(screen.getByLabelText("确认密码"), "Passw0rd!");
  await userEvent.type(screen.getByLabelText("真实姓名"), "张三");
  await userEvent.type(screen.getByLabelText("别名"), "zsan");
  await userEvent.type(screen.getByLabelText("专业"), "软件工程");
  await userEvent.type(screen.getByLabelText("手机号"), "13800138000");
  await userEvent.type(screen.getByLabelText("QQ 号"), "123456789");
}

describe("RegisterDetailsForm consent gate", () => {
  beforeEach(() => {
    mockCompleteRegister.mockReset();
    mockCompleteRegister.mockResolvedValue({
      data: {
        data: {
          access_token: "a",
          expires_in: 3600,
          user: { login_email: "B23011234@njupt.edu.cn" },
        },
      },
    });
  });

  it("links to the terms of service and the privacy policy", () => {
    const { container } = renderForm();
    const terms = container.querySelector('a[href="/terms"]');
    const privacy = container.querySelector('a[href="/privacy"]');
    expect(terms).toBeInTheDocument();
    expect(privacy).toBeInTheDocument();
    // Same-tab navigation keeps the step recoverable: the ticket and email are
    // in sessionStorage, which a new tab cannot see. Opening a new tab also
    // replays the boot intro and leaves the reader with no way back.
    expect(terms).not.toHaveAttribute("target", "_blank");
    expect(privacy).not.toHaveAttribute("target", "_blank");
  });

  it("starts unchecked so consent is an explicit action", () => {
    renderForm();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("blocks submission when consent is not given", async () => {
    renderForm();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "创建账户" }));

    expect(await screen.findByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
    expect(mockCompleteRegister).not.toHaveBeenCalled();
  });

  it("submits once the consent box is checked", async () => {
    renderForm();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "创建账户" }));
    expect(mockCompleteRegister).toHaveBeenCalledTimes(1);
  });
});
