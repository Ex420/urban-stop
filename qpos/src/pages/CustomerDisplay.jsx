import { PROVINCES } from "../data/constants";
import { fmt } from "../utils/format";

export default function CustomerDisplay({ liveCart = [], liveTotals = {}, liveStatus = "idle", liveMethod = "cash", liveProv = "ON", clock }) {
  const p = PROVINCES[liveProv] || PROVINCES["ON"];
  const isPaid = liveStatus === "paid";
  const isIdle = liveStatus === "idle" || liveCart.length === 0;
  return (
    <div className="cfd-wrap">
      <div className="cfd-header">
        <div>
          <div className="cfd-logo">Q<span>POS</span></div>
          <div className="cfd-store-name">QUICK MART · {p.name}</div>
        </div>
        <div className="cfd-clock">{clock}</div>
      </div>
      <div className="cfd-body">
        {isPaid ? (
          <div className="cfd-paid">
            <div className="cfd-paid-check">✅</div>
            <div className="cfd-paid-msg">Payment Received</div>
            <div className="cfd-paid-sub">Thank you for shopping at Quick Mart!</div>
          </div>
        ) : isIdle ? (
          <div className="cfd-idle">
            <div className="cfd-idle-logo">QPOS</div>
            <div style={{ fontSize: 36 }}>👋</div>
            <div className="cfd-idle-sub">Welcome! A cashier will scan your items shortly.</div>
            <div style={{ fontSize: 11, color: "var(--border)", marginTop: 20 }}>HST Reg: 123456789 RT0001</div>
          </div>
        ) : (
          <>
            <div className="cfd-items">
              <div className="cfd-items-title">Your Items — {liveCart.length} line(s)</div>
              {liveCart.map((item, i) => (
                <div key={i} className="cfd-item-row">
                  <div className="cfd-item-left">
                    <span className="cfd-item-emoji">{item.emoji}</span>
                    <div>
                      <div className="cfd-item-name">{item.name}</div>
                      <div className="cfd-item-qty">Qty: {item.qty} × {fmt(item.price)}</div>
                    </div>
                  </div>
                  <div className="cfd-item-price">{fmt(item.lineTotal)}</div>
                </div>
              ))}
            </div>
            <div className="cfd-totals">
              <div className="cfd-total-row"><span>Subtotal</span><span>{fmt(liveTotals.sub || 0)}</span></div>
              {(liveTotals.hst || 0) > 0 && <div className="cfd-total-row tax"><span>HST ({(p.hst * 100).toFixed(0)}%)</span><span>{fmt(liveTotals.hst)}</span></div>}
              {(liveTotals.gst || 0) > 0 && <div className="cfd-total-row tax"><span>GST</span><span>{fmt(liveTotals.gst)}</span></div>}
              {(liveTotals.pst || 0) > 0 && <div className="cfd-total-row tax"><span>PST</span><span>{fmt(liveTotals.pst)}</span></div>}
              {(liveTotals.surcharge || 0) > 0 && <div className="cfd-total-row sur"><span>{liveMethod === "debit" ? "Debit" : "Credit"} Surcharge</span><span>{fmt(liveTotals.surcharge)}</span></div>}
              <div className="cfd-total-row big"><span>TOTAL</span><span>{fmt(liveTotals.total || 0)}</span></div>
              <div style={{ marginTop: 20, fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.7 }}>
                {liveMethod === "cash" && "💵 Please have exact change ready"}
                {liveMethod === "debit" && "💳 Tap or insert debit card · +$0.25"}
                {liveMethod === "credit" && "🏦 Insert or tap credit card · +$0.50"}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="cfd-footer">
        <span>QUICK MART · 123 Main St</span>
        <span>HST Reg: 123456789 RT0001</span>
        <span>Thank you for shopping with us</span>
      </div>
    </div>
  );
}
