/** CashTracker mark: a one-tone celengan head with a coin slot. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="var(--brand)" />
      <path d="M17 24 C15 17 17 12 20 11 C24 12 28 15 30 18 Z M47 24 C49 17 47 12 44 11 C40 12 36 15 34 18 Z" fill="#fff" />
      <circle cx="32" cy="35" r="17" fill="#fff" />
      <rect x="27" y="20" width="10" height="3" rx="1.5" fill="var(--brand)" />
      <ellipse cx="32" cy="40" rx="8" ry="5.5" fill="var(--brand)" />
      <circle cx="29.2" cy="40" r="1.6" fill="#fff" />
      <circle cx="34.8" cy="40" r="1.6" fill="#fff" />
      <circle cx="25" cy="32" r="2.2" fill="var(--brand)" />
      <circle cx="39" cy="32" r="2.2" fill="var(--brand)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark" aria-label="CashTracker">
      <LogoMark size={30} />
      <span>cashtracker</span>
    </span>
  );
}
