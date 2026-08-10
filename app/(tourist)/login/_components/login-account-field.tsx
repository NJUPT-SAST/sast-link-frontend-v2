"use client";

import { useId, useMemo, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DOMAINS = ["@njupt.edu.cn", "@sast.fun", "其他邮箱"] as const;
type Domain = (typeof DOMAINS)[number];

const OTHER_EMAIL = "其他邮箱";

interface LoginAccountFieldProps {
  value: { localPart: string; domain: Domain };
  onChange: (value: { localPart: string; domain: Domain }) => void;
  label?: string;
  error?: string;
  autoComplete?: string;
  /** When true, typing @ does NOT auto-resolve the domain (e.g. register). */
  disableAtDetection?: boolean;
  /** Restrict the available domains. Defaults to all domains. */
  allowedDomains?: readonly Domain[];
  /** Copy context for the resolved-email hint. Defaults to login ("继续"). */
  context?: "login" | "reset";
  /** Fired when Enter is pressed inside the address input (e.g. to send a code
   *  when the form's submit button is disabled). */
  onEnter?: () => void;
}

export function LoginAccountField({
  value,
  onChange,
  label = "账户",
  error,
  autoComplete = "username",
  disableAtDetection = false,
  allowedDomains = DOMAINS,
  context = "login",
  onEnter,
}: LoginAccountFieldProps) {
  const [focused, setFocused] = useState(false);
  // id linking the input to its error / hint copy for screen readers.
  const describedBy = useId();
  const domainOptions = useMemo(
    () => DOMAINS.filter((d) => allowedDomains.includes(d)),
    [allowedDomains],
  );
  // Once an `@` appears the user is typing a full address — hide the domain
  // pill and treat the whole input as the address.
  const atResolved = useMemo(() => {
    if (disableAtDetection) return null;
    return value.localPart.includes("@") ? value.localPart : null;
  }, [value.localPart, disableAtDetection]);

  const handleChange = (raw: string) => {
    if (disableAtDetection) {
      onChange({ ...value, localPart: raw });
      return;
    }
    // An `@` means the input is already a full address: switch to the
    // other-email mode so the domain pill disappears and the raw value submits.
    if (value.domain !== OTHER_EMAIL && raw.includes("@")) {
      onChange({ localPart: raw, domain: OTHER_EMAIL });
      return;
    }
    onChange({ ...value, localPart: raw });
  };

  // Hint follows the selected domain: @njupt.edu.cn accounts are student ids,
  // @sast.fun accounts are a custom email prefix.
  const placeholder =
    value.domain === OTHER_EMAIL
      ? "完整邮箱地址"
      : value.domain === "@sast.fun"
        ? "邮箱前缀"
        : "学号";

  return (
    <div className="w-full">
      <label className="mb-2 block text-[13px] text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-lg border bg-card px-3.5 transition-colors",
          focused ? "border-ring" : "border-input",
          "focus-within:ring-2 focus-within:ring-ring/25",
        )}
      >
        <input
          type="text"
          inputMode="email"
          autoComplete={autoComplete}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error || value.localPart ? describedBy : undefined}
          placeholder={placeholder}
          value={value.localPart}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && onEnter) {
              event.preventDefault();
              onEnter();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-tertiary outline-none"
        />
        {!atResolved && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="选择邮箱域名"
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                  "bg-secondary/80 text-muted-foreground hover:bg-secondary",
                  "dark:bg-muted/60 dark:hover:bg-muted",
                )}
              >
                {value.domain}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem] p-1.5">
              {domainOptions.map((domain) => (
                <DropdownMenuItem
                  key={domain}
                  data-cursor-target
                  onClick={() => onChange({ ...value, domain })}
                  className="cursor-pointer rounded-md px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {domain}
                  {domain === value.domain && (
                    <Check className="ml-auto size-3.5 text-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {error ? (
        <p id={describedBy} className="mt-1 min-h-4 text-xs text-destructive">{error}</p>
      ) : value.localPart ? (
        <p id={describedBy} className="mt-1 min-h-4 text-xs text-muted-foreground">
          {context === "reset"
            ? `将发送验证码到 ${
                value.domain === OTHER_EMAIL || atResolved
                  ? value.localPart
                  : `${value.localPart}${value.domain}`
              }`
            : `将使用 ${
                value.domain === OTHER_EMAIL || atResolved
                  ? value.localPart
                  : `${value.localPart}${value.domain}`
              } 继续`}
        </p>
      ) : (
        <p className="mt-1 min-h-4" />
      )}
    </div>
  );
}
