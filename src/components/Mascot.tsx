import type { Mood } from "../lib/mood";

const BODY: Record<Mood, [string, string]> = {
  happy: ["#ffb3c6", "#ff8fab"],
  chill: ["#ffb3c6", "#ff8fab"],
  worried: ["#ffc2cf", "#ff8fa3"],
  angry: ["#ff8a99", "#f25c70"],
  furious: ["#ff5a6e", "#d62839"],
};

/** Kobi the celengan (piggy bank). Gets redder and grumpier as Hiburan spending climbs. */
export function Mascot({ mood, size = 160 }: { mood: Mood; size?: number }) {
  const [body, dark] = BODY[mood];
  const mad = mood === "angry" || mood === "furious";
  return (
    <svg
      className={`kobi kobi-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Kobi sedang ${mood}`}
    >
      {mad && (
        <g className="kobi-steam" fill="#c8d6e5">
          <circle cx="40" cy="40" r="10" />
          <circle cx="30" cy="25" r="7" />
          <circle cx="160" cy="40" r="10" />
          <circle cx="170" cy="25" r="7" />
        </g>
      )}
      {mood === "happy" && (
        <g className="kobi-sparkle" fill="#ffd166">
          <path d="M30 60 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" />
          <path d="M170 50 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" />
        </g>
      )}
      <g className="kobi-body">
        {/* tail */}
        <path d="M168 110 q18 -6 12 -18 q-6 -8 -12 2 q-4 10 10 10" fill="none" stroke={dark} strokeWidth="5" strokeLinecap="round" />
        {/* legs */}
        {[62, 84, 106, 128].map((x) => (
          <rect key={x} x={x} y="155" width="16" height="22" rx="7" fill={dark} />
        ))}
        {/* ears */}
        <path d="M52 78 L56 38 L90 62 Z" fill={dark} strokeLinejoin="round" stroke={dark} strokeWidth="6" />
        <path d="M148 78 L144 38 L110 62 Z" fill={dark} strokeLinejoin="round" stroke={dark} strokeWidth="6" />
        <ellipse cx="100" cy="112" rx="72" ry="58" fill={body} />
        {/* coin slot */}
        <rect x="84" y="58" width="32" height="7" rx="3.5" fill="#7a2940" opacity="0.7" />
        {/* blush */}
        {!mad && (
          <g fill="#ff6b94" opacity="0.35">
            <ellipse cx="58" cy="125" rx="11" ry="7" />
            <ellipse cx="142" cy="125" rx="11" ry="7" />
          </g>
        )}
        {/* eyes */}
        {mood === "happy" ? (
          <g fill="none" stroke="#3b1d2a" strokeWidth="5" strokeLinecap="round">
            <path d="M66 104 q9 -12 18 0" />
            <path d="M116 104 q9 -12 18 0" />
          </g>
        ) : (
          <g className="kobi-eyes">
            <circle cx="75" cy="102" r={mood === "furious" ? 7 : 9} fill="#3b1d2a" />
            <circle cx="125" cy="102" r={mood === "furious" ? 7 : 9} fill="#3b1d2a" />
            <circle cx="78" cy="98" r="3" fill="#fff" />
            <circle cx="128" cy="98" r="3" fill="#fff" />
          </g>
        )}
        {/* brows */}
        {mad && (
          <g stroke="#3b1d2a" strokeWidth="6" strokeLinecap="round">
            <path d="M60 82 L90 92" />
            <path d="M140 82 L110 92" />
          </g>
        )}
        {mood === "worried" && (
          <g stroke="#3b1d2a" strokeWidth="5" strokeLinecap="round">
            <path d="M62 90 L86 82" />
            <path d="M138 90 L114 82" />
          </g>
        )}
        {/* snout */}
        <ellipse cx="100" cy="128" rx="22" ry="15" fill={dark} />
        <ellipse cx="92" cy="128" rx="4" ry="6" fill="#7a2940" />
        <ellipse cx="108" cy="128" rx="4" ry="6" fill="#7a2940" />
        {/* mouth */}
        <g fill="none" stroke="#3b1d2a" strokeWidth="4.5" strokeLinecap="round">
          {mood === "happy" && <path d="M86 150 q14 14 28 0" fill="#7a2940" />}
          {mood === "chill" && <path d="M90 151 q10 7 20 0" />}
          {mood === "worried" && <path d="M86 154 q5 -5 10 0 q5 5 10 0 q5 -5 8 0" />}
          {mood === "angry" && <path d="M88 157 q12 -10 24 0" />}
        </g>
        {mood === "furious" && (
          <g>
            <path d="M84 160 q16 -20 32 0 z" fill="#7a2940" stroke="#3b1d2a" strokeWidth="4" strokeLinejoin="round" />
            <rect x="92" y="148" width="7" height="6" fill="#fff" />
            <rect x="101" y="148" width="7" height="6" fill="#fff" />
          </g>
        )}
        {/* worried sweat */}
        {mood === "worried" && <path className="kobi-sweat" d="M160 78 q8 12 0 16 q-8 -4 0 -16z" fill="#74c0fc" />}
        {/* anger mark */}
        {mad && (
          <g stroke="#d62839" strokeWidth="5" strokeLinecap="round" className="kobi-vein">
            <path d="M150 62 q6 6 12 0" />
            <path d="M150 74 q6 -6 12 0" />
            <path d="M150 62 q-6 6 0 12" />
            <path d="M162 62 q6 6 0 12" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="bubble">{children}</div>;
}
