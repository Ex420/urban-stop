import { supabase } from "./supabase";

const TABLE = "audit_log";

function rowToEntry(row) {
  return {
    id: row.id,
    time: row.time,
    editor: row.editor,
    item: row.item,
    field: row.field,
    from: row.from_value,
    to: row.to_value,
  };
}

export async function fetchAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("time", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data.map(rowToEntry);
}

export async function insert({ editor, item, field, from, to }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ editor, item, field, from_value: String(from), to_value: String(to) })
    .select()
    .single();
  if (error) throw error;
  return rowToEntry(data);
}
