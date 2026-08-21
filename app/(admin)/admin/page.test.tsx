import { render, screen, waitFor } from "@testing-library/react";
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

jest.mock("@/lib/api/admin", () => ({
  getAdminStats: (...args: unknown[]) => mockGetAdminStats(...args),
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
});
