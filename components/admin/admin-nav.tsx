"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/admin";
import { useUserProfileStore } from "@/store/use-user-profile-store";

export function AdminNav() {
  const pathname = usePathname();
  const role = useUserProfileStore((state) => state.profile.role);

  const items = ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="border-b border-hairline">
      <ul className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-5 whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8">
        {items.map((item) => {
          // The overview lives exactly at /admin — a prefix match would keep it
          // lit for every /admin/* route.
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={cn(
                  "type-tech inline-flex h-11 items-center border-b-2 px-3 text-[13px] transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-tertiary hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
