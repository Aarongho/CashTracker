import type { MonthStats } from "./ledger";

export type Mood = "happy" | "chill" | "worried" | "angry" | "furious";

const LINES: Record<Mood, string[]> = {
  happy: [
    "Hehe, dompetmu sehat banget hari ini! 🌱",
    "Mantap! Hiburan masih aman, aku bangga sama kamu 🥰",
    "Kobi senang~ uangnya dijaga baik-baik ya!",
  ],
  chill: [
    "Oke oke, masih santai. Tapi jangan kebablasan ya 👀",
    "Hiburan udah setengah budget nih. Pelan-pelan aja~",
    "Kobi lagi ngawasin kamu... dengan sayang 😌",
  ],
  worried: [
    "Eh eh... Hiburan udah hampir habis budgetnya 😰",
    "Kobi mulai deg-degan. Netflix-nya ditahan dulu ya?",
    "Serius nih mau top up game lagi? Mikir dulu dong 🥺",
  ],
  angry: [
    "HEH! Budget Hiburan udah JEBOL! 😤",
    "Kobi marah! Stop jajan hiburan bulan ini!!",
    "Aku ngambek. Uang hiburanmu udah lewat batas 😠",
  ],
  furious: [
    "KAMU INI YA!!! 🔥 Hiburan udah {pct}% dari budget!",
    "Kobi mau ngamuk!!! Cancel semua langganan SEKARANG 💢",
    "Tabunganmu nangis, Kobi juga NGAMUK 😡🔥",
  ],
};

export function computeMood(stats: MonthStats, budget: number, anyNegative: boolean): Mood {
  const ratio = budget > 0 ? stats.hiburan / budget : 0;
  const share = stats.spent > 0 ? stats.hiburan / stats.spent : 0;
  let mood: Mood =
    ratio >= 1.5 ? "furious" : ratio >= 1 ? "angry" : ratio >= 0.8 ? "worried" : ratio >= 0.5 ? "chill" : "happy";
  // Hiburan eating most of the spending is suspicious even under budget.
  if (share >= 0.5 && stats.hiburan > 0 && (mood === "happy" || mood === "chill")) mood = "worried";
  if (anyNegative && mood === "happy") mood = "worried";
  return mood;
}

export function moodLine(mood: Mood, stats: MonthStats, budget: number, seed = Date.now()): string {
  const lines = LINES[mood];
  const pct = budget > 0 ? Math.round((stats.hiburan / budget) * 100) : 0;
  return lines[Math.floor(seed / 15000) % lines.length].replace("{pct}", String(pct));
}
