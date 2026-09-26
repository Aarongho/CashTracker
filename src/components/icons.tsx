/** Small line-icon set (24px grid, currentColor). */
const P = {
  home: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z",
  list: "M8 7h11M8 12h11M8 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01",
  chart: "M5 19V11M12 19V5M19 19v-6",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2-4-4",
  plus: "M12 5v14M5 12h14",
  chevron: "M9 6l6 6-6 6",
  close: "M6 6l12 12M18 6 6 18",
  copy: "M9 9h10v10H9zM5 15V5h10",
  sort: "M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4",
  check: "M5 12.5 10 17l9-10",
  bank: "M4 10h16M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18M12 4l9 4H3z",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 22, stroke = 2 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

/** Colorful filled icons in Duolingo's style for the tab bar and stats. */
export type ColorIconName = "home" | "history" | "insight" | "settings" | "flame" | "coin" | "down" | "up" | "receipt" | "mail";

export function ColorIcon({ name, size = 30 }: { name: ColorIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {name === "home" && (
        <>
          <path d="M5 15 16 5l11 10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#ffc800" />
          <path d="M3 15.5 16 4l13 11.5-1.6 1.8L16 7.2 4.6 17.3z" fill="#ff4b4b" />
          <rect x="13" y="19" width="6" height="9" rx="1.5" fill="#ff9600" />
        </>
      )}
      {name === "history" && (
        <>
          <rect x="6" y="3" width="20" height="26" rx="4" fill="#1cb0f6" />
          <rect x="10" y="9" width="12" height="2.6" rx="1.3" fill="#fff" />
          <rect x="10" y="14.5" width="12" height="2.6" rx="1.3" fill="#fff" />
          <rect x="10" y="20" width="7" height="2.6" rx="1.3" fill="#fff" />
        </>
      )}
      {name === "insight" && (
        <>
          <rect x="4" y="16" width="7" height="12" rx="2.5" fill="#58cc02" />
          <rect x="12.5" y="9" width="7" height="19" rx="2.5" fill="#ffc800" />
          <rect x="21" y="4" width="7" height="24" rx="2.5" fill="#ff4f93" />
        </>
      )}
      {name === "settings" && (
        <g fill="#afafaf">
          {[0, 45, 90, 135].map((r) => (
            <rect key={r} x="13" y="2.5" width="6" height="27" rx="2.5" transform={`rotate(${r} 16 16)`} />
          ))}
          <circle cx="16" cy="16" r="9.5" />
          <circle cx="16" cy="16" r="4" fill="#fff" />
        </g>
      )}
      {name === "flame" && (
        <>
          <path d="M16 3c1 5 8 8 8 16a8 8 0 0 1-16 0c0-4 2-6 3-7 0 3 2 4 3 4-1-5 0-9 2-13z" fill="#ff9600" />
          <path d="M16 16c.6 2.6 4 3.6 4 7a4 4 0 0 1-8 0c0-2 1.2-3.2 2-3.8.2 1.4 1 2 1.6 2-.4-2.2 0-3.9.4-5.2z" fill="#ffc800" />
        </>
      )}
      {name === "coin" && (
        <>
          <circle cx="16" cy="16" r="13" fill="#ffc800" />
          <circle cx="16" cy="16" r="9" fill="none" stroke="#e5a500" strokeWidth="2.5" />
          <path d="M13 11.5h4.2a3 3 0 0 1 0 6H13zm0 6 5 4" fill="none" stroke="#e5a500" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "down" && (
        <>
          <circle cx="16" cy="16" r="13" fill="#ff4b4b" />
          <path d="M16 9v13m-5.5-5.5L16 22l5.5-5.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "up" && (
        <>
          <circle cx="16" cy="16" r="13" fill="#58cc02" />
          <path d="M16 23V10m-5.5 5.5L16 10l5.5 5.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "receipt" && (
        <>
          <path d="M7 3h18v26l-3-2-3 2-3-2-3 2-3-2-3 2z" fill="#ce82ff" />
          <rect x="11" y="9" width="10" height="2.6" rx="1.3" fill="#fff" />
          <rect x="11" y="15" width="10" height="2.6" rx="1.3" fill="#fff" />
        </>
      )}
      {name === "mail" && (
        <>
          <rect x="3" y="7" width="26" height="19" rx="4" fill="#1cb0f6" />
          <path d="M5 10l11 8 11-8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
