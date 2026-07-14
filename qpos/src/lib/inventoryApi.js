import { supabase } from "./supabase";

const TABLE = "inventory";

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    taxCat: row.tax_cat,
    stock: row.stock,
    barcode: row.barcode,
    emoji: row.emoji,
    cost: Number(row.cost || 0),
    reorderAt: row.reorder_at,
  };
}

function toRow(fields) {
  const row = {};
  if (fields.name !== undefined) row.name = fields.name;
  if (fields.price !== undefined) row.price = fields.price;
  if (fields.category !== undefined) row.category = fields.category;
  if (fields.taxCat !== undefined) row.tax_cat = fields.taxCat;
  if (fields.stock !== undefined) row.stock = fields.stock;
  if (fields.barcode !== undefined) row.barcode = fields.barcode;
  if (fields.emoji !== undefined) row.emoji = fields.emoji;
  if (fields.cost !== undefined) row.cost = fields.cost;
  if (fields.reorderAt !== undefined) row.reorder_at = fields.reorderAt;
  return row;
}

export async function fetchAll() {
  const { data, error } = await supabase.from(TABLE).select("*").order("id", { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

// One-time seed when the table is empty (preserves the demo dataset behavior).
export async function seed(items) {
  const rows = items.map((i) => toRow(i));
  const { error } = await supabase.from(TABLE).insert(rows);
  if (error) throw error;
}

export async function insert(item) {
  const { data, error } = await supabase.from(TABLE).insert(toRow(item)).select().single();
  if (error) throw error;
  return fromRow(data);
}

export async function update(id, fields) {
  const { error } = await supabase.from(TABLE).update(toRow(fields)).eq("id", id);
  if (error) throw error;
}

export async function remove(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
