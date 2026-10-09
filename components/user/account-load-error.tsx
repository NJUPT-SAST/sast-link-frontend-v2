"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { toApiError } from "@/lib/api/errors";

export function AccountLoadError({ title, error, retrying, onRetry }: {
  title: string;
  error: unknown;
  retrying?: boolean;
  onRetry: () => Promise<unknown>;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-4" aria-busy={!!retrying}>
      <div role="alert" className="flex flex-col gap-1">
        <p className="text-sm">{title}</p>
        <FormError message={toApiError(error).message} />
      </div>
      <Button variant="outline" size="sm" disabled={retrying}
        onClick={() => { void onRetry().catch(() => {}); }}>
        {retrying ? "重试中…" : "重试"}
      </Button>
    </div>
  );
}
