import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: string[];
  className?: string;
  /** When true, render items as a single raw string without bolding or separators. */
  raw?: boolean;
  /** Animation duration in seconds. Defaults to 36. */
  speed?: number;
}

const SAST_LINK_MARKER = "__SAST_LINK__";

/**
 * Infinite mono ticker. The sequence renders twice so the -50% loop is seamless;
 * no JS duplication needed. Honors reduced motion via the global media rule.
 */
export function Marquee({ items, className, raw, speed = 36 }: MarqueeProps) {
  const tokens = raw
    ? items
        .flatMap((item) => item.split("SAST LINK").join(SAST_LINK_MARKER).split(" "))
        .filter(Boolean)
    : items;

  const seq = raw ? (
    <>
      {tokens.map((token, i) => (
        <span key={i} className="type-tech whitespace-nowrap px-12 text-tertiary">
          {token === SAST_LINK_MARKER ? (
            <b className="font-semibold text-foreground">SAST LINK</b>
          ) : (
            token
          )}
        </span>
      ))}
    </>
  ) : (
    <>
      {tokens.map((item, i) => (
        <span key={i} className="type-tech px-5 text-tertiary">
          {i === 0 ? <b className="font-semibold text-foreground">{item}</b> : item}
          <span className="pl-5 text-tertiary">·</span>
        </span>
      ))}
    </>
  );

  return (
    <div
      className={cn(
        "marquee-hover-pause flex h-10 items-center overflow-hidden border-t border-hairline",
        className,
      )}
      style={{ "--mq-duration": `${speed}s` } as React.CSSProperties}
      aria-hidden
    >
      <div className="marquee-track">
        <div className="flex">{seq}</div>
        <div className="flex">{seq}</div>
      </div>
    </div>
  );
}
