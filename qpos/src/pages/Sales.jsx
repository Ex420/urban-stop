import DateFilters from "../components/DateFilters";
import { fmt } from "../utils/format";
import { exportSalesCsv, csvFilename } from "../utils/csv";

export default function Sales({ filteredSales, totalRev, dateFrom, dateTo, datePreset, setDateFrom, setDateTo, setDatePreset, applyPreset }) {
  return (
    <div className="main-area" style={{ height: "calc(100vh - 52px)", overflowY: "auto" }}>
      <div className="page-header">
        <div className="page-title">📋 Sales Log</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{filteredSales.length} transactions · {fmt(totalRev)} revenue</div>
          <button className="add-row-btn" disabled={filteredSales.length === 0}
            onClick={() => exportSalesCsv(filteredSales, csvFilename("qpos-sales", dateFrom, dateTo))}>
            ⬇ Export CSV
          </button>
        </div>
      </div>
      <DateFilters dateFrom={dateFrom} dateTo={dateTo} datePreset={datePreset} setDateFrom={setDateFrom} setDateTo={setDateTo} setDatePreset={setDatePreset} applyPreset={applyPreset} />
      {filteredSales.length === 0 && <div style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 60 }}>No transactions in this date range.</div>}
      {filteredSales.slice(0, 100).map((s) => (
        <div key={s.id} className="sales-card">
          <div className="sales-row">
            <div>
              <div className="sales-id">{s.id}</div>
              <div className="sales-detail">{new Date(s.time).toLocaleString("en-CA")} · {s.province} · {s.method.toUpperCase()}</div>
            </div>
            <div className="sales-total">{fmt(s.totals.total)}</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: "var(--muted)" }}>
            {s.items.map((i) => `${i.emoji} ${i.name} ×${i.qty}`).join("  ·  ")}
          </div>
          <div style={{ marginTop: 5, fontSize: 10, display: "flex", gap: 10 }}>
            <span>Sub: {fmt(s.totals.sub)}</span>
            {s.totals.hst > 0 && <span style={{ color: "var(--green)" }}>HST: {fmt(s.totals.hst)}</span>}
            {s.totals.gst > 0 && <span style={{ color: "var(--green)" }}>GST: {fmt(s.totals.gst)}</span>}
            {s.totals.pst > 0 && <span style={{ color: "var(--green)" }}>PST: {fmt(s.totals.pst)}</span>}
            {s.cashGiven != null && <span>Change: {fmt(s.change)}</span>}
          </div>
        </div>
      ))}
      {filteredSales.length > 100 && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 11, marginTop: 10 }}>Showing first 100 of {filteredSales.length} transactions</div>}
    </div>
  );
}
