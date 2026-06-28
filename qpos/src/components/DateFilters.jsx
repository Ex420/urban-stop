const PRESETS = [["today", "Today"], ["7d", "7 Days"], ["30d", "30 Days"], ["all", "All Time"]];

export default function DateFilters({ dateFrom, dateTo, datePreset, setDateFrom, setDateTo, setDatePreset, applyPreset }) {
  return (
    <div className="filter-bar">
      {PRESETS.map(([p, l]) => (
        <button key={p} className={`filter-btn ${datePreset === p ? "active" : ""}`} onClick={() => applyPreset(p)}>{l}</button>
      ))}
      <input type="date" className="date-input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDatePreset(""); }} />
      <span style={{ color: "var(--muted)", fontSize: 11 }}>→</span>
      <input type="date" className="date-input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDatePreset(""); }} />
    </div>
  );
}
