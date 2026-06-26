/* ════════════════════════════════════════════════════════════════
   ANT — JobMatch's spirit animal. A clean minimal ant in profile,
   facing right, antennae raised forward (curious, seeking).
   Reusable as the logo mark and as an in-context character.

   Props:
     size  — width in px (height scales to the 36x24 viewBox)
     color — fill/stroke color
     walk  — enable the gentle perpetual walk bob (.ant-walk in globals.css)
   ════════════════════════════════════════════════════════════════ */

export default function Ant({
  size = 30,
  color = "#16181D",
  walk = false,
  flag = false,
  className = "",
}: {
  size?: number;
  color?: string;
  walk?: boolean;
  flag?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={(size * 24) / 36}
      viewBox="0 0 36 24"
      fill="none"
      className={`ant ${walk ? "ant-walk" : ""} ${className}`}
      aria-hidden="true"
    >
      {/* planted victory flag (Match result celebration) */}
      {flag && (
        <g>
          <line x1="20" y1="9" x2="20" y2="1" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
          <path d="M20 1.5 L26 3 L20 4.5 Z" fill={color} />
        </g>
      )}
      {/* legs (under the body) */}
      <g stroke={color} strokeWidth={1.5} strokeLinecap="round">
        <path d="M20 13 L25 19.5" />
        <path d="M17.5 14 L17.5 21" />
        <path d="M16 13.5 L10 21" />
      </g>
      {/* antennae (raised forward) */}
      <g stroke={color} strokeWidth={1.4} strokeLinecap="round" fill="none">
        <path d="M27 8 Q31 4.5 33 2.5" />
        <path d="M27.5 9.5 Q31 7 34.5 6" />
      </g>
      {/* body: abdomen, thorax, head */}
      <g fill={color}>
        <ellipse cx="8" cy="12" rx="6" ry="4.6" />
        <ellipse cx="18" cy="11.5" rx="3.4" ry="3" />
        <circle cx="25.5" cy="10.5" r="3.9" />
      </g>
    </svg>
  );
}
