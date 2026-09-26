import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./store";
import type { AppState, Transaction } from "./types";

const tx = (id: string, messageId?: string): Transaction => ({
  id, messageId, date: "2026-09-10T10:00:00Z", amount: 10_000, direction: "out", merchant: id, category: "Makanan", bankId: "b", source: "BCA",
});

const withData = (): AppState => ({
  ...initialState,
  onboarded: true,
  banks: [{ id: "b", name: "BCA", initialBalance: 1_000_000, setAt: "2026-01-01T00:00:00Z", color: "#000" }],
  transactions: [tx("fromEmail", "m1"), tx("manual")],
  seenMessageIds: ["m1", "m2"],
  lastSyncAt: "2026-09-10T11:00:00Z",
});

describe("logging out of Gmail", () => {
  it("removes email data but keeps accounts and manual transactions", () => {
    const s = reducer(withData(), { type: "purgeEmailData" });
    expect(s.transactions.map((t) => t.id)).toEqual(["manual"]);
    expect(s.banks).toHaveLength(1);
    expect(s.banks[0].initialBalance).toBe(1_000_000);
    expect(s.seenMessageIds).toEqual([]);
    expect(s.lastSyncAt).toBeNull();
  });

  it("remembers emails marked 'Bukan transaksi' across logouts", () => {
    let s = reducer(withData(), { type: "removeTx", id: "fromEmail" });
    s = reducer(s, { type: "purgeEmailData" });
    expect(s.ignoredMessageIds).toEqual(["m1"]);
  });
});
