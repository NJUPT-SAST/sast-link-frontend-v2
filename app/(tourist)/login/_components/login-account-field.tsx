"use client";

import { useMemo, useState } from "react";

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
}

export function LoginAccountField({
  value,
  onChange,
  label = "账户",
  error,
  autoComplete = "username",
  disableAtDetection = false,
  allowedDomains = DOMAINS,
}: LoginAccountFieldProps) {
  const [focused, setFocused] = useState(false);
  const domainOptions = useMemo(
    () => DOMAINS.filter((d) => allowedDomains.includes(d)),
    [allowedDomains],
  );
  const atResolved = useMemo(() => {
    if (disableAtDetection || value.domain === OTHER_EMAIL) return null;
    const atIndex = value.localPart.indexOf("@");
    if (atIndex < 0) return null;
    const suffix = value.localPart.slice(atIndex + 1);
    return DOMAINS.find((d) => d !== OTHER_EMAIL && d.slice(1) === suffix) ?? null;
  }, [value.localPart, value.domain, disableAtDetection]);

  const handleChange = (raw: string) => {
    if (disableAtDetection || value.domain === OTHER_EMAIL) {
      onChange({ ...value, localPart: raw });
      return;
    }
    const atIndex = raw.indexOf("@");
    if (atIndex < 0) {
      onChange({ ...value, localPart: raw });
      return;
    }
    const prefix = raw.slice(0, atIndex);
    const suffix = raw.slice(atIndex + 1);
    const matched = DOMAINS.find(
      (d) => d !== OTHER_EMAIL && d.slice(1) === suffix,
    );
    if (matched) {
      onChange({ localPart: prefix, domain: matched });
    } else {
      onChange({ ...value, localPart: raw });
    }
  };

  return (
    <div className="w-full">
      <label className="mb-2 block text-[13px] text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center gap-2 border bg-card px-3.5 transition-colors",
          focused ? "border-ring" : "border-input",
        )}
      >
        <input
          type="text"
          inputMode="email"
          autoComplete={autoComplete}
          aria-label={label}
          aria-invalid={!!error}
          placeholder="学号或邮箱前缀"
          value={value.localPart}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-tertiary outline-none"
        />
        {!atResolved && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="选择邮箱域名"
                className={cn(
                  "shrink-0 px-2.5 py-1 text-sm font-medium transition-colors",
                  "bg-secondary/80 text-muted-foreground hover:bg-secondary",
                  "dark:bg-muted/60 dark:hover:bg-muted",
                )}
              >
                {value.domain}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[9rem]">
              {domainOptions.map((domain) => (
                <DropdownMenuItem
                  key={domain}
                  onClick={() => onChange({ ...value, domain })}
                  className={cn(
                    "cursor-pointer",
                    domain === value.domain && "bg-accent text-accent-foreground",
                  )}
                >
                  {domain}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {error ? (
        <p className="mt-1 min-h-4 text-xs text-destructive">{error}</p>
      ) : value.localPart ? (
        <p className="mt-1 min-h-4 text-xs text-muted-foreground">
          将使用{" "}
          {value.domain === OTHER_EMAIL || atResolved
            ? value.localPart
            : `${value.localPart}${value.domain}`}{" "}
          继续
        </p>
      ) : (
        <p className="mt-1 min-h-4" />
      )}
    </div>
  );
}
