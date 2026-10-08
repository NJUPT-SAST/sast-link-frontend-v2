import { fireEvent, render, screen } from "@testing-library/react";

import { NavigationGuard } from "./navigation-guard";
import { useNavigationGuardStore } from "@/store/use-navigation-guard-store";

const mockConfirm = jest.fn();
const mockPushState = jest.spyOn(window.history, "pushState");

function renderWithLink() {
  const clickSpy = jest.fn();
  render(
    <NavigationGuard>
      <a href="/settings" onClick={clickSpy}>
        设置
      </a>
      <a href="https://example.com">外部链接</a>
    </NavigationGuard>,
  );
  return clickSpy;
}

/** Fires a real cancelable click so defaultPrevented is observable afterwards. */
function clickLink(name: string) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  fireEvent(screen.getByText(name), event);
  return event;
}

describe("NavigationGuard", () => {
  beforeEach(() => {
    mockConfirm.mockReset();
    window.confirm = mockConfirm as unknown as typeof window.confirm;
    // Reset the store so tests don't inherit a blocked state from each other.
    useNavigationGuardStore.setState({ blocked: false, guardUrl: null });
    // jsdom starts at "/" — normalise history before clearing the spy so the
    // reset navigation itself isn't recorded.
    window.history.pushState(null, "", "/");
    mockPushState.mockClear();
  });

  it("prevents in-app navigation when blocked and confirm is declined", () => {
    useNavigationGuardStore.getState().setBlocked(true);
    const clickSpy = renderWithLink();

    const event = clickLink("设置");

    expect(mockConfirm).toHaveBeenCalledWith("有未保存的修改，确定要离开吗？");
    expect(event.defaultPrevented).toBe(true);
    // Capture-phase stopPropagation keeps the link's own handler unmounted
    // from the event, so the in-page exit action never runs.
    expect(clickSpy).not.toHaveBeenCalled();
    // Blocked state survives a declined exit.
    expect(useNavigationGuardStore.getState().blocked).toBe(true);
  });

  it("lets the navigation through and clears the guard when confirmed", () => {
    useNavigationGuardStore.getState().setBlocked(true);
    const clickSpy = renderWithLink();
    mockConfirm.mockReturnValue(true);

    const event = clickLink("设置");

    expect(event.defaultPrevented).toBe(false);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(useNavigationGuardStore.getState().blocked).toBe(false);
  });

  it("does not prompt when not blocked", () => {
    renderWithLink();

    clickLink("设置");

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(useNavigationGuardStore.getState().blocked).toBe(false);
  });

  it("ignores external links even when blocked", () => {
    useNavigationGuardStore.getState().setBlocked(true);
    renderWithLink();

    clickLink("外部链接");

    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("pushes the guarded URL back when popstate is declined", () => {
    render(<NavigationGuard>页面</NavigationGuard>);
    // Stage a guarded page path first, like the real app would have.
    window.history.pushState(null, "", "/profile/edit");
    useNavigationGuardStore.getState().setBlocked(true);
    mockPushState.mockClear();
    mockConfirm.mockReturnValue(false);

    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(mockPushState).toHaveBeenLastCalledWith(null, "", "/profile/edit");
    expect(useNavigationGuardStore.getState().blocked).toBe(true);
  });

  it("clears the guard when popstate is confirmed", () => {
    render(<NavigationGuard>页面</NavigationGuard>);
    useNavigationGuardStore.getState().setBlocked(true);
    mockConfirm.mockReturnValue(true);

    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(mockPushState).not.toHaveBeenCalled();
    expect(useNavigationGuardStore.getState().blocked).toBe(false);
  });
});
