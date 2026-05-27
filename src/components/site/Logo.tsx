import { cn } from "@/lib/cn";

/**
 * FunnelCloser brand identity — sibling to Closer Capital.
 *
 * Mark: a downward-pointing triangle (the lead funnel) interlocking with
 * a circle (the close). Two shapes in two colors, echoing the
 * vesica-piscis composition of the Closer Capital double-C mark.
 *
 * Wordmark: Cinzel Roman serif, all caps, wide tracking — the same
 * monumental classical voice as CLOSER CAPITAL.
 */

type LogoMarkProps = {
  size?: number;
  className?: string;
  monochrome?: boolean;
};

export function LogoMark({ size = 48, className, monochrome = false }: LogoMarkProps) {
  const triangleStroke = monochrome ? "currentColor" : "#5A5A65";
  const circleStroke = monochrome ? "currentColor" : "#FF6B2C";

  return (
    <svg
      viewBox="0 0 180 110"
      width={size * 1.6}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      role="img"
      aria-label="FunnelCloser logo mark"
    >
      {/* Funnel — downward triangle (representing the lead funnel) */}
      <polygon
        points="14,16 96,16 55,98"
        fill="none"
        stroke={triangleStroke}
        strokeWidth="9"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Closer — circle (representing the close, the deal) */}
      <circle
        cx="115"
        cy="55"
        r="42"
        fill="none"
        stroke={circleStroke}
        strokeWidth="9"
      />
    </svg>
  );
}

/**
 * Full vertical lockup: mark stacked above wordmark.
 * Use this on hero/footer where you want the monumental feel.
 */
export function LogoLockup({
  size = 64,
  className,
  showTagline = false,
}: {
  size?: number;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("inline-flex flex-col items-center text-center", className)}>
      <LogoMark size={size} />
      <div className="wordmark mt-5 text-foreground" style={{ fontSize: `${size * 0.42}px` }}>
        FUNNEL CLOSER
      </div>
      {showTagline && (
        <div className="eyebrow mt-3 text-[10px]">A CLOSER FAMILY BRAND</div>
      )}
    </div>
  );
}

/**
 * Horizontal lockup: small mark beside wordmark. Use for nav/header.
 */
type WordmarkProps = {
  size?: "sm" | "md" | "lg";
  showMark?: boolean;
  className?: string;
};

export function Wordmark({ size = "md", showMark = true, className }: WordmarkProps) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  }[size];
  const markSize = { sm: 22, md: 28, lg: 40 }[size];

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark && <LogoMark size={markSize} />}
      <span className={cn("wordmark text-foreground", sizeClass)}>
        FUNNEL <span className="text-[color:var(--color-accent)]">CLOSER</span>
      </span>
    </div>
  );
}
