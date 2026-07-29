"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@/lib/utils";

interface VerificationCodeInputProps {
  onResend: () => Promise<void>;
}

export function VerificationCodeInput({ onResend }: VerificationCodeInputProps) {
  const [clickable, setClickable] = useState(false);
  const [count, setCount] = useState(60);

  useEffect(() => {
    if (clickable) return;

    const intervalId = setInterval(() => {
      setCount((prev) => {
        if (prev <= 0) {
          setClickable(true);
          clearInterval(intervalId);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [clickable]);

  const handleResend = useCallback(async () => {
    setClickable(false);
    try {
      await onResend();
    } catch {
      setClickable(true);
    }
  }, [onResend]);

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={handleResend}
      className={cn(
        "appearance-none border-0 bg-transparent p-0 text-base font-semibold",
        clickable ? "cursor-pointer text-primary" : "text-muted-foreground",
      )}
    >
      {clickable ? "" : `${count}s 后`}重新发送
    </button>
  );
}
