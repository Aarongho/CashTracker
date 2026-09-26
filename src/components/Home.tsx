import type { AppState, Transaction } from "../types";
import { bankBalance, monthStats } from "../lib/ledger";
import { computeMood, moodLine } from "../lib/mood";
import { formatIDR } from "../lib/money";
import { Bubble, Mascot } from "./Mascot";
import { TxRow } from "./TxRow";
import type { useSync } from "../useSync";

type Sync = ReturnType<typeof useSync>;

export function Home({ state, sync, onOpenTx, onSeeAll, now }: { state: AppState; sync: Sync; onOpenTx: (t: Transaction) => void; onSeeAll: () => void; now: number }) {
  const stats = monthStats(state.transactions);
  const balances = state.banks.map((b) => ({ bank: b, bal: bankBalance(b, state.transactions) }));
  const total = balances.reduce((s, x) => s + x.bal, 0);
  const budget = state.settings.hiburanBudget;
  const mood = computeMood(stats, budget, balances.some((x) => x.bal < 0));
  const pct = budget > 0 ? Math.min(stats.hiburan / budget, 1.6) : 0;

  return (
    <div className="page">
      <section className="hero">
        <Mascot mood={mood} size={150} />
        <Bubble>{moodLine(mood, stats, budget, now)}</Bubble>
      </section>

      <SyncBar sync={sync} lastSyncAt={state.lastSyncAt} now={now} />

      <section className="card total">
        <small>Total saldo</small>
        <h1>{formatIDR(total)}</h1>
        <div className="bank-scroll">
          {balances.map(({ bank, bal }) => (
            <div key={bank.id} className="bank-card" style={{ "--bank": bank.color } as React.CSSProperties}>
              <small>{bank.name}</small>
              <b className={bal < 0 ? "neg" : ""}>{formatIDR(bal)}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="row between">
          <b>🎮 Hiburan bulan ini</b>
          <span className={`pill ${mood}`}>{Math.round((stats.hiburan / Math.max(budget, 1)) * 100)}%</span>
        </div>
        <div className={`meter ${mood}`}>
          <div style={{ width: `${Math.min(pct, 1) * 100}%` }} />
        </div>
        <small className="muted">
          {formatIDR(stats.hiburan)} dari budget {formatIDR(budget)}
          {stats.hiburan > budget && <b className="neg"> · lewat {formatIDR(stats.hiburan - budget)}!</b>}
        </small>
      </section>

      <section className="stat-grid">
        <div className="card stat"><small>Keluar bulan ini</small><b className="neg">{formatIDR(stats.spent)}</b></div>
        <div className="card stat"><small>Masuk bulan ini</small><b className="pos">{formatIDR(stats.income)}</b></div>
      </section>

      <section className="card">
        <div className="row between">
          <b>Transaksi terbaru</b>
          <button className="link" onClick={onSeeAll}>Lihat semua</button>
        </div>
        {state.transactions.length === 0 && <p className="muted">Belum ada transaksi. Sambungkan Gmail atau coba mode demo 👇</p>}
        {state.transactions.slice(0, 6).map((t) => (
          <TxRow key={t.id} tx={t} banks={state.banks} onClick={() => onOpenTx(t)} />
        ))}
      </section>
    </div>
  );
}

function ago(iso: string | null, now: number): string {
  if (!iso) return "belum pernah";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `${s} dtk lalu`;
  if (s < 3600) return `${Math.round(s / 60)} mnt lalu`;
  return `${Math.round(s / 3600)} jam lalu`;
}

export function SyncBar({ sync, lastSyncAt, now }: { sync: Sync; lastSyncAt: string | null; now: number }) {
  if (sync.mode === null) {
    return (
      <section className="card sync-cta">
        <b>📬 Sambungkan Gmail</b>
        <p className="muted">Kobi baca email transaksi (BCA, Apple, Gojek, Netflix…) secara <b>read-only</b>, langsung di browser kamu.</p>
        <div className="row">
          <button className="btn" onClick={sync.connectGmail} disabled={!sync.hasClientId} title={sync.hasClientId ? "" : "Set VITE_GOOGLE_CLIENT_ID dulu"}>
            Sambungkan Gmail
          </button>
          <button className="btn ghost" onClick={sync.startDemo}>Coba demo</button>
        </div>
        {!sync.hasClientId && <small className="muted">Butuh Google Client ID — lihat README.</small>}
        {sync.error && <small className="neg">{sync.error}</small>}
      </section>
    );
  }
  if (sync.mode === "demo") {
    return (
      <div className="sync-bar">
        <span className="live-dot demo" /> Mode demo
        <span className="grow" />
        <button className="btn small" onClick={sync.simulateEmail}>✉️ Simulasi email masuk</button>
      </div>
    );
  }
  return (
    <div className="sync-bar">
      <span className={`live-dot ${sync.status}`} />
      {sync.needsReconnect ? "Gmail terputus" : sync.status === "syncing" ? "Membaca Gmail…" : `Live · sync ${ago(lastSyncAt, now)}`}
      <span className="grow" />
      {sync.needsReconnect ? (
        <button className="btn small" onClick={sync.connectGmail}>Sambungkan lagi</button>
      ) : (
        <button className="btn small ghost" onClick={sync.syncGmail} disabled={sync.status === "syncing"}>↻ Sync</button>
      )}
    </div>
  );
}
