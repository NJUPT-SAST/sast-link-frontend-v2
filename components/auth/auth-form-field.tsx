"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

interface AuthFormFieldProps extends Omit<ComponentPropsWithoutRef<"input">, "size" | "prefix"> {
  label: string;
  description?: ReactNode;
  suffix?: ReactNode;
  /** fixed adornment shown inside the left edge of the input (e.g. "https://") */
  prefix?: ReactNode;
  invalid?: boolean;
  error?: string;
  containerClassName?: string;
  /** render a required marker next to the label */
  required?: boolean;
}

export const AuthFormField = forwardRef<HTMLInputElement, AuthFormFieldProps>(
  function AuthFormField(
    {
      label,
      description,
      suffix,
      prefix,
      invalid = false,
      error,
      className,
      containerClassName,
      id,
      type,
      required = false,
      ...props
    },
    ref,
  ) {
    const inputId = id ?? props.name;
    const isPassword = type === "password";
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
      <div className={cn("w-full", containerClassName)}>
        <label
          htmlFor={inputId}
          className="mb-2 block text-[13px] text-muted-foreground"
        >
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        <div className="relative w-full">
          <input
            {...props}
            id={inputId}
            ref={ref}
            type={isPassword && passwordVisible ? "text" : type}
            aria-label={label}
            aria-invalid={invalid}
            className={cn(
              "h-12 w-full rounded-lg border bg-card px-3.5 text-[15px] transition-colors placeholder:text-tertiary focus-visible:outline-none",
              "[&:-webkit-autofill]:[box-shadow:inset_0_0_0_100px_var(--card)]",
              "[&:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]",
              invalid
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/25"
                : "border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
              isPassword ? "pr-11" : suffix ? "pr-28" : undefined,
              prefix ? "pl-24" : undefined,
              className,
            )}
          />
          {prefix ? (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-tertiary">
              {prefix}
            </div>
          ) : null}
          {isPassword ? (
            <button
              type="button"
              aria-label={passwordVisible ? "隐藏密码" : "显示密码"}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
              className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          ) : null}
          {suffix ? (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-muted-foreground">
              {suffix}
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1 min-h-4 text-xs text-destructive">{error}</p>
        ) : description ? (
          <p className="mt-2 text-xs leading-4 text-tertiary">
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
