import type { Bank } from "../types";

export interface AccountSource {
  /** Matches the account name the user picked ("BCA", "GoPay"…). */
  name: RegExp;
  /** Email domains this bank / e-wallet sends transaction notices from. */
  domains: string[];
  kind: "bank" | "ewallet";
}

/** Known banks and e-wallets and the domains their transaction emails come from. */
export const ACCOUNT_SOURCES: AccountSource[] = [
  { name: /^bca$/i, domains: ["bca.co.id", "klikbca.com"], kind: "bank" },
  { name: /^blu/i, domains: ["blubybcadigital.id", "bcadigital.co.id"], kind: "bank" },
  { name: /mandiri/i, domains: ["bankmandiri.co.id"], kind: "bank" },
  { name: /^bni$/i, domains: ["bni.co.id"], kind: "bank" },
  { name: /^bri$/i, domains: ["bri.co.id"], kind: "bank" },
  { name: /cimb/i, domains: ["cimbniaga.co.id", "cimbniaga.com"], kind: "bank" },
  { name: /jago/i, domains: ["jago.com"], kind: "bank" },
  { name: /seabank/i, domains: ["seabank.co.id"], kind: "bank" },
  { name: /jenius/i, domains: ["jenius.com", "btpn.com"], kind: "bank" },
  { name: /permata/i, domains: ["permatabank.co.id", "permatabank.com"], kind: "bank" },
  { name: /ocbc/i, domains: ["ocbc.id", "ocbcnisp.com"], kind: "bank" },
  { name: /gopay/i, domains: ["gojek.com", "gopay.co.id"], kind: "ewallet" },
  { name: /^ovo$/i, domains: ["ovo.id"], kind: "ewallet" },
  { name: /^dana$/i, domains: ["dana.id"], kind: "ewallet" },
  { name: /shopeepay/i, domains: ["shopee.co.id", "shopeepay.co.id"], kind: "ewallet" },
  { name: /linkaja/i, domains: ["linkaja.id"], kind: "ewallet" },
];

export function sourceForAccount(bank: Pick<Bank, "name">): AccountSource | null {
  return ACCOUNT_SOURCES.find((s) => s.name.test(bank.name.trim())) ?? null;
}

/** Sender domains read for an account. Unknown (custom) accounts match on their name. */
export function accountDomains(bank: Pick<Bank, "name">): string[] {
  return sourceForAccount(bank)?.domains ?? [];
}

const senderAddress = (from: string) => (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();

/** Which of the user's accounts an email belongs to, by its sender. */
export function accountForSender<B extends Pick<Bank, "name">>(banks: B[], from: string): B | null {
  const addr = senderAddress(from);
  const domain = addr.split("@")[1] ?? addr;
  for (const b of banks) {
    if (accountDomains(b).some((d) => domain === d || domain.endsWith(`.${d}`))) return b;
  }
  // Custom accounts: the name has to appear in the sender (e.g. "Bank Neo" → neobank).
  const lowerFrom = from.toLowerCase();
  for (const b of banks) {
    if (sourceForAccount(b)) continue;
    const key = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key.length >= 3 && lowerFrom.replace(/[^a-z0-9@.]/g, "").includes(key)) return b;
  }
  return null;
}

export function isEwallet(bank: Pick<Bank, "name"> | null): boolean {
  return !!bank && sourceForAccount(bank)?.kind === "ewallet";
}

/** Gmail search that only returns mail from the user's own banks / e-wallets. */
export function gmailQueryForAccounts(banks: Pick<Bank, "name">[], afterEpochSec: number): string | null {
  const terms = new Set<string>();
  for (const b of banks) {
    const domains = accountDomains(b);
    if (domains.length) domains.forEach((d) => terms.add(`from:${d}`));
    else if (b.name.trim().length >= 3) terms.add(`from:"${b.name.trim().replace(/"/g, "")}"`);
  }
  if (!terms.size) return null;
  return `after:${afterEpochSec} {${[...terms].join(" ")}}`;
}
