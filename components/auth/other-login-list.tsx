"use client";

import type { ReactNode } from "react";

import { message } from "@/lib/message";

interface OtherLoginItem {
  target: string;
  describe: string;
  icon: ReactNode;
}

export function OtherLoginList({ list }: { list: OtherLoginItem[] }) {
  return (
    <ul className="m-0 flex w-full list-none flex-wrap gap-3 p-0">
      {list.map((item) => (
        <li key={`other_login_${item.describe}`} className="min-w-0 flex-1 basis-[calc(50%-0.375rem)]">
          <a
            title={item.describe}
            href={item.target || undefined}
            onClick={() => {
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
