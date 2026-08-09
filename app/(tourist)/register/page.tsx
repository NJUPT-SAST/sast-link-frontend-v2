"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { PageTransition } from "@/components/animation/page-transition";
import RegisterEmailForm from "./_components/register-email-form";
import RegisterDetailsForm from "./_components/register-details-form";

type RegisterPhase = "email" | "details";

const TICKET_KEY = "sast:register-ticket";

function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phase: RegisterPhase =
    searchParams.get("phase") === "details" ? "details" : "email";
  const loginEmail = searchParams.get("email") ?? "";
  const registerTicket =
    typeof window !== "undefined"
      ? sessionStorage.getItem(TICKET_KEY) ?? ""
      : "";
  const position = phase === "details" ? "rightToLeft" : "leftToRight";

  return (
    <AuthShell wide={phase === "details"}>
      {phase === "email" && (
        <PageTransition position={position}>
          <RegisterEmailForm
            defaultEmail={searchParams.get("email") ?? ""}
            onVerified={(email, ticket) => {
              sessionStorage.setItem(TICKET_KEY, ticket);
              const params = new URLSearchParams(searchParams.toString());
              params.set("phase", "details");
              params.set("email", email);
              router.replace(`/register?${params.toString()}`);
            }}
          />
        </PageTransition>
      )}
      {phase === "details" && (
        <PageTransition position={position}>
          <RegisterDetailsForm
            loginEmail={loginEmail}
            registerTicket={registerTicket}
            registrationState={searchParams.get("registration_state") ?? undefined}
            oauthState={searchParams.get("oauth_state") ?? undefined}
            onBack={() => {
              sessionStorage.removeItem(TICKET_KEY);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("phase");
              params.delete("email");
              router.replace(`/register?${params.toString()}`);
            }}
          />
        </PageTransition>
      )}
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterFlow />
    </Suspense>
  );
}
