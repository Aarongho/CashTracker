import { useEffect, useState } from "react";
import type { AppState, Bank } from "../types";
import type { Action } from "../store";
import { SOURCES } from "../lib/parsers";
import { bankBalance } from "../lib/ledger";
import { formatIDR } from "../lib/money";
import { BankForm, MoneyInput } from "./BankForm";
import type { useSync } from "../useSync";

/** Two-tap destructive button: first tap arms it, second tap within 4s confirms. */
function ConfirmButton({ label, confirmLabel, onConfirm, className }: { label: string; confirmLabel: string; onConfirm: () => void; className: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button className={className} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirmLabel : label}
    </button>
  );
}

export function Settings({ state, dispatch, sync, onSetupGmail }: { state: AppState; dispatch: React.Dispatch<Action>; sync: ReturnType<typeof useSync>; onSetupGmail: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<{ bank: Bank; balance: number } | null>(null);
  const merchantSources = SOURCES.filter((s) => s.kind === "merchant");

  return (
    <div className="page">
      <header className="page-head">
        <h1>Atur</h1>
        <p className="muted">Bank, budget, dan Gmail</p>
      </header>
      <section className="card">
        <h3>🏦 Bank & e-wallet</h3>
        {state.banks.map((b) => (
          <div key={b.id} className="bank-row" style={{ "--bank": b.color } as React.CSSProperties}>
            <span className="dot" />
            <span className="grow">
              <b>{b.name}</b>
              <br />
              <small className="muted">Saldo awal {formatIDR(b.initialBalance)} · {new Date(b.setAt).toLocaleDateString("id-ID")}</small>
            </span>
            <b>{formatIDR(bankBalance(b, state.transactions))}</b>
            <button className="icon-btn" aria-label={`Set ulang saldo ${b.name}`} onClick={() => setEditing({ bank: b, balance: bankBalance(b, state.transactions) })}>✏️</button>
          </div>
        ))}
        {editing && (
          <div className="card inset">
            <p className="muted">Saldo {editing.bank.name} yang benar sekarang:</p>
            <MoneyInput value={editing.balance} onChange={(n) => setEditing({ ...editing, balance: n })} autoFocus />
            <div className="row">
              <ConfirmButton className="btn danger small" label="Hapus bank" confirmLabel="Yakin hapus?" onConfirm={() => { dispatch({ type: "removeBank", id: editing.bank.id }); setEditing(null); }} />
              <span className="grow" />
              <button className="btn ghost small" onClick={() => setEditing(null)}>Batal</button>
              <button className="btn small" onClick={() => { dispatch({ type: "updateBank", bank: { ...editing.bank, initialBalance: editing.balance, setAt: new Date().toISOString() } }); setEditing(null); }}>Simpan</button>
            </div>
          </div>
        )}
        {adding ? (
          <BankForm existing={state.banks} onAdd={(bank) => { dispatch({ type: "addBank", bank }); setAdding(false); }} onCancel={() => setAdding(false)} />
        ) : (
          <button className="btn ghost wide" onClick={() => setAdding(true)}>+ Tambah bank</button>
        )}
      </section>

      <section className="card">
        <h3>🎮 Budget Hiburan / bulan</h3>
        <MoneyInput value={state.settings.hiburanBudget} onChange={(n) => dispatch({ type: "settings", patch: { hiburanBudget: n } })} />
        <small className="muted">Kobi mulai khawatir di 80%, marah di 100%, ngamuk di 150%.</small>
      </section>

      <section className="card">
        <h3>💳 Sumber dana per merchant</h3>
        <small className="muted">Struk Apple, Netflix, Gojek, dll. dipotong dari bank mana? (Notif bank sendiri otomatis masuk ke bank itu, dan struk yang sama nominalnya digabung biar tidak dobel.)</small>
        {merchantSources.map((s) => (
          <label key={s.name} className="field">
            <span>{s.name}</span>
            <select
              value={state.settings.sourceBank[s.name] ?? ""}
              onChange={(e) => dispatch({ type: "settings", patch: { sourceBank: { ...state.settings.sourceBank, [s.name]: e.target.value } } })}
            >
              <option value="">Default ({state.banks[0]?.name ?? "—"})</option>
              {state.banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        ))}
      </section>

      <section className="card">
        <h3>📬 Gmail</h3>
        <p className="muted">
          {sync.mode === "gmail" ? <>Tersambung{sync.account ? <> sebagai <b className="ink">{sync.account}</b></> : ""} (read-only). Email diproses di browser kamu, tidak dikirim ke server mana pun.</> : "Belum tersambung."}
        </p>
        <label className="field">
          <span>Cek email tiap</span>
          <select value={state.settings.pollSeconds} onChange={(e) => dispatch({ type: "settings", patch: { pollSeconds: Number(e.target.value) } })}>
            {[30, 60, 120, 300].map((s) => <option key={s} value={s}>{s < 60 ? `${s} detik` : `${s / 60} menit`}</option>)}
          </select>
        </label>
        {sync.clientId && <small className="muted mono">Client ID: {sync.clientId.slice(0, 14)}…</small>}
        <div className="row">
          {sync.mode !== "gmail" && <button className="btn" onClick={onSetupGmail}>{sync.hasClientId ? "Sambungkan Gmail" : "Setup Gmail"}</button>}
          {sync.mode === "gmail" && <button className="btn ghost" onClick={onSetupGmail}>Ganti Client ID</button>}
          {sync.mode !== null && <button className="btn ghost" onClick={sync.stop}>Putuskan</button>}
        </div>
      </section>

      <section className="card">
        <h3>⚠️ Data</h3>
        <p className="muted">Semua data disimpan di browser ini saja.</p>
        <ConfirmButton className="btn danger" label="Reset semua data" confirmLabel="Yakin? Tap lagi untuk hapus semua" onConfirm={() => { sync.stop(); dispatch({ type: "reset" }); }} />
      </section>
      <p className="legal">
        <a href="privacy.html" target="_blank" rel="noreferrer">Kebijakan Privasi</a> · <a href="terms.html" target="_blank" rel="noreferrer">Ketentuan Layanan</a>
      </p>
    </div>
  );
}
