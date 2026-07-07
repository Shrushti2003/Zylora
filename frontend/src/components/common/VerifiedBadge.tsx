interface VerifiedBadgeProps {
  small?: boolean;
  className?: string;
}

export function VerifiedBadge({ small = false, className = "" }: VerifiedBadgeProps) {
  const classes = ["verified-icon", small ? "small" : "", className].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-label="Verified account" role="img">
      <span className="verified-icon-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" focusable="false">
          <path d="M11 21.5 L16 26.5 L29 13.5" />
        </svg>
      </span>
    </span>
  );
}
