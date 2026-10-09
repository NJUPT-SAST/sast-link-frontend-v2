import { fireEvent, render, screen } from "@testing-library/react";
import { UserLoadError } from "./user-load-error";

const failure = (status: number) => ({ response: { status, data: { code: status * 100, message: "接口错误" } } });

it.each([503, 429, 0])("offers retry without claiming the user is missing for %s", (status) => {
  const retry = jest.fn();
  render(<UserLoadError error={status ? failure(status) : new Error("offline")} listHref="/admin/users?role=member" onRetry={retry} />);
  expect(screen.queryByText("用户不存在或链接无效")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link", { name: "返回用户列表" })).toHaveAttribute("href", "/admin/users?role=member");
});

it.each([[403, "没有权限查看该用户"], [404, "用户不存在或链接无效"]])("explains terminal %s without retry", (status, message) => {
  render(<UserLoadError error={failure(Number(status))} listHref="/admin/users" onRetry={jest.fn()} />);
  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "重试" })).not.toBeInTheDocument();
});
