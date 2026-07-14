import { supabase } from "./supabase";

const TABLE = "employees";

// NOTE: PINs are stored and compared in plaintext for simplicity. Before
// using this with real staff, hash PINs (e.g. bcrypt in an edge function)
// and verify server-side so the publishable key can't read raw PINs.

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

// Returns the matching active employee, or null when the PIN is wrong.
export async function verifyPin(pin) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, role, active")
    .eq("pin", pin)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// Fresh role lookup straight from the table — used by the admin page to
// re-verify owner access on every load instead of trusting client state.
export async function getById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, role, active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function fetchAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, role, active, created_at")
    .order("id", { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

export async function insert({ name, pin, role }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, pin, role })
    .select("id, name, role, active, created_at")
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function update(id, fields) {
  const { error } = await supabase.from(TABLE).update(fields).eq("id", id);
  if (error) throw error;
}

export async function remove(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
