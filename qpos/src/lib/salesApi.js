import { supabase } from "./supabase";

const SALES_TABLE = "sales";
const ITEMS_TABLE = "sale_items";
const CHUNK = 200;

function rowToItem(row) {
  return {
    id: row.item_id,
    name: row.name,
    emoji: row.emoji,
    category: row.category,
    taxCat: row.tax_cat,
    price: Number(row.price),
    cost: Number(row.cost || 0),
    qty: row.qty,
    subtotal: Number(row.subtotal),
    gst: Number(row.gst),
    pst: Number(row.pst),
    hst: Number(row.hst),
    lineTotal: Number(row.line_total),
  };
}

function itemToRow(saleId, item) {
  return {
    sale_id: saleId,
    item_id: item.id,
    name: item.name,
    emoji: item.emoji,
    category: item.category,
    tax_cat: item.taxCat,
    price: item.price,
    cost: item.cost || 0,
    qty: item.qty,
    subtotal: item.subtotal,
    gst: item.gst,
    pst: item.pst,
    hst: item.hst,
    line_total: item.lineTotal,
  };
}

function rowToSale(row, items) {
  return {
    id: row.id,
    time: row.time,
    province: row.province,
    method: row.method,
    items,
    totals: {
      sub: Number(row.sub),
      gst: Number(row.gst),
      pst: Number(row.pst),
      hst: Number(row.hst),
      total: Number(row.total),
    },
    cashGiven: row.cash_given != null ? Number(row.cash_given) : null,
    change: row.change != null ? Number(row.change) : null,
    surcharge: Number(row.surcharge || 0),
    posted: !!row.posted,
  };
}

function saleToRow(sale) {
  return {
    id: sale.id,
    time: sale.time,
    province: sale.province,
    method: sale.method,
    sub: sale.totals.sub,
    gst: sale.totals.gst,
    pst: sale.totals.pst,
    hst: sale.totals.hst,
    total: sale.totals.total,
    cash_given: sale.cashGiven,
    change: sale.change,
    surcharge: sale.surcharge || 0,
    posted: sale.posted ?? false,
  };
}

export async function fetchAll() {
  const { data: salesRows, error } = await supabase
    .from(SALES_TABLE)
    .select("*")
    .order("time", { ascending: false });
  if (error) throw error;
  if (salesRows.length === 0) return [];

  const { data: itemRows, error: itemErr } = await supabase
    .from(ITEMS_TABLE)
    .select("*")
    .in("sale_id", salesRows.map((r) => r.id));
  if (itemErr) throw itemErr;

  const itemsBySale = {};
  itemRows.forEach((r) => {
    (itemsBySale[r.sale_id] ??= []).push(rowToItem(r));
  });

  return salesRows.map((r) => rowToSale(r, itemsBySale[r.id] || []));
}

export async function insert(sale) {
  const { error } = await supabase.from(SALES_TABLE).insert(saleToRow(sale));
  if (error) throw error;
  const itemRows = sale.items.map((it) => itemToRow(sale.id, it));
  const { error: itemErr } = await supabase.from(ITEMS_TABLE).insert(itemRows);
  if (itemErr) throw itemErr;
}

export async function setPosted(id, posted) {
  const { error } = await supabase.from(SALES_TABLE).update({ posted }).eq("id", id);
  if (error) throw error;
}

// One-time seed of 30 days of demo sales when the table is empty.
export async function seed(sales) {
  for (let i = 0; i < sales.length; i += CHUNK) {
    const chunk = sales.slice(i, i + CHUNK);
    const { error } = await supabase.from(SALES_TABLE).insert(chunk.map(saleToRow));
    if (error) throw error;

    const itemRows = chunk.flatMap((s) => s.items.map((it) => itemToRow(s.id, it)));
    for (let j = 0; j < itemRows.length; j += CHUNK) {
      const { error: itemErr } = await supabase.from(ITEMS_TABLE).insert(itemRows.slice(j, j + CHUNK));
      if (itemErr) throw itemErr;
    }
  }
}
