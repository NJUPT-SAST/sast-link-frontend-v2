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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="主题切换加载中"
              className="size-10 rounded-none border-0 bg-transparent p-0 text-foreground/70 shadow-none hover:-translate-y-px hover:bg-transparent hover:text-foreground"
            >
              <Laptop />
            </Button>
          </TooltipTrigger>
          <TooltipContent>切换主题</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>主题模式</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={currentTheme}
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
              >
                <DropdownMenuRadioItem value="light" data-cursor-target>
                  <Sun />
                  {THEME_LABELS.light}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" data-cursor-target>
                  <Moon />
                  {THEME_LABELS.dark}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system" data-cursor-target>
                  <Laptop />
                  {THEME_LABELS.system}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>切换主题</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
