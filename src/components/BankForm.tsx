import { useState } from "react";
import type { Bank } from "../types";
import { digitsToNumber } from "../lib/money";
import { uid } from "../lib/ledger";

export const BANK_PRESETS: { name: string; color: string }[] = [
  { name: "BCA", color: "#0060af" },
  { name: "Mandiri", color: "#003d79" },
  { name: "BNI", color: "#f15a23" },
  { name: "BRI", color: "#00529c" },
  { name: "Jago", color: "#f5a623" },
  { name: "SeaBank", color: "#ff5c00" },
  { name: "Jenius", color: "#00a9e0" },
  { name: "CIMB Niaga", color: "#7a0019" },
  { name: "GoPay", color: "#00aa13" },
  { name: "OVO", color: "#4c2a86" },
  { name: "DANA", color: "#118eea" },
  { name: "ShopeePay", color: "#ee4d2d" },
];

export function MoneyInput({ value, onChange, autoFocus }: { value: number; onChange: (n: number) => void; autoFocus?: boolean }) {
  return (
    <label className="money-input">
      <span>Rp</span>
      <input
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value ? value.toLocaleString("id-ID") : ""}
        placeholder="0"
        onChange={(e) => onChange(digitsToNumber(e.target.value))}
      />
    </label>
  );
}

/** Pick a bank and type how much money is in it right now. */
export function BankForm({ existing, onAdd, onCancel }: { existing: Bank[]; onAdd: (b: Bank) => void; onCancel?: () => void }) {
  const [name, setName] = useState("");
  const [custom, setCustom] = useState(false);
  const [balance, setBalance] = useState(0);
  const preset = BANK_PRESETS.find((p) => p.name === name);
  const taken = new Set(existing.map((b) => b.name));

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      id: uid(),
      name: name.trim(),
      initialBalance: balance,
      setAt: new Date().toISOString(),
      color: preset?.color ?? "#ff6b94",
    });
    setName("");
    setBalance(0);
    setCustom(false);
  };

  return (
    <div className="card bank-form">
      <div className="chips">
        {BANK_PRESETS.filter((p) => !taken.has(p.name)).map((p) => (
          <button
            key={p.name}
            className={`chip ${name === p.name ? "on" : ""}`}
            style={{ "--chip": p.color } as React.CSSProperties}
            onClick={() => {
              setName(p.name);
              setCustom(false);
            }}
          >
            {p.name}
          </button>
        ))}
        <button className={`chip ${custom ? "on" : ""}`} onClick={() => { setCustom(true); setName(""); }}>
          + Lainnya
        </button>
      </div>
      {custom && <input className="text-input" placeholder="Nama bank / e-wallet" value={name} onChange={(e) => setName(e.target.value)} autoFocus />}
      {name && (
        <>
          <p className="muted">Saldo {name} kamu sekarang berapa?</p>
          <MoneyInput value={balance} onChange={setBalance} autoFocus={!custom} />
          <div className="row">
            {onCancel && <button className="btn ghost" onClick={onCancel}>Batal</button>}
            <button className="btn" onClick={submit}>Tambah {name}</button>
          </div>
        </>
      )}
      {!name && onCancel && <button className="btn ghost" onClick={onCancel}>Batal</button>}
    </div>
  );
}
