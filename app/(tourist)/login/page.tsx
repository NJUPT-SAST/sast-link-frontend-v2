"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getSession } from "@/lib/token";
import { AuthShell } from "@/components/auth/auth-shell";
import LoginAccountForm from "./_components/login-account-form";
import LoginPasswordForm from "./_components/login-password-form";

const LOGIN_ACCOUNT_KEY = "sast:login-account";

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // An already-signed-in user has no business on the login page; send them home.
  useEffect(() => {
    if (getSession()) {
      router.replace("/home");
    }
  }, [router]);
  // Only the cross-page `?reset=success` notice (redirected back from /reset)
  // survives in the query string. The two steps live behind sessionStorage — the
  // step must never be visible in the URL, and the account itself certainly not.
  const resetNotice =
    searchParams.get("reset") === "success" ? "密码已重置，请用新密码登录" : null;

  const [accountEmail, setAccountEmail] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem(LOGIN_ACCOUNT_KEY)
      : null,
  );

  const handleNext = (loginEmail: string) => {
    sessionStorage.setItem(LOGIN_ACCOUNT_KEY, loginEmail);
    setAccountEmail(loginEmail);
  };

  const handleBack = () => {
    sessionStorage.removeItem(LOGIN_ACCOUNT_KEY);
    setAccountEmail(null);
  };

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFlow />
    </Suspense>
  );
}
