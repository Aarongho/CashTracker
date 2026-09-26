import { useState } from "react";
import type { Bank } from "../types";
import { Bubble, Mascot } from "./Mascot";
import { BankForm, MoneyInput } from "./BankForm";
import { Wordmark } from "./Logo";
import { formatIDR } from "../lib/money";

const BUDGETS = [250_000, 500_000, 1_000_000, 2_000_000];

const STEPS = 4;

export function Onboarding({ onDone }: { onDone: (name: string, banks: Bank[], budget: number, connectGmail: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [budget, setBudget] = useState(500_000);

  const canNext = step === 0 ? !!name.trim() : step === 1 ? banks.length > 0 : true;
  const finish = (connect: boolean) => onDone(name.trim(), banks, budget, connect);
  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish(true));

  return (
    <div className="onboarding">
      <header className="ob-head">
        {step > 0 ? (
          <button className="ob-back" aria-label="Kembali" onClick={() => setStep(step - 1)}>‹</button>
        ) : (
          <Wordmark />
        )}
        <div className="bar grow"><i style={{ width: `${((step + 1) / STEPS) * 100}%` }} /></div>
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
        {step === 3 && (
          <>
            <div className="ob-hero">
              <Mascot mood="happy" size={150} interactive />
              <Bubble tail="left">Terakhir! Login pakai akun Google-mu, biar aku bisa baca email transaksi.</Bubble>
            </div>
            <ul className="perks">
              <li><span className="perk-icon">📬</span><div><b>Otomatis</b><small>Email BCA, Apple, Gojek, Netflix, Shopee… langsung tercatat.</small></div></li>
              <li><span className="perk-icon">🔒</span><div><b>Cuma baca</b><small>Kobi tidak bisa kirim, hapus, atau ubah emailmu.</small></div></li>
              <li><span className="perk-icon">📱</span><div><b>Tetap di HP-mu</b><small>Email diproses di browser ini, tidak dikirim ke server mana pun.</small></div></li>
            </ul>
          </>
        )}
      </main>

      <footer className="ob-foot">
        {step < STEPS - 1 ? (
          <button className="btn wide" disabled={!canNext} onClick={next}>Lanjut</button>
        ) : (
          <div className="ob-foot-stack">
            <button className="btn blue wide google" onClick={() => finish(true)}>
              <GoogleG /> Login dengan Google
            </button>
            <button className="link" onClick={() => finish(false)}>NANTI SAJA</button>
            <p className="legal">Dengan login kamu setuju dengan <a href="terms.html" target="_blank" rel="noreferrer">Ketentuan Layanan</a> dan <a href="privacy.html" target="_blank" rel="noreferrer">Kebijakan Privasi</a>.</p>
          </div>
        )}
      </footer>
    </div>
  );
}

function GoogleG() {
  return (
    <span className="g-chip" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="20" height="20">
        <path fill="#ea4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6c1.8-5.5 7-9.7 13.5-9.7z" />
        <path fill="#4285f4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.6 7.1-17.1z" />
        <path fill="#fbbc05" d="M10.5 28.8A14.5 14.5 0 0 1 9.5 24c0-1.7.3-3.3.9-4.8l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8z" />
        <path fill="#34a853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.7 2.3-8.7 2.3-6.4 0-11.7-4.2-13.5-9.8l-7.9 6C6.6 42.6 14.6 48 24 48z" />
      </svg>
    </span>
  );
}
