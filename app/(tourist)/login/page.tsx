"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { consumeAuthNext } from "@/lib/auth-next";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AuthShell } from "@/components/auth/auth-shell";
import { DotLoading } from "@/components/ui/dot-loading";
import LoginAccountForm from "./_components/login-account-form";
import LoginPasswordForm from "./_components/login-password-form";

const LOGIN_ACCOUNT_KEY = "sast:login-account";

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useAuthSession();
  // StrictMode double-invokes effects in dev; consumeAuthNext is destructive
  // (it clears the stash), so only run the redirect once or the second run reads
  // an empty stash and bounces an in-flight OAuth authorization back to /home.
  const redirectedRef = useRef(false);

  // An already-signed-in user has no business on the login page. The auth-next
  // stash points back at where they were heading (e.g. an OAuth consent
  // request), so respect it instead of dropping them on /home.
  useEffect(() => {
    if (status === "authenticated" && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(consumeAuthNext("/home"));
    }
  }, [router, status]);

  // Only the cross-page `?reset=success` notice (redirected back from /reset)
  // survives in the query string. The two steps live behind sessionStorage — the
  // step must never be visible in the URL, and the account itself certainly not.
  const resetNotice =
    searchParams.get("reset") === "success" ? "密码已重置，请用新密码登录" : null;

  const [accountEmail, setAccountEmail] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? safeSessionStorage.getItem(LOGIN_ACCOUNT_KEY)
      : null,
  );

  const handleNext = (loginEmail: string) => {
    safeSessionStorage.setItem(LOGIN_ACCOUNT_KEY, loginEmail);
    setAccountEmail(loginEmail);
  };

  const handleBack = () => {
    safeSessionStorage.removeItem(LOGIN_ACCOUNT_KEY);
    setAccountEmail(null);
  };

  // Never flash the login form at an already-signed-in visitor — while the
  // session resolves (sessionStorage or the /auth/refresh cookie probe), show a
  // neutral frame instead of the form.
  if (status === "loading") {
    return (
      <AuthShell>
        <div className="grid min-h-[40vh] place-items-center">
          <DotLoading />
        </div>
      </AuthShell>
    );
  }

  if (status === "unauthenticated") {
    return (
      <AuthShell>
        {accountEmail === null ? (
          <LoginAccountForm onNext={handleNext} resetNotice={resetNotice} />
        ) : (
          <LoginPasswordForm loginEmail={accountEmail} onBack={handleBack} />
        )}
      </AuthShell>
    );
  }

  // authenticated — the effect is redirecting to consumeAuthNext("/home").
  return null;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFlow />
    </Suspense>
  );
}
