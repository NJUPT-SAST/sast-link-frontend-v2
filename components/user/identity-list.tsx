"use client";

import { IDENTITY_PROVIDERS } from "@/lib/constants/providers";
import { useIdentities } from "@/hooks/use-identities";
import { message } from "@/lib/message";
import { Button } from "@/components/ui/button";

interface IdentityListProps {
  /** show bind/unbind action buttons (safety page) */
  actionable?: boolean;
}

/**
 * Provider list with bound/unbound status. Shared by the profile side panel
 * (read-only) and the safety page (with bind/unbind actions).
 */
export function IdentityList({ actionable }: IdentityListProps) {
  const { identities } = useIdentities();

  return (
    <>
      {IDENTITY_PROVIDERS.map((provider) => {
        const bound = identities.some(
          (identity) => identity.provider === provider.key,
        );
        return (
          <div
            key={provider.key}
            className="flex min-h-[52px] items-center justify-between border-b border-hairline py-3 text-sm last:border-b-0"
          >
            <span className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.icon}
                alt=""
                width={18}
                height={18}
                className="dark:invert"
              />
              {provider.name}
            </span>
            <span className="flex items-center gap-3.5">
              <span
                className={`flex items-center gap-1.5 text-xs ${
                  bound ? "text-success" : "text-tertiary"
                }`}
              >
                <span
                  className={`size-1.5 ${
                    bound ? "status-dot-pulse bg-current" : "bg-tertiary"
                  }`}
                />
                {bound ? "已绑定" : "未绑定"}
              </span>
              {actionable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    message.warning("绑定与解绑将在后端授权契约就绪后开放")
                  }
                >
                  {bound ? "解绑" : "绑定"}
                </Button>
              )}
            </span>
          </div>
        );
      })}
    </>
  );
}
