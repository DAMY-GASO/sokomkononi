// ============================================================
// exportDealTranscript.js
// Ina export transcript ya Deal Room kama TXT, PDF, au CSV.
// Inatumika na buyer, seller, na admin.
// ============================================================

// ── HELPERS ─────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("sw-TZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function fmtTZS(n) {
  const num = Number(n) || 0;
  return "TZS " + num.toLocaleString("en-US");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── TXT ─────────────────────────────────────────────────────
function buildTXT(transcript) {
  const { meta, messages, deal } = transcript;
  const L = meta.labels;
  const lines = [];

  lines.push("==========================================================");
  lines.push(`  ${L.title}`);
  lines.push("==========================================================");
  lines.push("");
  lines.push(`${L.dealInfo}`);
  lines.push(`  Deal Room ID : ${meta.dealRoomId}`);
  lines.push(`  Status       : ${meta.status}`);
  lines.push(`  ${L.listing}   : ${meta.listingTitle}`);
  lines.push(`  Location     : ${meta.location}`);
  lines.push(`  Category     : ${meta.category}`);
  lines.push(`  Asking Price : ${fmtTZS(meta.askingPrice)}`);
  lines.push(`  Current Offer: ${fmtTZS(meta.currentOffer)}`);
  lines.push(`  Agreed Price : ${fmtTZS(meta.agreedPrice)}`);
  if (meta.agreedAt) lines.push(`  Agreed At    : ${fmtDate(meta.agreedAt)}`);
  lines.push("");
  lines.push(`${L.participants}`);
  lines.push(`  ${deal.buyerName} (ID ${meta.buyerId})`);
  lines.push(`  ${deal.sellerName} (ID ${meta.sellerId})`);
  lines.push("");
  lines.push(`${L.timeline}`);
  lines.push(`  Created      : ${fmtDate(meta.createdAt)}`);
  lines.push(`  Updated      : ${fmtDate(meta.updatedAt)}`);
  if (meta.reservationHours) {
    lines.push(`  Reservation  : ${meta.reservationHours}h — ${fmtTZS(meta.reservationFee)}`);
  }
  if (meta.reservationExpiresAt) {
    lines.push(`  Resv. Expiry : ${fmtDate(meta.reservationExpiresAt)}`);
  }
  lines.push("");
  lines.push("==========================================================");
  lines.push(`  ${L.conversation} (${messages.length})`);
  lines.push("==========================================================");
  lines.push("");

  messages.forEach((m) => {
    const who = m.sender === "me" ? L.you : L.other;
    const prefix = m.offerAmount ? `[${L.offer}] ` : "";
    lines.push(`[${fmtDate(m.at)}] ${who}: ${prefix}${m.text || ""}`);
    if (m.offerAmount) {
      lines.push(`   → Amount: ${fmtTZS(m.offerAmount)}`);
    }
  });

  lines.push("");
  lines.push("==========================================================");
  lines.push(`  Exported: ${fmtDate(meta.exportedAt)}`);
  lines.push(`  By role : ${meta.exportedBy}`);
  lines.push("==========================================================");

  return lines.join("\n");
}

// ── CSV ─────────────────────────────────────────────────────
function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCSV(transcript) {
  const { messages } = transcript;
  const header = ["index", "timestamp", "sender", "sender_id", "type", "message", "offer_amount"];
  const rows = [header.join(",")];

  messages.forEach((m, i) => {
    rows.push([
      i + 1,
      m.at || "",
      m.sender === "me" ? "me" : "other",
      m.senderId || "",
      m.offerAmount ? "offer" : "message",
      csvEscape(m.text || ""),
      m.offerAmount ? m.offerAmount : "",
    ].join(","));
  });

  return rows.join("\n");
}

// ── PDF (using browser print) ───────────────────────────────
async function exportPDF(transcript, filename) {
  const html = buildPrintableHTML(transcript);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    throw new Error("Popup blocked. Please allow popups for PDF.");
  }
  win.document.write(html);
  win.document.close();

  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };
}

function buildPrintableHTML(transcript) {
  const { meta, messages, deal } = transcript;
  const L = meta.labels;

  const rows = messages.map((m, i) => {
    const who = m.sender === "me" ? L.you : L.other;
    const isOffer = !!m.offerAmount;
    return `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;vertical-align:top;font-size:11px;color:#666;">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd;vertical-align:top;font-size:11px;white-space:nowrap;">${fmtDate(m.at)}</td>
        <td style="padding:8px;border:1px solid #ddd;vertical-align:top;font-size:11px;font-weight:600;color:${isOffer ? "#8A5A16" : "#101A2E"};">${who}</td>
        <td style="padding:8px;border:1px solid #ddd;vertical-align:top;font-size:12px;">
          ${isOffer ? `<div style="font-weight:700;color:#8A5A16;margin-bottom:4px;">${L.offer}: ${fmtTZS(m.offerAmount)}</div>` : ""}
          <div>${(m.text || "").replace(/</g, "&lt;")}</div>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>${L.title}</title>
    </head>
    <body style="font-family:Arial,sans-serif;padding:24px;color:#101A2E;">
      <h1 style="font-size:20px;margin:0 0 4px;">${L.title}</h1>
      <p style="font-size:12px;color:#666;margin:0 0 20px;">Deal Room #${meta.dealRoomId} — ${meta.listingTitle}</p>

      <h2 style="font-size:14px;margin:16px 0 8px;">${L.dealInfo}</h2>
      <table style="border-collapse:collapse;font-size:12px;width:100%;">
        <tr><td style="padding:4px 8px;color:#666;">Status</td><td style="padding:4px 8px;font-weight:600;">${meta.status}</td></tr>
        <tr><td style="padding:4px 8px;color:#666;">${L.listing}</td><td style="padding:4px 8px;">${meta.listingTitle}</td></tr>
        <tr><td style="padding:4px 8px;color:#666;">Location</td><td style="padding:4px 8px;">${meta.location}</td></tr>
        <tr><td style="padding:4px 8px;color:#666;">Agreed Price</td><td style="padding:4px 8px;font-weight:600;color:#C1502E;">${fmtTZS(meta.agreedPrice || meta.currentOffer)}</td></tr>
        <tr><td style="padding:4px 8px;color:#666;">${L.participants}</td><td style="padding:4px 8px;">${deal.buyerName} ↔ ${deal.sellerName}</td></tr>
        <tr><td style="padding:4px 8px;color:#666;">Created</td><td style="padding:4px 8px;">${fmtDate(meta.createdAt)}</td></tr>
      </table>

      <h2 style="font-size:14px;margin:24px 0 8px;">${L.conversation} (${messages.length})</h2>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background:#F5F3EC;">
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:11px;">#</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:11px;">${L.date}</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:11px;">${L.from}</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:11px;">${L.message}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="font-size:10px;color:#999;margin-top:24px;">
        Exported: ${fmtDate(meta.exportedAt)} — ${meta.exportedBy}
      </p>
    </body>
    </html>
  `;
}

// ── MAIN EXPORT ─────────────────────────────────────────────
export async function exportTranscript(transcript, format = "TXT") {
  const safeName = `deal-room-${transcript.meta.dealRoomId}-${Date.now()}`;

  if (format === "TXT") {
    const blob = new Blob([buildTXT(transcript)], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${safeName}.txt`);
    return;
  }

  if (format === "CSV") {
    const blob = new Blob([buildCSV(transcript)], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `${safeName}.csv`);
    return;
  }

  if (format === "PDF") {
    await exportPDF(transcript, `${safeName}.pdf`);
    return;
  }

  throw new Error(`Unknown format: ${format}`);
}