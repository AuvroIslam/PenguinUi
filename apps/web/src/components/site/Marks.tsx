/**
 * The site's own small marks. Drawn for PenguinUi on a 24 unit grid with round 1.8 strokes,
 * the same hand as the library's glyph set, so nothing on the page comes from an icon pack.
 */

type MarkProps = { size?: number; className?: string; strokeWidth?: number };

function Mark({ size = 18, className, strokeWidth = 1.8, children }: MarkProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function ArrowRight(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
    </Mark>
  );
}

export function ArrowUpRight(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M7.5 16.5l9-9M9 7.5h7.5V15" />
    </Mark>
  );
}

export function ArrowLeft(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M19 12H6M11 6.5L5.5 12l5.5 5.5" />
    </Mark>
  );
}

export function CopyMark(p: MarkProps) {
  return (
    <Mark {...p}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.6" />
      <path d="M15.5 8.5V6.6A2.1 2.1 0 0 0 13.4 4.5H6.6A2.1 2.1 0 0 0 4.5 6.6v6.8a2.1 2.1 0 0 0 2.1 2.1h1.9" />
    </Mark>
  );
}

export function CheckMark(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Mark>
  );
}

export function SearchMark(p: MarkProps) {
  return (
    <Mark {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </Mark>
  );
}

export function ReplayMark(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </Mark>
  );
}

/** A snowflake, for the crystal-clear moments. Six arms with two barbs each. */
export function Flake(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      <path d="M12 6.5l-1.8-1.6M12 6.5l1.8-1.6M12 17.5l-1.8 1.6M12 17.5l1.8 1.6" />
    </Mark>
  );
}

export function SunMark(p: MarkProps) {
  return (
    <Mark {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </Mark>
  );
}

export function MoonMark(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />
    </Mark>
  );
}

/** A repository mark: a folded page with a branch, so GitHub links need no borrowed logo. */
export function RepoMark(p: MarkProps) {
  return (
    <Mark {...p}>
      <path d="M6 4.5h9.5L19 8v11.5H6z" />
      <path d="M15.5 4.5V8H19" />
      <circle cx="10" cy="11" r="1.2" />
      <circle cx="10" cy="16.5" r="1.2" />
      <path d="M10 12.2v3.1M10 13.6c0-1.4 1.2-2.1 3-2.1" />
    </Mark>
  );
}
