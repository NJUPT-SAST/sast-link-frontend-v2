"use client";

import { useState, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { SWRConfig } from "swr";

import { SurveyIntro } from "@/components/motion/survey-intro";
import { Starfield } from "@/components/visual/starfield";
import { TargetCursor } from "@/components/cursor/target-cursor";

const GlobalMessagePanel = dynamic(
  () =>
    import("@/components/feedback/global-message-panel").then(
      (m) => m.GlobalMessagePanel,
    ),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  const [mockReady, setMockReady] = useState(
    process.env.NEXT_PUBLIC_API_MOCKING !== "true",
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== "true") return;
    import("@/mocks").then(({ initMocks }) =>
      initMocks().then(() => setMockReady(true)),
    );
  }, []);

  if (!mockReady) return null;

  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <Starfield />
      {children}
      <GlobalMessagePanel />
      <SurveyIntro />
      <TargetCursor />
    </SWRConfig>
  );
}
