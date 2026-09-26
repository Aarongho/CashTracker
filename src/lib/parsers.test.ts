import { describe, expect, it } from "vitest";
import { extractAmount, extractRecipient, parseEmail } from "./parsers";
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

describe("promo emails are not transactions", () => {
  const promos: [string, string, string][] = [
    [
      "BCA <halo@bca.co.id>",
      "RUNinvestasi 2026: From Miles to Millions",
      "Ayo ikut RUNinvestasi 2026! Lari sambil belajar investasi.\nBiaya pendaftaran mulai Rp250 ribu.\nTotal hadiah hingga Rp 100 juta.\nDaftar sekarang di aplikasi myBCA. Pembayaran pendaftaran bisa lewat BCA mobile.\nSyarat & ketentuan berlaku.\nBerhenti berlangganan",
    ],
    [
      "OVO <no-reply@ovo.id>",
      "Mau belanja lebih hemat?",
      "Pakai OVO buat bayar belanjaan dan dapat cashback Rp10 rb!\nTop up saldo OVO sekarang. Transaksi minimal Rp50.000.\nPromo berlaku s.d. 30 September. S&K berlaku.\nUnsubscribe",
    ],
    [
      "Tokopedia <promo@tokopedia.com>",
      "Flash Sale 10.10 mulai jam 10 pagi!",
      "Diskon hingga 90% + gratis ongkir. Checkout order kamu sekarang, harga mulai Rp 1.000.",
    ],
    [
      "Grab <no-reply@grab.com>",
      "Ada voucher GrabFood buat kamu 🍜",
      "Pakai kode HEMAT untuk potongan Rp15.000 di pesanan berikutnya. Berlaku hingga Minggu.",
    ],
  ];
  it.each(promos)("%s: %s", (from, subject, body) => {
    expect(parseEmail(msg(from, subject, body))).toBeNull();
  });

  it("ignores amounts written with ribu/rb/juta", () => {
    expect(extractAmount("Cashback Rp10 rb, hadiah Rp 5 juta")).toBeNull();
  });

  it("ignores tiny amounts that aren't real payments", () => {
    expect(parseEmail(msg("BCA <bca@bca.co.id>", "Notifikasi Transaksi BCA", "Nominal : Rp 10"))).toBeNull();
  });

  it("still reads real OVO and BCA transactions", () => {
    expect(parseEmail(msg("OVO <no-reply@ovo.id>", "Pembayaran Berhasil", "Kamu telah membayar di KOPI KENANGAN\nTotal Pembayaran Rp 28.000\nID Transaksi: 123"))?.amount).toBe(28_000);
    expect(parseEmail(msg("BCA <bca@bca.co.id>", "Internet Transaction Journal", "Transaction Type : Payment\nCompany/Product : TELKOMSEL\nTotal Payment : IDR 100,000.00\nReference No. : 123"))?.amount).toBe(100_000);
  });
});

describe("transfer recipients", () => {
  it.each([
    ["Nama Penerima : BUDI SANTOSO", "BUDI SANTOSO"],
    ["Rekening Tujuan : 0123456789 - SITI AMINAH", "SITI AMINAH"],
    ["Penerima: Andi Wijaya (BNI)", "Andi Wijaya"],
    ["Beneficiary Name: JOHN DOE", "JOHN DOE"],
  ])("%s", (line, name) => expect(extractRecipient(line)).toBe(name));

  it("names the transfer after the recipient", () => {
    const p = parseEmail(msg("BCA <bca@bca.co.id>", "Transfer Berhasil", "Jenis Transaksi : Transfer BI-FAST\nNama Penerima : RINA KARTIKA\nBank Tujuan : Mandiri\nNominal : Rp 150.000,00"))!;
    expect(p).toMatchObject({ amount: 150_000, recipient: "RINA KARTIKA", merchant: "Transfer ke RINA KARTIKA" });
    expect(categorize(p.merchant, p.hint, p.body, noOverrides)).toBe("Transfer");
  });

  it("names incoming money after the sender", () => {
    const p = parseEmail(msg("BCA <bca@bca.co.id>", "Dana Masuk ke Rekening Anda", "Dari : PT MAJU JAYA\nNominal : Rp 8.500.000,00"))!;
    expect(p.merchant).toBe("Dari PT MAJU JAYA");
  });
});
