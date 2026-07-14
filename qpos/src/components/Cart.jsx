import { fmt } from "../utils/format";

export default function Cart({ cart, cartWithTax, changeQty, totals, surcharge, payMethod, prov, taxLabel, clearCart, onCharge }) {
  return (
    <aside className="sidebar">
      <div className="cart-header">
        <div className="cart-title">Current Order</div>
        <div className="cart-sub">{cart.length} item(s) · {prov.name} ({taxLabel})</div>
      </div>
      <div className="cart-items">
        {cart.length === 0 && <div className="cart-empty">Tap items to add them<br />to the order</div>}
        {cartWithTax.map((item) => (
          <div key={item.id} className="cart-item">
            <span className="ci-emoji">{item.emoji}</span>
            <div className="ci-info">
              <div className="ci-name">{item.name}</div>
              <div className="ci-price">{fmt(item.lineTotal)}</div>
            </div>
            <div className="ci-qty">
              <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
              <span className="qty-val">{item.qty}</span>
              <button className="qty-btn" onClick={() => changeQty(item.id, +1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-totals">
        <div className="total-row"><span>Subtotal</span><span>{fmt(totals.sub)}</span></div>
        {totals.hst > 0 && <div className="total-row"><span className="tax-label">HST ({(prov.hst * 100).toFixed(0)}%)</span><span>{fmt(totals.hst)}</span></div>}
        {totals.gst > 0 && <div className="total-row"><span className="tax-label">GST ({(prov.gst * 100).toFixed(0)}%)</span><span>{fmt(totals.gst)}</span></div>}
        {totals.pst > 0 && <div className="total-row"><span className="tax-label">PST ({(prov.pst * 100).toFixed(2)}%)</span><span>{fmt(totals.pst)}</span></div>}
        {surcharge > 0 && <div className="total-row"><span style={{ color: "var(--accent2)" }}>Card Surcharge ({payMethod})</span><span style={{ color: "var(--accent2)" }}>{fmt(surcharge)}</span></div>}
        <div className="total-row big"><span>TOTAL</span><span>{fmt(totals.total)}</span></div>
      </div>
      <div className="cart-actions">
        <button className="btn btn-primary" disabled={cart.length === 0} onClick={onCharge}>💳 Charge {fmt(totals.total)}</button>
        <button className="btn btn-secondary" disabled={cart.length === 0} onClick={clearCart}>🗑 Clear Order</button>
      </div>
    </aside>
  );
}
