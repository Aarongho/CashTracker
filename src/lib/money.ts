/**
 * Parse an amount written the Indonesian way ("1.250.000,00", "Rp150.000")
 * or the English way ("1,250,000.00", "IDR 49,000"). Returns whole rupiah.
 */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, "").replace(/[.,]+$/, "");
  if (!/\d/.test(s)) return null;
  const lastSep = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  if (lastSep === -1) return Number(s);
  const tail = s.slice(lastSep + 1);
  const head = s.slice(0, lastSep).replace(/[.,]/g, "");
  // Two (or one) digits after the last separator → it's a decimal separator.
  if (tail.length <= 2) return Math.round(Number(`${head}.${tail}`));
  return Number(head + tail);
}

const idr = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatIDR(n: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign ? (n > 0 ? "+" : n < 0 ? "−" : "") : n < 0 ? "−" : "";
  return `${sign}Rp${idr.format(Math.abs(Math.round(n)))}`;
}

/** "Rp1,2 jt" style short form for tight spaces. */
export function formatShort(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e9) return `${sign}Rp${(a / 1e9).toFixed(1).replace(".", ",")} M`;
  if (a >= 1e6) return `${sign}Rp${(a / 1e6).toFixed(1).replace(".", ",")} jt`;
  if (a >= 1e3) return `${sign}Rp${Math.round(a / 1e3)} rb`;
  return `${sign}Rp${Math.round(a)}`;
}

/** Keeps only digits, for the balance inputs ("1.500.000" → 1500000). */
export function digitsToNumber(s: string): number {
  const d = s.replace(/\D/g, "");
  return d ? Number(d) : 0;
}
