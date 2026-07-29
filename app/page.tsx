"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

import { useUserListStore } from "@/store/use-user-list-store";
import { getUserProfile } from "@/lib/api/user";
import { setSession } from "@/lib/token";
import { message } from "@/lib/message";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { DEFAULT_AVATAR, DEFAULT_NAME } from "@/lib/constants/profile";

export default function Home() {
  const router = useRouter();
  const { accounts, removeAccount } = useUserListStore();
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accounts.length === 0) router.replace("/login");
  }, [accounts.length, router]);

  const activeIndex = Math.min(selected, Math.max(0, accounts.length - 1));
  const active = accounts[activeIndex];

  const handleLogin = async () => {
    const account = accounts[activeIndex];
    if (!account) return;

    setLoading(true);
    setSession(account.session);
    try {
      await getUserProfile();
      router.replace("/home");
    } catch {
      removeAccount(activeIndex);
      message.error("登录状态已过期，请重新登录");
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length === 0) return null;

  return (
    <AuthShell tech="Accounts / 01">
      <div className="mb-8 flex flex-col gap-2.5">
        <h2 className="type-title1">选择账号</h2>
      </div>

      <div className="border-t border-hairline">
        {accounts.map((account, index) => (
          <div
            key={account.userId}
            className={cn(
              "flex min-h-[72px] items-center gap-3.5 border-b border-l-2 border-hairline px-3.5 transition-colors",
              index === activeIndex
                ? "border-l-link bg-recessed"
                : "border-l-transparent hover:bg-recessed",
            )}
          >
            <button
              type="button"
              onClick={() => setSelected(index)}
              className="flex flex-1 items-center gap-3.5 text-left"
            >
              <Image
                src={account.avatar ?? DEFAULT_AVATAR}
                alt=""
                width={44}
                height={44}
                className="grayscale"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{account.name || DEFAULT_NAME}</div>
                <div className="truncate text-xs text-muted-foreground">{account.loginEmail}</div>
              </div>
            </button>
            <button
              type="button"
              aria-label={`移除 ${account.name || account.loginEmail}`}
              onClick={(event) => {
                event.stopPropagation();
                removeAccount(index);
              }}
              className="grid size-7 place-items-center rounded text-tertiary transition-colors hover:bg-hairline hover:text-destructive"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <Button className="mt-7 w-full" onClick={handleLogin} disabled={loading}>
        {loading ? <DotLoading /> : `以${active?.name || DEFAULT_NAME}继续`}
      </Button>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-link hover:underline">使用其他账号</Link>
      </p>
    </AuthShell>
  );
}
