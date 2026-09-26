import { useEffect, useState } from "react";
import type { EmailMessage, Transaction } from "../types";
import { fetchMessage, gmailWebLink } from "../lib/gmail";
import { formatIDR } from "../lib/money";
import { Sheet } from "./Sheet";

/**
 * The original email behind a transaction, shown as plain text (no remote images or
 * scripts), with a link to open it in Gmail.
 */
export function EmailViewer({ tx, account, onClose }: { tx: Transaction; account: string | null; onClose: () => void }) {
  const [msg, setMsg] = useState<EmailMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tx.messageId) return;
    let alive = true;
    fetchMessage(tx.messageId)
      .then((m) => alive && setMsg(m))
      .catch(() => alive && setError("Tidak bisa memuat email. Sambungkan Gmail dulu, atau buka langsung di Gmail."));
    return () => {
      alive = false;
    };
  }, [tx.messageId]);

  const amountText = formatIDR(tx.amount).replace("Rp", "");

  return (
    <Sheet title="Email asli" onClose={onClose}>
      <div className="email-head">
        <div><small>Dari</small><b>{msg?.from ?? tx.source}</b></div>
        <div><small>Subjek</small><b>{msg?.subject ?? tx.subject ?? "—"}</b></div>
        <div><small>Tanggal</small><b>{new Date(msg?.date ?? tx.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</b></div>
      </div>
      {!msg && !error && <div className="email-body loading">Memuat email…</div>}
      {error && <div className="notice warn">{error}</div>}
      {msg && (
        <pre className="email-body">
          {highlight(msg.body.trim(), amountText)}
        </pre>
      )}
      {tx.messageId && (
        <a className="btn secondary wide" href={gmailWebLink(tx.messageId, account)} target="_blank" rel="noreferrer">
          Buka di Gmail
        </a>
      )}
    </Sheet>
  );
}

/** Marks where the recorded amount appears so the user can check it. */
function highlight(text: string, amount: string): React.ReactNode {
  const variants = [amount, amount.replace(/\./g, ",")].filter(Boolean);
  const re = new RegExp(`(${variants.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}
