"use client";

import { useSyncExternalStore } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const THEME_LABELS = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const currentTheme = theme === "light" || theme === "dark" ? theme : "system";
  const CurrentIcon =
    currentTheme === "light" ? Sun : currentTheme === "dark" ? Moon : Laptop;

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="主题切换加载中"
        title="主题切换加载中"
        className="size-10 rounded-none border-0 bg-transparent p-0 text-foreground/70 shadow-none hover:-translate-y-px hover:bg-transparent hover:text-foreground"
      >
        <Laptop />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="主题模式"
          title={`当前主题：${THEME_LABELS[currentTheme]}`}
          className="size-10 rounded-none border-0 bg-transparent p-0 text-foreground/70 shadow-none hover:-translate-y-px hover:bg-transparent hover:text-foreground"
        >
          <CurrentIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>主题模式</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={currentTheme}
            onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
          >
            <DropdownMenuRadioItem value="light">
              <Sun />
              {THEME_LABELS.light}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon />
              {THEME_LABELS.dark}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Laptop />
              {THEME_LABELS.system}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
