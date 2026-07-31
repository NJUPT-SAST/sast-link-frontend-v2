import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Position = "rightToLeft" | "leftToRight" | "topToBottom" | "bottomToTop";
type Variant = "slide" | "rise" | "blur" | "fade" | "zoom";

const offsets: Record<Position, { x: string; y: string }> = {
  rightToLeft: { x: "10px", y: "0" },
  leftToRight: { x: "-10px", y: "0" },
  topToBottom: { x: "0", y: "-10px" },
  bottomToTop: { x: "0", y: "10px" },
};

const variantClass: Record<Variant, string> = {
  slide: "pt-transition",
  rise: "pt-rise",
  blur: "pt-blur",
  fade: "pt-fade",
  zoom: "pt-zoom",
};

export function PageTransition({
  children,
  variant = "slide",
  position = "rightToLeft",
  style,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  position?: Position;
  style?: CSSProperties;
  className?: string;
}) {
  const { x, y } = offsets[position];
  const slideVars = variant === "slide" ? { "--pt-x": x, "--pt-y": y } : {};
  return (
    <div
      className={cn(variantClass[variant], className)}
      style={{ ...slideVars, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}
