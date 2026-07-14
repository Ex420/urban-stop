import { PROVINCES } from "../data/constants";

const TABS = [
  { id: "pos", label: "🛒 Register" },
  { id: "inventory", label: "📦 Inventory" },
  { id: "analytics", label: "📊 Analytics" },
  { id: "sales", label: "📋 Sales" },
  { id: "ai", label: "🤖 AI Advisor" },
];

export default function Nav({ page, setPage, province, setProvince, clock, onShowCFDPreview }) {
  return (
    <nav className="nav">
      <div className="nav-logo">Q<span>POS</span></div>
      {TABS.map((t) => (
        <button key={t.id} className={`nav-tab ${page === t.id ? "active" : ""}`} onClick={() => setPage(t.id)}>
          {t.label}
        </button>
      ))}
      <div className="nav-right">
        <button
          className="nav-tab"
          style={{ borderRadius: 6, border: "1px solid var(--green)", color: "var(--green)", fontSize: 11, padding: "4px 10px" }}
          onClick={onShowCFDPreview}
          title="Preview customer display"
        >
          🖥 Customer Display
        </button>
        <select className="province-select" value={province} onChange={(e) => setProvince(e.target.value)}>
          {Object.entries(PROVINCES).map(([code, p]) => (
            <option key={code} value={code}>{code} — {p.name}</option>
          ))}
        </select>
        <span className="clock">{clock}</span>
      </div>
    </nav>
  );
}
