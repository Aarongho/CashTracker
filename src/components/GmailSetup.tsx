import { useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./icons";
import { BrandBadge } from "./Brand";
import { accountDomains } from "../lib/accounts";
import type { Bank } from "../types";
import type { useSync } from "../useSync";

const SITE_URL = "https://aarongho.github.io/cashtracker/";

/** One-tap Gmail connection. Shows exactly which senders will be read. */
export function GmailSetup({ sync, banks, onClose }: { sync: ReturnType<typeof useSync>; banks: Bank[]; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  // Sandboxed previews (e.g. a claude.ai artifact) can't run Google sign-in.
  const sandboxed = window.location.origin === "null" || /claude|anthropic|usercontent/.test(window.location.hostname);

  const connect = async () => {
    setBusy(true);
    const ok = await sync.connectGmail();
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Sheet title="Sambungkan Gmail" onClose={onClose}>
      {sandboxed && (
        <div className="notice warn">
          <b>Preview ini tidak bisa login Google.</b>
          <a href={SITE_URL} target="_blank" rel="noreferrer">{SITE_URL}</a>
        </div>
      )}

      <p className="muted">Kobi cuma membaca email transaksi dari akun yang kamu tambahkan:</p>
      <div className="card list">
        {banks.map((b) => {
          const domains = accountDomains(b);
          return (
            <div key={b.id} className="bank-row">
              <BrandBadge name={b.name} size={36} />
              <div className="grow">
                <b>{b.name}</b>
                <br />
                <small className="muted">{domains.length ? domains.map((d) => `@${d}`).join(", ") : `email dengan nama "${b.name}"`}</small>
              </div>
            </div>
          );
        })}
      </div>

      {sync.error && <div className="notice bad">{sync.error}</div>}

      <button className="btn blue wide" disabled={busy || sandboxed || banks.length === 0} onClick={connect}>
        <Icon name="mail" size={18} /> {busy ? "Menghubungkan…" : "Login dengan Google"}
      </button>
      <p className="fine"><Icon name="lock" size={14} /> Hanya baca. Email diproses di HP-mu, tidak dikirim ke server mana pun.</p>
    </Sheet>
  );
}
