"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import { PageTransition } from "@/components/animation/page-transition";
import RegisterEmailForm from "./_components/register-email-form";
import RegisterDetailsForm from "./_components/register-details-form";

type RegisterPhase = "email" | "details";

const TICKET_KEY = "sast:register-ticket";
const EMAIL_KEY = "sast:register-email";

function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerTicket =
    typeof window !== "undefined"
      ? safeSessionStorage.getItem(TICKET_KEY) ?? ""
      : "";
  const [loginEmail, setLoginEmail] = useState<string>(() =>
    typeof window !== "undefined" ? safeSessionStorage.getItem(EMAIL_KEY) ?? "" : "",
  );
  // registration_state / oauth_state come from the OAuth callback and are the
  // only query parameters a third-party flow needs on the wire. The step and the
  // account address live in sessionStorage, never in the URL.
  const phase: RegisterPhase = loginEmail ? "details" : "email";
  const position = phase === "details" ? "rightToLeft" : "leftToRight";

  // Landing on the details step without a ticket (manual URL, expired session)
  // would strand the user — bounce back to email and clear the local state.
  useEffect(() => {
    if (phase === "details" && !registerTicket) {
      safeSessionStorage.removeItem(TICKET_KEY);
      safeSessionStorage.removeItem(EMAIL_KEY);
      // A same-route replace does not remount the page, so the step state must
      // be reset here; relying on a re-read of sessionStorage on mount would
      // leave the user on the details step with an empty ticket.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoginEmail("");
      router.replace("/register");
    }
  }, [phase, registerTicket, router]);

  return (
    <AuthShell wide={phase === "details"}>
      {phase === "email" && (
        <PageTransition position={position}>
          <RegisterEmailForm
            defaultEmail={loginEmail || (searchParams.get("email") ?? "")}
            onVerified={(email, ticket) => {
              safeSessionStorage.setItem(TICKET_KEY, ticket);
              safeSessionStorage.setItem(EMAIL_KEY, email);
              setLoginEmail(email);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("email");
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
              safeSessionStorage.removeItem(TICKET_KEY);
              safeSessionStorage.removeItem(EMAIL_KEY);
              setLoginEmail("");
              const params = new URLSearchParams(searchParams.toString());
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
