import { fireEvent, render, screen } from "@testing-library/react";

import { UserFilters } from "./user-filters";
import { AuditLogFilters } from "./audit-log-filters";

/**
 * The filter rows lay every control out side by side at xl, so a single field with
 * a different input height or label size visibly breaks the row. This locks the
 * shared rhythm in place: 学号/关键词 previously came from AuthFormField (h-12,
 * mb-2 text-[13px]) and sat 4px taller than their neighbours.
 *
 * Below xl the secondary filters collapse behind a 筛选 toggle (FilterDrawer), so
 * these tests also pin the drawer contract: fields stay mounted while collapsed and
 * the badge reports how many hidden filters are active.
 */
const LABEL_CLASS = "mb-1.5 block text-xs text-muted-foreground";

const USER_FIELDS = [
  "role",
  "state",
  "department",
  "needs_completion",
  "student_id",
  "keyword",
];
const AUDIT_FIELDS = ["user_id", "action", "resource", "success", "start_time", "end_time"];

function renderUserFilters(
  value: Parameters<typeof UserFilters>[0]["value"] = { page: 1, page_size: 20 },
) {
  return render(<UserFilters value={value} onChange={jest.fn()} />);
}

function renderAuditFilters(
  value: Parameters<typeof AuditLogFilters>[0]["value"] = { page: 1, page_size: 20 },
) {
  return render(<AuditLogFilters value={value} onChange={jest.fn()} />);
}

function expectUniformRow(ids: string[]) {
  for (const id of ids) {
    const control = document.getElementById(id);
    const label = document.querySelector(`label[for="${id}"]`);

    // Same control height everywhere in the row.
    expect(control?.className).toMatch(/\bh-11\b/);
    expect(control?.className).not.toMatch(/\bh-12\b/);
    // Same label metrics, so the labels sit on one baseline.
    expect(label?.className).toBe(LABEL_CLASS);
  }
}

/** The element carrying the xl grid track definition (FilterDrawer's root). */
function gridRow(container: HTMLElement) {
  return container.querySelector('[class*="xl:grid-cols-"]') as HTMLElement | null;
}

describe("admin filter row alignment", () => {
  it("keeps every user filter control on one height and label baseline", () => {
    renderUserFilters();

    expectUniformRow(USER_FIELDS);

    // Both text inputs are still reachable by their labels after moving off
    // AuthFormField.
    expect(screen.getByLabelText("学号")).toBeInTheDocument();
    expect(screen.getByLabelText("关键词")).toBeInTheDocument();
  });

  it("keeps the audit filter selects and date pickers on the same baseline", () => {
    renderAuditFilters();

    expectUniformRow(AUDIT_FIELDS);
  });

  it("aligns the row from the top so an error message cannot shift a control", () => {
    const { container } = renderUserFilters();

    // items-end would let a field that grows a validation message below it push
    // its own control upward, out of line with the rest of the row.
    expect(gridRow(container)?.className).toMatch(/\bxl:items-start\b/);
  });

  // At xl the row is an explicit grid, so a filter added without a matching track
  // silently lands on a second row and pushes 搜索/重置 off the line again. The
  // toggle is xl:hidden (out of the grid flow) and the panel/actions wrappers are
  // xl:contents, so the effective child count is fields + 2 buttons.
  it.each([
    ["user filters", renderUserFilters, USER_FIELDS.length],
    ["audit log filters", renderAuditFilters, AUDIT_FIELDS.length],
  ])("declares one grid track per control in the %s row", (_name, renderRow, fieldCount) => {
    const { container } = renderRow();
    const row = gridRow(container);
    expect(row).not.toBeNull();

    const tracks = /xl:grid-cols-\[([^\]]+)\]/.exec(row!.className)?.[1];
    expect(tracks).toBeDefined();

    // Tailwind arbitrary values use _ for spaces, so each track is one segment.
    expect(tracks!.split("_")).toHaveLength(fieldCount + 2);
    // The last two tracks are the buttons, sized to their content.
    expect(tracks!.endsWith("auto_auto")).toBe(true);
  });
});

describe("admin filter drawer", () => {
  it("keeps 关键词 visible and collapses the rest behind the toggle", () => {
    renderUserFilters();

    const toggle = screen.getByRole("button", { name: /筛选/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const panel = document.getElementById("admin-filter-panel")!;
    expect(panel).not.toContainElement(screen.getByLabelText("关键词"));
    expect(panel).toContainElement(screen.getByLabelText("角色"));

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps collapsed fields mounted so an active filter is never dropped", () => {
    // A filter that arrived from the URL lives inside the collapsed panel; if the
    // drawer unmounted it, react-hook-form would lose the value and the next
    // 搜索 would silently widen the query.
    renderUserFilters({ page: 1, page_size: 20, role: "admin", student_id: "B24040001" });

    expect(screen.getByLabelText("角色")).toHaveValue("admin");
    expect(screen.getByLabelText("学号")).toHaveValue("B24040001");
  });

  it("counts the active collapsed filters on the toggle badge", () => {
    renderUserFilters({
      page: 1,
      page_size: 20,
      role: "admin",
      state: "on_sast",
      // 关键词 stays visible, so it must not be counted.
      keyword: "张",
    });

    expect(screen.getByRole("button", { name: /筛选/ })).toHaveTextContent("2");
  });

  it("shows no badge when only the visible keyword filter is set", () => {
    renderUserFilters({ page: 1, page_size: 20, keyword: "张" });

    const toggle = screen.getByRole("button", { name: /筛选/ });
    expect(toggle.textContent).toBe("筛选");
  });

  it("collapses every audit filter, since that row has no visible field", () => {
    renderAuditFilters({ page: 1, page_size: 20, action: "login", success: false });

    const panel = document.getElementById("admin-filter-panel")!;
    for (const id of AUDIT_FIELDS) {
      expect(panel).toContainElement(document.getElementById(id));
    }
    expect(screen.getByRole("button", { name: /筛选/ })).toHaveTextContent("2");
  });
});
