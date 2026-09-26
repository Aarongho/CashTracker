import { describe, expect, it } from "vitest";
import { extractAmount, parseEmail } from "./parsers";
import { demoInbox } from "./demo";
import { categorize } from "./categorize";

const msg = (from: string, subject: string, body: string) => ({ id: "x", from, subject, body, date: "2026-09-10T10:00:00Z" });
const noOverrides = { merchantCategory: {} };

describe("extractAmount", () => {
  it("prefers the total line", () => {
    expect(extractAmount("Nominal : Rp 200.000\nTotal Bayar : Rp 202.500\nAdmin Rp 2.500")).toBe(202_500);
  });
  it("handles IDR English format", () => expect(extractAmount("Total IDR 54,990.00")).toBe(54_990));
});

describe("parseEmail", () => {
  it("parses a BCA QRIS notification", () => {
    const p = parseEmail(msg("BCA <bca@bca.co.id>", "Notifikasi Transaksi BCA", "Transaksi Berhasil\nNama Merchant : STARBUCKS GI\nNominal : Rp 58.000,00"))!;
    expect(p).toMatchObject({ amount: 58_000, direction: "out", merchant: "STARBUCKS GI", source: "BCA", sourceKind: "bank" });
    expect(categorize(p.merchant, p.hint, p.body, noOverrides)).toBe("Makanan");
  });

  it("detects incoming money", () => {
    const p = parseEmail(msg("BCA <bca@bca.co.id>", "Dana Masuk ke Rekening Anda", "Dari : PT X\nNominal : Rp 8.500.000,00"))!;
    expect(p.direction).toBe("in");
    expect(p.hint).toBe("Pemasukan");
  });

  it("does not treat 'kartu kredit' as incoming", () => {
    const p = parseEmail(msg("BCA <bca@bca.co.id>", "Transaksi Kartu Kredit BCA", "Merchant : CGV\nNominal : Rp 100.000"))!;
    expect(p.direction).toBe("out");
  });

  it("parses an Apple receipt as Hiburan", () => {
    const p = parseEmail(msg("Apple <no_reply@email.apple.com>", "Your receipt from Apple.", "Apple Music\nIndividual (Monthly)\nTOTAL Rp 69.000"))!;
    expect(p).toMatchObject({ amount: 69_000, merchant: "Apple Music", source: "Apple" });
    expect(categorize(p.merchant, p.hint, p.body, noOverrides)).toBe("Hiburan");
  });

  it("labels iCloud as Tagihan", () => {
    const p = parseEmail(msg("Apple <no_reply@email.apple.com>", "Your receipt from Apple.", "iCloud+ with 200 GB\nTOTAL Rp 45.000"))!;
    expect(categorize(p.merchant, p.hint, p.body, noOverrides)).toBe("Tagihan");
  });

  it("skips OTP and promo mail", () => {
    expect(parseEmail(msg("BCA <bca@bca.co.id>", "Kode OTP", "OTP transaksi Rp 100.000"))).toBeNull();
    expect(parseEmail(msg("Shopee <a@shopee.co.id>", "Promo 9.9 diskon hingga Rp 100.000", "Belanja sekarang, pembayaran mudah"))).toBeNull();
  });

  it("parses every demo email", () => {
    for (const m of demoInbox()) expect(parseEmail(m), m.id).not.toBeNull();
  });
});
