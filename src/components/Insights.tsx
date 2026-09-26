import { useMemo, useState } from "react";
import type { AppState, Category } from "../types";
import { CATEGORY_META } from "../types";
import { monthKey, monthStats } from "../lib/ledger";
import { formatIDR, formatShort } from "../lib/money";
import { emailSource, monogram, sourceColor } from "../lib/brand";
import { ColorIcon } from "./icons";

export function Insights({ state }: { state: AppState }) {
  const months = useMemo(() => {
    const set = new Set([monthKey(new Date()), ...state.transactions.map((t) => monthKey(t.date))]);
    return [...set].sort().reverse();
  }, [state.transactions]);
  const [month, setMonth] = useState(months[0]);
  const [hover, setHover] = useState<number | null>(null);
  const stats = monthStats(state.transactions, month);

  const cats = (Object.entries(stats.byCategory) as [Category, number][]).sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] ?? 1;
  const maxDay = Math.max(...stats.byDay, 1);

  const merchants = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of state.transactions) {
      if (t.direction !== "out" || t.category === "Transfer" || monthKey(t.date) !== month) continue;
      m.set(t.merchant, (m.get(t.merchant) ?? 0) + t.amount);
    }
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [state.transactions, month]);

  const sources = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of state.transactions) {
      if (t.direction !== "out" || t.category === "Transfer" || monthKey(t.date) !== month) continue;
      const k = emailSource(t);
      m.set(k, (m.get(k) ?? 0) + t.amount);
    }
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [state.transactions, month]);
  const maxSrc = sources[0]?.[1] ?? 1;

  const label = (k: string) => {
    const [y, m] = k.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  // Daily chart geometry
  const W = 320;
  const H = 120;
  const n = stats.byDay.length;
  const slot = W / n;
  const barW = Math.max(slot - 2, 2);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Insight</h1>
        <p className="muted">Ke mana uangmu pergi bulan ini</p>
      </header>
      <div className="chips scroll">
        {months.map((m) => (
          <button key={m} className={`chip ${month === m ? "on" : ""}`} onClick={() => setMonth(m)}>{label(m)}</button>
        ))}
      </div>

      <section className="stat-grid stagger">
        <div className="tile stat" style={{ "--i": 0 } as React.CSSProperties}>
          <ColorIcon name="down" size={30} />
          <div><b>{formatShort(stats.spent)}</b><small>Pengeluaran</small></div>
        </div>
        <div className="tile stat" style={{ "--i": 1 } as React.CSSProperties}>
          <ColorIcon name="up" size={30} />
          <div><b>{formatShort(stats.income)}</b><small>Pemasukan</small></div>
        </div>
      </section>

      <section className="card">
        <h3>Per kategori</h3>
        {cats.length === 0 && <p className="muted">Belum ada pengeluaran bulan ini.</p>}
        <div className="cat-bars">
          {cats.map(([c, v]) => (
            <div key={c} className="cat-bar">
              <span className="cat-label">{CATEGORY_META[c].emoji} {c}</span>
              <span className="cat-track">
                <span className={`cat-fill ${c === "Hiburan" ? "hot" : ""}`} style={{ width: `${(v / maxCat) * 100}%` }} />
              </span>
              <span className="cat-val">{formatShort(v)} <small className="muted">{Math.round((v / stats.spent) * 100)}%</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Per sumber email</h3>
        {sources.length === 0 && <p className="muted">—</p>}
        <div className="cat-bars">
          {sources.map(([src, v]) => (
            <div key={src} className="cat-bar">
              <span className="cat-label"><span className="mini-badge" style={{ background: sourceColor(src) }}>{monogram(src)}</span>{src}</span>
              <span className="cat-track"><span className="cat-fill" style={{ width: `${(v / maxSrc) * 100}%` }} /></span>
              <span className="cat-val">{formatShort(v)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="row between">
          <h3>Pengeluaran harian</h3>
          <small className="muted">
            {hover !== null ? `${hover + 1} ${label(month).split(" ")[0]} · ${formatIDR(stats.byDay[hover])}` : `puncak ${formatShort(maxDay)}`}
          </small>
        </div>
        <svg className="day-chart" viewBox={`0 0 ${W} ${H + 16}`} onMouseLeave={() => setHover(null)} role="img" aria-label="Grafik pengeluaran harian">
          <line x1="0" x2={W} y1={H} y2={H} className="axis" />
          {stats.byDay.map((v, i) => {
            const h = v ? Math.max((v / maxDay) * (H - 6), 3) : 0;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
                <rect x={i * slot} y="0" width={slot} height={H} fill="transparent" />
                {h > 0 && <rect x={i * slot + 1} y={H - h} width={barW} height={h} rx={Math.min(3, barW / 2)} className={`day-bar ${hover === i ? "on" : ""}`} />}
              </g>
            );
          })}
          {[1, 10, 20, n].map((d) => (
            <text key={d} x={(d - 0.5) * slot} y={H + 13} textAnchor="middle" className="tick">{d}</text>
          ))}
        </svg>
      </section>

      <section className="card">
        <h3>Top merchant</h3>
        {merchants.map(([m, v], i) => (
          <div key={m} className="row between merchant-row">
            <span className="ellipsis"><span className="rank">{i + 1}</span>{m}</span>
            <b>{formatIDR(v)}</b>
          </div>
        ))}
        {merchants.length === 0 && <p className="muted">—</p>}
      </section>
    </div>
  );
}
