import { fireEvent, render, screen } from "@testing-library/react";

import { SurveyIntro } from "./survey-intro";

const SEEN_KEY = "sast-survey-seen";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduced : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("SurveyIntro", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockReducedMotion(false);
    mockPathname = "/";
  });

  it.each(["/privacy", "/terms"])(
    "stays out of the way on %s, which is a document rather than an entry point",
    (route) => {
      mockPathname = route;
      render(<SurveyIntro />);
      expect(screen.queryByTestId("survey-intro")).not.toBeInTheDocument();
      // The boot flag must not be consumed either, so the intro still plays
      // when the reader returns to the app.
      expect(sessionStorage.getItem(SEEN_KEY)).toBeNull();
    },
  );

  it.each(["/oauth/error", "/oauth/callback", "/oauth/bind/github", "/oauth/bind/lark", "/oauth/consent"])(
    "stays out of the way on %s, a landing page a login bounces the visitor to",
    (route) => {
      mockPathname = route;
      render(<SurveyIntro />);
      expect(screen.queryByTestId("survey-intro")).not.toBeInTheDocument();
      // Landing pages skip without consuming the boot flag, so a later visit
      // to an entry point still gets the intro.
      expect(sessionStorage.getItem(SEEN_KEY)).toBeNull();
    },
  );

  it("plays once on the first visit of a session, on any route", () => {
    render(<SurveyIntro />);
    expect(screen.getByTestId("survey-intro")).toBeInTheDocument();
  });

  it("renders nothing once seen in this session", () => {
    sessionStorage.setItem(SEEN_KEY, "1");
    render(<SurveyIntro />);
    expect(screen.queryByTestId("survey-intro")).not.toBeInTheDocument();
  });

  it("renders nothing under reduced-motion", () => {
    mockReducedMotion(true);
    render(<SurveyIntro />);
    expect(screen.queryByTestId("survey-intro")).not.toBeInTheDocument();
  });

  it("skips on pointerdown and remembers the session", () => {
    render(<SurveyIntro />);
    fireEvent.pointerDown(window);
    expect(screen.queryByTestId("survey-intro")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SEEN_KEY)).toBe("1");
  });

  it("hides the custom cursor while playing", () => {
    render(<SurveyIntro />);
    expect(document.documentElement).toHaveAttribute("data-cursor-hidden");
  });

  it("does not hide the cursor once seen in this session", () => {
    sessionStorage.setItem(SEEN_KEY, "1");
    render(<SurveyIntro />);
    expect(document.documentElement).not.toHaveAttribute("data-cursor-hidden");
  });
});
