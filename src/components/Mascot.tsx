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

/** Flat palette per mood: body, lower shade, belly, snout, nostril, ear/foot dark. */
const PALETTE: Record<Mood, { body: string; shade: string; belly: string; snout: string; nose: string; dark: string }> = {
  happy: { body: "#ff8ab4", shade: "#f2669b", belly: "#ffc9de", snout: "#ffb0cc", nose: "#c2185b", dark: "#e5528a" },
  chill: { body: "#ff8ab4", shade: "#f2669b", belly: "#ffc9de", snout: "#ffb0cc", nose: "#c2185b", dark: "#e5528a" },
  worried: { body: "#ff9dc0", shade: "#f47aa6", belly: "#ffd5e5", snout: "#ffbdd4", nose: "#c2185b", dark: "#e8638f" },
  angry: { body: "#ff6f7d", shade: "#e84c5c", belly: "#ffb8be", snout: "#ffa0a9", nose: "#a3122a", dark: "#d93d4f" },
  furious: { body: "#ff4b4b", shade: "#d93636", belly: "#ffa3a3", snout: "#ff8a8a", nose: "#7a0b0b", dark: "#c22a2a" },
};

const BODY = "M110 46 C164 46 188 76 188 122 C188 170 158 196 110 196 C62 196 32 170 32 122 C32 76 56 46 110 46 Z";
const INK = "#2f2f3a";

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
  // Pupils: look down when worried, narrow and inward when mad.
  const px = mad ? 3 : 1;
  const py = mood === "worried" ? 7 : 3;
  const pr = mood === "furious" ? 10 : mood === "angry" ? 12 : 14;
  const EL = { cx: 86, cy: 104 };
  const ER = { cx: 134, cy: 104 };

  const svg = (
    <svg className={`kobi kobi-${mood}${anim ? ` anim-${anim}` : ""}`} width={size} height={size} viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <clipPath id={clip}><path d={BODY} /></clipPath>
      </defs>

      <ellipse className="k-shadow" cx="110" cy="210" rx="56" ry="7" fill="#000" opacity="0.08" />

      {mad && !anim && (
        <g className="k-steam" fill="#e5e5e5">
          <circle cx="36" cy="54" r="11" /><circle cx="24" cy="36" r="7" />
          <circle cx="184" cy="54" r="11" /><circle cx="196" cy="36" r="7" />
        </g>
      )}

      <g className="k-rig">
        {/* curly tail */}
        <path d="M184 150 c14 -2 18 -14 10 -18 c-7 -3 -11 6 -4 9" fill="none" stroke={c.dark} strokeWidth="6" strokeLinecap="round" />

        {/* hooves */}
        <g className="k-feet">
          <rect x="72" y="176" width="30" height="30" rx="12" fill={c.dark} />
          <rect x="118" y="176" width="30" height="30" rx="12" fill={c.dark} />
          <path d="M87 194 v10 M133 194 v10" stroke={c.nose} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* ears */}
        <g className="k-ears">
          <path d="M48 92 C36 70 36 44 46 36 C60 36 84 50 96 62 Z" fill={c.body} />
          <path d="M172 92 C184 70 184 44 174 36 C160 36 136 50 124 62 Z" fill={c.body} />
          <path d="M56 78 C50 64 50 50 54 46 C62 47 76 55 82 62 Z" fill={c.dark} />
          <path d="M164 78 C170 64 170 50 166 46 C158 47 144 55 138 62 Z" fill={c.dark} />
        </g>

        {/* coin half inside the slot: Kobi's signature */}
        <g className="k-coin">
          <circle cx="110" cy="40" r="17" fill="#ffc800" />
          <circle cx="110" cy="40" r="11" fill="none" stroke="#e5a500" strokeWidth="3.5" />
          <path d="M105 33 h5 a3.8 3.8 0 0 1 0 7.6 h-5 z m0 7.6 l6.5 6" fill="none" stroke="#e5a500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* body, flat with a darker underside */}
        <path d={BODY} fill={c.shade} />
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="110" cy="112" rx="86" ry="72" fill={c.body} />
          <ellipse cx="110" cy="176" rx="46" ry="26" fill={c.belly} />
        </g>
        {/* coin slot, drawn over the coin's lower half */}
        <rect x="90" y="48" width="40" height="9" rx="4.5" fill={c.nose} />
        <rect x="94" y="46" width="32" height="6" fill={c.body} />
        <rect x="92" y="50" width="36" height="6" rx="3" fill={c.nose} />

        {/* arms */}
        <g className="k-arm-l"><ellipse cx="34" cy="146" rx="12" ry="16" fill={c.body} transform="rotate(28 34 146)" /></g>
        <g className="k-arm-r"><ellipse cx="186" cy="146" rx="12" ry="16" fill={c.body} transform="rotate(-28 186 146)" /></g>

        {/* eyes (big and close together, like Duo) */}
        {face === "mood" && (
          <g className="k-eyes">
            <ellipse cx={EL.cx} cy={EL.cy} rx="24" ry="27" fill="#fff" />
            <ellipse cx={ER.cx} cy={ER.cy} rx="24" ry="27" fill="#fff" />
            <circle cx={EL.cx + px} cy={EL.cy + py} r={pr} fill={INK} />
            <circle cx={ER.cx - px} cy={ER.cy + py} r={pr} fill={INK} />
            <circle cx={EL.cx + px + 5} cy={EL.cy + py - 6} r="5" fill="#fff" />
            <circle cx={ER.cx - px + 5} cy={ER.cy + py - 6} r="5" fill="#fff" />
            <circle cx={EL.cx + px - 5} cy={EL.cy + py + 6} r="2.2" fill="#fff" />
            <circle cx={ER.cx - px - 5} cy={ER.cy + py + 6} r="2.2" fill="#fff" />
            {/* eyelids carry the mood, cut from the body color */}
            {mad && (
              <g fill={c.body}>
                <path d="M58 72 L114 92 L112 70 L58 60 Z" />
                <path d="M162 72 L106 92 L108 70 L162 60 Z" />
              </g>
            )}
            {mood === "worried" && (
              <g fill={c.body}>
                <path d="M58 86 L110 70 L110 60 L58 60 Z" />
                <path d="M162 86 L110 70 L110 60 L162 60 Z" />
              </g>
            )}
            {mood === "chill" && (
              <g fill={c.body}>
                <rect x="58" y="60" width="104" height="19" />
              </g>
            )}
          </g>
        )}
        {face === "hearts" && (
          <g className="k-heart-eyes" fill="#ff2d55">
            <path d="M86 124 C60 106 62 82 76 84 C81 85 86 90 86 95 C86 90 91 85 96 84 C110 82 112 106 86 124Z" />
            <path d="M134 124 C108 106 110 82 124 84 C129 85 134 90 134 95 C134 90 139 85 144 84 C158 82 160 106 134 124Z" />
          </g>
        )}
        {face === "spiral" && (
          <g>
            <ellipse cx={EL.cx} cy={EL.cy} rx="24" ry="27" fill="#fff" />
            <ellipse cx={ER.cx} cy={ER.cy} rx="24" ry="27" fill="#fff" />
            <g className="k-spiral" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
              <path d="M86 101 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11 a15 15 0 1 1 15 15" />
              <path d="M134 101 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11 a15 15 0 1 1 15 15" />
            </g>
          </g>
        )}
        {face === "closed" && (
          <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round">
            <path d="M68 106 q18 12 36 0" /><path d="M116 106 q18 12 36 0" />
          </g>
        )}
        {face === "laugh" && (
          <g fill="none" stroke={INK} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M70 110 q16 -20 32 0" /><path d="M118 110 q16 -20 32 0" />
          </g>
        )}

        {/* snout: light, wide, with a soft highlight */}
        <ellipse cx="110" cy="144" rx="30" ry="20" fill={c.snout} />
        <ellipse cx="104" cy="134" rx="12" ry="4" fill="#fff" opacity="0.4" />
        <ellipse cx="100" cy="146" rx="6" ry="8" fill={c.nose} />
        <ellipse cx="120" cy="146" rx="6" ry="8" fill={c.nose} />

        {/* mouth */}
        {face === "laugh" || (face === "mood" && mood === "happy") ? (
          <g>
            <path d="M94 168 Q110 190 126 168 Z" fill={c.nose} />
            <path d="M101 177 q9 7 18 0 q-9 -5 -18 0z" fill="#ff8fb5" />
          </g>
        ) : face === "closed" ? (
          <ellipse className="k-yawn" cx="110" cy="176" rx="8" ry="10" fill={c.nose} />
        ) : face === "hearts" || mood === "chill" ? (
          <path d="M100 170 q10 8 20 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        ) : face === "spiral" || mood === "worried" ? (
          <path d="M96 176 q4.5 -5 9 0 q4.5 5 9 0 q4.5 -5 9 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        ) : mood === "angry" ? (
          <path d="M98 180 q12 -12 24 0" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        ) : (
          <g>
            <path d="M92 184 Q110 160 128 184 Z" fill={c.nose} />
            <rect x="102" y="167" width="7" height="6" rx="1.5" fill="#fff" /><rect x="111" y="167" width="7" height="6" rx="1.5" fill="#fff" />
          </g>
        )}

        {!mad && (
          <g fill="#ff3d7f" opacity="0.25"><circle cx="56" cy="140" r="11" /><circle cx="164" cy="140" r="11" /></g>
        )}
        {face === "mood" && mood === "worried" && (
          <path className="k-sweat" d="M172 78 q10 14 0 20 q-10 -6 0 -20z" fill="#1cb0f6" />
        )}
        {face === "mood" && mad && (
          <g className="k-vein" fill="none" stroke="#ea2b2b" strokeWidth="6" strokeLinecap="round">
            <path d="M156 34 q7 7 14 0" /><path d="M156 48 q7 -7 14 0" /><path d="M156 34 q-7 7 0 14" /><path d="M170 34 q7 7 0 14" />
          </g>
        )}
      </g>

      {mood === "happy" && !anim && (
        <g className="k-sparkle" fill="#ffc800">
          <path d="M18 84 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" />
          <path d="M200 76 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" />
        </g>
      )}
      {anim === "love" && (
        <g className="fx-hearts" fill="#ff2d55">
          {[40, 88, 150, 186].map((x, i) => (
            <path key={x} style={{ animationDelay: `${i * 0.18}s` }} d={`M${x} 60 c-10 -8 -8 -18 -2 -18 c3 0 5 3 5 5 c0 -2 2 -5 5 -5 c6 0 8 10 -8 18z`} />
          ))}
        </g>
      )}
      {anim === "dizzy" && (
        <g className="fx-orbit" fill="#ffc800">
          {[0, 120, 240].map((r) => (
            <path key={r} transform={`rotate(${r} 110 30)`} d="M150 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
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
          <text x="14" y="66">♪</text>
          <text x="186" y="60" style={{ animationDelay: "0.3s" }}>♫</text>
        </g>
      )}
      {anim === "sleepy" && (
        <g className="fx-zzz" fill="#1cb0f6" fontWeight="900">
          <text x="160" y="54" fontSize="18">z</text>
          <text x="174" y="38" fontSize="24" style={{ animationDelay: "0.4s" }}>z</text>
          <text x="190" y="20" fontSize="30" style={{ animationDelay: "0.8s" }}>Z</text>
        </g>
      )}
      {anim === "laugh" && (
        <g className="fx-haha" fill="#ff9600" fontWeight="900" fontSize="18">
          <text x="0" y="66">HA</text>
          <text x="182" y="76" style={{ animationDelay: "0.25s" }}>HA</text>
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
