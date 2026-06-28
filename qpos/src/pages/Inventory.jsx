import { TAX_CATS } from "../data/constants";
import { fmt } from "../utils/format";

const CATEGORY_OPTIONS = ["Beverages", "Snacks", "Confectionery", "Grocery", "Prepared", "Personal Care", "Household", "Tobacco", "Alcohol", "Lottery"];

function SortTh({ col, label, invSort, toggleSort }) {
  const active = invSort.col === col;
  return (
    <th onClick={() => toggleSort(col)} style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
      {label} <span style={{ color: active ? "var(--accent)" : "var(--border)", fontSize: 9 }}>
        {active ? (invSort.dir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </th>
  );
}

export default function Inventory({
  editorName, setEditorName, barcodeMode, setBarcodeMode, showAudit, setShowAudit, auditLog, addNewItem,
  barcodeInputRef, handleBarcodeInput, barcodeScanHit, setBarcodeScanHit, applyBarcodeStockUpdate,
  sortedInventory, invSort, toggleSort, updateInv, confirmDelete,
}) {
  return (
    <div className="main-area" style={{ height: "calc(100vh - 52px)", overflowY: "auto" }}>
      <div className="page-header">
        <div className="page-title">📦 Inventory</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="editor-row" style={{ margin: 0 }}>
            <span className="editor-label">👤 Editing as:</span>
            <input className="editor-input" value={editorName} onChange={(e) => setEditorName(e.target.value)} placeholder="Your name" />
          </div>
          <button className="add-row-btn"
            style={{ borderColor: barcodeMode ? "var(--green)" : "var(--border)", color: barcodeMode ? "var(--green)" : "var(--text)", background: barcodeMode ? "rgba(46,196,182,.08)" : "transparent" }}
            onClick={() => setBarcodeMode((m) => !m)}>
            {barcodeMode ? "🟢 Scanner Active" : "📦 Scan Barcode"}
          </button>
          <button className="add-row-btn" style={{ borderColor: "var(--purple)", color: "var(--purple)" }} onClick={() => setShowAudit((a) => !a)}>
            {showAudit ? "Hide" : "📋"} Audit Log {auditLog.length > 0 && `(${auditLog.length})`}
          </button>
          <button className="add-row-btn" onClick={addNewItem}>+ Add Item</button>
        </div>
      </div>

      {barcodeMode && (
        <div style={{ marginBottom: 14 }}>
          <div className="scan-mode-bar">
            <div className="scan-mode-pulse" />
            <div style={{ flex: 1 }}>
              <div className="scan-mode-label">🔍 Barcode Scanner Mode Active</div>
              <div className="scan-mode-sub">Type or scan a barcode below and press Enter. A USB/BT scanner will do this automatically.</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              ref={barcodeInputRef}
              className="search-input"
              style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: 1, maxWidth: 320 }}
              placeholder="Type barcode + Enter  (e.g. 049000028904)"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBarcodeInput(e.target.value);
                  e.target.value = "";
                }
              }}
            />
            <button className="btn btn-secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}
              onClick={() => {
                const v = barcodeInputRef.current?.value || "";
                handleBarcodeInput(v);
                if (barcodeInputRef.current) barcodeInputRef.current.value = "";
              }}>
              Look up ↵
            </button>
          </div>

          {barcodeScanHit && (
            <div className="scan-hit-card">
              <div className="scan-hit-emoji">{barcodeScanHit.item.emoji}</div>
              <div className="scan-hit-info">
                <div className="scan-hit-name">{barcodeScanHit.item.name}</div>
                <div className="scan-hit-meta">{barcodeScanHit.item.category} · Barcode: {barcodeScanHit.item.barcode}</div>
                <div className="scan-hit-meta">Price: {fmt(barcodeScanHit.item.price)} · Current stock: <strong style={{ color: "var(--text)" }}>{barcodeScanHit.item.stock}</strong></div>
              </div>
              <div className="scan-hit-actions">
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>Set stock to:</div>
                  <input className="scan-stock-input" type="number" min={0}
                    value={barcodeScanHit.newStock}
                    onChange={(e) => setBarcodeScanHit((p) => ({ ...p, newStock: parseInt(e.target.value) || 0 }))}
                    onKeyDown={(e) => e.key === "Enter" && applyBarcodeStockUpdate()}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
                  <button className="btn btn-green" style={{ fontSize: 11, padding: "6px 12px" }} onClick={applyBarcodeStockUpdate}>✓ Update</button>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { setBarcodeScanHit(null); barcodeInputRef.current?.focus(); }}>Skip</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>
            💡 With a real USB scanner: just scan — it types the barcode and hits Enter automatically. Try <strong>049000028904</strong> (Coca-Cola) or <strong>028400315036</strong> (Lays) to test.
          </div>
        </div>
      )}

      {showAudit && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>📋 Inventory Audit Log</div>
          {auditLog.length === 0 && <div style={{ color: "var(--muted)", fontSize: 11, padding: "10px 0" }}>No changes recorded yet. Edit any field to start the log.</div>}
          {auditLog.length > 0 && (
            <table className="audit-table">
              <thead>
                <tr><th>Time</th><th>Editor</th><th>Item</th><th>Field</th><th>Change</th></tr>
              </thead>
              <tbody>
                {auditLog.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{new Date(e.time).toLocaleString("en-CA")}</td>
                    <td style={{ fontWeight: 600 }}>{e.editor}</td>
                    <td>{e.item}</td>
                    <td style={{ color: "var(--muted)" }}>{e.field}</td>
                    <td>
                      <span className="audit-change">{e.from}</span>
                      <span className="audit-arrow">→</span>
                      <span className="audit-new">{e.to}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <table className="inv-table">
        <thead>
          <tr>
            <SortTh col="emoji" label="" invSort={invSort} toggleSort={toggleSort} />
            <SortTh col="name" label="Name" invSort={invSort} toggleSort={toggleSort} />
            <SortTh col="category" label="Category" invSort={invSort} toggleSort={toggleSort} />
            <SortTh col="price" label="Price" invSort={invSort} toggleSort={toggleSort} />
            <SortTh col="cost" label="Cost" invSort={invSort} toggleSort={toggleSort} />
            <th>Tax Class</th>
            <SortTh col="stock" label="Stock" invSort={invSort} toggleSort={toggleSort} />
            <SortTh col="reorderAt" label="Reorder At ⓘ" invSort={invSort} toggleSort={toggleSort} />
            <th title="Status based on your reorder point">Status</th>
            <SortTh col="margin" label="Margin" invSort={invSort} toggleSort={toggleSort} />
            <th>Barcode</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedInventory.map((item) => {
            const margin = item.price > 0 ? ((item.price - (item.cost || 0)) / item.price * 100) : 0;
            const isOut = item.stock === 0;
            const isLow = !isOut && item.reorderAt > 0 && item.stock <= item.reorderAt;
            return (
              <tr key={item.id}>
                <td><input className="inv-input" style={{ width: 42, textAlign: "center" }} defaultValue={item.emoji} onBlur={(e) => updateInv(item.id, "emoji", e.target.value)} /></td>
                <td><input className="inv-input" style={{ width: 155 }} defaultValue={item.name} onBlur={(e) => updateInv(item.id, "name", e.target.value)} /></td>
                <td>
                  <select className="inv-select" value={item.category} onChange={(e) => updateInv(item.id, "category", e.target.value)}>
                    {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td><input className="inv-input" type="number" step="0.01" defaultValue={item.price.toFixed(2)} onBlur={(e) => updateInv(item.id, "price", e.target.value)} /></td>
                <td><input className="inv-input" type="number" step="0.01" defaultValue={(item.cost || 0).toFixed(2)} onBlur={(e) => updateInv(item.id, "cost", e.target.value)} /></td>
                <td>
                  <select className="inv-select" value={item.taxCat} onChange={(e) => updateInv(item.id, "taxCat", e.target.value)}>
                    {Object.keys(TAX_CATS).map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </td>
                <td><input className="inv-input" type="number" step="1" defaultValue={item.stock} onBlur={(e) => updateInv(item.id, "stock", e.target.value)} /></td>
                <td>
                  <input className="inv-input" type="number" step="1" defaultValue={item.reorderAt ?? 5} onBlur={(e) => updateInv(item.id, "reorderAt", e.target.value)}
                    title="Alert me when stock drops to or below this number. Set 0 to disable." />
                </td>
                <td>
                  {isOut
                    ? <span className="reorder-badge out">⛔ Out</span>
                    : item.reorderAt > 0 && isLow
                      ? <span className="reorder-badge low">⚠️ Reorder</span>
                      : item.reorderAt === 0
                        ? <span className="reorder-badge ok">— No alert</span>
                        : <span className="reorder-badge ok">✓</span>}
                </td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: margin < 15 ? "var(--accent)" : margin > 40 ? "var(--green)" : "var(--accent2)" }}>{margin.toFixed(0)}%</td>
                <td><input className="inv-input" style={{ width: 120, fontFamily: "var(--mono)", fontSize: 10 }} defaultValue={item.barcode || ""} placeholder="000000000000" onBlur={(e) => updateInv(item.id, "barcode", e.target.value)} /></td>
                <td><button className="del-btn" onClick={() => confirmDelete(item)} title="Delete item">🗑</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 10, paddingBottom: 20 }}>
        💡 <b>Reorder At</b>: set to the quantity where you want a warning. Set to 0 to disable alerts for that item. Status is only flagged when stock hits your threshold — not by a hardcoded number.
      </div>
    </div>
  );
}
