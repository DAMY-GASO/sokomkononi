// ============================================================
// scripts/theme-audit.mjs   —   endesha:  node scripts/theme-audit.mjs [src]
// Inapima kila faili: ni rangi/styles ngapi ZIMEANDIKWA MOJA KWA MOJA
// badala ya kutumia tokens (Tailwind classes kama bg-card, text-primary,
// border-hairline, .btn, .card, .alert). Inaorodhesha faili za kurekebisha
// KWANZA (alama kubwa = kazi nyingi zaidi).
// ============================================================
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || "src";
const EXT = new Set([".jsx", ".js", ".tsx", ".ts"]);
const SKIP = new Set(["node_modules", "dist", "build", ".git"]);

const CHECKS = [
  { key: "hex",      re: /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g,                 w: 1, hint: "hex iliyoandikwa" },
  { key: "rgba",     re: /rgba?\(\s*\d/g,                                        w: 1, hint: "rgb/rgba ya moja kwa moja" },
  { key: "COLORS",   re: /COLORS\.[A-Za-z]+/g,                                   w: 1, hint: "COLORS.* (si theme-aware)" },
  { key: "inline",   re: /style=\{\{/g,                                          w: 1, hint: "inline style" },
  // bg-white (imara au /50–/95) na gray/slate/neutral/stone. text-white na border-white
  // HAZIHESABIWI: kwenye header/footer/hero za navy ni matumizi sahihi.
  { key: "legacy",   re: /\bbg-white(?:\/(?:50|60|70|80|90|95))?(?![\w\/-])|\b(?:bg|text|border|divide)-(?:gray|slate|neutral|stone)-\d{2,3}\b/g, w: 1, hint: "Tailwind ya zamani (bg-white, *-gray-*)" },
  { key: "arbitrary",re: /\[(?:#|rgb)[^\]]*\]/g,                                 w: 1, hint: "bg-[#...] / text-[#...]" },
  { key: "gradient", re: /linear-gradient|radial-gradient|bg-gradient-/g,        w: 1, hint: "gradient" },
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.has(path.extname(e.name))) yield p;
  }
}

const rows = [];
const totals = Object.fromEntries(CHECKS.map((c) => [c.key, 0]));
for (const file of walk(root)) {
  const src = fs.readFileSync(file, "utf8");
  const counts = {};
  let score = 0;
  for (const c of CHECKS) {
    const n = (src.match(c.re) || []).length;
    counts[c.key] = n;
    totals[c.key] += n;
    score += n * c.w;
  }
  if (score > 0) rows.push({ file: path.relative(root, file), score, counts, lines: src.split("\n").length });
}

rows.sort((a, b) => b.score - a.score);
const pad = (s, n) => String(s).padEnd(n);
console.log("\nTHEME AUDIT —", root, "\n");
console.log(pad("FILE", 52), pad("SCORE", 7), CHECKS.map((c) => pad(c.key, 9)).join(""));
for (const r of rows.slice(0, 25)) {
  console.log(pad(r.file.slice(-50), 52), pad(r.score, 7), CHECKS.map((c) => pad(r.counts[c.key], 9)).join(""));
}
console.log("\nJUMLA:", CHECKS.map((c) => `${c.key}=${totals[c.key]}`).join("  "));
console.log("\nMaana ya kila safu:");
for (const c of CHECKS) console.log(`  ${pad(c.key, 10)} ${c.hint}`);
console.log("\nJinsi ya kusoma: anza na faili 5 za juu. Badilisha hex/COLORS/inline kuwa tokens za Tailwind");
console.log("(bg-card, bg-page, text-primary, text-secondary, border-hairline, bg-gold, text-night) na .btn/.card/.alert.\n");
