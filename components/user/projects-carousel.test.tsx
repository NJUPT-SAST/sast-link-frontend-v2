import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ProjectsCarousel } from "./projects-carousel";

let reduced = true;
const listeners = new Set<() => void>();
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  jest.useFakeTimers();
  reduced = true;
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() { return reduced; },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
});
afterEach(() => { jest.useRealTimers(); window.matchMedia = originalMatchMedia; listeners.clear(); });
const activeTitle = () => document.querySelector('article[aria-hidden="false"] h3')?.textContent;

it("stops autoplay for reduced motion, including preference changes, while keeping manual selection", () => {
  render(<ProjectsCarousel />);
  const first = activeTitle();
  act(() => jest.advanceTimersByTime(6000));
  expect(activeTitle()).toBe(first);
  const controls = screen.getAllByRole("button", { name: /^查看 / });
  fireEvent.click(controls[1]);
  expect(activeTitle()).not.toBe(first);
  const second = activeTitle();
  act(() => { reduced = false; listeners.forEach((listener) => listener()); jest.advanceTimersByTime(3100); });
  expect(activeTitle()).not.toBe(second);
  act(() => { reduced = true; listeners.forEach((listener) => listener()); });
  const stopped = activeTitle();
  act(() => jest.advanceTimersByTime(6000));
  expect(activeTitle()).toBe(stopped);
});

it("removes inactive-card links from keyboard navigation (F17)", () => {
  render(<ProjectsCarousel />);
  const links = document.querySelectorAll<HTMLAnchorElement>('article[aria-hidden="true"] a');
  expect(links.length).toBeGreaterThan(0);
  links.forEach((link) => {
    expect(link.tabIndex).toBe(-1);

  });
});

 it("keeps autoplay paused while a link has focus even after the pointer leaves", () => {
  reduced = false;
  render(<ProjectsCarousel />);
  const section = screen.getByRole("region", { name: "About SAST's projects" });
  const link = document.querySelector<HTMLAnchorElement>('article[aria-hidden="false"] a')!;
  fireEvent.focus(link);
  fireEvent.mouseLeave(link.closest("article")!.parentElement!);
  fireEvent.mouseLeave(section);
  const title = activeTitle();
  act(() => jest.advanceTimersByTime(6000));
  expect(activeTitle()).toBe(title);
});



it("gives SAST Shop only its GitHub link while preserving other Visit links", () => {
  render(<ProjectsCarousel />);
  fireEvent.click(screen.getByRole("button", { name: "查看 SAST Shop" }));
  const shop = screen.getByRole("article");
  expect(within(shop).getAllByRole("link")).toHaveLength(1);
  expect(within(shop).getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/NJUPT-SAST/sast-shop-v2");
  expect(within(shop).queryByRole("link", { name: /Visit/ })).not.toBeInTheDocument();
  for (const name of ["SAST Homepage", "SAST People", "SAST Link"]) {
    fireEvent.click(screen.getByRole("button", { name: `查看 ${name}` }));
    expect(within(screen.getByRole("article")).getByRole("link", { name: /Visit/ })).toHaveAttribute("tabindex", "0");
  }
});




it("advances after two seconds even when the pointer is over the section", () => {
  reduced = false;
  render(<ProjectsCarousel />);
  fireEvent.mouseEnter(screen.getByRole("region", { name: "About SAST's projects" }));
  act(() => jest.advanceTimersByTime(1999));
  expect(activeTitle()).toBe("SAST Homepage");
  act(() => jest.advanceTimersByTime(1));
  expect(activeTitle()).toBe("SAST People");
});

it("pauses only over outbound links and resumes after leaving", () => {
  reduced = false;
  render(<ProjectsCarousel />);
  const link = within(screen.getByRole("article")).getByRole("link", { name: /GitHub/ });
  fireEvent.mouseEnter(link);
  act(() => jest.advanceTimersByTime(4000));
  expect(activeTitle()).toBe("SAST Homepage");
  fireEvent.mouseLeave(link);
  act(() => jest.advanceTimersByTime(2000));
  expect(activeTitle()).toBe("SAST People");
});

it("resumes autoplay after pointer selection but pauses for keyboard focus", () => {
  reduced = false;
  render(<ProjectsCarousel />);
  const shop = screen.getByRole("button", { name: "查看 SAST Shop" });
  fireEvent.focus(shop);
  fireEvent.click(shop);
  act(() => jest.advanceTimersByTime(4000));
  expect(activeTitle()).toBe("SAST Shop");
  fireEvent.pointerDown(shop);
  fireEvent.pointerUp(shop);
  fireEvent.click(shop, { detail: 1 });
  act(() => jest.advanceTimersByTime(2000));
  expect(activeTitle()).toBe("SAST Homepage");
});




it("keeps project names and links without descriptions", () => {
  render(<ProjectsCarousel />);
  for (const name of ["SAST Homepage", "SAST People", "SAST Link", "SAST Shop"]) {
    fireEvent.click(screen.getByRole("button", { name: `查看 ${name}` }));
    const card = screen.getByRole("article");
    expect(within(card).getByRole("heading", { name })).toBeVisible();
    expect(within(card).getByRole("link", { name: /GitHub/ })).toBeVisible();
    expect(card.querySelector("p")).toBeNull();
  }
});

it("keeps card proportions consistent with centered content", () => {
  render(<ProjectsCarousel />);
  const card = screen.getByRole("article");
  expect(card).toHaveClass("aspect-[16/10]", "w-[min(480px,72vw)]");
  expect(card.parentElement).toHaveClass("h-[calc(min(300px,45vw)_+_64px)]");
  expect(card.querySelector("h3")?.parentElement).toHaveClass("justify-center", "gap-3", "sm:gap-6");
});


it("keeps neighboring cards legible without dropping them below the active card", () => {
  render(<ProjectsCarousel />);
  const neighbors = Array.from(document.querySelectorAll<HTMLElement>('article[aria-hidden="true"]')).filter(card => card.style.pointerEvents !== "none");
  expect(neighbors).toHaveLength(2);
  neighbors.forEach(card => {
    expect(card.style.transform).toContain("scale(.72)");
    expect(card.style.transform).toContain("12px");
  });
});


it.each(["pointerUp", "pointerCancel", "pointerLeave"] as const)("pauses during a press and resumes after %s", (end) => {
  reduced = false;
  render(<ProjectsCarousel />);
  const section = screen.getByRole("region", { name: "About SAST's projects" });
  fireEvent.pointerDown(section);
  act(() => jest.advanceTimersByTime(4000));
  expect(activeTitle()).toBe("SAST Homepage");
  fireEvent[end](section);
  act(() => jest.advanceTimersByTime(2000));
  expect(activeTitle()).toBe("SAST People");
});
