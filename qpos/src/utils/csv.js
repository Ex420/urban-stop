// Client-side CSV export — builds the file in-memory (Blob) and triggers a
// download via a temporary <a> element. No server involved.

function csvEscape(val) {
  const s = String(val ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HEADER = [
  "Transaction ID", "Date/Time", "Province", "Payment Method",
  "Subtotal", "GST", "PST", "HST", "Surcharge", "Total",
  "Posted", "Items",
];

export function exportSalesCsv(sales, filename) {
  const rows = sales.map((s) => [
    s.id,
    new Date(s.time).toLocaleString("en-CA"),
    s.province,
    s.method.toUpperCase(),
    s.totals.sub.toFixed(2),
    s.totals.gst.toFixed(2),
    s.totals.pst.toFixed(2),
    s.totals.hst.toFixed(2),
    (s.surcharge || 0).toFixed(2),
    s.totals.total.toFixed(2),
    s.posted ? "Posted" : "Training",
    s.items.map((i) => `${i.name} x${i.qty}`).join("; "),
  ]);

  const csv = [HEADER, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
  // UTF-8 BOM so Excel decodes emoji in item names correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Filename like "qpos-sales-2026-01-01-to-2026-01-31.csv", tracking the
// active date filters so the export is self-describing.
export function csvFilename(prefix, dateFrom, dateTo) {
  const range = dateFrom || dateTo
    ? `${dateFrom || "start"}-to-${dateTo || "today"}`
    : "all-time";
  return `${prefix}-${range}.csv`;
}
