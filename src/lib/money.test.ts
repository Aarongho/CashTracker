import { describe, expect, it } from "vitest";
import { formatIDR, parseAmount } from "./money";

describe("parseAmount", () => {
  it.each([
    ["1.250.000,00", 1_250_000],
    ["1,250,000.00", 1_250_000],
    ["150.000", 150_000],
    ["49,000", 49_000],
    ["58000", 58_000],
    ["399 999", 399_999],
    ["54,990.00", 54_990],
    ["12,50", 13],
  ])("%s → %d", (raw, want) => expect(parseAmount(raw)).toBe(want));

  it("returns null without digits", () => expect(parseAmount("Rp")).toBeNull());
});

describe("formatIDR", () => {
  it("formats with dots", () => expect(formatIDR(1250000)).toBe("Rp1.250.000"));
  it("signs", () => expect(formatIDR(-5000, { sign: true })).toBe("−Rp5.000"));
});
