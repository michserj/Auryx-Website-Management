/** Auryx bulb mark (retained from the existing brand) + wordmark. */
export function BulbMark({ className = "h-8 w-8", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill={tone === "dark" ? "#0e2c4b" : "rgba(255,255,255,0.08)"} />
      <g
        transform="translate(8 7) scale(2)"
        fill="none"
        stroke="#EEAD2B"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </g>
    </svg>
  );
}

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className="flex items-center gap-2.5">
      <BulbMark tone={tone} className="h-9 w-9" />
      <span className="leading-none">
        <span className={`block text-[19px] font-bold tracking-tight ${tone === "dark" ? "text-navy-900" : "text-white"}`}>
          Auryx
        </span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.22em] ${tone === "dark" ? "text-navy-500" : "text-navy-200"}`}>
          Software
        </span>
      </span>
    </span>
  );
}
