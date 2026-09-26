/** Badge colors for each email source, so groups are recognizable at a glance. */
const COLORS: Record<string, string> = {
  BCA: "#0060af", Mandiri: "#003d79", BNI: "#f15a23", BRI: "#00529c", "CIMB Niaga": "#7a0019",
  Jago: "#f5a623", SeaBank: "#ff5c00", Jenius: "#00a9e0", Permata: "#1d9b48", OCBC: "#e2231a",
  OVO: "#4c2a86", DANA: "#118eea", Apple: "#1d1d1f", "Google Play": "#01875f", Netflix: "#e50914",
  Spotify: "#1db954", "Disney+": "#113ccf", Steam: "#1b2838", PlayStation: "#003791", Vidio: "#ee2a24",
  Gojek: "#00aa13", Grab: "#00b14f", Tokopedia: "#03ac0e", Shopee: "#ee4d2d", Lazada: "#0f146d",
  Blibli: "#0095da", Traveloka: "#1ba0e2", "tiket.com": "#0064d2", PLN: "#00a2e9", Telkomsel: "#e4002b",
  IndiHome: "#e42313", Halodoc: "#e0004d", Manual: "#868e96",
};

export function sourceColor(name: string): string {
  if (COLORS[name]) return COLORS[name];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
}

export function monogram(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

/** The email a transaction is "from": the receipt sender if merged, else its own source. */
export function emailSource(t: { source: string; mergedFrom?: string[] }): string {
  return t.mergedFrom?.[0] ?? t.source;
}
