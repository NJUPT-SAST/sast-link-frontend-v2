"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import LoginStep1 from "./_components/login-step-1";
import LoginStep2 from "./_components/login-step-2";

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step") === "2" ? 2 : 1;
  const loginEmail = searchParams.get("email") ?? "";
  const resetNotice =
    searchParams.get("reset") === "success" ? "密码已重置，请用新密码登录" : null;

  const goToStep2 = (email: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", "2");
    params.set("email", email);
    router.replace(`/login?${params.toString()}`);
  };

  const goToStep1 = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("step");
    params.delete("email");
    router.replace(`/login?${params.toString()}`);
  };

  return (
    <AuthShell>
      <Suspense>
        {step === 1 ? (
          <LoginStep1 onNext={goToStep2} resetNotice={resetNotice} />
        ) : (
          <LoginStep2 loginEmail={loginEmail} onBack={goToStep1} />
        )}
      </Suspense>
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
