export type Category =
  | "Makanan"
  | "Transportasi"
  | "Belanja"
  | "Hiburan"
  | "Tagihan"
  | "Kesehatan"
  | "Transfer"
  | "Pemasukan"
  | "Lainnya";

export const CATEGORIES: Category[] = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Transfer",
  "Pemasukan",
  "Lainnya",
];

export const CATEGORY_META: Record<Category, { emoji: string; color: string }> = {
  Makanan: { emoji: "🍜", color: "#ff9f43" },
  Transportasi: { emoji: "🛵", color: "#2e86de" },
  Belanja: { emoji: "🛍️", color: "#a55eea" },
  Hiburan: { emoji: "🎮", color: "#ee5253" },
  Tagihan: { emoji: "🧾", color: "#10ac84" },
  Kesehatan: { emoji: "💊", color: "#48dbfb" },
  Transfer: { emoji: "🔁", color: "#8395a7" },
  Pemasukan: { emoji: "💰", color: "#1dd1a1" },
  Lainnya: { emoji: "📦", color: "#c8d6e5" },
};

export interface Bank {
  id: string;
  name: string;
  /** Balance the user typed in when they added this bank. */
  initialBalance: number;
  /** ISO time the initial balance was set; only emails after this count. */
  setAt: string;
  color: string;
}

export type Direction = "out" | "in";

export interface Transaction {
  id: string;
  /** Gmail message id, if it came from an email. */
  messageId?: string;
  date: string;
  amount: number;
  direction: Direction;
  merchant: string;
  category: Category;
  bankId: string | null;
  /** Which parser / sender produced it, e.g. "BCA", "Apple". */
  source: string;
  /** True when the user set the category by hand. */
  manualCategory?: boolean;
  /** Merged-away duplicates (e.g. an Apple receipt matched to a BCA notification). */
  mergedFrom?: string[];
  note?: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
}

export interface Settings {
  hiburanBudget: number;
  /** Which bank pays for charges from a merchant-only source (Apple, Gojek, …). */
  sourceBank: Record<string, string>;
  /** Merchant name (lowercase) → category the user chose. */
  merchantCategory: Record<string, Category>;
  pollSeconds: number;
}

export interface AppState {
  onboarded: boolean;
  userName: string;
  banks: Bank[];
  transactions: Transaction[];
  seenMessageIds: string[];
  lastSyncAt: string | null;
  settings: Settings;
}
