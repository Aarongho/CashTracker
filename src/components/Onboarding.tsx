import { useState } from "react";
import type { Bank } from "../types";
import { Bubble, Mascot } from "./Mascot";
import { BankForm, MoneyInput } from "./BankForm";
import { formatIDR } from "../lib/money";

export function Onboarding({ onDone }: { onDone: (name: string, banks: Bank[], budget: number) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [budget, setBudget] = useState(500_000);

  return (
    <div className="onboarding">
      <div className="progress"><div style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>

      {step === 0 && (
        <section className="step">
          <div className="stage stage-happy onboard-stage">
            <div className="stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <Mascot mood="happy" size={190} interactive />
            <div className="clouds" aria-hidden="true" />
          </div>
          <Bubble>
            Halo! Aku <b>Kobi</b>, celengan galakmu 🐷<br />
            Aku bakal baca email transaksi kamu dan jagain uangmu. Tapi awas… aku bisa <b>marah</b> kalau kamu kebanyakan jajan hiburan!
          </Bubble>
          <input id="nickname" className="text-input big" placeholder="Nama panggilanmu" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn wide" disabled={!name.trim()} onClick={() => setStep(1)}>Lanjut</button>
        </section>
      )}

      {step === 1 && (
        <section className="step">
          <Mascot mood="chill" size={120} interactive />
          <Bubble>Oke {name}! Tambahin bank & e-wallet kamu, terus isi saldo <b>sekarang</b>. Mulai dari sini aku yang hitung.</Bubble>
          {banks.map((b) => (
            <div key={b.id} className="bank-row" style={{ "--bank": b.color } as React.CSSProperties}>
              <span className="dot" />
              <b>{b.name}</b>
              <span className="grow" />
              <span>{formatIDR(b.initialBalance)}</span>
              <button className="icon-btn" aria-label={`Hapus ${b.name}`} onClick={() => setBanks(banks.filter((x) => x.id !== b.id))}>✕</button>
            </div>
          ))}
          <BankForm existing={banks} onAdd={(b) => setBanks([...banks, b])} />
          <div className="row">
            <button className="btn ghost" onClick={() => setStep(0)}>Kembali</button>
            <button className="btn" disabled={!banks.length} onClick={() => setStep(2)}>Lanjut</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="step">
          <Mascot mood="worried" size={120} interactive />
          <Bubble>Terakhir! Berapa batas jajan <b>Hiburan</b> kamu sebulan? (Netflix, game, bioskop, top up…) Lewat dari ini, aku ngamuk 😤</Bubble>
          <MoneyInput value={budget} onChange={setBudget} />
          <div className="chips">
            {[250_000, 500_000, 1_000_000, 2_000_000].map((v) => (
              <button key={v} className={`chip ${budget === v ? "on" : ""}`} onClick={() => setBudget(v)}>{formatIDR(v)}</button>
            ))}
          </div>
          <div className="row">
            <button className="btn ghost" onClick={() => setStep(1)}>Kembali</button>
            <button className="btn" onClick={() => onDone(name.trim(), banks, budget)}>Mulai!</button>
          </div>
        </section>
      )}
    </div>
  );
}
