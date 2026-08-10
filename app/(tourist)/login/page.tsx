"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import LoginAccountForm from "./_components/login-account-form";
import LoginPasswordForm from "./_components/login-password-form";

const LOGIN_ACCOUNT_KEY = "sast:login-account";

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step");
  // Only the cross-page `?reset=success` notice (redirected back from /reset)
  // survives in the query string; the two steps live behind `?step=password`.
  const resetNotice =
    searchParams.get("reset") === "success" ? "密码已重置，请用新密码登录" : null;

  // The password step only survives while the URL carries step=password AND a
  // stored account exists — the account itself never goes into the query
  // string. Adjusting state during render (not in an effect) resyncs the shown
  // step whenever the URL marker changes: browser back from the password step
  // returns to /login (step 1), forward restores it, and a direct
  // /login?step=password entry renders step 2 immediately.
  const [prevStep, setPrevStep] = useState(step);
  const [accountEmail, setAccountEmail] = useState<string | null>(() =>
    step === "password" && typeof window !== "undefined"
      ? sessionStorage.getItem(LOGIN_ACCOUNT_KEY)
      : null,
  );

  if (prevStep !== step) {
    setPrevStep(step);
    setAccountEmail(
      step === "password" ? sessionStorage.getItem(LOGIN_ACCOUNT_KEY) : null,
    );
  }

  // A bare /login?step=password with no stored account should not linger on a
  // broken password step — clean the URL back to the account step.
  useEffect(() => {
    if (step === "password" && !sessionStorage.getItem(LOGIN_ACCOUNT_KEY)) {
      router.replace("/login");
    }
  }, [router, step]);

  const handleNext = (loginEmail: string) => {
    sessionStorage.setItem(LOGIN_ACCOUNT_KEY, loginEmail);
    setAccountEmail(loginEmail);
    router.replace("/login?step=password");
  };

  const handleBack = () => {
    sessionStorage.removeItem(LOGIN_ACCOUNT_KEY);
    setAccountEmail(null);
    router.replace("/login");
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
