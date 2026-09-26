import type { Category, Transaction } from "../types";

export type PeriodKey = "today" | "7d" | "month" | "lastMonth" | "3m" | "year" | "all" | "custom";

export interface Period {
  key: PeriodKey;
  /** Inclusive start, or null for "since forever". */
  from: Date | null;
  /** Exclusive end, or null for "until now". */
  to: Date | null;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  today: "Hari ini",
  "7d": "7 hari",
  month: "Bulan ini",
  lastMonth: "Bulan lalu",
  "3m": "3 bulan",
  year: "Tahun ini",
  all: "Semua",
  custom: "Pilih tanggal",
};

export function makePeriod(key: PeriodKey, now = new Date(), custom?: { from: Date; to: Date }): Period {
  const today = startOfDay(now);
  switch (key) {
    case "today": return { key, from: today, to: addDays(today, 1) };
    case "7d": return { key, from: addDays(today, -6), to: addDays(today, 1) };
    case "month": return { key, from: new Date(today.getFullYear(), today.getMonth(), 1), to: addDays(today, 1) };
    case "lastMonth": return { key, from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 1) };
    case "3m": return { key, from: new Date(today.getFullYear(), today.getMonth() - 2, 1), to: addDays(today, 1) };
    case "year": return { key, from: new Date(today.getFullYear(), 0, 1), to: addDays(today, 1) };
    case "all": return { key, from: null, to: null };
    case "custom": {
      const from = startOfDay(custom?.from ?? today);
      const to = addDays(startOfDay(custom?.to ?? today), 1);
      return { key, from: from <= to ? from : addDays(to, -1), to: from <= to ? to : addDays(from, 1) };
    }
  }
}

/** A period covering one calendar month (used when tapping a month bar). */
export function monthPeriod(year: number, month: number): Period {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  return { key: "custom", from, to };
}

export function inPeriod(t: { date: string }, p: Period): boolean {
  const d = new Date(t.date);
  return (!p.from || d >= p.from) && (!p.to || d < p.to);
}

export function describePeriod(p: Period): string {
  if (p.key !== "custom") return PERIOD_LABEL[p.key];
  const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const last = p.to ? addDays(p.to, -1) : null;
  if (p.from && last && p.from.getDate() === 1 && addDays(last, 1).getDate() === 1 && p.from.getMonth() === last.getMonth())
    return p.from.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  if (p.from && last && p.from.getTime() === last.getTime()) return fmt(p.from);
  return `${p.from ? fmt(p.from) : "Awal"} – ${last ? fmt(last) : "Sekarang"}`;
}

/** Number of days a period spans (for per-day averages); open ends are clamped to the data. */
export function periodDays(p: Period, txs: Transaction[], now = new Date()): number {
  const dates = txs.map((t) => new Date(t.date).getTime());
  const from = p.from?.getTime() ?? (dates.length ? Math.min(...dates) : now.getTime());
  const to = Math.min(p.to?.getTime() ?? now.getTime(), addDays(startOfDay(now), 1).getTime());
  return Math.max(1, Math.round((to - from) / 86_400_000));
}

export interface Summary {
  spent: number;
  income: number;
  count: number;
  byCategory: Partial<Record<Category, number>>;
}

/** Spending summary; transfers between your own accounts aren't spending. */
export function summarize(txs: Transaction[]): Summary {
  const s: Summary = { spent: 0, income: 0, count: txs.length, byCategory: {} };
  for (const t of txs) {
    if (t.direction === "in") {
      if (t.category !== "Transfer") s.income += t.amount;
    }
    else if (t.category !== "Transfer") {
      s.spent += t.amount;
      s.byCategory[t.category] = (s.byCategory[t.category] ?? 0) + t.amount;
    }
  }
  return s;
}

export const isSpend = (t: Transaction) => t.direction === "out" && t.category !== "Transfer";
