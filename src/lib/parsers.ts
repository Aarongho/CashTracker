import type { Category, Direction, EmailMessage } from "../types";
import { parseAmount } from "./money";

export interface SourceDef {
  name: string;
  /** Sender address/domain patterns. */
  from: RegExp;
  /** Bank / e-wallet emails move money in an account the user owns. */
  kind: "bank" | "merchant";
  /** Category used when nothing more specific is found. */
  hint?: Category;
  /** Optional extra check on the subject (e.g. Google Play vs. other Google mail). */
  subject?: RegExp;
}

export const SOURCES: SourceDef[] = [
  // Banks & e-wallets
  { name: "BCA", from: /bca\.co\.id|klikbca|bcadigital|blu\.co\.id/i, kind: "bank" },
  { name: "Mandiri", from: /bankmandiri\.co\.id|livin/i, kind: "bank" },
  { name: "BNI", from: /bni\.co\.id/i, kind: "bank" },
  { name: "BRI", from: /bri\.co\.id/i, kind: "bank" },
  { name: "CIMB Niaga", from: /cimbniaga\.co\.id|cimb/i, kind: "bank" },
  { name: "Jago", from: /jago\.com/i, kind: "bank" },
  { name: "SeaBank", from: /seabank/i, kind: "bank" },
  { name: "Jenius", from: /jenius|btpn/i, kind: "bank" },
  { name: "Permata", from: /permatabank/i, kind: "bank" },
  { name: "OCBC", from: /ocbc/i, kind: "bank" },
  { name: "OVO", from: /ovo\.id/i, kind: "bank" },
  { name: "DANA", from: /dana\.id/i, kind: "bank" },
  // Merchants
  { name: "Apple", from: /apple\.com/i, kind: "merchant", hint: "Hiburan" },
  { name: "Google Play", from: /google\.com/i, subject: /google play|pesanan google|order receipt/i, kind: "merchant", hint: "Hiburan" },
  { name: "Netflix", from: /netflix\.com/i, kind: "merchant", hint: "Hiburan" },
  { name: "Spotify", from: /spotify\.com/i, kind: "merchant", hint: "Hiburan" },
  { name: "Disney+", from: /disneyplus|hotstar/i, kind: "merchant", hint: "Hiburan" },
  { name: "Steam", from: /steampowered\.com/i, kind: "merchant", hint: "Hiburan" },
  { name: "PlayStation", from: /playstation/i, kind: "merchant", hint: "Hiburan" },
  { name: "Vidio", from: /vidio\.com/i, kind: "merchant", hint: "Hiburan" },
  { name: "Gojek", from: /gojek\.com|gopay/i, kind: "merchant", hint: "Transportasi" },
  { name: "Grab", from: /grab\.com/i, kind: "merchant", hint: "Transportasi" },
  { name: "Tokopedia", from: /tokopedia/i, kind: "merchant", hint: "Belanja" },
  { name: "Shopee", from: /shopee/i, kind: "merchant", hint: "Belanja" },
  { name: "Lazada", from: /lazada/i, kind: "merchant", hint: "Belanja" },
  { name: "Blibli", from: /blibli/i, kind: "merchant", hint: "Belanja" },
  { name: "Traveloka", from: /traveloka/i, kind: "merchant", hint: "Transportasi" },
  { name: "tiket.com", from: /tiket\.com/i, kind: "merchant", hint: "Transportasi" },
  { name: "PLN", from: /pln\.co\.id/i, kind: "merchant", hint: "Tagihan" },
  { name: "Telkomsel", from: /telkomsel/i, kind: "merchant", hint: "Tagihan" },
  { name: "IndiHome", from: /indihome|telkom\.co\.id/i, kind: "merchant", hint: "Tagihan" },
  { name: "Halodoc", from: /halodoc/i, kind: "merchant", hint: "Kesehatan" },
];

/** Gmail search that pulls only mail from known senders or receipt-looking subjects. */
export function gmailQuery(afterEpochSec: number): string {
  const domains = [
    "bca.co.id", "klikbca.com", "bankmandiri.co.id", "bni.co.id", "bri.co.id", "cimbniaga.co.id",
    "jago.com", "seabank.co.id", "jenius.com", "permatabank.co.id", "ocbc.id", "ovo.id", "dana.id",
    "apple.com", "netflix.com", "spotify.com", "disneyplus.com", "steampowered.com",
    "playstation.com", "vidio.com", "gojek.com", "grab.com", "tokopedia.com", "shopee.co.id",
    "lazada.co.id", "blibli.com", "traveloka.com", "tiket.com", "pln.co.id", "telkomsel.com",
    "halodoc.com",
  ];
  const subjects = ["receipt", "struk", "transaksi", "invoice", "pembayaran", "payment", "tagihan", "billing", "pembelian", "purchase", "order"];
  return `after:${afterEpochSec} {${domains.map((d) => `from:${d}`).join(" ")} ${subjects.map((s) => `subject:${s}`).join(" ")}}`;
}

export interface ParsedTx {
  messageId: string;
  /** For transfers: the person/account the money went to. */
  recipient?: string;
  subject?: string;
  date: string;
  amount: number;
  direction: Direction;
  merchant: string;
  source: string;
  sourceKind: "bank" | "merchant";
  hint: Category | null;
  body: string;
}

const SKIP = /\b(otp|kode verifikasi|verification code|one[- ]time|e-?statement|lembar tagihan|billing statement|password|kata sandi)\b/i;
const INCOMING = /(dana masuk|uang masuk|transfer masuk|incoming transfer|you('ve)? received|telah menerima|diterima dari|refund|pengembalian dana|cashback diterima|kredit ke rekening|credited)/i;

/** Subjects that on their own say "this is a receipt / transaction notice". */
const STRONG_SUBJECT = /(receipt|struk|bukti (bayar|pembayaran|transfer|transaksi)|invoice|faktur|notifikasi transaksi|transaction (alert|notification|journal)|transaksi (berhasil|sukses|kartu)|pembayaran (berhasil|sukses|diterima)|payment (successful|received|confirmation)|top ?up berhasil|transfer (berhasil|sukses|masuk)|dana masuk|uang masuk|tagihan|your order|pesanan (kamu|anda)|purchase confirmation|terima kasih atas pembelian|thank you for your .*purchase)/i;
/** Weaker transaction words; need structured fields in the body too. */
const TX_SUBJECT = /(transaksi|transaction|pembayaran|payment|pembelian|purchase|pesanan|order|top ?up|transfer|langganan|subscription|berhasil|successful)/i;
/** Marketing language. */
const PROMO = /(promo|diskon|discount|voucher|kupon|coupon|cashback|hemat|gratis|free ongkir|hadiah|undian|giveaway|event|webinar|seminar|festival|daftar sekarang|ikuti|jangan lewatkan|flash sale|spesial|special offer|penawaran|newsletter|mulai dari|s\.d\.|hingga \d|up to|syarat (dan|&) ketentuan|s&k|t&c|\b(yuk|ayo)\b)/i;
const UNSUBSCRIBE = /(unsubscribe|berhenti berlangganan|stop receiving|manage (your )?(email )?preferences|kelola preferensi)/i;
/** "Label : value" lines that real receipts and bank notices have. */
const FIELD_LABELS = /^\s*(nominal|total( bayar| pembayaran| payment| tagihan| paid)?|grand total|jumlah( transaksi| pembayaran)?|amount|no\.? ?ref(erensi)?|reference( no\.?| number)?|id transaksi|transaction (id|type|date)|order (id|no\.?)|no\.? ?pesanan|no\.? ?invoice|invoice (no\.?|number)|merchant|nama merchant|company\/product|status( transaksi)?|tanggal( transaksi)?|waktu( transaksi)?|metode pembayaran|payment method|sumber dana|rekening tujuan|nama penerima|penerima|beneficiary( name)?|jenis transaksi)\s*[:\-]/gim;

/** Smallest amount we treat as a real payment; promos often yield "Rp10" from "Rp10 rb". */
const MIN_AMOUNT = 500;

const AMOUNT_RE = /(?:IDR|Rp\.?)\s?(\d{1,3}(?:[., \u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?!\d)(\s?(?:rb|ribu|k|jt|juta|m|miliar|milyar)\b)?/gi;
const AMOUNT_KEY = /(grand total|total pembayaran|total payment|total bayar|total tagihan|total|nominal|jumlah|amount|sebesar|harga|price|charged)/i;

export function extractAmount(text: string): number | null {
  let best: { value: number; score: number } | null = null;
  for (const line of text.split(/\n/)) {
    for (const m of line.matchAll(AMOUNT_RE)) {
      // "Rp10 rb", "Rp 5 juta": marketing shorthand, never how receipts state totals.
      if (m[2]) continue;
      const value = parseAmount(m[1]);
      if (!value || value <= 0) continue;
      const key = line.match(AMOUNT_KEY)?.[1]?.toLowerCase() ?? "";
      // Totals beat nominal, nominal beats a bare number; larger wins ties.
      const score = key.startsWith("grand") || key.startsWith("total") ? 3 : key ? 2 : 1;
      if (!best || score > best.score || (score === best.score && value > best.value)) {
        best = { value, score };
      }
    }
  }
  return best?.value ?? null;
}

const MERCHANT_RE =
  /^\s*(?:nama merchant|merchant(?: name)?|nama toko|toko|payment to|pembayaran ke|bayar ke|dibayar ke|penerima|nama penerima|tujuan|keterangan|description|deskripsi|item|layanan|produk|to|ke|di|at)\s*[:\-]\s*(.+)$/im;

const APPLE_ITEMS =
  /(Apple Music|Apple TV\+?|Apple Arcade|Apple One|iCloud\+?[^\n]{0,20}|Apple Fitness\+?|Apple News\+?)/i;

function clean(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[*_|]/g, "").trim().slice(0, 60);
}

export function extractMerchant(text: string, subject: string, src: SourceDef | null): string {
  if (src?.name === "Apple") {
    const item = text.match(APPLE_ITEMS)?.[1] ?? subject.match(APPLE_ITEMS)?.[1];
    if (item) return clean(item);
    const app = text.match(/^\s*(.+?)\s*\n\s*(?:In-App Purchase|Pembelian Dalam App|App|Aplikasi)\b/im)?.[1];
    return app ? `Apple · ${clean(app)}` : "Apple";
  }
  if (src?.name === "Gojek") {
    if (/gofood/i.test(text + subject)) {
      const resto = text.match(MERCHANT_RE)?.[1];
      return resto ? `GoFood · ${clean(resto)}` : "GoFood";
    }
    if (/gocar/i.test(text + subject)) return "GoCar";
    if (/goride/i.test(text + subject)) return "GoRide";
    if (/gomart/i.test(text + subject)) return "GoMart";
  }
  if (src?.name === "Grab") {
    if (/grabfood|food/i.test(subject)) return "GrabFood";
    if (/grabcar|car/i.test(subject)) return "GrabCar";
    if (/grabbike|bike/i.test(subject)) return "GrabBike";
  }
  const m = text.match(MERCHANT_RE)?.[1];
  if (m && !/^(rp|idr)\b/i.test(m.trim())) return clean(m);
  if (src?.kind === "merchant") return src.name;
  return clean(subject) || src?.name || "Transaksi";
}

export function detectSource(from: string, subject: string): SourceDef | null {
  return SOURCES.find((s) => s.from.test(from) && (!s.subject || s.subject.test(subject))) ?? null;
}

/** Best-effort crude HTML → text so parsers see line structure. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d|table)>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n");
}

const RECIPIENT_RE =
  /^\s*(?:nama penerima|penerima|nama tujuan|rekening tujuan|tujuan|beneficiary(?: name)?|recipient(?: name)?|transfer ke|ke|to)\s*[:\-]\s*(.+)$/im;

/** Person or account a transfer went to, e.g. "BUDI SANTOSO" from "Nama Penerima : BUDI SANTOSO". */
export function extractRecipient(text: string): string | null {
  const m = text.match(RECIPIENT_RE)?.[1];
  if (!m) return null;
  // Drop account numbers and bank codes around the name: "0123456789 - BUDI SANTOSO (BCA)".
  const name = m
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(?:rek(?:ening)?|acc(?:ount)?|no\.?)\b\.?/gi, " ")
    .replace(/[\d*xX]{4,}/g, " ")
    .replace(/[-–|/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name.length >= 2 && /[a-z]/i.test(name) && !/^(rp|idr)\b/i.test(name) ? name.slice(0, 50) : null;
}

/** Why an email is (not) treated as a transaction; exported for tests and debugging. */
export function transactionSignals(msg: Pick<EmailMessage, "subject" | "body">) {
  const labels = new Set([...msg.body.matchAll(FIELD_LABELS)].map((m) => m[1].toLowerCase())).size;
  return {
    strongSubject: STRONG_SUBJECT.test(msg.subject),
    txSubject: TX_SUBJECT.test(msg.subject),
    promoSubject: PROMO.test(msg.subject) || /\?\s*\S{0,3}\s*$/.test(msg.subject),
    promoBody: (msg.body.match(new RegExp(PROMO.source, "gi")) ?? []).length,
    unsubscribe: UNSUBSCRIBE.test(msg.body),
    labels,
  };
}

function looksLikeTransaction(msg: EmailMessage): boolean {
  const s = transactionSignals(msg);
  // Marketing subject ("Mau belanja lebih hemat?", "Flash Sale…") without a receipt-style subject.
  if (s.promoSubject && !s.strongSubject) return false;
  // Newsletter-style body: unsubscribe link or lots of promo words, and few receipt fields.
  if ((s.unsubscribe || s.promoBody >= 3) && s.labels < 2 && !s.strongSubject) return false;
  if (s.strongSubject) return true;
  if (s.txSubject && s.labels >= 1) return true;
  return s.labels >= 2;
}

export function parseEmail(msg: EmailMessage): ParsedTx | null {
  const text = `${msg.subject}\n${msg.body}`;
  if (SKIP.test(text)) return null;
  if (!looksLikeTransaction(msg)) return null;

  const src = detectSource(msg.from, msg.subject);
  const amount = extractAmount(msg.body) ?? extractAmount(msg.subject);
  if (!amount || amount < MIN_AMOUNT) return null;

  // "Kartu kredit" / "credit card" talk about the card type, not money coming in.
  const dirText = text.replace(/kartu kredit|credit card|kredit card/gi, "");
  const direction: Direction = INCOMING.test(dirText) ? "in" : "out";

  const isTransfer = /\btransfer\b|bi-?fast|\brtol\b|\bskn\b|kirim uang|send money/i.test(text);
  const recipient = direction === "out" && isTransfer ? extractRecipient(msg.body) : null;
  const sender = direction === "in" ? extractSender(msg.body) : null;

  const senderName = msg.from.replace(/<.*>/, "").replace(/"/g, "").trim();
  return {
    messageId: msg.id,
    date: msg.date,
    amount,
    direction,
    merchant: recipient ? `Transfer ke ${recipient}` : sender ? `Dari ${sender}` : extractMerchant(msg.body, msg.subject, src),
    recipient: recipient ?? undefined,
    subject: msg.subject.slice(0, 120),
    source: src?.name ?? (senderName || "Email"),
    sourceKind: src?.kind ?? "merchant",
    hint: direction === "in" ? "Pemasukan" : recipient ? "Transfer" : src?.hint ?? null,
    body: msg.body,
  };
}

const SENDER_RE = /^\s*(?:dari|pengirim|nama pengirim|from|sender(?: name)?)\s*[:\-]\s*(.+)$/im;

/** Who sent money in, e.g. "PT MAJU JAYA" from "Dari : PT MAJU JAYA". */
function extractSender(text: string): string | null {
  const m = text.match(SENDER_RE)?.[1];
  if (!m) return null;
  const name = m.replace(/\(.*?\)/g, " ").replace(/[\d*xX]{4,}/g, " ").replace(/[-–|/]+/g, " ").replace(/\s+/g, " ").trim();
  return name.length >= 2 && /[a-z]/i.test(name) ? name.slice(0, 50) : null;
}
