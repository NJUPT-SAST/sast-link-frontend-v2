import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { TargetCursor } from "./target-cursor";

function mockPointer(fine: boolean, reduced = false) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes("pointer: fine") ? fine : reduced,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("TargetCursor", () => {
  afterEach(() => {
    document.documentElement.classList.remove("tc-active");
  });

  it("renders nothing on coarse pointers", () => {
    mockPointer(false);
    render(<TargetCursor />);
    expect(screen.queryByTestId("target-cursor")).not.toBeInTheDocument();
  });

  it("renders nothing under reduced-motion", () => {
    mockPointer(true, true);
    render(<TargetCursor />);
    expect(screen.queryByTestId("target-cursor")).not.toBeInTheDocument();
  });

  it("renders dot and brackets on fine pointers and hides the system cursor", async () => {
    mockPointer(true);
    render(<TargetCursor />);
    const root = await screen.findByTestId("target-cursor");
    expect(root.dataset.state).toBe("idle");
    expect(document.documentElement).toHaveClass("tc-active");
  });

  it("locks onto interactive elements on hover", async () => {
    mockPointer(true);
    render(
      <>
        <TargetCursor />
        <button>锁定我</button>
      </>,
    );
    const root = await screen.findByTestId("target-cursor");
    fireEvent.mouseOver(screen.getByRole("button", { name: "锁定我" }));
    await waitFor(() => expect(root.dataset.state).toBe("locked"));
  });

  it("locks onto explicit content targets", async () => {
    mockPointer(true);
    render(
      <>
        <TargetCursor />
        <div data-cursor-target>姓名</div>
      </>,
    );
    const root = await screen.findByTestId("target-cursor");
    fireEvent.mouseOver(screen.getByText("姓名"));
    await waitFor(() => expect(root.dataset.state).toBe("locked"));
  });

  it("does not lock onto text inputs", async () => {
    mockPointer(true);
    render(
      <>
        <TargetCursor />
        <input aria-label="签名" />
      </>,
    );
    const root = await screen.findByTestId("target-cursor");
    fireEvent.mouseOver(screen.getByRole("textbox", { name: "签名" }));
    expect(root.dataset.state).toBe("idle");
  });

  it("contracts brackets on press and releases back", async () => {
    mockPointer(true);
    render(<TargetCursor />);
    const root = await screen.findByTestId("target-cursor");
    fireEvent(window, new MouseEvent("pointermove", { clientX: 200, clientY: 200 }));
    const arm = root.querySelectorAll("div")[1] as HTMLElement;

    let before = "";
    await waitFor(() => {
      before = arm.style.transform;
      expect(before).toContain("translate");
    });

    fireEvent.mouseDown(window);
    await waitFor(() => expect(arm.style.transform).not.toBe(before));

    const duringPress = arm.style.transform;
    fireEvent.mouseUp(window);
    await waitFor(() => expect(arm.style.transform).not.toBe(duringPress));
  });
});
