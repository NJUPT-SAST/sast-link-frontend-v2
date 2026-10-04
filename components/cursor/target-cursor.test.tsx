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
    jest.restoreAllMocks();
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

  it("hides while a fullscreen overlay sets data-cursor-hidden", async () => {
    mockPointer(true);
    render(<TargetCursor />);
    const root = await screen.findByTestId("target-cursor");

    document.documentElement.setAttribute("data-cursor-hidden", "");
    await waitFor(() => expect(root.style.visibility).toBe("hidden"));

    document.documentElement.removeAttribute("data-cursor-hidden");
    await waitFor(() => expect(root.style.visibility).toBe(""));
  });

  // A native text drag-and-drop owns the pointer: no pointermove reaches the
  // page until dragend. Without the hand-off the reticle froze at the drag
  // origin while .tc-active kept the system cursor hidden.
  it("hands the pointer to the system during a native drag and resyncs on dragend", async () => {
    mockPointer(true);
    render(
      <>
        <TargetCursor />
        <button>锁定我</button>
      </>,
    );
    const root = await screen.findByTestId("target-cursor");

    // A drag typically starts on the locked element itself (links are both
    // lockable and draggable) — the lock must drop with the reticle, or the
    // brackets re-lock onto the drag origin after dragend.
    fireEvent.mouseOver(screen.getByRole("button", { name: "锁定我" }));
    await waitFor(() => expect(root.dataset.state).toBe("locked"));

    fireEvent.dragStart(window);
    await waitFor(() => {
      expect(root.style.visibility).toBe("hidden");
      expect(root.dataset.state).toBe("idle");
      expect(document.documentElement).not.toHaveClass("tc-active");
    });

    fireEvent.dragEnd(window, { clientX: 320, clientY: 240 });
    await waitFor(() => {
      expect(root.style.visibility).toBe("");
      expect(document.documentElement).toHaveClass("tc-active");
    });

    // The loop resumed: a fresh move after dragend is tracked again.
    fireEvent(window, new MouseEvent("pointermove", { clientX: 500, clientY: 300 }));
    await waitFor(() =>
      expect(root.style.transform).toBe("translate(500px, 300px)"),
    );
  });

  // Edge's Super Drag Drop can take a text drag over and end it without the
  // page ever seeing dragend or another pointer event — a frozen page. A
  // selection drag is cancelled at dragstart, so it never starts.
  it("cancels a native drag that starts on selected text", async () => {
    mockPointer(true);
    render(
      <>
        <TargetCursor />
        <p>可选中的文本</p>
      </>,
    );
    await screen.findByTestId("target-cursor");
    const text = screen.getByText("可选中的文本").firstChild!;

    const notCancelled = fireEvent.dragStart(text);
    expect(notCancelled).toBe(false);
    expect(document.documentElement).toHaveClass("tc-active");
  });

  it("resumes on a button-free pointermove when dragend never arrives", async () => {
    mockPointer(true);
    render(<TargetCursor />);
    const root = await screen.findByTestId("target-cursor");

    fireEvent.dragStart(window);
    await waitFor(() => expect(root.style.visibility).toBe("hidden"));

    // A move with the drag's button still held does not end the drag.
    fireEvent(window, new MouseEvent("pointermove", { clientX: 100, clientY: 100, buttons: 1 }));
    expect(document.documentElement).not.toHaveClass("tc-active");

    fireEvent(window, new MouseEvent("pointermove", { clientX: 420, clientY: 260 }));
    await waitFor(() => {
      expect(document.documentElement).toHaveClass("tc-active");
      expect(root.style.visibility).toBe("");
      expect(root.style.transform).toBe("translate(420px, 260px)");
    });
  });

  it("releases the press when the pointer stream is cancelled", async () => {
    mockPointer(true);
    render(<TargetCursor />);
    const root = await screen.findByTestId("target-cursor");
    const dot = root.querySelector("div") as HTMLElement;
    const scale = () => Number(/scale\(([\d.]+)\)/.exec(dot.style.transform)?.[1] ?? NaN);
    // Keep the loop awake (it pauses 120ms after the last move) so press can
    // lerp all the way in each direction.
    const nudge = () => fireEvent(window, new MouseEvent("pointermove", { clientX: 200, clientY: 200 }));

    fireEvent.mouseDown(window);
    await waitFor(() => {
      nudge();
      expect(scale()).toBeGreaterThan(1.5);
    });

    // No pointerup/mouseup follows a cancelled stream — the press must still
    // release, or the dot stays swollen and the corners stay gathered.
    fireEvent(window, new Event("pointercancel"));
    await waitFor(() => {
      nudge();
      expect(scale()).toBeLessThan(1.05);
    });
  });

  it("pauses the rAF loop when idle and wakes on the next pointer move", async () => {
    mockPointer(true);
    // Control the loop manually: capture each rAF callback instead of letting
    // jsdom's timer-driven rAF run, so the pause/wake decision is deterministic.
    const rafSpy = jest.spyOn(window, "requestAnimationFrame");
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    let captured: FrameRequestCallback | null = null;
    rafSpy.mockImplementation((cb) => {
      captured = cb;
      return 1;
    });

    let clock = 0;
    jest.spyOn(performance, "now").mockImplementation(() => clock);

    render(<TargetCursor />);
    await screen.findByTestId("target-cursor");

    // A move wakes the loop and arms a frame.
    fireEvent.pointerMove(window, { clientX: 40, clientY: 40 });
    expect(captured).not.toBeNull();
    const cb = captured!;
    const callsBeforeIdle = rafSpy.mock.calls.length;

    // Pointer still past the threshold: the next frame must pause (no reschedule).
    clock = 10_000;
    cb(10_000);
    expect(rafSpy.mock.calls.length).toBe(callsBeforeIdle);

    // A fresh move resumes the loop.
    fireEvent.pointerMove(window, { clientX: 60, clientY: 60 });
    expect(rafSpy.mock.calls.length).toBeGreaterThan(callsBeforeIdle);
  });
});
