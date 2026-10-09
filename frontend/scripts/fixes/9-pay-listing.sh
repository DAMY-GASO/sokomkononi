#!/usr/bin/env bash
set -e
FRONT="${FRONTEND_HOME:-$HOME/Desktop/sokomkononi/frontend}"
cd "$FRONT"
BK="src.bak.9.$(date +%Y%m%d_%H%M%S)"
cp -r src "$BK"
echo "backup → $BK"

python3 - <<'PYEOF'
import pathlib

# PayListingFee.jsx
p = pathlib.Path("src/pages/dashboard/components/PayListingFee.jsx")
if p.exists():
    s = p.read_text()
    orig = s

    if "getListing" not in s:
        s = s.replace(
            'import { COLORS, formatTZS, getCategory, timeAgo } from "./shared";',
            'import { COLORS, formatTZS, getCategory, timeAgo } from "./shared";\n'
            'import { getListing } from "../../../config/listingsStore.js";',
            1,
        )

    if "temp_ ids never exist" not in s:
        import re
        s = re.sub(
            r'(if \(!listingId\) \{\s*\n\s*setStage\("error"\);\s*\n[^}]+\n\s*return;\s*\n\s*\})',
            r'''\1

    if (String(listingId).startsWith("temp_")) {
      setStage("error");
      setError(t(
        "Tangazo lako bado halijathibitishwa. Subiri sekunde chache ujaribu tena.",
        "Your listing hasn't synced. Wait a moment and try again."
      ));
      return;
    }''',
            s,
            count=1,
        )

    if s != orig:
        p.write_text(s)
        print("  ✓ PayListingFee.jsx patched")
    else:
        print("  ~ PayListingFee.jsx already OK or pattern not found")

# MyListings.jsx
p2 = pathlib.Path("src/pages/dashboard/components/MyListings.jsx")
if p2.exists():
    s2 = p2.read_text()
    o2 = s2
    import re
    s2 = re.sub(
        r'const goToPayment = \(id\) => navigate\(`/dashboard/pay-listing\?id=\$\{id\}`\);',
        'const goToPayment = (id) => {\n'
        '    if (String(id).startsWith("temp_")) {\n'
        '      alert(lang === "sw"\n'
        '        ? "Tangazo lako bado halijathibitishwa. Subiri sekunde chache."\n'
        '        : "Your listing hasn\'t synced yet. Please wait.");\n'
        '      return;\n'
        '    }\n'
        '    navigate(`/dashboard/pay-listing?id=${id}`);\n'
        '  };',
        s2,
        count=1,
    )
    if s2 != o2:
        p2.write_text(s2)
        print("  ✓ MyListings.jsx patched")
    else:
        print("  ~ MyListings.jsx already OK or pattern not found")
PYEOF

echo
echo "Building..."
npm run build 2>&1 | tail -5
