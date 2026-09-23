import { render, screen, waitFor, within } from "@testing-library/react";
import { SWRConfig } from "swr";

import AdminOverviewPage from "./page";

// Each test gets its own SWR cache: the overview key ("admin:stats") is
// otherwise shared process-wide, so a later test's fresh mock would render
// on top of a previous test's cached response instead of its own.
function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <AdminOverviewPage />
    </SWRConfig>,
  );
}

const mockGetAdminStats = jest.fn();
const mockGetAdminUsers = jest.fn();

jest.mock("@/lib/api/admin", () => ({
  getAdminStats: (...args: unknown[]) => mockGetAdminStats(...args),
  getAdminUsers: (...args: unknown[]) => mockGetAdminUsers(...args),
}));

// Role total 100 (freshman 50 + member 30 + lecturer 20) folds 5 incomplete
// (3 freshman + 2 member) into one "未补全" slice; state total mirrors it via
// njupter (50) folding 4 incomplete into "未补全". total (100) is untouched by
// either fold, so both donuts must still sum back to it.
const statsData = {
  users: {
    total: 100,
    by_role: { freshman: 50, member: 30, lecturer: 20 },
    by_state: { njupter: 50, on_sast: 50 },
    by_department: { software: 60 },
    no_department: 40,
    incomplete_by_role: { freshman: 3, member: 2 },
    incomplete_by_state: { njupter: 4 },
  },
  clients: { total: 2, active: 1 },
  audit: { recent: [] },
};

describe("AdminOverviewPage", () => {
  beforeEach(() => {
    mockGetAdminStats.mockReset();
    mockGetAdminStats.mockResolvedValue({ data: { data: statsData } });
    // One empty page by default: the grade donut has no buckets and the
    // stats-focused tests stay about their own fixtures.
    mockGetAdminUsers.mockReset();
    mockGetAdminUsers.mockResolvedValue({
      data: { data: { users: [], total: 0, page: 1, page_size: 100 } },
    });
  });

  it("folds incomplete counts out of the role and state donuts into 未补全", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("角色分布")).toBeInTheDocument());

    // Role donut: freshman 50-3=47, member 30-2=28, lecturer 20 untouched,
    // plus one folded 未补全 slice of 5.
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    const roleUnfinished = screen.getAllByText("未补全")[0].closest("div");
    expect(roleUnfinished).toHaveTextContent("5");

    // State donut: njupter 50-4=46, on_sast 50 untouched, plus a folded 未补全
    // slice of 4.
    expect(screen.getByText("46")).toBeInTheDocument();
    const stateUnfinished = screen.getAllByText("未补全")[1].closest("div");
    expect(stateUnfinished).toHaveTextContent("4");

    // Donut totals (denominators) are untouched by the fold: the total user
    // count still reads 100 on the summary card.
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  // The state dimension spans every state (is_deleted included) while total
  // counts live accounts only, so the ring cannot be scaled against total or its
  // arcs overflow past 100% and wrap over themselves.
  it("scales each ring against its own segment sum, not the account total", async () => {
    mockGetAdminStats.mockResolvedValue({
      data: {
        data: {
          ...statsData,
          users: {
            ...statsData.users,
            total: 51, // live accounts only
            by_state: { on_sast: 28, njupter: 19, retired_sast: 4, is_deleted: 2 },
            incomplete_by_state: { njupter: 8 },
          },
        },
      },
    });

    renderPage();
    await waitFor(() => expect(screen.getByText("状态分布")).toBeInTheDocument());

    // Segments sum to 53 (28+11+8+4+2) against a live total of 51. Each arc's
    // dash length must still fit the circumference exactly once.
    // Scope by heading rather than svg order: the stat-card icons are svgs too.
    const stateRing = screen
      .getByText("状态分布")
      .closest("section")!
      .querySelector("svg")!;
    const circumference = 2 * Math.PI * 40;
    let dashTotal = 0;
    for (const circle of Array.from(stateRing.querySelectorAll("circle"))) {
      const dash = circle.getAttribute("stroke-dasharray");
      if (!dash) continue; // the track circle carries no dash array
      dashTotal += Number(dash.split(" ")[0]);
    }
    expect(dashTotal).toBeCloseTo(circumference, 5);
  });

  it("omits the 未补全 slice entirely when no account is incomplete", async () => {
    mockGetAdminStats.mockResolvedValue({
      data: {
        data: {
          ...statsData,
          users: {
            ...statsData.users,
            incomplete_by_role: {},
            incomplete_by_state: {},
          },
        },
      },
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("角色分布")).toBeInTheDocument());
    expect(screen.queryByText("未补全")).not.toBeInTheDocument();
    // freshman, njupter, and on_sast all read 50 unfolded across both donuts.
    expect(screen.getAllByText("50")).toHaveLength(3);
  });

  // The buckets ship in a later backend release than this page, so a frontend
  // deployed first receives a payload without either key. That must render the
  // true buckets rather than crash — there is no error boundary above /admin.
  it("renders the unfolded donuts when the backend omits the buckets", async () => {
    const usersWithoutBuckets: Record<string, unknown> = { ...statsData.users };
    delete usersWithoutBuckets.incomplete_by_role;
    delete usersWithoutBuckets.incomplete_by_state;
    mockGetAdminStats.mockResolvedValue({
      data: { data: { ...statsData, users: usersWithoutBuckets } },
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("角色分布")).toBeInTheDocument());
    expect(screen.queryByText("未补全")).not.toBeInTheDocument();
    expect(screen.getAllByText("50")).toHaveLength(3);
  });

  // One page of users: two 22级 students, one 21级, one non-student mailbox,
  // and one deleted 23级 account that must drop out of the buckets.
  const gradeUsers = [
    { login_email: "b21123456@njupt.edu.cn", state: "njupter" },
    { login_email: "B22040101@njupt.edu.cn", state: "on_sast" },
    { login_email: "b22040102@njupt.edu.cn", state: "on_sast" },
    { login_email: "admin@njupt.edu.cn", state: "on_sast" },
    { login_email: "B23999999@njupt.edu.cn", state: "is_deleted" },
  ];

  it("replaces 部门分布 with 年级分布 bucketed from login emails", async () => {
    mockGetAdminUsers.mockResolvedValue({
      data: { data: { users: gradeUsers, total: 5, page: 1, page_size: 100 } },
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("年级分布")).toBeInTheDocument());
    // The department donut is retired from the overview; its slot now renders
    // the grade donut.
    expect(screen.queryByText("部门分布")).not.toBeInTheDocument();

    const gradeSection = screen.getByText("年级分布").closest("section")!;
    expect(gradeSection).toHaveTextContent("21级");
    expect(gradeSection).toHaveTextContent("22级");
    expect(gradeSection).toHaveTextContent("其他");
    // Deleted accounts are skipped, so their grade never appears.
    expect(gradeSection).not.toHaveTextContent("23级");
    // Legend rows read "<label><count>": 21级×1, 22级×2, 其他×1.
    const legendRow = (label: string) =>
      within(gradeSection).getByText(label).closest("div")!.textContent;
    expect(legendRow("21级")).toBe("21级1");
    expect(legendRow("22级")).toBe("22级2");
    expect(legendRow("其他")).toBe("其他1");
  });

  it("pages through /admin/users until the roster is exhausted", async () => {
    mockGetAdminUsers.mockImplementation(async (_args?: { page?: number }) => {
      const page = _args?.page ?? 1;
      if (page === 1) {
        return {
          data: {
            data: {
              users: gradeUsers.slice(0, 2),
              total: 5,
              page: 1,
              page_size: 100,
            },
          },
        };
      }
      return {
        data: {
          data: { users: gradeUsers.slice(2), total: 5, page: 2, page_size: 100 },
        },
      };
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("年级分布")).toBeInTheDocument());
    await waitFor(() => expect(mockGetAdminUsers).toHaveBeenCalledTimes(2));
    expect(mockGetAdminUsers).toHaveBeenLastCalledWith({ page: 2, page_size: 100 });
    // Buckets aggregate across both pages: 21级×1, 22级×2, 其他×1.
    const gradeSection = screen.getByText("年级分布").closest("section")!;
    const legendRow = (label: string) =>
      within(gradeSection).getByText(label).closest("div")!.textContent;
    expect(legendRow("21级")).toBe("21级1");
    expect(legendRow("22级")).toBe("22级2");
    expect(legendRow("其他")).toBe("其他1");
  });

  it("paints the folded 未补全 slice in the muted color, not the palette", async () => {
    // 未补全 50 is the largest slice, so it lands where the saturated palette
    // slot 0 used to sit.
    mockGetAdminStats.mockResolvedValue({
      data: {
        data: {
          ...statsData,
          users: {
            ...statsData.users,
            by_role: { freshman: 50, member: 10 },
            incomplete_by_role: { freshman: 50 },
          },
        },
      },
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("角色分布")).toBeInTheDocument());

    const roleSection = screen.getByText("角色分布").closest("section")!;
    const segments = Array.from(
      roleSection.querySelectorAll<SVGCircleElement>("circle[stroke-dasharray]"),
    );
    // Sorted largest-first: the folded slice is segment 0.
    expect(segments[0].getAttribute("stroke")).toBe("#94a3b8");
    expect(segments[1].getAttribute("stroke")).toBe("#60a5fa");

    // The legend dot shares the muted color (jsdom normalizes the inline
    // background to rgb).
    const legendDot = roleSection.querySelector<HTMLSpanElement>(
      'span[class~="size-2.5"]',
    );
    expect(legendDot?.style.background).toBe("rgb(148, 163, 184)");
  });
});
