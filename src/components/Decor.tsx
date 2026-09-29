/** Subtle maritime decoration: bathymetric contour lines, drawn in SVG (no stock imagery). */
export function ContourLines({ className = "" }: { className?: string }) {
  const lines = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      {lines.map((i) => (
        <path
          key={i}
          d={`M-20 ${250 - i * 22} C 140 ${190 - i * 26}, 260 ${320 - i * 18}, 420 ${240 - i * 24} S 700 ${150 - i * 20}, 820 ${210 - i * 22}`}
          stroke="currentColor"
          strokeWidth={i % 3 === 0 ? 1.2 : 0.7}
          opacity={0.18 + (i % 3 === 0 ? 0.12 : 0)}
        />
      ))}
    </svg>
  );
}

/** Small compass-style marker used beside section eyebrows. */
export function Bearing({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2.5 9.4 8 8 13.5 6.6 8Z" fill="currentColor" />
    </svg>
  );
}
