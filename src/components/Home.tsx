import { useState } from "react";
import type { AppState, Transaction } from "../types";
import { bankBalance, hematStreak, monthStats } from "../lib/ledger";
import { computeMood, moodLine, type Mood } from "../lib/mood";
import { formatIDR, formatShort } from "../lib/money";
import { ANIM_LINE, Bubble, Mascot, type TapAnim } from "./Mascot";
import { TxRow } from "./TxRow";
import { ColorIcon } from "./icons";
import { useCountUp } from "../useCountUp";
import type { useSync } from "../useSync";

type Sync = ReturnType<typeof useSync>;

const BANNER: Record<Mood, { title: string; tone: string }> = {
  happy: { title: "Hiburan aman terkendali", tone: "green" },
  chill: { title: "Hiburan mulai terpakai", tone: "blue" },
  worried: { title: "Hiburan hampir habis!", tone: "orange" },
  angry: { title: "Budget Hiburan jebol!", tone: "red" },
  furious: { title: "Kobi ngamuk! Stop jajan!", tone: "red" },
};

export function Home({ state, sync, onOpenTx, onSeeAll, onSetupGmail, now }: {
  state: AppState;
  sync: Sync;
  onOpenTx: (t: Transaction) => void;
  onSeeAll: () => void;
  onSetupGmail: () => void;
  now: number;
}) {
  const [tapLine, setTapLine] = useState<{ a: TapAnim; at: number } | null>(null);
  const stats = monthStats(state.transactions);
  const balances = state.banks.map((b) => ({ bank: b, bal: bankBalance(b, state.transactions) }));
  const total = balances.reduce((s, x) => s + x.bal, 0);
  const shownTotal = useCountUp(total);
  const budget = state.settings.hiburanBudget;
  const mood = computeMood(stats, budget, balances.some((x) => x.bal < 0));
  const pct = budget > 0 ? stats.hiburan / budget : 0;
  const line = tapLine && now - tapLine.at < 5000 ? ANIM_LINE[tapLine.a] : moodLine(mood, stats, budget, now);
  const since = state.banks.map((b) => b.setAt).sort()[0];
  const streak = hematStreak(state.transactions, since);
  const banner = BANNER[mood];

  return (
    <div className="page">
      <section className="hero">
        <Mascot mood={mood} size={150} interactive onAnim={(a) => setTapLine({ a, at: Date.now() })} />
        <div className="hero-talk">
          <Bubble key={line}>{line}</Bubble>
          <small className="hint">Tap Kobi!</small>
        </div>
      </section>

      <section className={`banner ${banner.tone}`}>
        <div className="banner-text">
          <small>HIBURAN BULAN INI</small>
          <b>{banner.title}</b>
        </div>
        <div className="bar on-color"><i style={{ width: `${Math.min(pct, 1) * 100}%` }} /></div>
        <div className="banner-foot">
          <span>{formatIDR(stats.hiburan)} / {formatIDR(budget)}</span>
          <b>{Math.round(pct * 100)}%</b>
        </div>
      </section>

      {sync.mode === null && (
        <section className="card connect">
          <ColorIcon name="mail" size={44} />
          <div>
            <b>Sambungkan Gmail</b>
            <p className="muted">Kobi baca email BCA, Apple, Gojek, Netflix… lalu mencatatnya otomatis.</p>
          </div>
          <button className="btn wide" onClick={onSetupGmail}>Sambungkan Gmail</button>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Saldo kamu</h2>
        </div>
        <div className="total">
          <ColorIcon name="coin" size={36} />
          <span className="total-num">{formatIDR(shownTotal)}</span>
        </div>
        <div className="bank-grid stagger">
          {balances.map(({ bank, bal }, i) => (
            <div key={bank.id} className="tile" style={{ "--bank": bank.color, "--i": i } as React.CSSProperties}>
              <span className="bank-badge">{bank.name.slice(0, 2).toUpperCase()}</span>
              <small>{bank.name}</small>
              <b className={bal < 0 ? "neg" : ""}>{formatShort(bal)}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Statistik bulan ini</h2></div>
        <div className="stat-grid stagger">
          <Stat i={0} icon="flame" value={`${streak}`} label="Hari hemat" tone="orange" />
          <Stat i={1} icon="receipt" value={`${stats.count}`} label="Transaksi" tone="purple" />
          <Stat i={2} icon="down" value={formatShort(stats.spent)} label="Keluar" tone="red" />
          <Stat i={3} icon="up" value={formatShort(stats.income)} label="Masuk" tone="green" />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Transaksi terbaru</h2>
          <button className="link" onClick={onSeeAll}>LIHAT SEMUA</button>
        </div>
        <div className="card list stagger">
          {state.transactions.length === 0 && <p className="muted empty">Belum ada transaksi. Sambungkan Gmail dan Kobi akan mulai mencatat.</p>}
          {state.transactions.slice(0, 5).map((t, i) => (
            <TxRow key={t.id} tx={t} banks={state.banks} onClick={() => onOpenTx(t)} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label, tone, i }: { icon: "flame" | "receipt" | "down" | "up"; value: string; label: string; tone: string; i: number }) {
  return (
    <div className={`tile stat ${tone}`} style={{ "--i": i } as React.CSSProperties}>
      <ColorIcon name={icon} size={30} />
      <div>
        <b>{value}</b>
        <small>{label}</small>
      </div>
    </div>
  );
}
