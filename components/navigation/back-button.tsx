"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-fit text-muted-foreground"
      onClick={() => {
        // Direct visits (no history) have nowhere to go back to - fall back to
        // settings instead of leaving the site.
        if (window.history.length > 1) router.back();
        else router.replace("/settings");
      }}
    >
      <ArrowLeft size={16} />
      返回
    </Button>
  );
}
