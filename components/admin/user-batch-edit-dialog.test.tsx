import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { UserBatchEditDialog } from "./user-batch-edit-dialog";

// Radix Dialog portals into document.body; jsdom lacks the animations the
// content relies on, so a plain render of the controlled open state is enough.
function setup(overrides: { onConfirm?: jest.Mock } = {}) {
  const onConfirm = overrides.onConfirm ?? jest.fn();
  const onOpenChange = jest.fn();
  render(
    <UserBatchEditDialog
      open
      onOpenChange={onOpenChange}
      count={3}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm, onOpenChange };
}

async function pickDepartment(value: string) {
  fireEvent.change(screen.getByLabelText("部门"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "确认修改" }));
}

describe("UserBatchEditDialog department tri-state (backend PR #100)", () => {
  it("sends the picked department key through onConfirm", async () => {
    const { onConfirm } = setup();
    await pickDepartment("competition");
    expect(onConfirm).toHaveBeenCalledWith({ department: "competition" });
  });

  it("maps the clear sentinel to an empty-string clear command", async () => {
    const { onConfirm } = setup();
    await pickDepartment("__clear__");
    // "" is the backend's clear-to-NULL command, distinct from "absent".
    expect(onConfirm).toHaveBeenCalledWith({ department: "" });
  });

  it("keeps the confirm button disabled while nothing is picked", () => {
    setup();
    expect(screen.getByRole("button", { name: "确认修改" })).toBeDisabled();
  });

  it("offers the seven-department catalogue from GET /departments", async () => {
    setup();
    const select = (await screen.findByLabelText("部门")) as HTMLSelectElement;
    await waitFor(() => {
      const values = Array.from(select.options).map((o) => o.value);
      // "" untouched + "__clear__" sentinel + the seven backend keys.
      expect(values).toEqual([
        "",
        "__clear__",
        "software",
        "media",
        "electronics",
        "office",
        "liaison",
        "publicity",
        "competition",
      ]);
    });
  });
});
