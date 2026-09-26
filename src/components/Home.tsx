import { useState } from "react";
import type { AppState, Transaction } from "../types";
import { bankBalance, monthStats } from "../lib/ledger";
import { computeMood, moodLine } from "../lib/mood";
import { formatIDR } from "../lib/money";
import { ANIM_LINE, Mascot, type TapAnim } from "./Mascot";
import { TxRow } from "./TxRow";
import { Icon } from "./icons";
import type { useSync } from "../useSync";

type Sync = ReturnType<typeof useSync>;

const MOOD_LABEL = { happy: "Senang", chill: "Santai", worried: "Khawatir", angry: "Marah", furious: "Ngamuk" };

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
  const budget = state.settings.hiburanBudget;
  const mood = computeMood(stats, budget, balances.some((x) => x.bal < 0));
  const pct = budget > 0 ? stats.hiburan / budget : 0;
  const line = tapLine && now - tapLine.at < 5000 ? ANIM_LINE[tapLine.a] : moodLine(mood, stats, budget, now);

  return (
    <div className="page">
      <header className="home-head">
        <div>
          <small className="muted">Hai, {state.userName} 👋</small>
          <h1>Yuk cek duitmu</h1>
        </div>
        <SyncButton sync={sync} lastSyncAt={state.lastSyncAt} now={now} onSetup={onSetupGmail} />
      </header>

      <section className={`stage stage-${mood}`}>
        <div className="stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <div className="stage-bubble" key={line}>{line}</div>
        <Mascot mood={mood} size={200} interactive onAnim={(a) => setTapLine({ a, at: Date.now() })} />
        <div className="clouds" aria-hidden="true" />
        <div className="stage-foot">
          <span className={`mood-pill ${mood}`}>Kobi: {MOOD_LABEL[mood]}</span>
          <span className="tap-hint">Tap Kobi!</span>
        </div>
      </section>

      <section className="balance">
        <div className="row between">
          <div>
            <small className="muted">Total saldo</small>
            <div className="big-num">{formatIDR(total)}</div>
          </div>
        </div>
        <div className="bank-scroll">
          {balances.map(({ bank, bal }) => (
            <div key={bank.id} className="bank-card" style={{ "--bank": bank.color } as React.CSSProperties}>
              <span className="bank-mono">{bank.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <small>{bank.name}</small>
                <b className={bal < 0 ? "neg-on-color" : ""}>{formatIDR(bal)}</b>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card hiburan">
        <div className="row between">
          <b>🎮 Hiburan bulan ini</b>
          <span className={`pill ${mood}`}>{Math.round(pct * 100)}%</span>
        </div>
        <div className={`meter ${mood}`}>
          <div style={{ width: `${Math.min(pct, 1) * 100}%` }} />
        </div>
        <small className="muted">
          {formatIDR(stats.hiburan)} dari {formatIDR(budget)}
          {stats.hiburan > budget && <b className="neg"> · lewat {formatIDR(stats.hiburan - budget)}</b>}
        </small>
      </section>

      <section className="stat-grid">
        <div className="card stat"><small className="muted">Keluar bulan ini</small><b>{formatIDR(stats.spent)}</b></div>
        <div className="card stat"><small className="muted">Masuk bulan ini</small><b className="pos">{formatIDR(stats.income)}</b></div>
      </section>

      {sync.mode === null && (
        <section className="card connect">
          <span className="connect-icon"><Icon name="mail" size={26} /></span>
          <div>
            <b>Sambungkan Gmail</b>
            <p className="muted">Kobi baca email BCA, Apple, Gojek, Netflix… dan catat otomatis.</p>
          </div>
          <div className="row">
            <button className="btn" onClick={onSetupGmail}>Sambungkan Gmail</button>
          </div>
        </section>
      )}

      <section className="card">
        <div className="row between">
          <h3>Transaksi terbaru</h3>
          <button className="link" onClick={onSeeAll}>Lihat semua</button>
        </div>
        {state.transactions.length === 0 && <p className="muted">Belum ada transaksi.</p>}
        {state.transactions.slice(0, 5).map((t) => (
          <TxRow key={t.id} tx={t} banks={state.banks} onClick={() => onOpenTx(t)} />
        ))}
      </section>
    </div>
  );
}

function ago(iso: string | null, now: number): string {
  if (!iso) return "belum sync";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `${s} dtk lalu`;
  if (s < 3600) return `${Math.round(s / 60)} mnt lalu`;
  return `${Math.round(s / 3600)} jam lalu`;
}

function SyncButton({ sync, lastSyncAt, now, onSetup }: { sync: Sync; lastSyncAt: string | null; now: number; onSetup: () => void }) {
  if (sync.mode === "gmail") {
    const label = sync.needsReconnect ? "Sambungkan lagi" : sync.status === "syncing" ? "Membaca…" : `Live · ${ago(lastSyncAt, now)}`;
    return (
      <button className={`sync-chip ${sync.needsReconnect ? "off" : sync.status}`} onClick={sync.needsReconnect ? onSetup : sync.syncGmail}>
        <span className="live-dot" />
        {label}
        <Icon name="refresh" size={15} />
      </button>
    );
  }
  return (
    <button className="sync-chip off" onClick={onSetup}><Icon name="mail" size={15} /> Gmail</button>
  );
}
