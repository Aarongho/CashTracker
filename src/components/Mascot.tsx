import { useEffect, useId, useRef, useState } from "react";
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

/** Flat, cel-shaded palette per mood: body, shade (right side), belly, snout/feet, nostril. */
const PALETTE: Record<Mood, { body: string; shade: string; belly: string; snout: string; nose: string }> = {
  happy: { body: "#ff8fb8", shade: "#f06b9d", belly: "#ffc6dc", snout: "#ff6fa3", nose: "#a8174f" },
  chill: { body: "#ff8fb8", shade: "#f06b9d", belly: "#ffc6dc", snout: "#ff6fa3", nose: "#a8174f" },
  worried: { body: "#ffa3c4", shade: "#f47ea8", belly: "#ffd3e3", snout: "#ff7fac", nose: "#a8174f" },
  angry: { body: "#ff7482", shade: "#e8505f", belly: "#ffb5bc", snout: "#e84a5c", nose: "#8f0f22" },
  furious: { body: "#ff4b4b", shade: "#d93636", belly: "#ff9e9e", snout: "#c92a2a", nose: "#6e0a0a" },
};

const BODY = "M110 38 C160 38 190 74 191 118 C192 166 158 192 110 192 C62 192 28 166 29 118 C30 74 60 38 110 38 Z";
const INK = "#3c3c3c";

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
  const uid = useId().replace(/:/g, "");
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
  const clip = `${uid}-clip`;
  // Pupils look down when worried, glare inward when mad.
  const px = mad ? 4 : 2;
  const py = mood === "worried" ? 8 : 4;
  const pr = mood === "furious" ? 10 : 13;

  const svg = (
    <svg className={`kobi kobi-${mood}${anim ? ` anim-${anim}` : ""}`} width={size} height={size} viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <clipPath id={clip}><path d={BODY} /></clipPath>
      </defs>

      <ellipse className="k-shadow" cx="110" cy="208" rx="54" ry="7" fill="#000" opacity="0.08" />

      {mad && !anim && (
        <g className="k-steam" fill="#e5e5e5">
          <circle cx="40" cy="48" r="11" /><circle cx="28" cy="30" r="7" />
          <circle cx="180" cy="48" r="11" /><circle cx="192" cy="30" r="7" />
        </g>
      )}

      <g className="k-rig">
        {/* feet */}
        <g className="k-feet" fill={c.snout}>
          <rect x="74" y="178" width="26" height="26" rx="11" />
          <rect x="120" y="178" width="26" height="26" rx="11" />
        </g>

        {/* ears */}
        <g className="k-ears">
          <path d="M58 70 C48 48 50 26 60 20 C72 22 90 36 98 46 Z" fill={c.body} />
          <path d="M162 70 C172 48 170 26 160 20 C148 22 130 36 122 46 Z" fill={c.shade} />
          <path d="M64 58 C58 44 60 32 64 30 C72 32 82 40 86 46 Z" fill={c.belly} />
          <path d="M156 58 C162 44 160 32 156 30 C148 32 138 40 134 46 Z" fill={c.belly} opacity="0.8" />
        </g>

        {/* body with flat cel shading */}
        <path d={BODY} fill={c.shade} />
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="96" cy="104" rx="84" ry="86" fill={c.body} />
          <ellipse cx="110" cy="182" rx="50" ry="26" fill={c.belly} />
          <ellipse cx="66" cy="70" rx="16" ry="9" fill="#fff" opacity="0.35" transform="rotate(-30 66 70)" />
        </g>
        <rect x="95" y="44" width="30" height="7" rx="3.5" fill={c.nose} opacity="0.55" />

        {/* arms */}
        <g className="k-arm-l"><ellipse cx="32" cy="146" rx="12" ry="17" fill={c.body} transform="rotate(24 32 146)" /></g>
        <g className="k-arm-r"><ellipse cx="188" cy="146" rx="12" ry="17" fill={c.shade} transform="rotate(-24 188 146)" /></g>

        {/* eyes */}
        {face === "mood" && (
          <g className="k-eyes">
            <ellipse cx="84" cy="100" rx="25" ry="28" fill="#fff" />
            <ellipse cx="136" cy="100" rx="25" ry="28" fill="#fff" />
            <circle cx={84 + px} cy={100 + py} r={pr} fill={INK} />
            <circle cx={136 - px} cy={100 + py} r={pr} fill={INK} />
            <circle cx={84 + px + 5} cy={100 + py - 5} r="4.5" fill="#fff" />
            <circle cx={136 - px + 5} cy={100 + py - 5} r="4.5" fill="#fff" />
            {mood === "happy" && (
              <g fill="#fff">
                <circle cx={84 + px - 4} cy={100 + py + 6} r="2" />
                <circle cx={136 - px - 4} cy={100 + py + 6} r="2" />
              </g>
            )}
          </g>
        )}
        {face === "hearts" && (
          <g className="k-heart-eyes" fill="#ff4b4b">
            <path d="M84 120 C60 104 62 80 75 82 C80 83 84 88 84 92 C84 88 88 83 93 82 C106 80 108 104 84 120Z" />
            <path d="M136 120 C112 104 114 80 127 82 C132 83 136 88 136 92 C136 88 140 83 145 82 C158 80 160 104 136 120Z" />
          </g>
        )}
        {face === "spiral" && (
          <g>
            <ellipse cx="84" cy="100" rx="25" ry="28" fill="#fff" />
            <ellipse cx="136" cy="100" rx="25" ry="28" fill="#fff" />
            <g className="k-spiral" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
              <path d="M84 97 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11 a15 15 0 1 1 15 15" />
              <path d="M136 97 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11 a15 15 0 1 1 15 15" />
            </g>
          </g>
        )}
        {face === "closed" && (
          <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round">
            <path d="M66 104 q18 12 36 0" /><path d="M118 104 q18 12 36 0" />
          </g>
        )}
        {face === "laugh" && (
          <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M68 106 l16 -12 l16 12" /><path d="M120 106 l16 -12 l16 12" />
          </g>
        )}

        {/* brows */}
        {face === "mood" && mad && (
          <g fill={INK}>
            <path d="M58 70 L104 82 L102 90 L56 79 Z" />
            <path d="M162 70 L116 82 L118 90 L164 79 Z" />
          </g>
        )}
        {face === "mood" && mood === "worried" && (
          <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round">
            <path d="M62 72 L98 62" /><path d="M158 72 L122 62" />
          </g>
        )}

        {/* snout */}
        <ellipse cx="110" cy="138" rx="27" ry="19" fill={c.snout} />
        <ellipse cx="101" cy="138" rx="5.5" ry="8" fill={c.nose} />
        <ellipse cx="119" cy="138" rx="5.5" ry="8" fill={c.nose} />

        {/* mouth */}
        {face === "laugh" || (face === "mood" && mood === "happy") ? (
          <g>
            <path d="M92 160 Q110 184 128 160 Z" fill={c.nose} />
            <path d="M101 170 q9 7 18 0 q-9 -5 -18 0z" fill="#ff9ec2" />
          </g>
        ) : face === "closed" ? (
          <ellipse className="k-yawn" cx="110" cy="168" rx="9" ry="11" fill={c.nose} />
        ) : face === "hearts" || mood === "chill" ? (
          <path d="M98 162 q12 10 24 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        ) : face === "spiral" || mood === "worried" ? (
          <path d="M94 168 q5 -6 10 0 q5 6 10 0 q5 -6 10 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        ) : mood === "angry" ? (
          <path d="M96 172 q14 -14 28 0" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        ) : (
          <g>
            <path d="M90 176 Q110 150 130 176 Z" fill={c.nose} />
            <rect x="101" y="158" width="8" height="7" rx="1.5" fill="#fff" /><rect x="111" y="158" width="8" height="7" rx="1.5" fill="#fff" />
          </g>
        )}

        {!mad && (
          <g fill="#ff4b8b" opacity="0.22"><ellipse cx="54" cy="136" rx="13" ry="8" /><ellipse cx="166" cy="136" rx="13" ry="8" /></g>
        )}
        {face === "mood" && mood === "worried" && (
          <path className="k-sweat" d="M176 70 q10 14 0 20 q-10 -6 0 -20z" fill="#1cb0f6" />
        )}
        {face === "mood" && mad && (
          <g className="k-vein" fill="none" stroke="#ea2b2b" strokeWidth="6" strokeLinecap="round">
            <path d="M160 30 q7 7 14 0" /><path d="M160 44 q7 -7 14 0" /><path d="M160 30 q-7 7 0 14" /><path d="M174 30 q7 7 0 14" />
          </g>
        )}
      </g>

      {mood === "happy" && !anim && (
        <g className="k-sparkle" fill="#ffc800">
          <path d="M20 76 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" />
          <path d="M198 66 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" />
        </g>
      )}
      {anim === "love" && (
        <g className="fx-hearts" fill="#ff4b4b">
          {[40, 88, 150, 186].map((x, i) => (
            <path key={x} style={{ animationDelay: `${i * 0.18}s` }} d={`M${x} 60 c-10 -8 -8 -18 -2 -18 c3 0 5 3 5 5 c0 -2 2 -5 5 -5 c6 0 8 10 -8 18z`} />
          ))}
        </g>
      )}
      {anim === "dizzy" && (
        <g className="fx-orbit" fill="#ffc800">
          {[0, 120, 240].map((r) => (
            <path key={r} transform={`rotate(${r} 110 34)`} d="M150 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
          ))}
        </g>
      )}
      {anim === "coin" && (
        <g className="fx-coin">
          <circle cx="110" cy="0" r="15" fill="#ffc800" />
          <circle cx="110" cy="0" r="10" fill="none" stroke="#e5a500" strokeWidth="3" />
        </g>
      )}
      {anim === "dance" && (
        <g className="fx-notes" fill="#ce82ff" fontSize="30" fontWeight="900">
          <text x="18" y="62">♪</text>
          <text x="184" y="56" style={{ animationDelay: "0.3s" }}>♫</text>
        </g>
      )}
      {anim === "sleepy" && (
        <g className="fx-zzz" fill="#1cb0f6" fontWeight="900">
          <text x="160" y="50" fontSize="18">z</text>
          <text x="174" y="34" fontSize="24" style={{ animationDelay: "0.4s" }}>z</text>
          <text x="190" y="16" fontSize="30" style={{ animationDelay: "0.8s" }}>Z</text>
        </g>
      )}
      {anim === "laugh" && (
        <g className="fx-haha" fill="#ff9600" fontWeight="900" fontSize="18">
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

/** Duolingo-style bordered speech bubble; `tail` says which side points at Kobi. */
export function Bubble({ children, tail = "left" }: { children: React.ReactNode; tail?: "left" | "bottom" }) {
  return <div className={`bubble tail-${tail}`}>{children}</div>;
}
