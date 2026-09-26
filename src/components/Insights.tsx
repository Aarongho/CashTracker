import { useMemo, useState } from "react";
import type { AppState, Category, Transaction } from "../types";
import { CATEGORY_META } from "../types";
import { formatIDR, formatShort } from "../lib/money";
import { emailSource } from "../lib/brand";
import { inPeriod, isSpend, makePeriod, monthPeriod, periodDays, summarize, type Period } from "../lib/period";
import { ColorIcon } from "./icons";
import { BrandBadge } from "./Brand";
import { PeriodPicker, SourceFilter } from "./Filters";
import { TxRow } from "./TxRow";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function Insights({ state, onOpenTx }: { state: AppState; onOpenTx: (t: Transaction) => void }) {
  const [period, setPeriod] = useState<Period>(() => makePeriod("month"));
  const [source, setSource] = useState<string | null>(null);
  const [day, setDay] = useState<Date | null>(null);

  const sources = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of state.transactions) if (isSpend(t)) m.set(emailSource(t), (m.get(emailSource(t)) ?? 0) + t.amount);
    return [...m].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [state.transactions]);

  // Everything below respects the source filter; most also respect the period.
  const bySource = useMemo(() => state.transactions.filter((t) => !source || emailSource(t) === source), [state.transactions, source]);
  const txs = useMemo(() => bySource.filter((t) => inPeriod(t, period)), [bySource, period]);
  const sum = summarize(txs);
  const perDay = sum.spent / periodDays(period, txs);

  const spendByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of txs) if (isSpend(t)) m.set(dayKey(new Date(t.date)), (m.get(dayKey(new Date(t.date))) ?? 0) + t.amount);
    return m;
  }, [txs]);

  const cats = (Object.entries(sum.byCategory) as [Category, number][]).sort((a, b) => b[1] - a[1]);
  const srcTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of state.transactions) if (isSpend(t) && inPeriod(t, period)) m.set(emailSource(t), (m.get(emailSource(t)) ?? 0) + t.amount);
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [state.transactions, period]);
  const merchants = useMemo(() => {
    const m = new Map<string, { total: number; t: Transaction }>();
    for (const t of txs) if (isSpend(t)) m.set(t.merchant, { total: (m.get(t.merchant)?.total ?? 0) + t.amount, t });
    return [...m].sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  }, [txs]);
  const weekday = useMemo(() => {
    const w = Array<number>(7).fill(0);
    for (const t of txs) if (isSpend(t)) w[(new Date(t.date).getDay() + 6) % 7] += t.amount;
    return w;
  }, [txs]);
  const months = useMemo(() => {
    // Last 12 months up to now, for the source filter (not limited by the period).
    const now = new Date();
    const list = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { y: d.getFullYear(), m: d.getMonth(), total: 0 };
    });
    for (const t of bySource) {
      if (!isSpend(t)) continue;
      const d = new Date(t.date);
      const hit = list.find((x) => x.y === d.getFullYear() && x.m === d.getMonth());
      if (hit) hit.total += t.amount;
    }
    const first = list.findIndex((x) => x.total > 0);
    return first === -1 ? list.slice(-6) : list.slice(Math.min(first, 6));
  }, [bySource]);

  const dayTxs = day ? txs.filter((t) => dayKey(new Date(t.date)) === dayKey(day)) : [];

  return (
    <div className="page">
      <header className="page-head">
        <h1>Insight</h1>
        <p className="muted">Ke mana uangmu pergi, kapan, dan lewat apa.</p>
      </header>

      <PeriodPicker value={period} onChange={(p) => { setPeriod(p); setDay(null); }} />
      <SourceFilter sources={sources} value={source} onChange={(s) => { setSource(s); setDay(null); }} />

      {source && (
        <div className="source-hero">
          <BrandBadge name={source} size={52} />
          <div>
            <small className="muted">Khusus dari</small>
            <h2>{source}</h2>
          </div>
        </div>
      )}

      <section className="stat-grid stagger">
        <Tile i={0} icon="down" value={formatShort(sum.spent)} label="Pengeluaran" />
        <Tile i={1} icon="up" value={formatShort(sum.income)} label="Pemasukan" />
        <Tile i={2} icon="flame" value={formatShort(perDay)} label="Rata-rata / hari" />
        <Tile i={3} icon="receipt" value={`${sum.count}`} label="Transaksi" />
      </section>

      <Calendar period={period} spendByDay={spendByDay} selected={day} onSelect={setDay} />

      {day && (
        <section className="card list day-list">
          <div className="day-list-head">
            <b>{day.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</b>
            <span className="money">{formatIDR(spendByDay.get(dayKey(day)) ?? 0)}</span>
          </div>
          {dayTxs.length === 0 && <p className="muted empty">Tidak ada pengeluaran hari ini. Kobi bangga! 🐷</p>}
          {dayTxs.map((t, i) => <TxRow key={t.id} tx={t} banks={state.banks} onClick={() => onOpenTx(t)} showDate={false} index={i} />)}
        </section>
      )}

      <section className="card">
        <div className="row between">
          <h3>Per bulan</h3>
          <small className="muted">tap bulan untuk lihat detailnya</small>
        </div>
        <MonthBars months={months} period={period} onPick={(y, m) => { setPeriod(monthPeriod(y, m)); setDay(null); }} />
      </section>

      <section className="card">
        <h3>Per hari dalam seminggu</h3>
        <WeekdayBars values={weekday} />
      </section>

      <section className="card">
        <h3>Per kategori</h3>
        {cats.length === 0 && <p className="muted">Belum ada pengeluaran di periode ini.</p>}
        <div className="cat-bars">
          {cats.map(([c, v]) => (
            <div key={c} className="cat-bar">
              <span className="cat-label">{CATEGORY_META[c].emoji} {c}</span>
              <span className="cat-track"><span className={`cat-fill ${c === "Hiburan" ? "hot" : ""}`} style={{ width: `${(v / cats[0][1]) * 100}%` }} /></span>
              <span className="cat-val">{formatShort(v)} <small className="muted">{Math.round((v / sum.spent) * 100)}%</small></span>
            </div>
          ))}
        </div>
      </section>

      {!source && (
        <section className="card">
          <div className="row between">
            <h3>Per sumber email</h3>
            <small className="muted">tap untuk filter</small>
          </div>
          {srcTotals.length === 0 && <p className="muted">—</p>}
          <div className="cat-bars">
            {srcTotals.map(([s, v]) => (
              <button key={s} className="cat-bar as-button" onClick={() => setSource(s)}>
                <span className="cat-label"><BrandBadge name={s} size={26} />{s}</span>
                <span className="cat-track"><span className="cat-fill" style={{ width: `${(v / srcTotals[0][1]) * 100}%` }} /></span>
                <span className="cat-val">{formatShort(v)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card list">
        <h3 className="list-title">Top merchant</h3>
        {merchants.length === 0 && <p className="muted empty">—</p>}
        {merchants.map(([m, { total, t }], i) => (
          <div key={m} className="merchant-row">
            <span className={`rank r${i + 1}`}>{i + 1}</span>
            <BrandBadge name={m} alt={emailSource(t)} size={36} fallback={CATEGORY_META[t.category].emoji} />
            <b className="ellipsis grow">{m}</b>
            <b className="money">{formatIDR(total)}</b>
          </div>
        ))}
      </section>
    </div>
  );
}

function Tile({ icon, value, label, i }: { icon: "down" | "up" | "flame" | "receipt"; value: string; label: string; i: number }) {
  return (
    <div className="tile stat" style={{ "--i": i } as React.CSSProperties}>
      <ColorIcon name={icon} size={30} />
      <div><b>{value}</b><small>{label}</small></div>
    </div>
  );
}

/** Duolingo streak-calendar style month grid; darker = more spending. */
function Calendar({ period, spendByDay, selected, onSelect }: { period: Period; spendByDay: Map<string, number>; selected: Date | null; onSelect: (d: Date | null) => void }) {
  const last = period.to ? new Date(period.to.getTime() - 1) : new Date();
  const [cursor, setCursor] = useState(() => new Date(Math.min(last.getTime(), Date.now())));
  // Keep the shown month inside the period when the period changes.
  const periodKey = `${period.from?.getTime()}-${period.to?.getTime()}`;
  const [seenKey, setSeenKey] = useState(periodKey);
  if (seenKey !== periodKey) {
    setSeenKey(periodKey);
    setCursor(new Date(Math.min(last.getTime(), Date.now())));
  }

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const max = Math.max(1, ...spendByDay.values());
  const today = dayKey(new Date());
  const canPrev = !period.from || new Date(y, m, 1) > period.from;
  const canNext = new Date(y, m + 1, 1) <= new Date() && (!period.to || new Date(y, m + 1, 1) < period.to);
  const monthTotal = [...Array(days)].reduce((s, _, i) => s + (spendByDay.get(dayKey(new Date(y, m, i + 1))) ?? 0), 0);

  return (
    <section className="card calendar">
      <div className="cal-head">
        <button className="round-btn" aria-label="Bulan sebelumnya" disabled={!canPrev} onClick={() => setCursor(new Date(y, m - 1, 1))}>‹</button>
        <div className="cal-title">
          <b>{first.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</b>
          <small className="muted">{formatIDR(monthTotal)}</small>
        </div>
        <button className="round-btn" aria-label="Bulan berikutnya" disabled={!canNext} onClick={() => setCursor(new Date(y, m + 1, 1))}>›</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => <span key={w} className="cal-wd">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = new Date(y, m, i + 1);
          const k = dayKey(d);
          const v = spendByDay.get(k) ?? 0;
          const level = v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4));
          const inside = (!period.from || d >= period.from) && (!period.to || d < period.to) && d <= new Date();
          const isSel = selected && dayKey(selected) === k;
          return (
            <button
              key={k}
              className={`cal-day l${level}${k === today ? " today" : ""}${isSel ? " sel" : ""}${inside ? "" : " out"}`}
              disabled={!inside}
              onClick={() => onSelect(isSel ? null : d)}
              aria-label={`${d.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}: ${formatIDR(v)}`}
              title={formatIDR(v)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="cal-legend">
        <small className="muted">Sedikit</small>
        {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`cal-swatch l${l}`} />)}
        <small className="muted">Banyak</small>
      </div>
    </section>
  );
}

function MonthBars({ months, period, onPick }: { months: { y: number; m: number; total: number }[]; period: Period; onPick: (y: number, m: number) => void }) {
  const max = Math.max(1, ...months.map((x) => x.total));
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="vbars" onMouseLeave={() => setHover(null)}>
      {months.map((x, i) => {
        const start = new Date(x.y, x.m, 1);
        const active = (!period.from || start >= new Date(period.from.getFullYear(), period.from.getMonth(), 1)) && (!period.to || start < period.to);
        return (
          <button key={`${x.y}-${x.m}`} className={`vbar ${active ? "on" : ""}`} onClick={() => onPick(x.y, x.m)} onMouseEnter={() => setHover(i)} aria-label={`${start.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}: ${formatIDR(x.total)}`}>
            <span className="vbar-val">{hover === i || (active && months.length <= 6) ? formatShort(x.total) : ""}</span>
            <span className="vbar-track"><span className="vbar-fill" style={{ height: `${(x.total / max) * 100}%` }} /></span>
            <small>{start.toLocaleDateString("id-ID", { month: "short" })}</small>
          </button>
        );
      })}
    </div>
  );
}

function WeekdayBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const top = values.indexOf(Math.max(...values));
  return (
    <>
      <div className="vbars week">
        {values.map((v, i) => (
          <div key={i} className={`vbar ${i === top && v > 0 ? "on" : ""}`} title={formatIDR(v)}>
            <span className="vbar-val">{i === top && v > 0 ? formatShort(v) : ""}</span>
            <span className="vbar-track"><span className="vbar-fill" style={{ height: `${(v / max) * 100}%` }} /></span>
            <small>{WEEKDAYS[i]}</small>
          </div>
        ))}
      </div>
      {values[top] > 0 && <p className="muted">Kamu paling boros hari <b className="ink">{["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][top]}</b>.</p>}
    </>
  );
}
