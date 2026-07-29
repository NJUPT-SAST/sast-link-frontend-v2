import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Position = "rightToLeft" | "leftToRight" | "topToBottom" | "bottomToTop";

const offsets: Record<Position, { x: string; y: string }> = {
  rightToLeft: { x: "10px", y: "0" },
  leftToRight: { x: "-10px", y: "0" },
  topToBottom: { x: "0", y: "-10px" },
  bottomToTop: { x: "0", y: "10px" },
};

export function PageTransition({
  children,
  position = "rightToLeft",
  style,
  className,
}: {
  children: ReactNode;
  position?: Position;
  style?: CSSProperties;
  className?: string;
}) {
  const { x, y } = offsets[position];
  return (
    <div
      className={cn("pt-transition", className)}
      style={{ "--pt-x": x, "--pt-y": y, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}
