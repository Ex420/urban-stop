import { fmt } from "../utils/format";

const METHODS = [
  { id: "cash", icon: "💵", label: "Cash", note: "No surcharge" },
  { id: "debit", icon: "💳", label: "Debit", note: "+$0.25" },
  { id: "credit", icon: "🏦", label: "Credit", note: "+$0.50" },
];

export default function PaymentModal({ open, baseTotals, prov, payMethod, setPayMethod, surcharge, totals, cashGiven, setCashGiven, change, onClose, onComplete }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">💳 Collect Payment</div>
          <div className="modal-sub">Items: {fmt(baseTotals.total)} · {prov.name}</div>
        </div>
        <div className="modal-body">
          <div className="pay-methods">
            {METHODS.map((m) => (
              <div key={m.id} className={`pay-btn ${payMethod === m.id ? "sel" : ""}`} onClick={() => setPayMethod(m.id)}>
                <span className="pay-icon">{m.icon}</span>
                <div>{m.label}</div>
                <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{m.note}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--muted)" }}>
              <span>Items subtotal</span><span>{fmt(baseTotals.sub)}</span>
            </div>
            {baseTotals.hst > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--muted)" }}>
              <span>HST</span><span>{fmt(baseTotals.hst)}</span>
            </div>}
            {baseTotals.gst > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--muted)" }}>
              <span>GST</span><span>{fmt(baseTotals.gst)}</span>
            </div>}
            {baseTotals.pst > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--muted)" }}>
              <span>PST</span><span>{fmt(baseTotals.pst)}</span>
            </div>}
            {surcharge > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--accent2)" }}>
              <span>{payMethod === "debit" ? "Debit" : "Credit"} Card Surcharge</span><span>{fmt(surcharge)}</span>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, fontFamily: "var(--mono)", paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 4 }}>
              <span>TOTAL DUE</span><span style={{ color: "var(--green)" }}>{fmt(totals.total)}</span>
            </div>
          </div>

          {payMethod === "cash" && (
            <>
              <input className="cash-input" type="number" placeholder="Cash tendered ($)" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} />
              <div className="numpad">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"].map((k) => (
                  <button key={k} className="np-btn" onClick={() => {
                    if (k === "⌫") setCashGiven((p) => p.slice(0, -1));
                    else setCashGiven((p) => (p + k).replace(/^0+(\d)/, "$1"));
                  }}>{k}</button>
                ))}
              </div>
              {cashGiven && <div className="change-row">
                <span>{change >= 0 ? "Change Due" : "Insufficient"}</span>
                <span className="change-val" style={change < 0 ? { color: "var(--accent)" } : {}}>{change >= 0 ? fmt(change) : `Short ${fmt(-change)}`}</span>
              </div>}
            </>
          )}
          {payMethod !== "cash" && (
            <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted)", fontSize: 12 }}>
              {payMethod === "debit" ? "📱 Tap debit card on terminal" : "💳 Insert or tap credit card"}
              <div style={{ marginTop: 6, fontSize: 10 }}>Surcharge of {fmt(surcharge)} will be collected</div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-green" style={{ flex: 2 }} disabled={payMethod === "cash" && (!cashGiven || change < 0)} onClick={onComplete}>✓ Complete — {fmt(totals.total)}</button>
        </div>
      </div>
    </div>
  );
}
