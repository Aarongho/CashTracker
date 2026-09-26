import { useState } from "react";
import type { Bank } from "../types";
import { Bubble, Mascot } from "./Mascot";
import { BankForm, MoneyInput } from "./BankForm";
import { Wordmark } from "./Logo";
import { formatIDR } from "../lib/money";

const BUDGETS = [250_000, 500_000, 1_000_000, 2_000_000];

export function Onboarding({ onDone }: { onDone: (name: string, banks: Bank[], budget: number) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [budget, setBudget] = useState(500_000);

  const canNext = step === 0 ? !!name.trim() : step === 1 ? banks.length > 0 : true;
  const next = () => (step < 2 ? setStep(step + 1) : onDone(name.trim(), banks, budget));

  return (
    <div className="onboarding">
      <header className="ob-head">
        {step > 0 ? (
          <button className="ob-back" aria-label="Kembali" onClick={() => setStep(step - 1)}>‹</button>
        ) : (
          <Wordmark />
        )}
        <div className="bar grow"><i style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      </header>

      <main className="ob-body" key={step}>
        {step === 0 && (
          <>
            <div className="ob-hero">
              <Mascot mood="happy" size={170} interactive />
              <Bubble tail="left">Halo! Aku <b>Kobi</b>, celengan galakmu. Siapa namamu?</Bubble>
            </div>
            <h1 className="ob-title">Aku bakal jagain uangmu dari email transaksi. Tapi awas, aku bisa <span className="hl">marah</span> kalau kamu boros hiburan!</h1>
            <input id="nickname" className="text-input big" placeholder="Nama panggilanmu" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </>
        )}

        {step === 1 && (
          <>
            <div className="ob-hero small">
              <Mascot mood="chill" size={110} interactive />
              <Bubble tail="left">Oke {name}! Bank & e-wallet apa aja yang kamu pakai?</Bubble>
            </div>
            {banks.length > 0 && (
              <div className="card list">
                {banks.map((b) => (
                  <div key={b.id} className="bank-row">
                    <span className="bank-badge" style={{ "--bank": b.color } as React.CSSProperties}>{b.name.slice(0, 2).toUpperCase()}</span>
                    <b className="grow">{b.name}</b>
                    <span className="money">{formatIDR(b.initialBalance)}</span>
                    <button className="icon-btn" aria-label={`Hapus ${b.name}`} onClick={() => setBanks(banks.filter((x) => x.id !== b.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <BankForm existing={banks} onAdd={(b) => setBanks([...banks, b])} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="ob-hero small">
              <Mascot mood="worried" size={110} interactive />
              <Bubble tail="left">Terakhir! Berapa batas jajan <b>Hiburan</b> kamu sebulan? Lewat dari ini, aku ngamuk 😤</Bubble>
            </div>
            <div className="pick-grid two">
              {BUDGETS.map((v) => (
                <button key={v} className={`pick tall ${budget === v ? "on" : ""}`} onClick={() => setBudget(v)}>
                  <b>{formatIDR(v)}</b>
                  <small>{v <= 250_000 ? "Super hemat" : v <= 500_000 ? "Santai" : v <= 1_000_000 ? "Lumayan" : "Sultan"}</small>
                </button>
              ))}
            </div>
            <p className="muted center">atau ketik sendiri</p>
            <MoneyInput id="budget" value={budget} onChange={setBudget} />
          </>
        )}
      </main>

      <footer className="ob-foot">
        <button className="btn wide" disabled={!canNext} onClick={next}>{step < 2 ? "Lanjut" : "Mulai!"}</button>
      </footer>
    </div>
  );
}
