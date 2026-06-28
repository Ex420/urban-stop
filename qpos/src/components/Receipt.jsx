import { PROVINCES } from "../data/constants";
import { fmt } from "../utils/format";

export default function Receipt({ open, receipt, onClose, onNewSale }) {
  if (!open || !receipt) return null;
  const p = PROVINCES[receipt.province];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🧾 Receipt</div>
          <div className="modal-sub">Sale complete</div>
        </div>
        <div className="modal-body">
          <div className="receipt">
            <div className="receipt-store">QUICK MART</div>
            <div className="receipt-addr">123 Main St · {p.name}<br />GST/HST Reg: 123456789 RT0001</div>
            <hr className="receipt-divider" />
            {receipt.items.map((i) => (
              <div key={i.id} className="receipt-row"><span>{i.name} ×{i.qty}</span><span>{fmt(i.lineTotal)}</span></div>
            ))}
            <hr className="receipt-divider" />
            <div className="receipt-row"><span>Subtotal</span><span>{fmt(receipt.totals.sub)}</span></div>
            {receipt.totals.hst > 0 && <div className="receipt-row"><span>HST ({(p.hst * 100).toFixed(0)}%)</span><span>{fmt(receipt.totals.hst)}</span></div>}
            {receipt.totals.gst > 0 && <div className="receipt-row"><span>GST ({(p.gst * 100).toFixed(0)}%)</span><span>{fmt(receipt.totals.gst)}</span></div>}
            {receipt.totals.pst > 0 && <div className="receipt-row"><span>PST ({(p.pst * 100).toFixed(2)}%)</span><span>{fmt(receipt.totals.pst)}</span></div>}
            {receipt.surcharge > 0 && <div className="receipt-row"><span>{receipt.method === "debit" ? "Debit" : "Credit"} Surcharge</span><span>{fmt(receipt.surcharge)}</span></div>}
            <hr className="receipt-divider" />
            <div className="receipt-row receipt-total"><span>TOTAL</span><span>{fmt(receipt.totals.total)}</span></div>
            <div className="receipt-row"><span>{receipt.method.toUpperCase()}</span><span>{receipt.cashGiven ? fmt(receipt.cashGiven) : "—"}</span></div>
            {receipt.change != null && <div className="receipt-row"><span>CHANGE</span><span>{fmt(receipt.change)}</span></div>}
            <div className="receipt-footer">{receipt.id}<br />Thank you for shopping with us!</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onNewSale}>New Sale</button>
        </div>
      </div>
    </div>
  );
}
