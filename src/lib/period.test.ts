import { describe, expect, it } from "vitest";
import { describePeriod, inPeriod, makePeriod, monthPeriod, summarize } from "./period";
import type { Transaction } from "../types";

const now = new Date(2026, 8, 20, 15); // 20 Sep 2026
const at = (y: number, m: number, d: number, h = 12) => ({ date: new Date(y, m, d, h).toISOString() });

describe("periods", () => {
  it("today includes only today", () => {
    const p = makePeriod("today", now);
    expect(inPeriod(at(2026, 8, 20, 0), p)).toBe(true);
    expect(inPeriod(at(2026, 8, 19, 23), p)).toBe(false);
  });
  it("last month is the whole previous month", () => {
    const p = makePeriod("lastMonth", now);
    expect(inPeriod(at(2026, 7, 1, 0), p)).toBe(true);
    expect(inPeriod(at(2026, 7, 31, 23), p)).toBe(true);
    expect(inPeriod(at(2026, 8, 1, 0), p)).toBe(false);
  });
  it("custom range includes both end days", () => {
    const p = makePeriod("custom", now, { from: new Date(2026, 8, 3), to: new Date(2026, 8, 5) });
    expect(inPeriod(at(2026, 8, 5, 23), p)).toBe(true);
    expect(inPeriod(at(2026, 8, 6, 0), p)).toBe(false);
    expect(describePeriod(p)).toContain("3");
  });
  it("names a full month", () => {
    expect(describePeriod(monthPeriod(2026, 7))).toMatch(/Agustus 2026/);
  });
});

describe("summarize", () => {
  it("ignores transfers and counts income", () => {
    const tx = (amount: number, category: Transaction["category"], direction: "in" | "out" = "out") =>
      ({ id: String(amount), date: now.toISOString(), amount, direction, merchant: "x", category, bankId: null, source: "x" }) as Transaction;
    const s = summarize([tx(100, "Makanan"), tx(50, "Transfer"), tx(1000, "Pemasukan", "in")]);
    expect(s).toMatchObject({ spent: 100, income: 1000, count: 3 });
    expect(s.byCategory.Transfer).toBeUndefined();
  });
});
