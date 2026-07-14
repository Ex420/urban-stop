import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Nav from "./components/Nav";
import PaymentModal from "./components/PaymentModal";
import Receipt from "./components/Receipt";
import LockScreen from "./components/LockScreen";
import Register from "./pages/Register";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import Sales from "./pages/Sales";
import AIAdvisor from "./pages/AIAdvisor";
import CustomerDisplay from "./pages/CustomerDisplay";
import Admin from "./pages/Admin";
import { PROVINCES, INITIAL_INVENTORY, calcTax } from "./data/constants";
import { generateSeedSales } from "./data/seedSales";
import * as inventoryApi from "./lib/inventoryApi";
import * as salesApi from "./lib/salesApi";
import * as auditLogApi from "./lib/auditLogApi";

const SURCHARGE = { cash: 0, debit: 0.25, credit: 0.50 };

export default function App() {
  const [page, setPage] = useState("pos");
  const [province, setProvince] = useState("ON");
  const [inventory, setInventory] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [payMethod, setPayMethod] = useState("cash");
  const [cashGiven, setCashGiven] = useState("");
  const [sales, setSales] = useState([]);
  const [pendingTxn, setPendingTxn] = useState(null); // completed payment awaiting post/training choice
  const [employee, setEmployee] = useState(null); // null = locked (PIN screen)
  const [lastReceipt, setLastReceipt] = useState(null);
  const [clock, setClock] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState("30d");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyLocked, setApiKeyLocked] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([{
    role: "ai",
    text: "Hi! I'm your store AI. I have full access to your sales data, inventory, and can run projections. Ask me anything — try 'What were my top selling items this week?' or 'Project next month revenue'.",
    time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }),
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ── Inventory UX state ──
  const [toast, setToast] = useState(null);
  const [invSort, setInvSort] = useState({ col: "name", dir: "asc" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [anaTab, setAnaTab] = useState("overview");
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeScanHit, setBarcodeScanHit] = useState(null);
  const [showCFDPreview, setShowCFDPreview] = useState(false);
  const barcodeInputRef = useRef(null);
  const toastTimeout = useRef(null);
  const broadcastRef = useRef(null);

  // ── Load inventory / sales / audit log from Supabase, seeding once if empty ──
  useEffect(() => {
    (async () => {
      try {
        let inv = await inventoryApi.fetchAll();
        if (inv.length === 0) {
          await inventoryApi.seed(INITIAL_INVENTORY);
          inv = await inventoryApi.fetchAll();
        }
        setInventory(inv);

        let salesData = await salesApi.fetchAll();
        if (salesData.length === 0) {
          await salesApi.seed(generateSeedSales());
          salesData = await salesApi.fetchAll();
        }
        setSales(salesData);

        const auditData = await auditLogApi.fetchAll();
        setAuditLog(auditData);

        setDataLoading(false);
      } catch (e) {
        setDataError(e.message || String(e));
      }
    })();
  }, []);

  // ── BroadcastChannel: syncs cart to Customer Display in real browser ──
  useEffect(() => {
    try { broadcastRef.current = new BroadcastChannel("qpos_cfd"); } catch (e) {}
    return () => broadcastRef.current?.close();
  }, []);

  const broadcastCart = useCallback((cartItems, totalsData, method, status = "active") => {
    try {
      broadcastRef.current?.postMessage({
        type: "CART_UPDATE", cart: cartItems, totals: totalsData,
        method, status, time: new Date().toISOString(), province,
      });
    } catch (e) {}
  }, [province]);

  const showToast = (msg, type = "success") => {
    clearTimeout(toastTimeout.current);
    setToast({ msg, type });
    toastTimeout.current = setTimeout(() => setToast(null), 3200);
  };

  const addAuditEntry = async (itemName, field, oldVal, newVal) => {
    const entry = await auditLogApi.insert({ editor: employee?.name || "Unknown", item: itemName, field, from: oldVal, to: newVal });
    setAuditLog((prev) => [entry, ...prev].slice(0, 500));
  };

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }));
    tick(); const t = setInterval(tick, 30000); return () => clearInterval(t);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs, chatLoading]);

  // Broadcast cart to customer display whenever it changes
  useEffect(() => {
    const b = baseTotals ?? { sub: 0, gst: 0, pst: 0, hst: 0, total: 0 };
    broadcastCart(cart, { ...b, surcharge, total: b.total + surcharge }, payMethod, cart.length > 0 ? "active" : "idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, payMethod]);

  // ── Date range helpers ──
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

  // Main Sales Log, Analytics, and all KPI calculations see ONLY posted
  // transactions — training (unposted) sales are visible on /admin only.
  const postedSales = useMemo(() => sales.filter((s) => s.posted), [sales]);

  const filteredSales = useMemo(() => {
    return postedSales.filter((s) => {
      const d = new Date(s.time);
      if (dateFrom && d < new Date(dateFrom + "T00:00:00")) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [postedSales, dateFrom, dateTo]);

  // ── Categories (derived live from inventory) ──
  const categories = useMemo(() => ["All", ...new Set(inventory.map((i) => i.category))], [inventory]);

  // ── Cart helpers ──
  const addToCart = useCallback((item) => {
    if (item.stock <= 0) return;
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);
  const changeQty = (id, delta) => setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)).filter((c) => c.qty > 0));
  const clearCart = () => setCart([]);

  // ── Tax totals ──
  const prov = PROVINCES[province];
  const cartWithTax = cart.map((item) => {
    const sub = item.price * item.qty;
    const tax = calcTax(sub, item.taxCat, province);
    return { ...item, subtotal: sub, ...tax, lineTotal: sub + tax.gst + tax.pst + tax.hst };
  });
  const surcharge = SURCHARGE[payMethod] || 0;
  const baseTotals = cartWithTax.reduce((a, c) => ({ sub: a.sub + c.subtotal, gst: a.gst + c.gst, pst: a.pst + c.pst, hst: a.hst + c.hst, total: a.total + c.lineTotal }), { sub: 0, gst: 0, pst: 0, hst: 0, total: 0 });
  const totals = { ...baseTotals, surcharge, total: baseTotals.total + surcharge };
  const change = parseFloat(cashGiven || 0) - totals.total;
  const taxLabel = prov.hst > 0 ? "HST" : (prov.gst > 0 && prov.pst > 0 ? "GST+PST" : prov.gst > 0 ? "GST" : "—");

  // ── Complete sale ──
  // Payment first builds a pending transaction, then a confirmation dialog
  // asks whether to post it (real sale) or save it as training. Only the
  // posted flag differs — everything else, including the stock deduction,
  // is identical for both.
  const completeSale = () => {
    const txn = {
      id: `TXN-${Date.now()}`, time: new Date().toISOString(), province, method: payMethod,
      items: [...cartWithTax], totals: { ...totals },
      cashGiven: payMethod === "cash" ? parseFloat(cashGiven) : null,
      change: payMethod === "cash" ? change : null,
      surcharge,
    };
    setPendingTxn(txn);
    setModal("post");
  };

  const finalizeSale = async (posted) => {
    if (!pendingTxn) return;
    const txn = { ...pendingTxn, posted };
    await salesApi.insert(txn);
    // Stock deduction happens regardless of posted status — training sales
    // still reduce inventory.
    for (const ci of txn.items) {
      const inv = inventory.find((i) => i.id === ci.id);
      if (inv) await inventoryApi.update(inv.id, { stock: Math.max(0, inv.stock - ci.qty) });
    }
    setInventory((prev) => prev.map((inv) => {
      const ci = txn.items.find((c) => c.id === inv.id);
      if (!ci) return inv;
      return { ...inv, stock: Math.max(0, inv.stock - ci.qty) };
    }));
    setSales((prev) => [txn, ...prev]);
    setLastReceipt(txn); setPendingTxn(null); setCart([]); setCashGiven(""); setModal("receipt");
    broadcastCart([], { sub: 0, gst: 0, pst: 0, hst: 0, surcharge: 0, total: 0 }, payMethod, "paid");
  };

  // ── Toggle a transaction's posted status (admin page only) ──
  const togglePosted = async (sale) => {
    const next = !sale.posted;
    await salesApi.setPosted(sale.id, next);
    setSales((prev) => prev.map((s) => (s.id === sale.id ? { ...s, posted: next } : s)));
    await addAuditEntry(sale.id, "posted", String(sale.posted), String(next));
    showToast(next ? `✅ ${sale.id} posted — now included in reports.` : `↩️ ${sale.id} marked as training — excluded from reports.`);
  };

  // ── Filtered items ──
  const items = inventory.filter((i) => {
    const mc = catFilter === "All" || i.category === catFilter;
    const ms = i.name.toLowerCase().includes(search.toLowerCase()) || (i.barcode || "").includes(search);
    return mc && ms;
  });

  // ── Analytics data ──
  const analytics = useMemo(() => {
    const byDay = {}; const byCat = {}; const byItem = {}; const byMethod = { cash: 0, debit: 0, credit: 0 };
    let totalRev = 0, totalTaxAmt = 0, totalCost = 0, totalSurcharge = 0;

    filteredSales.forEach((s) => {
      const day = s.time.split("T")[0];
      if (!byDay[day]) byDay[day] = { date: day, revenue: 0, transactions: 0, tax: 0, profit: 0, cost: 0 };
      byDay[day].revenue += s.totals.total;
      byDay[day].transactions += 1;
      byDay[day].tax += s.totals.gst + s.totals.pst + s.totals.hst;

      s.items.forEach((it) => {
        const c = it.category || "Other";
        if (!byCat[c]) byCat[c] = { name: c, revenue: 0, qty: 0, cost: 0, profit: 0 };
        byCat[c].revenue += it.lineTotal;
        byCat[c].qty += it.qty;
        byCat[c].cost += (it.cost || 0) * it.qty;
        byCat[c].profit += it.subtotal - (it.cost || 0) * it.qty;

        if (!byItem[it.id]) byItem[it.id] = {
          name: it.name, emoji: it.emoji, revenue: 0, qty: 0, id: it.id,
          cost: it.cost || 0, price: it.price || 0, subtotal: 0, taxPaid: 0, lineProfit: 0,
        };
        byItem[it.id].revenue += it.lineTotal;
        byItem[it.id].qty += it.qty;
        byItem[it.id].subtotal += it.subtotal;
        byItem[it.id].taxPaid += (it.hst || 0) + (it.gst || 0) + (it.pst || 0);
        byItem[it.id].lineProfit += it.subtotal - (it.cost || 0) * it.qty;

        const cost = (it.cost || 0) * it.qty;
        const profit = it.subtotal - cost;
        byDay[day].profit += profit;
        byDay[day].cost += cost;
        totalCost += cost;
      });

      byMethod[s.method] = (byMethod[s.method] || 0) + s.totals.total;
      totalRev += s.totals.total;
      totalTaxAmt += s.totals.gst + s.totals.pst + s.totals.hst;
      totalSurcharge += s.surcharge || 0;
    });

    const dailyArr = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
    const allItems = Object.values(byItem);

    // ── Week-over-week split ──
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const thisWeekSales = postedSales.filter((s) => new Date(s.time) >= weekAgo);
    const lastWeekSales = postedSales.filter((s) => new Date(s.time) >= twoWeeksAgo && new Date(s.time) < weekAgo);
    const thisWeekRev = thisWeekSales.reduce((a, s) => a + s.totals.total, 0);
    const lastWeekRev = lastWeekSales.reduce((a, s) => a + s.totals.total, 0);
    const wowChange = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev * 100) : 0;

    // ── Margin analysis per item ──
    const itemMargins = allItems.map((it) => {
      const margin = it.price > 0 ? ((it.price - it.cost) / it.price * 100) : 0;
      return { ...it, margin };
    });
    const lowMarginItems = itemMargins.filter((i) => i.margin < 20 && i.qty > 0).sort((a, b) => a.margin - b.margin).slice(0, 8);
    const highMarginItems = itemMargins.filter((i) => i.margin >= 40 && i.qty > 0).sort((a, b) => b.margin - a.margin).slice(0, 8);
    const topItems = allItems.sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    // ── Loss drivers ──
    const costHeavy = inventory.filter((i) => i.price > 0 && (i.cost / i.price) > 0.7).map((i) => ({
      ...i, costRatio: (i.cost / i.price * 100).toFixed(0), margin: ((i.price - i.cost) / i.price * 100).toFixed(0),
    }));

    const soldIds = new Set(allItems.map((i) => i.id));
    const deadStock = inventory.filter((i) => !soldIds.has(i.id) && i.stock > 0 && i.cost > 0).map((i) => ({
      ...i, capitalTied: (i.stock * i.cost).toFixed(2),
    }));

    const taxDragPct = totalRev > 0 ? (totalTaxAmt / totalRev * 100) : 0;

    const catArr = Object.values(byCat).map((c) => ({
      ...c,
      margin: c.revenue > 0 ? ((c.profit / c.revenue) * 100) : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // ── Hourly ──
    const byHour = Array(24).fill(0);
    filteredSales.forEach((s) => { const h = new Date(s.time).getHours(); byHour[h]++; });
    const hourlyArr = byHour.map((count, h) => ({ hour: `${h}:00`, count }));
    const peakHour = byHour.indexOf(Math.max(...byHour));

    // ── Day of week ──
    const byDow = Array(7).fill(0).map((_, i) => ({ day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i], rev: 0, txn: 0 }));
    filteredSales.forEach((s) => { const d = new Date(s.time).getDay(); byDow[d].rev += s.totals.total; byDow[d].txn += 1; });

    // ── Revenue concentration risk ──
    const top3Rev = topItems.slice(0, 3).reduce((a, i) => a + i.revenue, 0);
    const top3Pct = totalRev > 0 ? (top3Rev / totalRev * 100) : 0;

    // ── Average basket breakdown ──
    const methodArr = Object.entries(byMethod).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })).filter((x) => x.value > 0);

    // ── Profit margin trend (14-day) ──
    const profitTrend = dailyArr.slice(-14).map((d) => ({
      date: d.date,
      margin: d.revenue > 0 ? ((d.profit / d.revenue) * 100) : 0,
      profit: d.profit,
      revenue: d.revenue,
    }));

    return {
      dailyArr, topItems, catArr, methodArr, hourlyArr, byDow,
      totalRev, totalTaxAmt, totalCost,
      totalProfit: totalRev - totalCost - totalTaxAmt,
      txnCount: filteredSales.length,
      avgTxn: filteredSales.length ? totalRev / filteredSales.length : 0,
      lowMarginItems, highMarginItems, costHeavy, deadStock,
      taxDragPct, top3Pct, peakHour, wowChange, thisWeekRev, lastWeekRev,
      profitTrend, itemMargins,
      grossMarginPct: totalRev > 0 ? ((totalRev - totalCost) / totalRev * 100) : 0,
      netMarginPct: totalRev > 0 ? (((totalRev - totalCost - totalTaxAmt) / totalRev) * 100) : 0,
      totalSurcharge,
    };
  }, [filteredSales, inventory, postedSales]);

  // ── Inventory edit helpers ──
  const updateInv = async (id, field, rawVal) => {
    const numFields = ["price", "cost", "stock", "reorderAt"];
    const val = numFields.includes(field) ? (parseFloat(rawVal) || 0) : rawVal;
    const old = inventory.find((i) => i.id === id);
    if (!old) return;
    const oldVal = old[field];
    if (String(oldVal) === String(val)) return; // no change, no log
    setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
    await inventoryApi.update(id, { [field]: val });
    await addAuditEntry(old.name, field, oldVal, val);
  };

  const addNewItem = async () => {
    const newItemFields = { name: "New Item", price: 0, cost: 0, category: "Grocery", taxCat: "grocery_basic", stock: 0, reorderAt: 5, barcode: "", emoji: "📦" };
    const inserted = await inventoryApi.insert(newItemFields);
    setInventory((prev) => [...prev, inserted]);
    await addAuditEntry("New Item", "created", "—", "Added to inventory");
    showToast("✅ New item added — scroll to the bottom of the list to edit it.");
    // auto-sort to bottom so user sees it
    setInvSort({ col: "id", dir: "desc" });
  };

  const confirmDelete = (item) => setDeleteTarget(item);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    await inventoryApi.remove(deleteTarget.id);
    setInventory((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    await addAuditEntry(deleteTarget.name, "deleted", "—", "Removed from inventory");
    showToast(`🗑 "${deleteTarget.name}" deleted.`, "warn");
    setDeleteTarget(null);
  };

  // ── Barcode Scanner (keyboard-wedge) ──
  const handleBarcodeInput = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const matched = inventory.find((i) => i.barcode === trimmed);
    if (matched) {
      setBarcodeScanHit({ item: matched, newStock: matched.stock });
    } else {
      showToast(`⚠️ Barcode "${trimmed}" not found in inventory.`, "warn");
    }
  };

  const applyBarcodeStockUpdate = async () => {
    if (!barcodeScanHit) return;
    await updateInv(barcodeScanHit.item.id, "stock", barcodeScanHit.newStock);
    showToast(`✅ Stock updated — ${barcodeScanHit.item.name}: ${barcodeScanHit.newStock} units`);
    setBarcodeScanHit(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  // When entering barcode mode, auto-focus the hidden input
  useEffect(() => {
    if (barcodeMode) setTimeout(() => barcodeInputRef.current?.focus(), 100);
    else setBarcodeScanHit(null);
  }, [barcodeMode]);

  const sortedInventory = useMemo(() => {
    const { col, dir } = invSort;
    return [...inventory].sort((a, b) => {
      let av = a[col]; let bv = b[col];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [inventory, invSort]);

  const toggleSort = (col) => setInvSort((prev) => ({
    col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc",
  }));

  // ── AI Chat ──
  const buildContext = () => {
    const top5 = Object.entries(
      filteredSales.flatMap((s) => s.items).reduce((a, i) => { a[i.name] = (a[i.name] || 0) + i.qty; return a; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, q]) => `${n}: ${q} units`).join(", ");
    const lowStock = inventory.filter((i) => i.stock > 0 && i.stock <= 10).map((i) => `${i.name}(${i.stock})`).join(", ");
    const outStock = inventory.filter((i) => i.stock === 0).map((i) => i.name).join(", ");
    return `You are an AI assistant for a Canadian convenience store POS system called QPOS.
You have access to the following live store data:

SALES SUMMARY (${dateFrom || "all time"} to ${dateTo || "today"}):
- Total Revenue: ${analytics.totalRev.toFixed(2)}
- Total Transactions: ${analytics.txnCount}
- Average Transaction: ${analytics.avgTxn.toFixed(2)}
- Tax Collected: ${analytics.totalTaxAmt.toFixed(2)}
- Estimated Profit: ${analytics.totalProfit.toFixed(2)}

TOP SELLING ITEMS: ${top5 || "No data yet"}
LOW STOCK ITEMS: ${lowStock || "None"}
OUT OF STOCK: ${outStock || "None"}
TOTAL SKUS: ${inventory.length}

DAILY REVENUE (last 7 days):
${analytics.dailyArr.slice(-7).map((d) => `  ${d.date}: $${d.revenue.toFixed(2)} (${d.transactions} txns)`).join("\n")}

REVENUE BY CATEGORY:
${analytics.catArr.map((c) => `  ${c.name}: $${c.revenue.toFixed(2)}`).join("\n")}

PAYMENT METHODS: ${analytics.methodArr.map((m) => `${m.name}: $${m.value.toFixed(2)}`).join(", ")}

PROVINCE: Ontario (HST 13%)

You can:
- Analyze sales trends and patterns
- Identify top/underperforming products
- Suggest reorder priorities
- Project future revenue based on trends
- Calculate tax obligations
- Recommend pricing strategies
- Identify peak hours and days
- Flag inventory risks

Be concise, data-driven, and actionable. Use actual numbers from the data above.`;
  };

  const sendChat = async (text) => {
    if (!text.trim() || chatLoading) return;
    if (!apiKey) { setChatMsgs((p) => [...p, { role: "ai", text: "⚠️ Please enter your Anthropic API key in the panel on the right to enable AI features.", time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) }]); return; }
    const userMsg = { role: "user", text: text.trim(), time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) };
    setChatMsgs((p) => [...p, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const history = chatMsgs.filter((m) => m.role !== "ai" || !m.text.startsWith("Hi!")).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          system: buildContext(),
          messages: [...history, { role: "user", content: text.trim() }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.content?.[0]?.text || "No response.";
      setChatMsgs((p) => [...p, { role: "ai", text: reply, time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) }]);
    } catch (e) {
      setChatMsgs((p) => [...p, { role: "ai", text: `❌ Error: ${e.message}. Check your API key.`, time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) }]);
    }
    setChatLoading(false);
  };

  // ── Customer window mode (URL ?mode=customer) ──
  const isCustomerWindow = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "customer";

  // ── Hidden admin page (URL /admin — deliberately absent from the nav).
  // Route hiding is cosmetic only; real access control is the owner-role
  // re-check inside <Admin> plus (eventually) Supabase RLS policies.
  const isAdminWindow = typeof window !== "undefined" &&
    window.location.pathname.replace(/\/+$/, "") === "/admin";

  const [cfdState, setCfdState] = useState({
    cart: [], totals: { sub: 0, gst: 0, pst: 0, hst: 0, surcharge: 0, total: 0 },
    status: "idle", method: "cash", province: "ON",
  });

  useEffect(() => {
    if (!isCustomerWindow) return;
    let ch;
    try {
      ch = new BroadcastChannel("qpos_cfd");
      ch.onmessage = (e) => {
        if (e.data?.type === "CART_UPDATE") {
          setCfdState({
            cart: e.data.cart || [], totals: e.data.totals || {},
            status: e.data.status, method: e.data.method, province: e.data.province || "ON",
          });
        }
      };
    } catch (err) {}
    return () => ch?.close();
  }, [isCustomerWindow]);

  if (isCustomerWindow) {
    return (
      <CustomerDisplay liveCart={cfdState.cart} liveTotals={cfdState.totals}
        liveStatus={cfdState.status} liveMethod={cfdState.method} liveProv={cfdState.province} clock={clock} />
    );
  }

  if (dataError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 10, color: "var(--accent)", fontFamily: "var(--font)", padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>⚠️ Could not load store data</div>
        <div style={{ color: "var(--muted)", fontSize: 13, maxWidth: 480 }}>{dataError}</div>
        <div style={{ color: "var(--muted)", fontSize: 11, maxWidth: 480 }}>Check your Supabase URL/key in .env and that the inventory, sales, sale_items, and audit_log tables exist.</div>
      </div>
    );
  }

  // PIN lock screen — the POS (and admin page) is unusable until an active
  // employee unlocks it. The customer display window above never locks.
  if (!employee) {
    return <LockScreen onUnlock={setEmployee} />;
  }

  if (dataLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "var(--font)" }}>
        Loading QPOS…
      </div>
    );
  }

  if (isAdminWindow) {
    return (
      <>
        <nav className="nav">
          <div className="nav-logo">Q<span>POS</span></div>
          <div className="nav-right">
            <span style={{ fontSize: 11, color: "var(--muted)" }}>👤 <strong style={{ color: "var(--text)" }}>{employee.name}</strong></span>
            <button className="nav-tab" style={{ borderRadius: 6, border: "1px solid var(--border)", fontSize: 11, padding: "4px 10px" }}
              onClick={() => setEmployee(null)} title="Lock">🔒 Lock</button>
            <span className="clock">{clock}</span>
          </div>
        </nav>
        <Admin employee={employee} sales={sales} onTogglePosted={togglePosted} addAuditEntry={addAuditEntry} showToast={showToast} />
        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      </>
    );
  }

  const lowStockCount = inventory.filter((i) => i.stock > 0 && i.stock <= 10).length;

  return (
    <>
      <Nav page={page} setPage={setPage} province={province} setProvince={setProvince} clock={clock}
        onShowCFDPreview={() => setShowCFDPreview(true)} employee={employee} onLock={() => setEmployee(null)} />

      {page === "pos" && (
        <Register
          search={search} setSearch={setSearch}
          catFilter={catFilter} setCatFilter={setCatFilter}
          categories={categories} items={items} addToCart={addToCart} prov={prov}
          cart={cart} cartWithTax={cartWithTax} changeQty={changeQty}
          totals={totals} surcharge={surcharge} payMethod={payMethod} taxLabel={taxLabel}
          clearCart={clearCart} onCharge={() => setModal("payment")}
        />
      )}

      {page === "inventory" && (
        <Inventory
          editorName={employee.name}
          barcodeMode={barcodeMode} setBarcodeMode={setBarcodeMode}
          showAudit={showAudit} setShowAudit={setShowAudit} auditLog={auditLog} addNewItem={addNewItem}
          barcodeInputRef={barcodeInputRef} handleBarcodeInput={handleBarcodeInput}
          barcodeScanHit={barcodeScanHit} setBarcodeScanHit={setBarcodeScanHit} applyBarcodeStockUpdate={applyBarcodeStockUpdate}
          sortedInventory={sortedInventory} invSort={invSort} toggleSort={toggleSort} updateInv={updateInv} confirmDelete={confirmDelete}
        />
      )}

      {page === "analytics" && (
        <Analytics
          analytics={analytics} inventory={inventory}
          dateFrom={dateFrom} dateTo={dateTo} datePreset={datePreset}
          setDateFrom={setDateFrom} setDateTo={setDateTo} setDatePreset={setDatePreset} applyPreset={applyPreset}
          anaTab={anaTab} setAnaTab={setAnaTab}
        />
      )}

      {page === "sales" && (
        <Sales
          filteredSales={filteredSales} totalRev={analytics.totalRev}
          dateFrom={dateFrom} dateTo={dateTo} datePreset={datePreset}
          setDateFrom={setDateFrom} setDateTo={setDateTo} setDatePreset={setDatePreset} applyPreset={applyPreset}
        />
      )}

      {page === "ai" && (
        <AIAdvisor
          chatMsgs={chatMsgs} chatLoading={chatLoading} chatInput={chatInput} setChatInput={setChatInput}
          sendChat={sendChat} chatEndRef={chatEndRef}
          apiKey={apiKey} setApiKey={setApiKey} apiKeyLocked={apiKeyLocked} setApiKeyLocked={setApiKeyLocked}
          dateFrom={dateFrom} dateTo={dateTo} analytics={analytics}
          inventoryCount={inventory.length} lowStockCount={lowStockCount}
        />
      )}

      <PaymentModal
        open={modal === "payment"} baseTotals={baseTotals} prov={prov} payMethod={payMethod} setPayMethod={setPayMethod}
        surcharge={surcharge} totals={totals} cashGiven={cashGiven} setCashGiven={setCashGiven} change={change}
        onClose={() => setModal(null)} onComplete={completeSale}
      />

      <Receipt open={modal === "receipt"} receipt={lastReceipt} onClose={() => setModal(null)} onNewSale={() => { setModal(null); setPage("pos"); }} />

      {modal === "post" && pendingTxn && (
        <div className="modal-backdrop">
          <div className="del-modal">
            <div className="del-modal-title">🧾 Post this transaction?</div>
            <div className="del-modal-sub">
              <strong>{pendingTxn.id}</strong> · {`$${pendingTxn.totals.total.toFixed(2)}`}<br />
              <strong>Post</strong> records it as a real sale (counted in reports).<br />
              <strong>Save as Training</strong> keeps it out of the Sales Log and analytics.<br />
              Stock is deducted either way.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-secondary" style={{ minWidth: 130 }} onClick={() => finalizeSale(false)}>Save as Training</button>
              <button className="btn btn-green" style={{ minWidth: 130 }} onClick={() => finalizeSale(true)}>✓ Post</button>
            </div>
          </div>
        </div>
      )}

      {showCFDPreview && (
        <div className="cfd-preview-modal">
          <div className="cfd-preview-bar">
            <div className="cfd-preview-label">🖥 Customer Facing Display — Live Preview</div>
            <div className="cfd-preview-sub">
              This is exactly what your customer sees. Add items on the Register to watch it update.
              &nbsp;|&nbsp;
              <strong style={{ color: "var(--green)" }}>Real setup:</strong> open
              <code style={{ margin: "0 4px", fontSize: 10, color: "var(--accent2)" }}>{window.location.href.split("?")[0]}?mode=customer</code>
              on your second monitor, then use this window as the POS.
            </div>
            <button className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 12px", flexShrink: 0 }}
              onClick={() => {
                const url = window.location.href.split("?")[0] + "?mode=customer";
                navigator.clipboard?.writeText(url);
                showToast("URL copied — paste it into a browser on your second screen");
              }}>📋 Copy URL</button>
            <button className="btn btn-primary" style={{ fontSize: 11, padding: "5px 12px", flexShrink: 0 }}
              onClick={() => setShowCFDPreview(false)}>✕ Close</button>
          </div>
          <div className="cfd-preview-content">
            <CustomerDisplay
              liveCart={cartWithTax}
              liveTotals={totals}
              liveStatus={cart.length > 0 ? "active" : "idle"}
              liveMethod={payMethod}
              liveProv={province}
              clock={clock}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-modal-title">🗑 Delete Item?</div>
            <div className="del-modal-sub">
              You're about to permanently delete <strong>"{deleteTarget.name}"</strong>.<br />
              This cannot be undone. Sales history won't be affected.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-secondary" style={{ minWidth: 100 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ minWidth: 100 }} onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
