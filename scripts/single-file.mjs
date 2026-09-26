// Inlines the Vite build into one self-contained HTML body (for claude.ai artifact hosting).
// Usage: npm run build && node scripts/single-file.mjs out.html
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const assets = readdirSync("dist/assets");
const js = readFileSync(`dist/assets/${assets.find((f) => f.endsWith(".js"))}`, "utf8");
const css = readFileSync(`dist/assets/${assets.find((f) => f.endsWith(".css"))}`, "utf8");
const out = process.argv[2] ?? "cashtracker-single.html";

writeFileSync(
  out,
  `<title>CashTracker</title>
<meta name="theme-color" content="#ff4f93">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script>
`,
);
console.log(`wrote ${out}`);
