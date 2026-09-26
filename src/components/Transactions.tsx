import { useMemo, useState } from "react";
import type { AppState, Transaction } from "../types";
import { CATEGORY_META, type Category } from "../types";
import { monthKey } from "../lib/ledger";
import { formatIDR } from "../lib/money";
import { emailSource, monogram, sourceColor } from "../lib/brand";
import { TxRow } from "./TxRow";
import { Icon } from "./icons";
import { Segmented } from "./Segmented";

type GroupBy = "source" | "category" | "date";
type SortBy = "newest" | "biggest";

interface Group {
  key: string;
  label: string;
  badge: React.ReactNode;
  color: string;
  spent: number;
  income: number;
  txs: Transaction[];
}

const monthLabel = (k: string) => {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
};

export function Transactions({ state, onOpenTx, onAdd }: { state: AppState; onOpenTx: (t: Transaction) => void; onAdd: () => void }) {
  const [q, setQ] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("source");
  const [sortBy, setSortBy] = useState<SortBy>("biggest");
  const [month, setMonth] = useState<string>(monthKey(new Date()));
  const [open, setOpen] = useState<Set<string>>(new Set());

  const months = useMemo(
    () => [...new Set([monthKey(new Date()), ...state.transactions.map((t) => monthKey(t.date))])].sort().reverse(),
    [state.transactions],
  );

  const { groups, spent, count } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = state.transactions.filter(
      (t) =>
        (month === "all" || monthKey(t.date) === month) &&
        (!needle || `${t.merchant} ${t.source} ${t.mergedFrom?.join(" ") ?? ""} ${t.category}`.toLowerCase().includes(needle)),
    );
    const map = new Map<string, Group>();
    for (const t of list) {
      let key: string, label: string, badge: React.ReactNode, color: string;
      if (groupBy === "source") {
        key = label = emailSource(t);
        color = sourceColor(key);
        badge = monogram(key);
      } else if (groupBy === "category") {
        key = label = t.category;
        color = CATEGORY_META[t.category as Category].color;
        badge = CATEGORY_META[t.category as Category].emoji;
      } else {
        key = t.date.slice(0, 10);
        label = new Date(t.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
        color = "var(--accent)";
        badge = new Date(t.date).getDate();
      }
      const g = map.get(key) ?? { key, label, badge, color, spent: 0, income: 0, txs: [] };
      if (t.direction === "in") g.income += t.amount;
      else if (t.category !== "Transfer") g.spent += t.amount;
      g.txs.push(t);
      map.set(key, g);
    }
    const byTx = sortBy === "biggest" ? (a: Transaction, b: Transaction) => b.amount - a.amount : (a: Transaction, b: Transaction) => b.date.localeCompare(a.date);
    const groups = [...map.values()];
    for (const g of groups) g.txs.sort(byTx);
    if (groupBy === "date") groups.sort((a, b) => b.key.localeCompare(a.key));
    else groups.sort((a, b) => (sortBy === "biggest" ? b.spent + b.income - (a.spent + a.income) : b.txs[0].date.localeCompare(a.txs[0].date)));
    return { groups, spent: groups.reduce((s, g) => s + g.spent, 0), count: list.length };
  }, [state.transactions, q, groupBy, sortBy, month]);

  const maxGroup = Math.max(...groups.map((g) => g.spent || g.income), 1);
  // Date view reads best fully open; the others start collapsed except the biggest group.
  const isOpen = (k: string, i: number) => (open.has(k) ? true : open.has(`!${k}`) ? false : groupBy === "date" || i === 0);
  const toggle = (k: string, i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      n.delete(k);
      n.delete(`!${k}`);
      n.add(isOpen(k, i) ? `!${k}` : k);
      return n;
    });

  return (
    <div className="page">
      <header className="page-head">
        <h1>Pengeluaran</h1>
        <p className="muted">{count} transaksi · keluar <b className="ink">{formatIDR(spent)}</b></p>
      </header>

      <label className="search">
        <Icon name="search" size={18} />
        <input id="tx-search" placeholder="Cari merchant, bank, kategori…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <Segmented
        value={groupBy}
        onChange={(v) => { setGroupBy(v); setOpen(new Set()); }}
        options={[{ value: "source", label: "Sumber email" }, { value: "category", label: "Kategori" }, { value: "date", label: "Tanggal" }]}
      />

      <div className="chips scroll">
        <button className={`chip ${sortBy === "biggest" ? "on" : ""}`} onClick={() => setSortBy("biggest")}><Icon name="sort" size={14} /> Terbesar</button>
        <button className={`chip ${sortBy === "newest" ? "on" : ""}`} onClick={() => setSortBy("newest")}>Terbaru</button>
        <span className="chip-sep" />
        {months.map((m) => (
          <button key={m} className={`chip ${month === m ? "on" : ""}`} onClick={() => setMonth(m)}>{monthLabel(m)}</button>
        ))}
        <button className={`chip ${month === "all" ? "on" : ""}`} onClick={() => setMonth("all")}>Semua</button>
      </div>

      {groups.length === 0 && <p className="muted center">Tidak ada transaksi di sini.</p>}
      {groups.map((g, i) => {
        const expanded = isOpen(g.key, i);
        return (
          <section key={g.key} className={`group ${expanded ? "open" : ""}`}>
            <button className="group-head" onClick={() => toggle(g.key, i)} aria-expanded={expanded}>
              <span className="group-badge" style={{ "--c": g.color } as React.CSSProperties}>{g.badge}</span>
              <span className="group-title">
                <b>{g.label}</b>
                <small className="muted">{g.txs.length} transaksi{g.income ? ` · +${formatIDR(g.income)}` : ""}</small>
                <span className="group-bar"><span style={{ width: `${((g.spent || g.income) / maxGroup) * 100}%`, background: g.color }} /></span>
              </span>
              <span className="group-total">{g.spent ? formatIDR(g.spent) : formatIDR(g.income, { sign: true })}</span>
              <span className="group-chev"><Icon name="chevron" size={18} /></span>
            </button>
            {expanded && (
              <div className="group-body">
                {g.txs.map((t) => <TxRow key={t.id} tx={t} banks={state.banks} onClick={() => onOpenTx(t)} showDate={groupBy !== "date"} />)}
              </div>
            )}
          </section>
        );
      })}

      <button className="fab" aria-label="Tambah transaksi" onClick={onAdd}><Icon name="plus" size={26} stroke={2.6} /></button>
    </div>
  );
}
