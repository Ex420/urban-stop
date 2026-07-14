import { INITIAL_INVENTORY, calcTax } from "./constants";

// ─── Seed Historical Sales (30 days) ──────────────────────────────────────
// Only used to populate Supabase the first time the `sales` table is empty.
export function generateSeedSales() {
  const sales = [];
  const now = new Date();
  const methods = ["cash","debit","credit"];
  const popularItems = [1,2,7,12,17,4,22,35,37,5,8,13,20];
  let idCounter = 1;

  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const txnCount = isWeekend ? Math.floor(Math.random()*8)+12 : Math.floor(Math.random()*6)+7;

    for (let t = 0; t < txnCount; t++) {
      const hour = Math.floor(Math.random()*14)+7;
      const min = Math.floor(Math.random()*60);
      const txDate = new Date(date);
      txDate.setHours(hour, min, 0, 0);

      const itemCount = Math.floor(Math.random()*4)+1;
      const items = [];
      const usedIds = new Set();
      for (let i = 0; i < itemCount; i++) {
        let inv;
        if (Math.random() > 0.3) {
          const pid = popularItems[Math.floor(Math.random()*popularItems.length)];
          inv = INITIAL_INVENTORY.find(x => x.id === pid);
        } else {
          inv = INITIAL_INVENTORY[Math.floor(Math.random()*INITIAL_INVENTORY.length)];
        }
        if (!inv || usedIds.has(inv.id)) continue;
        usedIds.add(inv.id);
        const qty = Math.floor(Math.random()*3)+1;
        const sub = inv.price * qty;
        const tax = calcTax(sub, inv.taxCat, "ON");
        items.push({ ...inv, qty, subtotal: sub, ...tax, lineTotal: sub + tax.gst + tax.pst + tax.hst });
      }
      if (items.length === 0) continue;

      const totals = items.reduce((a,c) => ({
        sub: a.sub + c.subtotal, gst: a.gst + c.gst,
        pst: a.pst + c.pst, hst: a.hst + c.hst, total: a.total + c.lineTotal,
      }), { sub:0, gst:0, pst:0, hst:0, total:0 });

      const method = methods[Math.floor(Math.random()*methods.length)];
      sales.push({
        id: `TXN-SEED-${String(idCounter++).padStart(4,"0")}`,
        time: txDate.toISOString(),
        province: "ON",
        method,
        items,
        totals,
        cashGiven: method === "cash" ? Math.ceil(totals.total / 5) * 5 : null,
        change: method === "cash" ? Math.ceil(totals.total / 5) * 5 - totals.total : null,
        surcharge: 0,
        posted: true, // demo history counts as real sales, not training
      });
    }
  }
  return sales.sort((a,b) => new Date(b.time) - new Date(a.time));
}
