import { describe, expect, it } from "vitest";
import { bankBalance, hematStreak, mergeParsed, monthStats } from "./ledger";
import { parseEmail } from "./parsers";
import { initialState } from "../store";
import { demoInbox } from "./demo";
import { computeMood } from "./mood";
import type { AppState } from "../types";

const withBank = (): AppState => ({
  ...initialState,
  onboarded: true,
  banks: [{ id: "bca", name: "BCA", initialBalance: 1_000_000, setAt: "2000-01-01T00:00:00Z", color: "#000" }],
});

describe("mergeParsed", () => {
  it("merges an Apple receipt with the matching BCA debit", () => {
    const apple = parseEmail({ id: "a", from: "no_reply@email.apple.com", subject: "Your receipt from Apple.", body: "Apple Music\nTOTAL Rp 69.000", date: "2026-09-10T10:00:00Z" })!;
    const bca = parseEmail({ id: "b", from: "bca@bca.co.id", subject: "Notifikasi Transaksi BCA", body: "Transaksi Berhasil\nNama Merchant : APPLE.COM/BILL\nNominal : Rp 69.000,00", date: "2026-09-11T10:00:00Z" })!;
    const { state } = mergeParsed(withBank(), [apple, bca]);
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0]).toMatchObject({ merchant: "Apple Music", category: "Hiburan", source: "BCA", bankId: "bca" });
    expect(bankBalance(state.banks[0], state.transactions)).toBe(931_000);
  });

  it("ignores already-seen messages", () => {
    const p = parseEmail({ id: "a", from: "no_reply@email.apple.com", subject: "Your receipt from Apple.", body: "TOTAL Rp 69.000", date: "2026-09-10T10:00:00Z" })!;
    const once = mergeParsed(withBank(), [p]).state;
    expect(mergeParsed(once, [p]).state.transactions).toHaveLength(1);
  });

  it("only counts transactions after the balance was set", () => {
    const s = withBank();
    s.banks[0].setAt = "2026-09-12T00:00:00Z";
    const p = parseEmail({ id: "a", from: "bca@bca.co.id", subject: "Notifikasi Transaksi BCA", body: "Nama Merchant : X\nNominal : Rp 50.000", date: "2026-09-10T10:00:00Z" })!;
    const { state } = mergeParsed(s, [p]);
    expect(bankBalance(state.banks[0], state.transactions)).toBe(1_000_000);
  });
});

describe("demo month", () => {
  it("makes Kobi at least worried about Hiburan", () => {
    const parsed = demoInbox().map(parseEmail).filter((p) => p !== null);
    const { state } = mergeParsed(withBank(), parsed);
    const stats = monthStats(state.transactions);
    expect(stats.hiburan).toBeGreaterThan(0);
    expect(["worried", "angry", "furious"]).toContain(computeMood(stats, 500_000, false));
  });
});

describe("hematStreak", () => {
  const tx = (date: string, category: "Hiburan" | "Makanan") =>
    ({ id: date, date, amount: 1, direction: "out", merchant: "x", category, bankId: null, source: "x" }) as const;
  const today = new Date(2026, 8, 20, 15);

  it("counts days since the last Hiburan spend", () => {
    const txs = [tx(new Date(2026, 8, 16, 10).toISOString(), "Hiburan"), tx(new Date(2026, 8, 19, 10).toISOString(), "Makanan")];
    expect(hematStreak([...txs], new Date(2026, 8, 1).toISOString(), today)).toBe(4);
  });

  it("is 0 when you spent on Hiburan today", () => {
    expect(hematStreak([tx(new Date(2026, 8, 20, 9).toISOString(), "Hiburan")], new Date(2026, 8, 1).toISOString(), today)).toBe(0);
  });

  it("stops at the day tracking started", () => {
    expect(hematStreak([], new Date(2026, 8, 18, 12).toISOString(), today)).toBe(3);
  });
});
