#!/usr/bin/env python3
"""Ondoa emoji zote kwenye src/ ya SokoMkononi.
Matumizi:  python3 strip_emoji.py <njia ya src>      (inabadilisha faili mahali pake)
- Maonyo/lebo zinazoonekana kwa mtumiaji: emoji inaondolewa au inabadilishwa kuwa icon ya lucide.
- Maoni ya msimbo (// ✅ FIX ...): emoji inaondolewa.
- Alama za kawaida (→ ← ↑ ↓ ↔ ▲ ▼ ★ ☆ ✓) HAZIGUSWI: si emoji.
Ni idempotent: kuiendesha tena haibadilishi kitu."""
import re, sys, os, glob
EMO = "[\U0001F000-\U0001FAFF☀-➿⬀-⯿⌀-⏿✅❌✨]"
KEEP = set("✓★☆")
ICON = 'className="inline -mt-0.5 mr-1"'
SPEC = {
 "context/AttributionContext.jsx": [(' ✨"', '"')],
 "context/LanguageContext.jsx": [('"⬇ Pakua', '"Pakua'), ('"⬇ Download', '"Download')],
 "pages/AdminLoginPage.jsx": [('🔒 {t("admin_secure_access")}', '<Lock size={12} %s />{t("admin_secure_access")}' % ICON)],
 "pages/AllListingsPage.jsx": [('`📍 ${', '`${')],
 "pages/dashboard/admin/components/SystemSettings/CategoryForm.jsx": [
    ('⚠️ Baada', '<AlertTriangle size={12} %s />Baada' % ICON), ('⚠️ After', '<AlertTriangle size={12} %s />After' % ICON)],
 "pages/dashboard/admin/sections/SupportSection.jsx": [('⏰ {t("SLA', '<Clock size={12} %s />{t("SLA' % ICON)],
 "pages/dashboard/admin/sections/TrashSection.jsx": [('"⚠️ ', '"')],
 "pages/dashboard/buyer/BuyerOverview.jsx": [(' 👋`', '`')],
 "pages/dashboard/seller/SellerOverview.jsx": [(' 👋`', '`')],
 "pages/dashboard/components/DealRooms.jsx": [('"📎 Picha"', '"Picha"'), ('"⚠️ Backend', '"Backend')],
 "pages/dashboard/components/PostPropertyForm.jsx": [('"🎉 ', '"')],
}
NEEDS_IMPORT = {"pages/AdminLoginPage.jsx": "Lock", "pages/dashboard/admin/components/SystemSettings/CategoryForm.jsx": "AlertTriangle"}
def add_icon_import(s, name):
    m = re.search(r'import\s*\{([^}]*)\}\s*from\s*"lucide-react";', s)
    if m:
        if re.search(r'\b%s\b' % name, m.group(1)): return s
        return s[:m.start(1)] + m.group(1).rstrip() + (", " if not m.group(1).rstrip().endswith(",") else " ") + name + " " + s[m.end(1):]
    ms = list(re.finditer(r'^import\b[\s\S]*?\bfrom\s+["\'][^"\']+["\'];?[ \t]*\r?\n', s, re.M))
    nl = "\r\n" if "\r\n" in s else "\n"
    return s[:ms[-1].end()] + 'import { %s } from "lucide-react";%s' % (name, nl) + s[ms[-1].end():]
def process(rel, s):
    for a, b in SPEC.get(rel, []): s = s.replace(a, b)
    if rel in NEEDS_IMPORT and "<%s " % NEEDS_IMPORT[rel] in s: s = add_icon_import(s, NEEDS_IMPORT[rel])
    s = re.sub(r"([0-9#*])\uFE0F?\u20E3", r"\1.", s)
    if rel == "config/FaqsData.js": s = re.sub("[\U0001F000-\U0001FAFF]️? ", "• ", s)
    return re.sub(r"(%s)️? ?" % EMO, lambda m: m.group(0) if m.group(1) in KEEP else "", s)
def main(root):
    n = 0
    for f in glob.glob(os.path.join(root, "**", "*.js*"), recursive=True):
        rel = os.path.relpath(f, root).replace(os.sep, "/")
        s = open(f, encoding="utf-8", newline="").read()
        o = process(rel, s)
        if o != s: open(f, "w", encoding="utf-8", newline="").write(o); n += 1; print("•", rel)
    print("faili zilizobadilishwa:", n)
if __name__ == "__main__": main(sys.argv[1])
