import { useEffect, useRef, useState } from "react";
import type { Mood } from "../lib/mood";

/** The ten things Kobi does when you tap it, played in order. */
export const TAP_ANIMS = ["jump", "spin", "wave", "dance", "love", "dizzy", "coin", "flip", "sleepy", "laugh"] as const;
export type TapAnim = (typeof TAP_ANIMS)[number];

const ANIM_MS: Record<TapAnim, number> = {
  jump: 900, spin: 900, wave: 1300, dance: 1600, love: 1600,
  dizzy: 1600, coin: 1400, flip: 1000, sleepy: 2200, laugh: 1400,
};

export const ANIM_LINE: Record<TapAnim, string> = {
  jump: "Hup! 🐷",
  spin: "Wheee~",
  wave: "Haii! 👋",
  dance: "Ayo joget! 🎶",
  love: "Aku sayang tabunganmu 💕",
  dizzy: "Pusing liat pengeluaranmu…",
  coin: "Cring! Nabung dulu 🪙",
  flip: "Salto! 🤸",
  sleepy: "Hoaam… Zzz",
  laugh: "Hahaha! Geli! 🤭",
};

const PALETTE: Record<Mood, { top: string; bottom: string; dark: string; belly: string }> = {
  happy: { top: "#ff9cc2", bottom: "#ff4f8b", dark: "#e0336f", belly: "#ffc4db" },
  chill: { top: "#ff9cc2", bottom: "#ff4f8b", dark: "#e0336f", belly: "#ffc4db" },
  worried: { top: "#ffadc9", bottom: "#ff6a95", dark: "#e04978", belly: "#ffd0e0" },
  angry: { top: "#ff8a8a", bottom: "#f0304f", dark: "#c41d3c", belly: "#ffb3b8" },
  furious: { top: "#ff6b6b", bottom: "#d4102f", dark: "#a30a24", belly: "#ff9a9a" },
};

const BODY = "M110 34 C168 34 190 70 190 112 C190 158 158 184 110 184 C62 184 30 158 30 112 C30 70 52 34 110 34 Z";
const INK = "#3b1d2a";

interface Props {
  mood: Mood;
  size?: number;
  /** When set, tapping Kobi plays the next of the ten animations. */
  interactive?: boolean;
  onAnim?: (a: TapAnim) => void;
}

export function Mascot({ mood, size = 160, interactive, onAnim }: Props) {
  const [anim, setAnim] = useState<TapAnim | null>(null);
  const next = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const play = () => {
    const a = TAP_ANIMS[next.current % TAP_ANIMS.length];
    next.current++;
    setAnim(null);
    // Restart cleanly even if tapped mid-animation.
    requestAnimationFrame(() => setAnim(a));
    onAnim?.(a);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAnim(null), ANIM_MS[a]);
  };

  const c = PALETTE[mood];
  const mad = mood === "angry" || mood === "furious";
  const face =
    anim === "love" ? "hearts"
    : anim === "dizzy" ? "spiral"
    : anim === "sleepy" ? "closed"
    : anim === "laugh" || anim === "jump" || anim === "coin" || anim === "dance" ? "laugh"
    : "mood";
  const id = `k${size}`;
  const pupilR = mood === "furious" ? 11 : mood === "happy" ? 15 : 14;
  const pupilY = mood === "worried" ? 100 : 96;

  const svg = (
    <svg className={`kobi kobi-${mood}${anim ? ` anim-${anim}` : ""}`} width={size} height={size} viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={c.top} />
          <stop offset="100%" stopColor={c.bottom} />
        </radialGradient>
        <radialGradient id={`${id}-eye`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#3a8dff" />
          <stop offset="100%" stopColor="#0b3a8c" />
        </radialGradient>
        <linearGradient id={`${id}-coin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="100%" stopColor="#f59f00" />
        </linearGradient>
      </defs>

      <ellipse className="k-shadow" cx="110" cy="208" rx="52" ry="7" fill="#000" opacity="0.12" />

      {mad && !anim && (
        <g className="k-steam" fill="#dfe3ea">
          <circle cx="42" cy="46" r="11" /><circle cx="30" cy="28" r="7" />
          <circle cx="178" cy="46" r="11" /><circle cx="190" cy="28" r="7" />
        </g>
      )}

      <g className="k-rig">
        <g className="k-feet" fill={c.dark} stroke="#fff" strokeWidth="5">
          <rect x="72" y="172" width="26" height="30" rx="13" />
          <rect x="122" y="172" width="26" height="30" rx="13" />
        </g>
        {/* white sticker outline behind the body */}
        <path d={BODY} fill="#fff" transform="translate(110 109) scale(1.05) translate(-110 -109)" />
        <g className="k-ears" strokeLinejoin="round">
          <path d="M56 66 Q34 2 100 36 Z" fill={c.dark} stroke="#fff" strokeWidth="7" />
          <path d="M164 66 Q186 2 120 36 Z" fill={c.dark} stroke="#fff" strokeWidth="7" />
          <path d="M60 56 Q50 22 86 38 Z" fill={c.belly} opacity="0.8" />
          <path d="M160 56 Q170 22 134 38 Z" fill={c.belly} opacity="0.8" />
        </g>
        <path d={BODY} fill={`url(#${id}-body)`} />
        <ellipse cx="110" cy="170" rx="38" ry="11" fill={c.belly} opacity="0.55" />
        <ellipse cx="72" cy="66" rx="20" ry="11" fill="#fff" opacity="0.45" transform="rotate(-28 72 66)" />
        <circle cx="96" cy="54" r="4" fill="#fff" opacity="0.5" />
        <rect x="94" y="38" width="32" height="8" rx="4" fill={c.dark} />

        <g className="k-arm-l"><ellipse cx="36" cy="152" rx="11" ry="15" fill={c.dark} stroke="#fff" strokeWidth="5" transform="rotate(20 36 152)" /></g>
        <g className="k-arm-r"><ellipse cx="184" cy="152" rx="11" ry="15" fill={c.dark} stroke="#fff" strokeWidth="5" transform="rotate(-20 184 152)" /></g>

        {/* eyes */}
        {face === "mood" && (
          <g className="k-eyes">
            <circle cx="80" cy="94" r="24" fill="#fff" />
            <circle cx="140" cy="94" r="24" fill="#fff" />
            <circle cx={mad ? 84 : 82} cy={pupilY} r={pupilR} fill={`url(#${id}-eye)`} />
            <circle cx={mad ? 136 : 138} cy={pupilY} r={pupilR} fill={`url(#${id}-eye)`} />
            {mood === "happy" ? (
              <g fill="#fff">
                <path d="M88 82 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5z" />
                <path d="M144 82 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5z" />
              </g>
            ) : (
              <g fill="#fff"><circle cx="87" cy={pupilY - 7} r="5" /><circle cx="143" cy={pupilY - 7} r="5" /></g>
            )}
            <g fill="#fff"><circle cx="78" cy={pupilY + 7} r="2.5" /><circle cx="134" cy={pupilY + 7} r="2.5" /></g>
          </g>
        )}
        {face === "hearts" && (
          <g className="k-heart-eyes" fill="#ff2d6f" stroke="#fff" strokeWidth="4">
            <path d="M80 112 C56 96 60 74 72 76 C77 77 80 82 80 86 C80 82 83 77 88 76 C100 74 104 96 80 112Z" />
            <path d="M140 112 C116 96 120 74 132 76 C137 77 140 82 140 86 C140 82 143 77 148 76 C160 74 164 96 140 112Z" />
          </g>
        )}
        {face === "spiral" && (
          <g>
            <circle cx="80" cy="94" r="24" fill="#fff" /><circle cx="140" cy="94" r="24" fill="#fff" />
            <g className="k-spiral" fill="none" stroke="#0b3a8c" strokeWidth="4" strokeLinecap="round">
              <path d="M80 91 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11 a15 15 0 1 1 15 15" />
              <path d="M140 91 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11 a15 15 0 1 1 15 15" />
            </g>
          </g>
        )}
        {face === "closed" && (
          <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round">
            <path d="M62 98 q18 12 36 0" /><path d="M122 98 q18 12 36 0" />
          </g>
        )}
        {face === "laugh" && (
          <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M64 100 l16 -10 l16 10" /><path d="M124 100 l16 -10 l16 10" />
          </g>
        )}

        {face === "mood" && mad && (
          <g stroke={INK} strokeWidth="8" strokeLinecap="round"><path d="M58 64 L100 80" /><path d="M162 64 L120 80" /></g>
        )}
        {face === "mood" && mood === "worried" && (
          <g stroke={INK} strokeWidth="6" strokeLinecap="round"><path d="M62 72 L96 62" /><path d="M158 72 L124 62" /></g>
        )}

        {/* snout */}
        <ellipse cx="110" cy="128" rx="26" ry="18" fill={c.dark} />
        <ellipse cx="104" cy="121" rx="10" ry="4" fill="#fff" opacity="0.35" />
        <ellipse cx="101" cy="129" rx="5" ry="7" fill="#5b0f2b" />
        <ellipse cx="119" cy="129" rx="5" ry="7" fill="#5b0f2b" />

        {/* mouth */}
        {face === "laugh" || (face === "mood" && mood === "happy") ? (
          <g>
            <path d="M92 150 q18 26 36 0 z" fill="#5b0f2b" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <path d="M101 160 q9 8 18 0 q-9 -6 -18 0z" fill="#ff8fb1" />
          </g>
        ) : face === "closed" ? (
          <ellipse className="k-yawn" cx="110" cy="158" rx="9" ry="11" fill="#5b0f2b" />
        ) : face === "hearts" || mood === "chill" ? (
          <path d="M96 152 q14 12 28 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        ) : face === "spiral" || mood === "worried" ? (
          <path d="M94 160 q5 -6 10 0 q5 6 10 0 q5 -6 10 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        ) : mood === "angry" ? (
          <path d="M96 162 q14 -14 28 0" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        ) : (
          <g>
            <path d="M92 166 q18 -26 36 0 z" fill="#5b0f2b" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <rect x="101" y="148" width="8" height="7" fill="#fff" /><rect x="111" y="148" width="8" height="7" fill="#fff" />
          </g>
        )}

        {!mad && (
          <g fill="#ff2d6f" opacity="0.28"><ellipse cx="56" cy="128" rx="13" ry="8" /><ellipse cx="164" cy="128" rx="13" ry="8" /></g>
        )}
        {face === "mood" && mood === "worried" && (
          <path className="k-sweat" d="M178 66 q10 14 0 20 q-10 -6 0 -20z" fill="#74c0fc" stroke="#fff" strokeWidth="3" />
        )}
        {face === "mood" && mad && (
          <g className="k-vein" fill="none" stroke="#b0102c" strokeWidth="6" strokeLinecap="round">
            <path d="M164 30 q7 7 14 0" /><path d="M164 44 q7 -7 14 0" /><path d="M164 30 q-7 7 0 14" /><path d="M178 30 q7 7 0 14" />
          </g>
        )}
      </g>

      {mood === "happy" && !anim && (
        <g className="k-sparkle" fill="#ffd43b">
          <path d="M22 70 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" />
          <path d="M196 60 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" />
        </g>
      )}
      {anim === "love" && (
        <g className="fx-hearts" fill="#ff2d6f">
          {[40, 88, 150, 186].map((x, i) => (
            <path key={x} style={{ animationDelay: `${i * 0.18}s` }} d={`M${x} 60 c-10 -8 -8 -18 -2 -18 c3 0 5 3 5 5 c0 -2 2 -5 5 -5 c6 0 8 10 -8 18z`} />
          ))}
        </g>
      )}
      {anim === "dizzy" && (
        <g className="fx-orbit" fill="#ffd43b" stroke="#fff" strokeWidth="2">
          {[0, 120, 240].map((r) => (
            <path key={r} transform={`rotate(${r} 110 34)`} d="M150 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
          ))}
        </g>
      )}
      {anim === "coin" && (
        <g className="fx-coin">
          <circle cx="110" cy="0" r="15" fill={`url(#${id}-coin)`} stroke="#fff" strokeWidth="3" />
          <text x="110" y="5" textAnchor="middle" fontSize="13" fontWeight="900" fill="#a86400">Rp</text>
        </g>
      )}
      {anim === "dance" && (
        <g className="fx-notes" fill="#7048e8" fontSize="30" fontWeight="900">
          <text x="18" y="62">♪</text>
          <text x="184" y="56" style={{ animationDelay: "0.3s" }}>♫</text>
        </g>
      )}
      {anim === "sleepy" && (
        <g className="fx-zzz" fill="#748ffc" fontWeight="900">
          <text x="160" y="50" fontSize="18">z</text>
          <text x="174" y="34" fontSize="24" style={{ animationDelay: "0.4s" }}>z</text>
          <text x="190" y="16" fontSize="30" style={{ animationDelay: "0.8s" }}>Z</text>
        </g>
      )}
      {anim === "laugh" && (
        <g className="fx-haha" fill="#f76707" fontWeight="900" fontSize="18">
          <text x="2" y="60">HA</text>
          <text x="180" y="70" style={{ animationDelay: "0.25s" }}>HA</text>
        </g>
      )}
    </svg>
  );

  if (!interactive) return svg;
  return (
    <button className="kobi-btn" onClick={play} aria-label="Tap Kobi">
      {svg}
    </button>
  );
}

export function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="bubble">{children}</div>;
}
