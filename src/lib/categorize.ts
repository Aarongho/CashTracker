import type { Category, Settings } from "../types";

/** Keyword → category rules. Short words are matched on word boundaries. */
const RULES: [Category, string[]][] = [
  [
    "Hiburan",
    [
      "netflix", "spotify", "disney", "hotstar", "youtube premium", "youtube music", "vidio",
      "prime video", "viu", "wetv", "iqiyi", "hbo", "steam", "playstation", "psn", "nintendo",
      "xbox", "epic games", "riot", "valorant", "genshin", "hoyoverse", "mobile legends",
      "moonton", "codashop", "unipin", "garena", "roblox", "apple music", "apple tv",
      "apple arcade", "game", "games", "cgv", "xxi", "cinepolis", "bioskop", "cinema",
      "karaoke", "inul vizta", "happy puppy", "konser", "concert", "loket", "twitch",
      "joox", "timezone", "bar", "club", "holywings", "nonton", "tiket konser",
      "apple.com", "itunes", "app store", "google play", "googleplay",
    ],
  ],
  [
    "Makanan",
    [
      "gofood", "grabfood", "shopeefood", "food", "resto", "restaurant", "restoran", "cafe",
      "kafe", "kopi", "coffee", "starbucks", "mcdonald", "mcd", "kfc", "burger", "pizza",
      "hokben", "sushi", "ramen", "bakso", "mie", "martabak", "warung", "warteg", "chatime",
      "janji jiwa", "kenangan", "fore coffee", "point coffee", "richeese", "solaria",
      "bakery", "bread", "dimsum", "boba", "mixue", "es teh",
    ],
  ],
  [
    "Transportasi",
    [
      "goride", "gocar", "grabbike", "grabcar", "grab ride", "gojek ride", "bluebird", "taxi",
      "taksi", "krl", "mrt", "lrt", "transjakarta", "commuter", "kai", "whoosh", "tol",
      "e-toll", "etoll", "flazz", "bensin", "pertamina", "shell", "bp akr", "parkir",
      "parking", "garuda", "citilink", "lion air", "airasia", "batik air", "pesawat", "maxim",
    ],
  ],
  [
    "Tagihan",
    [
      "pln", "listrik", "token listrik", "pdam", "telkomsel", "xl", "axis", "indosat", "im3",
      "tri", "smartfren", "by.u", "indihome", "biznet", "first media", "myrepublic", "bpjs",
      "icloud", "google one", "google storage", "asuransi", "insurance", "cicilan", "kpr",
      "pulsa", "paket data", "internet", "wifi", "iuran", "tagihan", "chatgpt", "openai",
      "claude", "anthropic", "microsoft 365", "canva", "notion",
    ],
  ],
  [
    "Kesehatan",
    [
      "apotek", "apotik", "kimia farma", "k24", "guardian", "watsons", "halodoc", "alodokter",
      "rumah sakit", "hospital", "klinik", "clinic", "dokter", "century", "lab", "prodia",
      "gym", "fitness",
    ],
  ],
  [
    "Belanja",
    [
      "tokopedia", "shopee", "lazada", "blibli", "zalora", "tiktok shop", "uniqlo", "h&m",
      "zara", "indomaret", "alfamart", "alfamidi", "superindo", "hypermart", "transmart",
      "lotte mart", "supermarket", "ikea", "ace hardware", "informa", "miniso", "amazon",
      "sociolla", "erafone", "ibox", "digimap",
    ],
  ],
  ["Transfer", ["transfer", "trf", "bi-fast", "bifast", "ke rekening", "top up", "topup"]],
];

const compiled: [Category, RegExp][] = RULES.map(([cat, words]) => [
  cat,
  new RegExp(
    words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .map((w) => (w.length <= 4 ? `\\b${w}\\b` : w))
      .join("|"),
    "i",
  ),
]);

export function categorizeText(text: string): Category | null {
  for (const [cat, re] of compiled) if (re.test(text)) return cat;
  return null;
}

export function categorize(
  merchant: string,
  hint: Category | null,
  body: string,
  settings: Pick<Settings, "merchantCategory">,
): Category {
  const override = settings.merchantCategory[merchant.trim().toLowerCase()];
  if (override) return override;
  return categorizeText(merchant) ?? hint ?? categorizeText(body) ?? "Lainnya";
}
