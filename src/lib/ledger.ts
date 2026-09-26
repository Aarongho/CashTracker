import type { AppState, Bank, Category, Transaction } from "../types";
import { categorize } from "./categorize";
import { SOURCES, type ParsedTx } from "./parsers";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const DAY = 86_400_000;

function bankForSource(state: AppState, p: ParsedTx): string | null {
  if (p.sourceKind === "bank") {
    const want = p.source.toLowerCase();
    const bank = state.banks.find((b) => b.name.toLowerCase().includes(want) || want.includes(b.name.toLowerCase()));
    if (bank) return bank.id;
  }
  const mapped = state.settings.sourceBank[p.source];
  if (mapped && state.banks.some((b) => b.id === mapped)) return mapped;
  return state.banks[0]?.id ?? null;
}

/**
 * A merchant receipt (Apple, Gojek…) and the bank's own notification often describe
 * the same charge. Find the counterpart so we count it once.
 */
function findTwin(txs: Transaction[], t: Transaction, kind: "bank" | "merchant"): Transaction | undefined {
  const at = Date.parse(t.date);
  return txs.find(
    (o) =>
      o.direction === t.direction &&
      o.amount === t.amount &&
      o.source !== t.source &&
      o.messageId &&
      guessKind(o.source) !== kind &&
      Math.abs(Date.parse(o.date) - at) <= 3 * DAY &&
      !(o.mergedFrom?.length),
  );
}

export interface MergeResult {
  state: AppState;
  added: Transaction[];
}

export function mergeParsed(state: AppState, parsed: ParsedTx[]): MergeResult {
  const seen = new Set(state.seenMessageIds);
  const txs = [...state.transactions];
  const added: Transaction[] = [];

  for (const p of [...parsed].sort((a, b) => a.date.localeCompare(b.date))) {
    if (seen.has(p.messageId)) continue;
    seen.add(p.messageId);
    const tx: Transaction = {
      id: uid(),
      messageId: p.messageId,
      date: p.date,
      amount: p.amount,
      direction: p.direction,
      merchant: p.merchant,
      category: categorize(p.merchant, p.hint, p.body, state.settings),
      bankId: bankForSource(state, p),
      source: p.source,
      recipient: p.recipient,
      subject: p.subject,
    };
    const twin = findTwin(txs, tx, p.sourceKind);
    if (twin) {
      const [bankTx, merchantTx] = p.sourceKind === "bank" ? [tx, twin] : [twin, tx];
      const merged: Transaction = {
        ...bankTx,
        id: twin.id,
        merchant: merchantTx.merchant,
        category: twin.manualCategory ? twin.category : merchantTx.category,
        manualCategory: twin.manualCategory,
        mergedFrom: [merchantTx.source],
      };
      txs[txs.indexOf(twin)] = merged;
      continue;
    }
    txs.push(tx);
    added.push(tx);
  }

  txs.sort((a, b) => b.date.localeCompare(a.date));
  return { state: { ...state, transactions: txs, seenMessageIds: [...seen] }, added };
}

function guessKind(source: string): "bank" | "merchant" {
  return SOURCES.find((s) => s.name === source)?.kind ?? "merchant";
}

export function bankBalance(bank: Bank, txs: Transaction[]): number {
  const since = Date.parse(bank.setAt);
  return txs.reduce((bal, t) => {
    if (t.bankId !== bank.id || Date.parse(t.date) < since) return bal;
    return bal + (t.direction === "in" ? t.amount : -t.amount);
  }, bank.initialBalance);
}

export function monthKey(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

export interface MonthStats {
  spent: number;
  income: number;
  byCategory: Record<Category, number>;
  byDay: number[];
  hiburan: number;
  count: number;
}

export function monthStats(txs: Transaction[], month = monthKey(new Date())): MonthStats {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const byCategory = {} as Record<Category, number>;
  const byDay = Array<number>(days).fill(0);
  let spent = 0;
  let income = 0;
  let count = 0;
  for (const t of txs) {
    if (monthKey(t.date) !== month) continue;
    count++;
    if (t.direction === "in") {
      income += t.amount;
      continue;
    }
    if (t.category === "Transfer") continue; // moving your own money isn't spending
    spent += t.amount;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    byDay[new Date(t.date).getDate() - 1] += t.amount;
  }
  return { spent, income, byCategory, byDay, hiburan: byCategory.Hiburan ?? 0, count };
}

/**
 * Duolingo-style streak: consecutive days (ending today) without any Hiburan spending,
 * counted no further back than when the user started tracking.
 */
export function hematStreak(txs: Transaction[], since: string | undefined, today = new Date()): number {
  const start = since ? new Date(since) : today;
  start.setHours(0, 0, 0, 0);
  const funDays = new Set(
    txs.filter((t) => t.direction === "out" && t.category === "Hiburan").map((t) => new Date(t.date).toDateString()),
  );
  let n = 0;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  while (d >= start && !funDays.has(d.toDateString()) && n < 3650) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
