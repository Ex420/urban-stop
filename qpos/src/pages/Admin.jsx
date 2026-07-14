import { useState, useEffect, useMemo } from "react";
import DateFilters from "../components/DateFilters";
import * as employeesApi from "../lib/employeesApi";
import { fmt } from "../utils/format";
import { exportSalesCsv, csvFilename } from "../utils/csv";

// Hidden owner-only page (not linked from the nav — reachable at /admin).
//
// SECURITY NOTE: the owner role is re-verified against the employees table
// on every page load (see the access-check effect below) instead of trusting
// a client-side flag. But client-side route hiding alone can still be
// bypassed: anyone with the publishable key can query the sales table
// directly. For full protection, unposted transactions should eventually be
// behind a Supabase RLS policy tied to authenticated roles.

const STATUS_FILTERS = [["all", "All"], ["posted", "Posted only"], ["training", "Training only"]];

export default function Admin({ employee, sales, onTogglePosted, addAuditEntry, showToast }) {
  const [access, setAccess] = useState("checking"); // checking | ok | denied

  // Server-side role check: query the employees table fresh on every admin
  // page load — do not store an "isAdmin" flag in client state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await employeesApi.getById(employee.id);
        const ok = fresh && fresh.active && fresh.role === "owner";
        if (!cancelled) setAccess(ok ? "ok" : "denied");
      } catch {
        if (!cancelled) setAccess("denied");
      }
    })();
    return () => { cancelled = true; };
  }, [employee.id]);

  // ── Local date filters (independent of the main app's) ──
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState("30d");
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const now = new Date(); const today = now.toISOString().split("T")[0];
    const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };
    if (preset === "today") { setDateFrom(today); setDateTo(today); }
    else if (preset === "7d") { setDateFrom(daysAgo(6)); setDateTo(today); }
    else if (preset === "30d") { setDateFrom(daysAgo(29)); setDateTo(today); }
    else if (preset === "all") { setDateFrom(""); setDateTo(""); }
  };
  useEffect(() => { applyPreset("30d"); }, []);

  const [statusFilter, setStatusFilter] = useState("all");
  const [toggleTarget, setToggleTarget] = useState(null);

  const dateFiltered = useMemo(() => sales.filter((s) => {
    const d = new Date(s.time);
    if (dateFrom && d < new Date(dateFrom + "T00:00:00")) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  }), [sales, dateFrom, dateTo]);

  const visible = useMemo(() => dateFiltered.filter((s) => {
    if (statusFilter === "posted") return s.posted;
    if (statusFilter === "training") return !s.posted;
    return true;
  }), [dateFiltered, statusFilter]);

  const stats = useMemo(() => {
    const posted = dateFiltered.filter((s) => s.posted);
    const training = dateFiltered.filter((s) => !s.posted);
    return {
      postedRev: posted.reduce((a, s) => a + s.totals.total, 0),
      trainingRev: training.reduce((a, s) => a + s.totals.total, 0),
      postedCount: posted.length,
      trainingCount: training.length,
    };
  }, [dateFiltered]);

  // ── Employees management ──
  const [employees, setEmployees] = useState([]);
  const [empError, setEmpError] = useState("");
  const [newEmp, setNewEmp] = useState({ name: "", pin: "", role: "staff" });

  useEffect(() => {
    if (access !== "ok") return;
    employeesApi.fetchAll().then(setEmployees).catch((e) => setEmpError(e.message));
  }, [access]);

  const activeOwnerCount = employees.filter((e) => e.active && e.role === "owner").length;

  const addEmployee = async () => {
    const name = newEmp.name.trim();
    if (!name) { showToast("⚠️ Enter a name for the new employee.", "warn"); return; }
    if (!/^\d{4}$/.test(newEmp.pin)) { showToast("⚠️ PIN must be exactly 4 digits.", "warn"); return; }
    if (employees.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      showToast("⚠️ An employee with that name already exists.", "warn"); return;
    }
    try {
      const emp = await employeesApi.insert({ name, pin: newEmp.pin, role: newEmp.role });
      setEmployees((prev) => [...prev, emp]);
      setNewEmp({ name: "", pin: "", role: "staff" });
      await addAuditEntry(`Employee: ${name}`, "created", "—", `Added as ${emp.role}`);
      showToast(`✅ ${name} added.`);
    } catch (e) {
      showToast(`❌ ${e.message}`, "warn");
    }
  };

  const setEmployeeActive = async (emp, active) => {
    if (!active && emp.role === "owner" && activeOwnerCount <= 1) {
      showToast("⚠️ Cannot deactivate the last active owner — you would be locked out.", "warn");
      return;
    }
    await employeesApi.update(emp.id, { active });
    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, active } : e)));
    await addAuditEntry(`Employee: ${emp.name}`, "active", String(!active), String(active));
    showToast(active ? `✅ ${emp.name} reactivated.` : `🔒 ${emp.name} deactivated.`);
  };

  const deleteEmployee = async (emp) => {
    if (emp.role === "owner" && activeOwnerCount <= 1 && emp.active) {
      showToast("⚠️ Cannot delete the last active owner — you would be locked out.", "warn");
      return;
    }
    if (!window.confirm(`Permanently delete employee "${emp.name}"? Their PIN stops working immediately.`)) return;
    await employeesApi.remove(emp.id);
    setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
    await addAuditEntry(`Employee: ${emp.name}`, "deleted", "—", "Removed");
    showToast(`🗑 ${emp.name} deleted.`, "warn");
  };

  if (access === "checking") {
    return <div className="admin-gate">Verifying access…</div>;
  }

  if (access === "denied") {
    return (
      <div className="admin-gate">
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>⛔ Access denied</div>
        <div style={{ color: "var(--muted)", fontSize: 12, maxWidth: 380, textAlign: "center" }}>
          This page is restricted to owner accounts. Staff PINs unlock the register only.
        </div>
        <a className="btn btn-secondary" href="/" style={{ textDecoration: "none" }}>← Back to POS</a>
      </div>
    );
  }

  return (
    <div className="main-area" style={{ height: "calc(100vh - 52px)", overflowY: "auto" }}>
      <div className="page-header">
        <div className="page-title">🔐 Admin — All Transactions</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Owner: <strong style={{ color: "var(--text)" }}>{employee.name}</strong></span>
          <button className="add-row-btn" disabled={visible.length === 0}
            onClick={() => exportSalesCsv(visible, csvFilename("qpos-admin-sales", dateFrom, dateTo))}>
            ⬇ Export CSV
          </button>
          <a className="add-row-btn" href="/" style={{ textDecoration: "none" }}>← Back to POS</a>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-label">Posted Revenue</div>
          <div className="stat-val" style={{ color: "var(--green)" }}>{fmt(stats.postedRev)}</div>
          <div className="stat-change">{stats.postedCount} transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Training Revenue (excluded from reports)</div>
          <div className="stat-val" style={{ color: "var(--accent2)" }}>{fmt(stats.trainingRev)}</div>
          <div className="stat-change">{stats.trainingCount} transactions</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <DateFilters dateFrom={dateFrom} dateTo={dateTo} datePreset={datePreset}
          setDateFrom={setDateFrom} setDateTo={setDateTo} setDatePreset={setDatePreset} applyPreset={applyPreset} />
        <div className="filter-bar" style={{ marginLeft: "auto" }}>
          {STATUS_FILTERS.map(([id, label]) => (
            <button key={id} className={`filter-btn ${statusFilter === id ? "active" : ""}`}
              onClick={() => setStatusFilter(id)}>{label}</button>
          ))}
        </div>
      </div>

      <table className="audit-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Transaction</th><th>Date/Time</th><th>Prov</th><th>Method</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {visible.map((s) => (
            <tr key={s.id}>
              <td style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{s.id}</td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{new Date(s.time).toLocaleString("en-CA")}</td>
              <td>{s.province}</td>
              <td>{s.method.toUpperCase()}</td>
              <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10, color: "var(--muted)" }}>
                {s.items.map((i) => `${i.emoji} ${i.name} ×${i.qty}`).join(" · ")}
              </td>
              <td style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{fmt(s.totals.total)}</td>
              <td>
                {s.posted
                  ? <span className="badge badge-green">Posted</span>
                  : <span className="badge badge-yellow">Training</span>}
              </td>
              <td>
                <button className="add-row-btn" style={{ fontSize: 10, padding: "3px 8px" }}
                  onClick={() => setToggleTarget(s)}>
                  {s.posted ? "→ Training" : "→ Post"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && (
        <div style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 30 }}>
          No transactions match the current filters.
        </div>
      )}

      {/* ── Employees ── */}
      <div className="section-label" style={{ marginTop: 28 }}>👥 Employees</div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10 }}>
        Staff PINs unlock the register; only owners can open this page. PINs are stored in plaintext for now — hash before production use with real staff.
      </div>
      {empError && <div style={{ color: "var(--accent)", fontSize: 11, marginBottom: 8 }}>❌ {empError}</div>}
      <table className="audit-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Status</th><th>Since</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id} style={e.active ? {} : { opacity: 0.55 }}>
              <td style={{ fontWeight: 600 }}>{e.name}{e.id === employee.id && <span style={{ color: "var(--muted)", fontWeight: 400 }}> (you)</span>}</td>
              <td>{e.role === "owner" ? <span className="badge badge-red">Owner</span> : <span className="badge badge-green">Staff</span>}</td>
              <td>{e.active ? "Active" : "Deactivated"}</td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-CA") : "—"}</td>
              <td style={{ display: "flex", gap: 6 }}>
                <button className="add-row-btn" style={{ fontSize: 10, padding: "3px 8px" }}
                  onClick={() => setEmployeeActive(e, !e.active)}>
                  {e.active ? "Deactivate" : "Reactivate"}
                </button>
                <button className="del-btn" title="Delete employee" onClick={() => deleteEmployee(e)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap", paddingBottom: 30 }}>
        <input className="editor-input" style={{ width: 160 }} placeholder="Name"
          value={newEmp.name} onChange={(e) => setNewEmp((p) => ({ ...p, name: e.target.value }))} />
        <input className="editor-input" style={{ width: 110, fontFamily: "var(--mono)" }} placeholder="4-digit PIN"
          value={newEmp.pin} maxLength={4} inputMode="numeric"
          onChange={(e) => setNewEmp((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "") }))} />
        <select className="inv-select" value={newEmp.role} onChange={(e) => setNewEmp((p) => ({ ...p, role: e.target.value }))}>
          <option value="staff">staff</option>
          <option value="owner">owner</option>
        </select>
        <button className="add-row-btn" onClick={addEmployee}>+ Add Employee</button>
      </div>

      {/* ── Posted-toggle confirmation ── */}
      {toggleTarget && (
        <div className="modal-backdrop" onClick={() => setToggleTarget(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-modal-title">{toggleTarget.posted ? "↩️ Mark as Training?" : "✅ Post this transaction?"}</div>
            <div className="del-modal-sub">
              <strong>{toggleTarget.id}</strong> · {fmt(toggleTarget.totals.total)}<br />
              {toggleTarget.posted
                ? "It will be removed from the Sales Log and all analytics."
                : "It will start counting toward revenue, profit, tax, and all analytics."}
              <br />This change is recorded in the audit log.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-secondary" style={{ minWidth: 100 }} onClick={() => setToggleTarget(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ minWidth: 100 }}
                onClick={async () => { await onTogglePosted(toggleTarget); setToggleTarget(null); }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
