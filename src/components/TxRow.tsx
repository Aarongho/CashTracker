import type { Bank, Transaction } from "../types";
import { CATEGORY_META } from "../types";
import { formatIDR } from "../lib/money";

export function TxRow({ tx, banks, onClick }: { tx: Transaction; banks: Bank[]; onClick?: () => void }) {
  const meta = CATEGORY_META[tx.category];
  const bank = banks.find((b) => b.id === tx.bankId);
  const time = new Date(tx.date).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <button className="tx-row" onClick={onClick}>
      <span className="tx-icon" style={{ background: meta.color }}>{meta.emoji}</span>
      <span className="tx-main">
        <b>{tx.merchant}</b>
        <small>
          {tx.category} · {bank?.name ?? "—"} · {time}
          {tx.mergedFrom?.length ? ` · ✉️ ${tx.source}+${tx.mergedFrom.join("+")}` : ` · ✉️ ${tx.source}`}
        </small>
      </span>
      <span className={`tx-amt ${tx.direction}`}>{formatIDR(tx.direction === "in" ? tx.amount : -tx.amount, { sign: true })}</span>
    </button>
  );
}
