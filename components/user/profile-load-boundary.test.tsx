import { fireEvent, render, screen } from "@testing-library/react";
import { ProfileLoadBoundary } from "./profile-load-boundary";

const mutate = jest.fn().mockResolvedValue(undefined);
let state: { data?: unknown; error?: unknown; isValidating?: boolean };
jest.mock("@/hooks/use-fetch-profile", () => ({ useFetchProfile: () => ({ ...state, mutate }) }));

beforeEach(() => { state = {}; mutate.mockClear(); });

it("does not expose account content before a successful load, and retries failures", () => {
  const { rerender } = render(<ProfileLoadBoundary><p>Private profile</p></ProfileLoadBoundary>);
  expect(screen.getByRole("status", { name: "正在加载个人资料" })).toBeInTheDocument();
  expect(screen.queryByText("Private profile")).not.toBeInTheDocument();
  state = { error: new Error("服务暂不可用") };
  rerender(<ProfileLoadBoundary><p>Private profile</p></ProfileLoadBoundary>);
  expect(screen.getByText("个人资料加载失败")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Private profile")).not.toBeInTheDocument();
});

it("keeps the current form mounted during a failed background refresh", () => {
  state = { data: { id: 1 } };
  const { rerender } = render(<ProfileLoadBoundary><input aria-label="Draft" defaultValue="" /></ProfileLoadBoundary>);
  fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "unsaved" } });
  state = { ...state, error: new Error("offline"), isValidating: true };
  rerender(<ProfileLoadBoundary><input aria-label="Draft" defaultValue="" /></ProfileLoadBoundary>);
  expect(screen.getByLabelText("Draft")).toHaveValue("unsaved");
  expect(screen.getByText("资料更新失败，已保留当前内容")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "重试中…" })).toBeDisabled();
});
