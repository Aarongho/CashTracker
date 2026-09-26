import { useState } from "react";
import type { Bank, Category, Direction, Transaction } from "../types";
import { CATEGORIES, CATEGORY_META } from "../types";
import { MoneyInput } from "./BankForm";
import { uid } from "../lib/ledger";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function TxEditor({
  tx,
  banks,
  onSave,
  onDelete,
  onClose,
}: {
  tx: Transaction | null;
  banks: Bank[];
  onSave: (t: Transaction, remember: boolean) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const isNew = !tx;
  const [draft, setDraft] = useState<Transaction>(
    tx ?? {
      id: uid(),
      date: new Date().toISOString(),
      amount: 0,
      direction: "out",
      merchant: "",
      category: "Makanan",
      bankId: banks[0]?.id ?? null,
      source: "Manual",
      manualCategory: true,
    },
  );
  const [remember, setRemember] = useState(!isNew);
  const set = <K extends keyof Transaction>(k: K, v: Transaction[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>{isNew ? "Tambah transaksi" : "Edit transaksi"}</h2>
          <button className="icon-btn" aria-label="Tutup" onClick={onClose}>✕</button>
        </div>

        <div className="seg">
          {(["out", "in"] as Direction[]).map((d) => (
            <button key={d} className={draft.direction === d ? "on" : ""} onClick={() => set("direction", d)}>
              {d === "out" ? "Pengeluaran" : "Pemasukan"}
            </button>
          ))}
        </div>

        <input className="text-input" placeholder="Merchant / keterangan" value={draft.merchant} onChange={(e) => set("merchant", e.target.value)} />
        <MoneyInput value={draft.amount} onChange={(n) => set("amount", n)} />

        <label className="field">
          <span>Bank</span>
          <select value={draft.bankId ?? ""} onChange={(e) => set("bankId", e.target.value || null)}>
            <option value="">— Tidak ada —</option>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Waktu</span>
          <input type="datetime-local" value={toLocalInput(draft.date)} onChange={(e) => e.target.value && set("date", new Date(e.target.value).toISOString())} />
        </label>

        <div className="chips">
          {CATEGORIES.map((c: Category) => (
            <button key={c} className={`chip ${draft.category === c ? "on" : ""}`} style={{ "--chip": CATEGORY_META[c].color } as React.CSSProperties} onClick={() => setDraft((d) => ({ ...d, category: c, manualCategory: true }))}>
              {CATEGORY_META[c].emoji} {c}
            </button>
          ))}
        </div>

        {draft.merchant.trim() && (
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Selalu kategorikan “{draft.merchant.trim()}” sebagai {draft.category}
          </label>
        )}

        <div className="row">
          {!isNew && onDelete && <button className="btn danger" onClick={() => onDelete(draft.id)}>Hapus</button>}
          <button className="btn wide" disabled={!draft.amount || !draft.merchant.trim()} onClick={() => onSave(draft, remember)}>Simpan</button>
        </div>
      </div>
    </div>
  );
}
