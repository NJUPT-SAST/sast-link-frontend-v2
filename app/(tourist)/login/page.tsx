"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import LoginAccountForm from "./_components/login-account-form";
import LoginPasswordForm from "./_components/login-password-form";

function LoginFlow() {
  const searchParams = useSearchParams();
  // The two phases live in local state — no `?step=` in the URL. Only the
  // cross-page `?reset=success` notice (redirected back from /reset) survives
  // in the query string.
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const resetNotice =
    searchParams.get("reset") === "success" ? "密码已重置，请用新密码登录" : null;

  return (
    <AuthShell>
      {accountEmail === null ? (
        <LoginAccountForm
          onNext={setAccountEmail}
          resetNotice={resetNotice}
        />
      ) : (
        <LoginPasswordForm
          loginEmail={accountEmail}
          onBack={() => setAccountEmail(null)}
        />
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
