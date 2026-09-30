import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";

import AdminUserEditPage from "./page";

// The page reads the user id from the URL; jsdom keeps a real location/history,
// so no navigation mock is needed beyond the router itself.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

// canManageUsers reads the role off the profile store; admin unlocks the actions.
jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: { role: string } }) => unknown) =>
    selector({ profile: { role: "admin" } }),
}));

// MSW handlers authorize on the access-<id>- token shape.
jest.mock("@/lib/token", () => ({
  ...jest.requireActual("@/lib/token"),
  getSession: () => ({ accessToken: "access-2-0" }),
}));

import { mockUsers } from "@/mocks/data/users";

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AdminUserEditPage />
    </SWRConfig>,
  );
}

describe("AdminUserEditPage closed account", () => {
  const deleted = mockUsers.find((user) => user.profile.state === "is_deleted");

  if (!deleted) throw new Error("mock data has no soft-deleted user to test with");

  beforeEach(() => {
    window.history.replaceState(null, "", `/admin/users/edit?id=${deleted.profile.id}`);
  });

  it("intercepts a soft-deleted account instead of offering the form", async () => {
    renderPage();

    expect(await screen.findByText("该用户已注销，恢复后才能编辑")).toBeInTheDocument();
    // The form itself never mounts — every PUT would answer 422.
    expect(screen.queryByRole("button", { name: "保存修改" })).not.toBeInTheDocument();
    // The restore lives on the detail page; the link carries the same id.
    const detailLink = screen.getByRole("link", { name: "前往详情页恢复" });
    expect(detailLink).toHaveAttribute(
      "href",
      `/admin/users/detail?id=${deleted.profile.id}`,
    );
  });

  it("renders the form for a live account", async () => {
    const live = mockUsers.find(
      (user) => user.profile.state !== "is_deleted" && user.profile.id !== deleted.profile.id,
    );
    if (!live) throw new Error("mock data has no live user to test with");
    window.history.replaceState(null, "", `/admin/users/edit?id=${live.profile.id}`);

    renderPage();

    expect(await screen.findByRole("button", { name: "保存修改" })).toBeInTheDocument();
  });
});
