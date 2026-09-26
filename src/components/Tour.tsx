import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { Bank } from "../types";
import type { Mood } from "../lib/mood";
import { Mascot } from "./Mascot";
import { BrandBadge } from "./Brand";

interface Step {
  /** data-tour value of the element to spotlight; none = centered card. */
  target?: string;
  title: string;
  text: React.ReactNode;
  mood: Mood;
}

function buildSteps(banks: Bank[], connected: boolean): Step[] {
  const names = banks.map((b) => b.name).join(" & ") || "bank-mu";
  const steps: Step[] = [
    {
      title: "Penting sebelum mulai!",
      mood: "worried",
      text: (
        <>
          <p>
            Aku cuma bisa mencatat kalau <b>bank & e-wallet kamu mengirim email notifikasi / invoice setiap transaksi</b>.
          </p>
          <p>Cek dulu di aplikasi masing-masing (biasanya di menu Pengaturan → Notifikasi) bahwa notifikasi transaksi lewat email sudah aktif.</p>
          <div className="tour-accounts">
            {banks.map((b) => (
              <span key={b.id} className="tour-acc"><BrandBadge name={b.name} size={24} />{b.name}</span>
            ))}
          </div>
        </>
      ),
    },
    { target: "kobi", mood: "happy", title: "Halo, aku Kobi!", text: <>Mood-ku ikut pengeluaran Hiburan-mu. Tap aku kapan aja buat lihat 10 gaya berbeda 😆</> },
    { target: "banner", mood: "chill", title: "Budget Hiburan", text: <>Ini jatah jajan hiburan bulan ini. Makin dekat batas, warnanya berubah… dan aku makin marah 😤</> },
    {
      target: "banks",
      mood: "happy",
      title: "Saldo per akun",
      text: <>Aku cuma baca email dari <b>{names}</b>. Email dari tiap akun hanya mengubah saldo akun itu, misalnya top up GoPay menambah saldo GoPay, bayar pakai BCA mengurangi saldo BCA.</>,
    },
    { target: "topbar", mood: "happy", title: "Statistik cepat", text: <>🔥 hari berturut-turut tanpa jajan hiburan, 🪙 total saldo, ✉️ status Gmail (titik hijau berarti live).</> },
    { target: "recent", mood: "chill", title: "Transaksi terbaru", text: <>Semua yang aku baca muncul di sini. Tap transaksinya untuk <b>edit</b> atau <b>lihat email aslinya</b>.</> },
    { target: "nav", mood: "happy", title: "Menu", text: <><b>Riwayat</b> untuk semua transaksi, <b>Insight</b> untuk kalender & grafik, <b>Atur</b> untuk akun, budget, dan Gmail.</> },
  ];
  if (!connected) steps.push({ target: "connect", mood: "worried", title: "Terakhir!", text: <>Gmail belum tersambung. Tap <b>Sambungkan Gmail</b> di sini supaya aku bisa mulai mencatat.</> });
  return steps;
}

/** First-run walkthrough: Kobi explains each part while it is spotlighted. */
export function Tour({ banks, connected, onDone }: { banks: Bank[]; connected: boolean; onDone: () => void }) {
  const [steps] = useState(() => buildSteps(banks, connected));
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[i];

  const measure = useCallback(() => {
    const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step.target]);

  useLayoutEffect(() => {
    const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const t = window.setTimeout(measure, 400);
    return () => window.clearTimeout(t);
  }, [step.target, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  const last = i === steps.length - 1;
  const next = () => (last ? onDone() : setI(i + 1));
  const pad = 8;
  const hole = rect && { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 };
  // Put the card on whichever side of the spotlight has more room.
  const below = !hole || hole.top + hole.height / 2 < window.innerHeight / 2;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={step.title}>
      {hole ? <div className="tour-hole" style={hole} /> : <div className="tour-dim" />}
      <div
        className={`tour-card ${hole ? (below ? "below" : "above") : "center"}`}
        style={hole ? (below ? { top: Math.min(hole.top + hole.height + 14, window.innerHeight - 260) } : { bottom: Math.max(window.innerHeight - hole.top + 14, 16) }) : undefined}
        key={i}
      >
        <div className="tour-top">
          <Mascot mood={step.mood} size={64} />
          <div className="tour-text">
            <b>{step.title}</b>
            <div>{step.text}</div>
          </div>
        </div>
        <div className="tour-foot">
          <div className="tour-dots" aria-label={`Langkah ${i + 1} dari ${steps.length}`}>
            {steps.map((_, k) => <span key={k} className={k === i ? "on" : ""} />)}
          </div>
          {i > 0 && !last && <button className="link" onClick={onDone}>LEWATI</button>}
          <button className="btn small" onClick={next}>{i === 0 ? "Aku paham" : last ? "Selesai" : "Lanjut"}</button>
        </div>
      </div>
    </div>
  );
}
