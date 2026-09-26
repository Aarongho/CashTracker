import {
  siAirasia, siAirbnb, siAnthropic, siApple, siApplemusic, siAppletv, siBlibli, siBookingdotcom, siDiscord,
  siEpicgames, siFoodpanda, siGojek, siGoogleplay, siGrab, siHandm, siHbo, siIcloud, siIkea, siKfc,
  siMcdonalds, siNetflix, siNotion, siPaypal, siPlaystation, siRiotgames, siRoblox, siSamsung, siShell,
  siShopee, siSpotify, siStarbucks, siSteam, siTiktok, siTwitch, siUber, siUniqlo, siXiaomi, siYoutube,
  siYoutubemusic, siZara,
} from "simple-icons";

export interface Logo {
  path: string;
  /** Brand color used as the tile background. */
  bg: string;
}

type Icon = { path: string; hex: string };
const L = (i: Icon, bg?: string): Logo => ({ path: i.path, bg: bg ?? `#${i.hex}` });

/** Keyword → logo. Checked in order, so specific names come before generic ones. */
const RULES: [RegExp, Logo][] = [
  [/apple music/i, L(siApplemusic, "#fa243c")],
  [/apple tv/i, L(siAppletv, "#000000")],
  [/icloud/i, L(siIcloud, "#3693f3")],
  [/youtube music/i, L(siYoutubemusic)],
  [/youtube/i, L(siYoutube)],
  [/netflix/i, L(siNetflix, "#e50914")],
  [/spotify/i, L(siSpotify, "#1db954")],
  [/steam/i, L(siSteam, "#171a21")],
  [/playstation|\bpsn\b/i, L(siPlaystation)],
  [/google play/i, L(siGoogleplay, "#01875f")],
  [/shopee/i, L(siShopee)],
  [/gojek|gofood|goride|gocar|gomart|gopay/i, L(siGojek)],
  [/\bgrab/i, L(siGrab)],
  [/mcdonald|\bmcd\b/i, L(siMcdonalds, "#da291c")],
  [/\bkfc\b/i, L(siKfc)],
  [/starbucks/i, L(siStarbucks)],
  [/blibli/i, L(siBlibli)],
  [/uniqlo/i, L(siUniqlo)],
  [/\bhbo/i, L(siHbo, "#000000")],
  [/notion/i, L(siNotion, "#000000")],
  [/\bzara\b/i, L(siZara, "#000000")],
  [/h&m|\bhm\b/i, L(siHandm)],
  [/ikea/i, L(siIkea)],
  [/airasia/i, L(siAirasia)],
  [/\bshell\b/i, L(siShell, "#dd1d21")],
  [/tiktok/i, L(siTiktok, "#000000")],
  [/discord/i, L(siDiscord)],
  [/twitch/i, L(siTwitch)],
  [/epic games/i, L(siEpicgames, "#313131")],
  [/riot|valorant/i, L(siRiotgames)],
  [/roblox/i, L(siRoblox, "#000000")],
  [/claude|anthropic/i, L(siAnthropic, "#d97757")],
  [/xiaomi/i, L(siXiaomi)],
  [/samsung/i, L(siSamsung)],
  [/paypal/i, L(siPaypal)],
  [/foodpanda/i, L(siFoodpanda)],
  [/\buber\b/i, L(siUber, "#000000")],
  [/airbnb/i, L(siAirbnb)],
  [/booking\.com/i, L(siBookingdotcom)],
  [/apple|app store/i, L(siApple, "#000000")],
];

/** Find a brand logo for a merchant or email source, if we have one. */
export function logoFor(...names: (string | undefined)[]): Logo | null {
  for (const name of names) {
    if (!name) continue;
    for (const [re, logo] of RULES) if (re.test(name)) return logo;
  }
  return null;
}
