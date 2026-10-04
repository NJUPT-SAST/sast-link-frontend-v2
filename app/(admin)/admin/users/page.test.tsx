import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SWRConfig } from "swr";
import { http, HttpResponse } from "msw";

import { server } from "@/mocks/server";
import { API_BASE_URL } from "@/lib/config/public";
import AdminUsersPage from "./page";

// The page reads its filters from the URL; jsdom keeps a real location/history,
// so no navigation mock is needed beyond the router itself.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

// canManageUsers reads the role off the profile store; admin unlocks selection.
jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: { role: string } }) => unknown) =>
    selector({ profile: { role: "admin" } }),
}));

// MSW handlers authorize on the access-<id>- token shape.
jest.mock("@/lib/token", () => ({
  ...jest.requireActual("@/lib/token"),
  getSession: () => ({ accessToken: "access-2-0" }),
}));

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AdminUsersPage />
    </SWRConfig>,
  );
}

async function waitForRows() {
  await waitFor(() =>
    expect(screen.getByLabelText("全选本页用户")).toBeInTheDocument(),
  );
}

describe("AdminUsersPage selection across pages", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/admin/users");
  });

  it("clears the selection when turning the page", async () => {
    renderPage();
    await waitForRows();

    fireEvent.click(screen.getByLabelText("全选本页用户"));
    await waitFor(() => expect(screen.getByText(/已选 \d+ 人/)).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("下一页"));

    // The batch bar disappears entirely once nothing is selected.
    await waitFor(() => expect(screen.queryByText(/已选 \d+ 人/)).not.toBeInTheDocument());
  });

  it("clears the selection when jumping to a typed page", async () => {
    renderPage();
    await waitForRows();

    fireEvent.click(screen.getByLabelText("全选本页用户"));
    await waitFor(() => expect(screen.getByText(/已选 \d+ 人/)).toBeInTheDocument());

    const jump = screen.getByLabelText("跳转到页码");
    fireEvent.change(jump, { target: { value: "3" } });
    fireEvent.keyDown(jump, { key: "Enter" });

    await waitFor(() => expect(screen.queryByText(/已选 \d+ 人/)).not.toBeInTheDocument());
  });

  it("clears the selection when the filters change", async () => {
    renderPage();
    await waitForRows();

    fireEvent.click(screen.getByLabelText("全选本页用户"));
    await waitFor(() => expect(screen.getByText(/已选 \d+ 人/)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("角色"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    await waitFor(() => expect(screen.queryByText(/已选 \d+ 人/)).not.toBeInTheDocument());
  });

  it("keeps the selection while staying on the same page", async () => {
    renderPage();
    await waitForRows();

    fireEvent.click(screen.getByLabelText("全选本页用户"));

    const bar = await screen.findByText(/已选 \d+ 人/);
    const selected = Number(/已选 (\d+) 人/.exec(bar.textContent ?? "")![1]);
    expect(selected).toBeGreaterThan(0);

    // Toggling one row off is a same-page edit, not a page turn.
    const firstRowCheckbox = screen
      .getAllByRole("checkbox")
      .find((box) => box.getAttribute("aria-label")?.startsWith("选择 "))!;
    fireEvent.click(firstRowCheckbox);

    await waitFor(() =>
      expect(screen.getByText(`已选 ${selected - 1} 人`)).toBeInTheDocument(),
    );
  });

  it("scopes 全选本页 to the rows currently rendered", async () => {
    renderPage();
    await waitForRows();

    const rowBoxes = screen
      .getAllByRole("checkbox")
      .filter((box) => box.getAttribute("aria-label")?.startsWith("选择 "));

    fireEvent.click(screen.getByLabelText("全选本页用户"));

    await waitFor(() =>
      expect(screen.getByText(`已选 ${rowBoxes.length} 人`)).toBeInTheDocument(),
    );

    // Clearing via the header checkbox empties it again.
    fireEvent.click(screen.getByLabelText("全选本页用户"));
    await waitFor(() => expect(screen.queryByText(/已选 \d+ 人/)).not.toBeInTheDocument());
  });

  it("offers the batch action only while a selection exists", async () => {
    renderPage();
    await waitForRows();

    expect(screen.queryByRole("button", { name: /批量修改/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("全选本页用户"));
    const batchButton = await screen.findByRole("button", { name: /批量修改/ });
    expect(batchButton).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("下一页"));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /批量修改/ })).not.toBeInTheDocument(),
    );
  });

  it("syncs the page into the URL so returning restores it", async () => {
    renderPage();
    await waitForRows();

    fireEvent.click(screen.getByLabelText("下一页"));

    await waitFor(() => expect(window.location.search).toContain("page=2"));
    // within() keeps this from matching a row that happens to contain "2".
    const pagination = screen.getByLabelText("跳转到页码");
    await waitFor(() => expect(pagination).toHaveValue("2"));
    expect(within(document.body).getByLabelText("跳转到页码")).toBe(pagination);
  });

  it("sends a department clear command (empty string) per selected id — backend PR #100", async () => {
    const bodies: Array<{ id: string; body: Record<string, unknown> }> = [];
    server.use(
      http.put(`${API_BASE_URL}/admin/users/:id`, async ({ request, params }) => {
        bodies.push({
          id: String(params.id),
          body: (await request.json()) as Record<string, unknown>,
        });
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: { message: "用户信息更新成功", user: null },
        });
      }),
    );

    renderPage();
    await waitForRows();
    fireEvent.click(screen.getByLabelText("全选本页用户"));
    fireEvent.click(await screen.findByRole("button", { name: /批量修改/ }));

    // The sentinel option maps to "" — the backend's clear-to-NULL command.
    // A truthiness guard would swallow it, so this pins the !== undefined one.
    // The filter bar also labels a select 部门 — scope to the dialog's id.
    fireEvent.change(
      await screen.findByLabelText("部门", { selector: "#batch-department" }),
      {
        target: { value: "__clear__" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "确认修改" }));

    await waitFor(() => expect(bodies.length).toBeGreaterThan(0));
    const ids = bodies.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length); // one PUT per selected id
    for (const { body } of bodies) {
      expect(body).toEqual({ department: "" });
    }
    // Sonner toasts are unreliable under jsdom; the dialog closing (selection
    // cleared) is the observable success signal.
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "确认修改" }),
      ).not.toBeInTheDocument(),
    );
  });
});
