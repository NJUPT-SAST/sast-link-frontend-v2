"use client";

import { Suspense, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import LoginStep1 from "./_components/login-step-1";
import LoginStep2 from "./_components/login-step-2";

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loginEmail, setLoginEmail] = useState<string | null>(null);

  return (
    <AuthShell
      tech={step === 1 ? "Sign in / 01" : "Sign in / 02"}
    >
      <Suspense>
        {step === 1 ? (
          <LoginStep1
            onNext={(email) => {
              setLoginEmail(email);
              setStep(2);
            }}
          />
        ) : (
          <LoginStep2
            loginEmail={loginEmail!}
            onBack={() => setStep(1)}
          />
        )}
      </Suspense>
    </AuthShell>
  );
}
