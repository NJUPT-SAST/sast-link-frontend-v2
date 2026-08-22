"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@/lib/utils";
import { message } from "@/lib/message";

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
      message.error("验证码发送失败，请重试");
    }
  }, [onResend]);

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={handleResend}
      className={cn(
        "appearance-none border-0 bg-transparent p-0 text-sm font-medium tabular-nums",
        clickable ? "cursor-pointer text-primary" : "text-muted-foreground",
      )}
    >
      {clickable ? "" : `${count}s 后`}重新发送
    </button>
  );
}
