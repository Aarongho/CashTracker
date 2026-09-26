import type { EmailMessage } from "../types";

const ago = (days: number, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
};

const bca = (id: string, days: number, merchant: string, amount: string, jenis = "QRIS") => ({
  id,
  from: "BCA <bca@bca.co.id>",
  subject: "Notifikasi Transaksi BCA",
  date: ago(days),
  body: `Transaksi Berhasil\nJenis Transaksi : ${jenis}\nNama Merchant : ${merchant}\nNominal : Rp ${amount},00\nTanggal : hari ini\nTerima kasih telah bertransaksi dengan BCA.`,
});

/** Sample inbox so the app is explorable before connecting Gmail. */
export function demoInbox(): EmailMessage[] {
  const days = Math.min(new Date().getDate() - 1, 20);
  const d = (n: number) => Math.max(0, Math.min(days, n));
  return [
    {
      id: "demo-gaji",
      from: "BCA <bca@bca.co.id>",
      subject: "Dana Masuk ke Rekening Anda",
      date: ago(d(20), 9),
      body: "Dana masuk ke rekening Anda\nDari : PT MAJU JAYA\nNominal : Rp 8.500.000,00\nKeterangan : GAJI",
    },
    bca("demo-1", d(18), "STARBUCKS GRAND INDONESIA", "58.000"),
    {
      id: "demo-apple-1",
      from: "Apple <no_reply@email.apple.com>",
      subject: "Your receipt from Apple.",
      date: ago(d(16), 20),
      body: "Receipt\nApple ID: kamu@gmail.com\nApple Music\nIndividual (Monthly)\nRp 69.000\nTOTAL Rp 69.000",
    },
    bca("demo-1b", d(16), "APPLE.COM/BILL", "69.000", "Kartu Debit Online"),
    {
      id: "demo-netflix",
      from: "Netflix <info@account.netflix.com>",
      subject: "Pembayaran Netflix kamu berhasil",
      date: ago(d(15), 8),
      body: "Terima kasih! Pembayaran langganan Premium kamu berhasil.\nJumlah: Rp 186.000",
    },
    {
      id: "demo-gofood",
      from: "Gojek <no-reply@gojek.com>",
      subject: "Your GoFood receipt",
      date: ago(d(14), 13),
      body: "GoFood order completed\nToko: Bakmi GM - Kemang\nTotal pembayaran Rp 87.500",
    },
    {
      id: "demo-grab",
      from: "Grab <no-reply@grab.com>",
      subject: "Your GrabCar E-Receipt",
      date: ago(d(12), 18),
      body: "Thanks for riding with Grab!\nTotal Paid IDR 42,000",
    },
    {
      id: "demo-steam",
      from: "Steam <noreply@steampowered.com>",
      subject: "Thank you for your Steam purchase!",
      date: ago(d(11), 22),
      body: "Item: ELDEN RING NIGHTREIGN\nTotal: Rp 399 999",
    },
    {
      id: "demo-toped",
      from: "Tokopedia <noreply@tokopedia.com>",
      subject: "Pembayaran Berhasil - Invoice INV/2026/001",
      date: ago(d(10), 11),
      body: "Pembayaran untuk pesananmu sudah kami terima\nProduk: Kaos Polos Uniqlo\nTotal Tagihan Rp 199.000",
    },
    {
      id: "demo-pln",
      from: "PLN Mobile <noreply@pln.co.id>",
      subject: "Struk Pembelian Token Listrik",
      date: ago(d(8), 10),
      body: "Pembelian token listrik berhasil\nNominal : Rp 200.000\nTotal Bayar : Rp 202.500",
    },
    bca("demo-cgv", d(6), "CGV GRAND INDONESIA", "150.000"),
    {
      id: "demo-apple-2",
      from: "Apple <no_reply@email.apple.com>",
      subject: "Your receipt from Apple.",
      date: ago(d(4), 23),
      body: "Receipt\nGenshin Impact\nIn-App Purchase\nBlessing of the Welkin Moon\nTOTAL Rp 79.000",
    },
    bca("demo-trf", d(3), "TRANSFER KE BUDI SANTOSO", "250.000", "Transfer BI-FAST"),
    {
      id: "demo-spotify",
      from: "Spotify <no-reply@spotify.com>",
      subject: "Your Spotify Premium receipt",
      date: ago(d(2), 7),
      body: "Spotify Premium Individual\nTotal IDR 54,990.00",
    },
    bca("demo-kopi", d(1), "KOPI KENANGAN", "28.000"),
  ];
}

const LIVE_POOL: Omit<EmailMessage, "id" | "date">[] = [
  { from: "Steam <noreply@steampowered.com>", subject: "Thank you for your Steam purchase!", body: "Item: Hollow Knight: Silksong\nTotal: Rp 189.999" },
  { from: "Apple <no_reply@email.apple.com>", subject: "Your receipt from Apple.", body: "Mobile Legends: Bang Bang\nIn-App Purchase\n706 Diamonds\nTOTAL Rp 179.000" },
  { from: "BCA <bca@bca.co.id>", subject: "Notifikasi Transaksi BCA", body: "Transaksi Berhasil\nNama Merchant : XXI PLAZA SENAYAN\nNominal : Rp 110.000,00" },
  { from: "Gojek <no-reply@gojek.com>", subject: "Your GoRide receipt", body: "GoRide trip completed\nTotal pembayaran Rp 18.000" },
  { from: "BCA <bca@bca.co.id>", subject: "Notifikasi Transaksi BCA", body: "Transaksi Berhasil\nNama Merchant : INDOMARET KEMANG\nNominal : Rp 64.300,00" },
  { from: "Disney+ Hotstar <noreply@disneyplus.com>", subject: "Pembayaran langganan berhasil", body: "Disney+ Hotstar Premium\nTotal Rp 79.000" },
  { from: "BCA <bca@bca.co.id>", subject: "Notifikasi Transaksi BCA", body: "Transaksi Berhasil\nNama Merchant : HAPPY PUPPY KARAOKE\nNominal : Rp 320.000,00" },
];

/** One fake "just arrived" email for the live demo. */
export function randomLiveEmail(): EmailMessage {
  const pick = LIVE_POOL[Math.floor(Math.random() * LIVE_POOL.length)];
  return { ...pick, id: `live-${Date.now()}`, date: new Date().toISOString() };
}
