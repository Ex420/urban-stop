import Cart from "../components/Cart";
import { fmt } from "../utils/format";

export default function Register({
  search, setSearch, catFilter, setCatFilter, categories, items, addToCart, prov,
  cart, cartWithTax, changeQty, totals, surcharge, payMethod, taxLabel, clearCart, onCharge,
}) {
  return (
    <div className="layout">
      <div className="main-area">
        <div className="search-bar">
          <input className="search-input" placeholder="🔍 Search items or barcode…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="cat-bar">
          {categories.map((c) => (
            <button key={c} className={`cat-btn ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>
          ))}
        </div>
        <div className="item-grid">
          {items.map((item) => (
            <div key={item.id} className={`item-card ${item.stock === 0 ? "out" : ""}`} onClick={() => addToCart(item)}>
              <span className="item-emoji">{item.emoji}</span>
              <div className="item-name">{item.name}</div>
              <div className="item-price">{fmt(item.price)}</div>
              <div className="tax-badge">
                {item.taxCat === "lottery" || item.taxCat === "grocery_basic"
                  ? <span style={{ color: "var(--muted)" }}>Tax-Free</span>
                  : prov.hst > 0 ? <span style={{ color: "var(--green)" }}>+HST {(prov.hst * 100).toFixed(0)}%</span>
                  : <span style={{ color: "var(--accent2)" }}>+{(prov.gst * 100).toFixed(0)}%GST</span>}
              </div>
              <span className={`item-stock ${item.stock <= 5 ? "stock-low" : ""}`}>{item.stock === 0 ? "OUT" : `×${item.stock}`}</span>
            </div>
          ))}
        </div>
      </div>
      <Cart
        cart={cart}
        cartWithTax={cartWithTax}
        changeQty={changeQty}
        totals={totals}
        surcharge={surcharge}
        payMethod={payMethod}
        prov={prov}
        taxLabel={taxLabel}
        clearCart={clearCart}
        onCharge={onCharge}
      />
    </div>
  );
}
