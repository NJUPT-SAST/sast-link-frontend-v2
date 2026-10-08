"use client";

import type { ReactNode } from "react";

import { message } from "@/lib/message";

interface OtherLoginItem {
  describe: string;
  icon: ReactNode;
  /** Click-time navigation for entries whose destination must be built at
   *  click (an OAuth login computes a fresh PKCE challenge per jump, so a
   *  pre-rendered href is impossible). */
  onLaunch?: () => void;
  /** Static link target for plain entries; empty string renders the
   *  "暂未开放" placeholder behavior. */
  target?: string;
}

export function OtherLoginList({ list }: { list: OtherLoginItem[] }) {
  return (
    <ul className="m-0 flex w-full list-none flex-wrap gap-3 p-0">
      {list.map((item) => (
        <li key={`other_login_${item.describe}`} className="min-w-0 flex-1 basis-[calc(50%-0.375rem)]">
          <a
            title={item.describe}
            href={item.onLaunch ? "#" : item.target || undefined}
            onClick={(event) => {
              if (item.onLaunch) {
                // The provider jump must stay in this tab (the PKCE verifier
                // lives in its sessionStorage), so the anchor is a styled
                // button rather than a real navigation target.
                event.preventDefault();
                item.onLaunch();
                return;
              }
              if (!item.target) message.warning("暂未开放");
            }}
            className="flex h-12 cursor-pointer select-none items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-foreground transition-colors hover:bg-recessed [&_img]:size-[18px] [&_svg]:size-[18px]"
          >
            {item.icon}
            <span className="truncate">{item.describe}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
