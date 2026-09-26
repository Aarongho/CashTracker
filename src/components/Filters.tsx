import { useState } from "react";
import { PERIOD_LABEL, describePeriod, makePeriod, type Period, type PeriodKey } from "../lib/period";
import { BrandBadge } from "./Brand";

const KEYS: PeriodKey[] = ["today", "7d", "month", "lastMonth", "3m", "year", "all", "custom"];
const toInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromInput = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Period chips plus a date-range row for "Pilih tanggal". */
export function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const today = new Date();
  const [from, setFrom] = useState(toInput(value.from ?? new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(toInput(value.to ? new Date(value.to.getTime() - 86_400_000) : today));
  const applyCustom = (f: string, t: string) => f && t && onChange(makePeriod("custom", today, { from: fromInput(f), to: fromInput(t) }));

  return (
    <div className="period">
      <div className="chips scroll">
        {KEYS.map((k) => (
          <button
            key={k}
            className={`chip ${value.key === k ? "on" : ""}`}
            onClick={() => (k === "custom" ? applyCustom(from, to) : onChange(makePeriod(k)))}
          >
            {k === "custom" ? "📅 " : ""}{PERIOD_LABEL[k]}
          </button>
        ))}
      </div>
      {value.key === "custom" && (
        <div className="range">
          <label>
            <small>Dari</small>
            <input id="period-from" type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); applyCustom(e.target.value, to); }} />
          </label>
          <span className="range-dash">–</span>
          <label>
            <small>Sampai</small>
            <input id="period-to" type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); applyCustom(from, e.target.value); }} />
          </label>
        </div>
      )}
      {value.key === "custom" && <small className="period-label">{describePeriod(value)}</small>}
    </div>
  );
}

/** "Semua" + one chip per email source (Apple, GoPay, BCA…) with its logo. */
export function SourceFilter({ sources, value, onChange }: { sources: string[]; value: string | null; onChange: (s: string | null) => void }) {
  if (sources.length < 2) return null;
  return (
    <div className="chips scroll">
      <button className={`chip ${value === null ? "on" : ""}`} onClick={() => onChange(null)}>Semua sumber</button>
      {sources.map((s) => (
        <button key={s} className={`chip src ${value === s ? "on" : ""}`} onClick={() => onChange(value === s ? null : s)}>
          <BrandBadge name={s} size={22} />
          {s}
        </button>
      ))}
    </div>
  );
}
