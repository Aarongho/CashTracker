import { useMemo, useState } from "react";
import type { AppState, Category, Transaction } from "../types";
import { CATEGORIES, CATEGORY_META } from "../types";
import { TxRow } from "./TxRow";

export function Transactions({ state, onOpenTx, onAdd }: { state: AppState; onOpenTx: (t: Transaction) => void; onAdd: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [bankId, setBankId] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = state.transactions.filter(
      (t) =>
        (!cat || t.category === cat) &&
        (!bankId || t.bankId === bankId) &&
        (!needle || t.merchant.toLowerCase().includes(needle) || t.source.toLowerCase().includes(needle)),
    );
    const map = new Map<string, Transaction[]>();
    for (const t of list) {
      const day = new Date(t.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
      map.set(day, [...(map.get(day) ?? []), t]);
    }
    return [...map];
  }, [state.transactions, q, cat, bankId]);

  return (
    <div className="page">
      <div className="row">
        <input className="text-input grow" placeholder="Cari merchant…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="text-input" value={bankId} onChange={(e) => setBankId(e.target.value)} aria-label="Filter bank">
          <option value="">Semua bank</option>
          {state.banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="chips scroll">
        <button className={`chip ${!cat ? "on" : ""}`} onClick={() => setCat(null)}>Semua</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${cat === c ? "on" : ""}`} style={{ "--chip": CATEGORY_META[c].color } as React.CSSProperties} onClick={() => setCat(cat === c ? null : c)}>
            {CATEGORY_META[c].emoji} {c}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="muted center">Tidak ada transaksi.</p>}
      {groups.map(([day, txs]) => (
        <section key={day} className="card">
          <small className="muted">{day}</small>
          {txs.map((t) => <TxRow key={t.id} tx={t} banks={state.banks} onClick={() => onOpenTx(t)} />)}
        </section>
      ))}

      <button className="fab" aria-label="Tambah transaksi" onClick={onAdd}>＋</button>
    </div>
  );
}
