import { fireEvent, render, screen } from "@testing-library/react";

import { SurveyIntro } from "./survey-intro";

const SEEN_KEY = "sast-survey-seen";

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
  });

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
