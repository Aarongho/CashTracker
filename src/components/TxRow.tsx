import type { Bank, Transaction } from "../types";
import { CATEGORY_META } from "../types";
import { formatIDR } from "../lib/money";

export function TxRow({ tx, banks, onClick, showDate = true, index = 0 }: { tx: Transaction; banks: Bank[]; onClick?: () => void; showDate?: boolean; index?: number }) {
  const meta = CATEGORY_META[tx.category];
  const bank = banks.find((b) => b.id === tx.bankId);
  const when = new Date(tx.date).toLocaleString("id-ID", showDate ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" });
  // "Apple → BCA" for a merged receipt; skip the source when it just repeats the bank name.
  const via = tx.mergedFrom?.length ? `${tx.mergedFrom[0]} → ${bank?.name ?? tx.source}` : tx.source === bank?.name ? null : tx.source;
  const meta2 = [via ?? bank?.name ?? "—", via && !tx.mergedFrom?.length ? bank?.name : null, when].filter(Boolean).join(" · ");
  return (
    <button className="tx-row" onClick={onClick} style={{ "--i": index } as React.CSSProperties}>
      <span className="tx-icon" style={{ "--cat": meta.color } as React.CSSProperties}>{meta.emoji}</span>
      <span className="tx-main">
        <b>{tx.merchant}</b>
        <small>{meta2}</small>
      </span>
      <span className={`tx-amt ${tx.direction}`}>{formatIDR(tx.direction === "in" ? tx.amount : -tx.amount, { sign: true })}</span>
    </button>
  );
}
