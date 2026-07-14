import { useState, useEffect, useCallback } from "react";
import * as employeesApi from "../lib/employeesApi";

// Full-screen PIN pad shown until an active employee unlocks the POS.
// PINs are checked against the Supabase `employees` table (plaintext for
// now — hash before production use with real staff).
export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = useCallback(async (candidate) => {
    setChecking(true);
    setError("");
    try {
      const emp = await employeesApi.verifyPin(candidate);
      if (emp) {
        onUnlock(emp);
      } else {
        setError("Incorrect PIN");
        setPin("");
      }
    } catch (e) {
      setError(e.message || "Could not verify PIN — check your connection.");
      setPin("");
    }
    setChecking(false);
  }, [onUnlock]);

  const press = useCallback((k) => {
    if (checking) return;
    setError("");
    if (k === "⌫") { setPin((p) => p.slice(0, -1)); return; }
    if (k === "C") { setPin(""); return; }
    setPin((p) => {
      if (p.length >= 4) return p;
      const next = p + k;
      if (next.length === 4) submit(next);
      return next;
    });
  }, [checking, submit]);

  // Physical keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("⌫");
      else if (e.key === "Escape") press("C");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="nav-logo" style={{ fontSize: 26 }}>Q<span>POS</span></div>
        <div className="lock-title">Enter your PIN to unlock</div>
        <div className="lock-dots">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`lock-dot ${pin.length > i ? "filled" : ""}`} />
          ))}
        </div>
        <div className="lock-status">
          {checking ? "Checking…" : error ? <span className="lock-error">{error}</span> : " "}
        </div>
        <div className="numpad" style={{ maxWidth: 220, margin: "0 auto" }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((k) => (
            <button key={k} className="np-btn" style={{ fontSize: 16, padding: "14px 0" }}
              disabled={checking} onClick={() => press(k)}>{k}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 14 }}>
          🔒 Shift change? Ask a manager for your employee PIN.
        </div>
      </div>
    </div>
  );
}
