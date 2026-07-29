"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();
let mediaWatched = false;

function prefersLight() {
  return window.matchMedia("(prefers-color-scheme: light)");
}

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && !prefersLight().matches);
  document.documentElement.classList.toggle("dark", dark);
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

const getServerSnapshot = (): Theme => "system";

function getResolvedSnapshot(): "light" | "dark" {
  const stored = localStorage.getItem(STORAGE_KEY);
  const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  return theme === "dark" || (theme === "system" && !prefersLight().matches) ? "dark" : "light";
}

const getServerResolved = (): "light" | "dark" => "light";

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!mediaWatched) {
    mediaWatched = true;
    prefersLight().addEventListener("change", () => {
      applyTheme(getSnapshot());
      listeners.forEach((callback) => callback());
    });
  }
  return () => {
    listeners.delete(callback);
  };
}

export function setTheme(next: Theme) {
  localStorage.setItem(STORAGE_KEY, next);

  const run = () => {
    applyTheme(next);
    listeners.forEach((callback) => callback());
  };

  if ("startViewTransition" in document) {
    document.startViewTransition(run);
  } else {
    run();
  }
}

/**
 * Theme store compatible with next-themes' useTheme API.
 * The anti-FOUC inline script in app/layout.tsx applies the class pre-paint;
 * this hook keeps it in sync afterwards. No Provider needed.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { theme, setTheme };
}

/** Resolved theme synced with the `.dark` class on <html>. For libs that need "light"|"dark". */
export function useResolvedTheme() {
  return useSyncExternalStore(subscribe, getResolvedSnapshot, getServerResolved);
}
