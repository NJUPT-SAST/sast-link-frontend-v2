import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

import type { AdminCreateUserData, AdminCreateUserRequest } from "@/lib/api/types";
import { UserCreateDialog } from "./user-create-dialog";

const created: AdminCreateUserData = {
  id: 2001,
  login_email: "b24040525@njupt.edu.cn",
  // A placeholder, not a real password — kept low-entropy so secret scanners
  // (GitGuardian Generic Password) don't flag a test fixture.
  initial_password: "initial-password-placeholder",
};

// Controlled wrapper so a test can close (via the dialog's own 关闭 / overlay /
// Escape paths) and reopen, mirroring how the users page owns `open`.
function Harness({
  onCreate,
}: {
  onCreate: (data: AdminCreateUserRequest) => Promise<AdminCreateUserData>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        reopen
      </button>
      <UserCreateDialog open={open} onOpenChange={setOpen} onCreate={onCreate} />
    </>
  );
}

function renderDialog(onCreate = jest.fn().mockResolvedValue(created)) {
  render(<UserCreateDialog open onOpenChange={jest.fn()} onCreate={onCreate} />);
  return onCreate;
}

function fillRequiredFields() {
  fireEvent.change(screen.getByRole("textbox", { name: "姓名" }), {
    target: { value: "张三" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "学号" }), {
    target: { value: "B24040525" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "登录邮箱" }), {
    target: { value: "b24040525@njupt.edu.cn" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "手机号" }), {
    target: { value: "13800138000" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "QQ 号" }), {
    target: { value: "12345" },
  });
}

describe("UserCreateDialog", () => {
  it("submits required fields and omits empty optional ones", async () => {
    const onCreate = renderDialog();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "创建账号" }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "张三",
          student_id: "B24040525",
          college: "其他",
          login_email: "b24040525@njupt.edu.cn",
          phone_number: "13800138000",
          qq_number: "12345",
          role: "member",
          state: "retired_sast",
        }),
      ),
    );
    // Empty major/personal_email must not appear in the request.
    expect(onCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({ personal_email: expect.anything() }),
    );
    expect(onCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({ major: "" }),
    );

    // The one-time initial password is presented on a success screen.
    expect(await screen.findByRole("heading", { name: "创建成功" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("initial-password-placeholder")).toBeInTheDocument();
  });

  it("includes a filled personal_email in the request", async () => {
    const onCreate = renderDialog();
    fillRequiredFields();
    fireEvent.change(screen.getByRole("textbox", { name: "个人邮箱（可选）" }), {
      target: { value: "zhangsan@qq.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "创建账号" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ personal_email: "zhangsan@qq.com" }),
    );
  });

  it("blocks personal_email identical to login_email inline", async () => {
    const onCreate = renderDialog();
    fillRequiredFields();
    fireEvent.change(screen.getByRole("textbox", { name: "个人邮箱（可选）" }), {
      target: { value: "B24040525@njupt.edu.cn" },
    });
    fireEvent.click(screen.getByRole("button", { name: "创建账号" }));

    expect(await screen.findByText("个人邮箱不能与登录邮箱相同")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("keeps the form open and shows server-side errors (e.g. duplicate email)", async () => {
    const onCreate = jest.fn().mockRejectedValue(new Error("邮箱已被占用"));
    renderDialog(onCreate);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "创建账号" }));

    expect(await screen.findByText("邮箱已被占用")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "创建成功" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建账号" })).toBeInTheDocument();
  });

  it("discards a create that settles after the dialog was closed mid-flight", async () => {
    let resolveCreate!: (data: AdminCreateUserData) => void;
    const onCreate = jest.fn(
      () =>
        new Promise<AdminCreateUserData>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render(<Harness onCreate={onCreate} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "创建账号" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());

    // Close (X → onOpenChange(false) → reset) while the create is still in-flight.
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    // The late success must be discarded, not landed onto the closed dialog.
    await act(async () => {
      resolveCreate(created);
    });

    // Reopen must show a fresh form — never the previous user's success screen.
    fireEvent.click(screen.getByRole("button", { name: "reopen" }));
    expect(await screen.findByRole("heading", { name: "创建账号" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "创建成功" })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(created.initial_password)).not.toBeInTheDocument();
  });
});