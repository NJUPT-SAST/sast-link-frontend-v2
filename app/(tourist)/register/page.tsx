"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { PageTransition } from "@/components/animation/page-transition";
import RegisterStep1 from "./_components/register-step-1";
import RegisterStep2 from "./_components/register-step-2";
import RegisterStep3 from "./_components/register-step-3";

const STEP_META = {
  1: { tech: "Register / 01 of 03" },
  2: { tech: "Register / 02 of 03" },
  3: { tech: "Register / 03 of 03" },
} as const;

function RegisterFlow() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loginEmail, setLoginEmail] = useState("");
  const [registerTicket, setRegisterTicket] = useState("");
  const meta = STEP_META[step];

  return (
    <AuthShell tech={meta.tech}>
      {step === 1 && <PageTransition><RegisterStep1 onNext={(email) => { setLoginEmail(email); setStep(2); }} /></PageTransition>}
      {step === 2 && <PageTransition><RegisterStep2 loginEmail={loginEmail} onNext={(ticket) => { setRegisterTicket(ticket); setStep(3); }} onBack={() => setStep(1)} /></PageTransition>}
      {step === 3 && <PageTransition><RegisterStep3 loginEmail={loginEmail} ticket={registerTicket} registrationState={searchParams.get("registration_state") ?? undefined} oauthState={searchParams.get("state") ?? undefined} defaultName={searchParams.get("name") ?? ""} onBack={() => setStep(2)} /></PageTransition>}
    </AuthShell>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterFlow /></Suspense>;
}
