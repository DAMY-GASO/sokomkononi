const fs = require("fs");
const path = require("path");

const re = /((?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+))(["'])([^"'\r\n]*\\[^"'\r\n]*)\2/g;

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(f.name)) fix(p);
  }
}

function fix(file) {
  const src = fs.readFileSync(file, "utf8");
  const out = src.replace(re, (m, pre, q, p) => `${pre}${q}${p.replace(/\\/g, "/")}${q}`);
  if (out !== src) {
    fs.writeFileSync(file, out, "utf8");
    console.log("fixed:", file);
  }
}

walk("src");