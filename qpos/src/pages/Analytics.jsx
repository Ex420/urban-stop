import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import DateFilters from "../components/DateFilters";
import { CHART_COLORS } from "../data/constants";
import { fmt, fmtShort } from "../utils/format";

const ANA_TABS = [["overview", "📈 Overview"], ["profit", "💸 Profit Drivers"], ["risk", "⚠️ Risk Alerts"], ["performance", "🏆 Performance"]];

export default function Analytics({
  analytics, inventory, dateFrom, dateTo, datePreset, setDateFrom, setDateTo, setDatePreset, applyPreset, anaTab, setAnaTab,
}) {
  return (
    <div className="main-area" style={{ height: "calc(100vh - 52px)", overflowY: "auto" }}>
      <div className="page-header">
        <div className="page-title">📊 Business Intelligence</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {analytics.wowChange !== 0 && (
            <span className={`wow-pill ${analytics.wowChange > 0 ? "up" : analytics.wowChange < -2 ? "down" : "flat"}`}>
              {analytics.wowChange > 0 ? "↑" : "↓"} {Math.abs(analytics.wowChange).toFixed(1)}% vs last week
            </span>
          )}
        </div>
      </div>
      <DateFilters dateFrom={dateFrom} dateTo={dateTo} datePreset={datePreset} setDateFrom={setDateFrom} setDateTo={setDateTo} setDatePreset={setDatePreset} applyPreset={applyPreset} />

      <div className="ana-tabs">
        {ANA_TABS.map(([id, label]) => (
          <button key={id} className={`ana-tab ${anaTab === id ? "active" : ""}`} onClick={() => setAnaTab(id)}>{label}</button>
        ))}
      </div>

      {anaTab === "overview" && <>
        <div className="stat-grid">
          <div className="stat-card s-green">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-val green">{fmtShort(analytics.totalRev)}</div>
            <div className="stat-change">{analytics.txnCount} transactions</div>
          </div>
          <div className="stat-card s-orange">
            <div className="stat-label">Gross Profit</div>
            <div className="stat-val orange">{fmtShort(analytics.totalProfit)}</div>
            <div className="stat-change">{analytics.grossMarginPct.toFixed(1)}% gross margin</div>
          </div>
          <div className="stat-card s-blue">
            <div className="stat-label">Avg Transaction</div>
            <div className="stat-val">{fmt(analytics.avgTxn)}</div>
            <div className="stat-change">Per sale</div>
          </div>
          <div className="stat-card s-purple">
            <div className="stat-label">Tax Collected</div>
            <div className="stat-val">{fmtShort(analytics.totalTaxAmt)}</div>
            <div className="stat-change">{analytics.taxDragPct.toFixed(1)}% of revenue</div>
          </div>
          <div className="stat-card s-red">
            <div className="stat-label">Cost of Goods</div>
            <div className="stat-val red">{fmtShort(analytics.totalCost)}</div>
            <div className="stat-change">{analytics.totalRev > 0 ? (analytics.totalCost / analytics.totalRev * 100).toFixed(1) : 0}% of revenue</div>
          </div>
          <div className="stat-card s-green">
            <div className="stat-label">Net Margin</div>
            <div className={`stat-val ${analytics.netMarginPct > 15 ? "green" : analytics.netMarginPct > 5 ? "orange" : "red"}`}>{analytics.netMarginPct.toFixed(1)}%</div>
            <div className="stat-change">After cost + tax</div>
          </div>
          <div className="stat-card s-blue">
            <div className="stat-label">Card Surcharges</div>
            <div className="stat-val" style={{ color: "var(--accent2)" }}>{fmt(analytics.totalSurcharge || 0)}</div>
            <div className="stat-change">Debit $0.25 · Credit $0.50</div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Revenue vs Cost vs Profit — Daily</div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={analytics.dailyArr} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2ec4b6" stopOpacity={0.25} /><stop offset="95%" stopColor="#2ec4b6" stopOpacity={0} /></linearGradient>
                <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e63946" stopOpacity={0.2} /><stop offset="95%" stopColor="#e63946" stopOpacity={0} /></linearGradient>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f4a261" stopOpacity={0.25} /><stop offset="95%" stopColor="#f4a261" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,50,80,.5)" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fill: "var(--muted)", fontSize: 9 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2ec4b6" strokeWidth={2} fill="url(#gRev)" />
              <Area type="monotone" dataKey="cost" name="Cost" stroke="#e63946" strokeWidth={1.5} fill="url(#gCost)" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#f4a261" strokeWidth={2} fill="url(#gProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-title">Revenue by Day of Week</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.byDow} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,50,80,.5)" />
                <XAxis dataKey="day" tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="rev" name="Revenue" radius={[4, 4, 0, 0]}>
                  {analytics.byDow.map((d, i) => <Cell key={i} fill={d.rev === Math.max(...analytics.byDow.map((x) => x.rev)) ? "#2ec4b6" : "#457b9d"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-title">Transactions by Hour</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.hourlyArr} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,50,80,.5)" />
                <XAxis dataKey="hour" tick={{ fill: "var(--muted)", fontSize: 8 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" name="Transactions" radius={[3, 3, 0, 0]}>
                  {analytics.hourlyArr.map((d, i) => <Cell key={i} fill={d.count === Math.max(...analytics.hourlyArr.map((x) => x.count)) ? "#f4a261" : "#2e3250"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>}

      {anaTab === "profit" && <>
        <div className="insight-grid">
          <div className={`insight-card ${analytics.grossMarginPct < 25 ? "danger" : analytics.grossMarginPct < 40 ? "warn" : "good"}`}>
            <div className="insight-title">Gross Margin</div>
            <div className={`insight-value ${analytics.grossMarginPct < 25 ? "danger" : analytics.grossMarginPct < 40 ? "warn" : "good"}`}>{analytics.grossMarginPct.toFixed(1)}%</div>
            <div className="insight-body">
              {analytics.grossMarginPct < 25
                ? <><strong>Below healthy range.</strong> Convenience stores typically target 25–40%. Your cost of goods is eating {(100 - analytics.grossMarginPct).toFixed(0)}¢ of every dollar earned.</>
                : analytics.grossMarginPct < 40
                ? <>Margin is <strong>acceptable but improvable.</strong> Review your lowest-margin items below — even a 5% improvement on high-volume items compounds fast.</>
                : <><strong>Strong margin.</strong> You're keeping {analytics.grossMarginPct.toFixed(0)}¢ per dollar after cost of goods. Protect this by monitoring supplier price creep.</>}
            </div>
          </div>
          <div className={`insight-card ${analytics.taxDragPct > 12 ? "warn" : "info"}`}>
            <div className="insight-title">Tax Drag</div>
            <div className={`insight-value ${analytics.taxDragPct > 12 ? "warn" : "good"}`}>{analytics.taxDragPct.toFixed(1)}%</div>
            <div className="insight-body">
              {fmt(analytics.totalTaxAmt)} collected in HST/GST/PST this period. <strong>This is not profit — it flows to CRA.</strong> If your cash flow feels tighter than your revenue suggests, tax drag is likely why. Consider pushing more volume in tax-exempt categories (basic groceries, lottery).
            </div>
          </div>
          <div className={`insight-card ${analytics.top3Pct > 60 ? "danger" : analytics.top3Pct > 40 ? "warn" : "good"}`}>
            <div className="insight-title">Revenue Concentration</div>
            <div className={`insight-value ${analytics.top3Pct > 60 ? "danger" : "warn"}`}>{analytics.top3Pct.toFixed(0)}%</div>
            <div className="insight-body">
              Your top 3 items drive <strong>{analytics.top3Pct.toFixed(0)}% of all revenue.</strong>
              {analytics.top3Pct > 60
                ? " This is a concentration risk. If one item goes out of stock or a supplier raises prices, your revenue drops hard."
                : " Healthy spread, but keep an eye on your top sellers — losing one would hurt."}
            </div>
          </div>
          <div className={`insight-card ${analytics.wowChange < -5 ? "danger" : analytics.wowChange < 0 ? "warn" : "good"}`}>
            <div className="insight-title">Week-over-Week Trend</div>
            <div className={`insight-value ${analytics.wowChange >= 0 ? "good" : "danger"}`}>{analytics.wowChange >= 0 ? "+" : ""}{analytics.wowChange.toFixed(1)}%</div>
            <div className="insight-body">
              This week: <strong>{fmt(analytics.thisWeekRev)}</strong> vs last week: <strong>{fmt(analytics.lastWeekRev)}</strong>.
              {analytics.wowChange < -5 ? " Revenue is declining — check if this is a seasonal pattern or a real problem."
                : analytics.wowChange < 0 ? " Slight dip. Monitor over the next week before acting."
                : " Growth is positive. Stay consistent with what's working."}
            </div>
          </div>
        </div>

        <div className="section-label">💸 Items Killing Your Margin (under 20%)</div>
        {analytics.lowMarginItems.length === 0
          ? <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 14 }}>No low-margin items sold in this period. Good.</div>
          : <div className="alert-panel">
              <div className="alert-panel-header">
                <div className="alert-panel-title">These items have the lowest profit margin</div>
                <span className="alert-count">{analytics.lowMarginItems.length} items</span>
              </div>
              {analytics.lowMarginItems.map((it) => (
                <div key={it.id} className="alert-row">
                  <div className="alert-left">
                    <div className="alert-name">{it.emoji} {it.name}</div>
                    <div className="alert-desc">Price {fmt(it.price)} · Cost {fmt(it.cost)} · Sold {it.qty} units</div>
                  </div>
                  <div className="alert-right">
                    <div className="r1" style={{ color: "var(--accent)" }}>{it.margin.toFixed(0)}% margin</div>
                    <div className="r2">Made {fmt(it.lineProfit)} profit</div>
                    <div style={{ marginTop: 4 }}>
                      <div className="margin-bar-wrap">
                        <div className="margin-bar-bg"><div className="margin-bar-fill" style={{ width: `${Math.max(0, it.margin)}%`, background: "var(--accent)" }} /></div>
                        <span className="margin-val" style={{ color: "var(--accent)" }}>{it.margin.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>}

        <div className="section-label">🌟 Your Best Margin Items (over 40%)</div>
        {analytics.highMarginItems.length === 0
          ? <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 14 }}>No high-margin items sold this period.</div>
          : <div className="alert-panel">
              <div className="alert-panel-header">
                <div className="alert-panel-title">Push these — they make you the most money per sale</div>
                <span className="alert-count good">{analytics.highMarginItems.length} items</span>
              </div>
              {analytics.highMarginItems.map((it) => (
                <div key={it.id} className="alert-row">
                  <div className="alert-left">
                    <div className="alert-name">{it.emoji} {it.name}</div>
                    <div className="alert-desc">Price {fmt(it.price)} · Cost {fmt(it.cost)} · Sold {it.qty} units</div>
                  </div>
                  <div className="alert-right">
                    <div className="r1" style={{ color: "var(--green)" }}>{it.margin.toFixed(0)}% margin</div>
                    <div className="r2">Made {fmt(it.lineProfit)} profit</div>
                    <div style={{ marginTop: 4 }}>
                      <div className="margin-bar-wrap">
                        <div className="margin-bar-bg"><div className="margin-bar-fill" style={{ width: `${Math.min(100, it.margin)}%`, background: "var(--green)" }} /></div>
                        <span className="margin-val" style={{ color: "var(--green)" }}>{it.margin.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>}

        <div className="section-label">📊 Category Profit Margin Breakdown</div>
        <div className="alert-panel">
          <div className="alert-panel-header"><div className="alert-panel-title">Gross margin by category</div></div>
          {analytics.catArr.map((c, i) => (
            <div key={i} className="alert-row">
              <div className="alert-left">
                <div className="alert-name">{c.name}</div>
                <div className="alert-desc">{c.qty} units · Cost {fmt(c.cost)} · Profit {fmt(c.profit)}</div>
              </div>
              <div className="alert-right" style={{ minWidth: 160 }}>
                <div className="r1" style={{ color: c.margin < 15 ? "var(--accent)" : c.margin < 30 ? "var(--accent2)" : "var(--green)" }}>{c.margin.toFixed(1)}%</div>
                <div style={{ marginTop: 4 }}>
                  <div className="margin-bar-wrap">
                    <div className="margin-bar-bg"><div className="margin-bar-fill" style={{ width: `${Math.min(100, Math.max(0, c.margin))}%`, background: c.margin < 15 ? "var(--accent)" : c.margin < 30 ? "var(--accent2)" : "var(--green)" }} /></div>
                    <span className="margin-val">{fmt(c.revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>}

      {anaTab === "risk" && <>
        <div className="insight-grid">
          <div className={`insight-card ${analytics.costHeavy.length > 5 ? "danger" : "warn"}`}>
            <div className="insight-title">High Cost-Ratio Items</div>
            <div className={`insight-value ${analytics.costHeavy.length > 0 ? "danger" : "good"}`}>{analytics.costHeavy.length}</div>
            <div className="insight-body">Items where your cost is over 70% of the selling price. <strong>You're barely covering supplier cost</strong> on these — any shrinkage, spoilage, or theft on them is a direct net loss.</div>
          </div>
          <div className={`insight-card ${analytics.deadStock.length > 5 ? "danger" : analytics.deadStock.length > 0 ? "warn" : "good"}`}>
            <div className="insight-title">Dead Stock</div>
            <div className={`insight-value ${analytics.deadStock.length > 0 ? "warn" : "good"}`}>{analytics.deadStock.length}</div>
            <div className="insight-body">Items currently in stock that had <strong>zero sales</strong> in the selected period. This is capital sitting on your shelf doing nothing — and it may expire or go unsellable.</div>
          </div>
          <div className={`insight-card ${inventory.filter((i) => i.stock === 0).length > 3 ? "danger" : "warn"}`}>
            <div className="insight-title">Out of Stock</div>
            <div className={`insight-value ${inventory.filter((i) => i.stock === 0).length > 0 ? "danger" : "good"}`}>{inventory.filter((i) => i.stock === 0).length}</div>
            <div className="insight-body"><strong>Every out-of-stock item is lost revenue.</strong> If a customer comes in for it and you don't have it, they leave — and sometimes don't come back. These need immediate attention.</div>
          </div>
          <div className={`insight-card ${inventory.filter((i) => i.reorderAt > 0 && i.stock <= i.reorderAt && i.stock > 0).length > 0 ? "warn" : "good"}`}>
            <div className="insight-title">At Reorder Point</div>
            <div className="insight-value warn">{inventory.filter((i) => i.reorderAt > 0 && i.stock <= i.reorderAt && i.stock > 0).length}</div>
            <div className="insight-body">Items that have hit your custom reorder threshold. Order these <strong>before</strong> they hit zero — lead time from your supplier means you'll be stocked out for days if you wait.</div>
          </div>
        </div>

        {analytics.costHeavy.length > 0 && <>
          <div className="section-label">🔴 High Cost-Ratio Items — Risk of Loss on Any Shrinkage</div>
          <div className="alert-panel">
            <div className="alert-panel-header">
              <div className="alert-panel-title">Cost is over 70% of price — thin ice</div>
              <span className="alert-count">{analytics.costHeavy.length}</span>
            </div>
            {analytics.costHeavy.map((it) => (
              <div key={it.id} className="alert-row">
                <div className="alert-left">
                  <div className="alert-name">{it.emoji} {it.name}</div>
                  <div className="alert-desc">You pay {fmt(it.cost)} · Sell for {fmt(it.price)} · Stock: {it.stock} units</div>
                </div>
                <div className="alert-right">
                  <div className="r1" style={{ color: "var(--accent)" }}>Only {it.margin}% margin</div>
                  <div className="r2">Cost is {it.costRatio}% of price</div>
                  <div className="r2" style={{ color: "var(--accent2)" }}>Consider raising price or renegotiating cost</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {analytics.deadStock.length > 0 && <>
          <div className="section-label">🪦 Dead Stock — Capital Trapped on Your Shelf</div>
          <div className="alert-panel">
            <div className="alert-panel-header">
              <div className="alert-panel-title">In stock but zero sales in selected period</div>
              <span className="alert-count warn">{analytics.deadStock.length}</span>
            </div>
            {analytics.deadStock.map((it) => (
              <div key={it.id} className="alert-row">
                <div className="alert-left">
                  <div className="alert-name">{it.emoji} {it.name}</div>
                  <div className="alert-desc">{it.stock} units × {fmt(it.cost)} cost = capital tied up</div>
                </div>
                <div className="alert-right">
                  <div className="r1" style={{ color: "var(--accent2)" }}>{fmt(it.capitalTied)} locked up</div>
                  <div className="r2">0 units sold this period</div>
                  <div className="r2" style={{ color: "var(--muted)" }}>Discount, relocate, or discontinue</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {inventory.filter((i) => i.stock === 0).length > 0 && <>
          <div className="section-label">⛔ Out of Stock — Revenue You're Leaving on the Table</div>
          <div className="alert-panel">
            <div className="alert-panel-header">
              <div className="alert-panel-title">These items cannot be sold right now</div>
              <span className="alert-count">{inventory.filter((i) => i.stock === 0).length}</span>
            </div>
            {inventory.filter((i) => i.stock === 0).map((it) => (
              <div key={it.id} className="alert-row">
                <div className="alert-left">
                  <div className="alert-name">{it.emoji} {it.name}</div>
                  <div className="alert-desc">{it.category} · Reorder at: {it.reorderAt || "not set"}</div>
                </div>
                <div className="alert-right">
                  <div className="r1" style={{ color: "var(--accent)" }}>⛔ Out of stock</div>
                  <div className="r2">Selling price: {fmt(it.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        <div className="section-label">📋 What to Watch</div>
        <div className="chart-card">
          <div style={{ fontSize: 12, lineHeight: 1.8, color: "var(--muted)" }}>
            {[
              analytics.grossMarginPct < 25 && { icon: "🔴", text: `Your gross margin is ${analytics.grossMarginPct.toFixed(1)}% — below the 25% minimum for a healthy convenience store. Review your top 10 items for cost renegotiation opportunities.` },
              analytics.taxDragPct > 12 && { icon: "🟠", text: `Tax takes ${analytics.taxDragPct.toFixed(1)}% of your revenue. Push basic groceries (tax-exempt) volume to improve cash retention without raising prices.` },
              analytics.deadStock.length > 0 && { icon: "🟠", text: `${analytics.deadStock.length} items are sitting unsold. That's ${fmt(analytics.deadStock.reduce((a, i) => a + parseFloat(i.capitalTied), 0))} in tied-up cash. Run a clearance price on these.` },
              analytics.top3Pct > 60 && { icon: "🟠", text: `${analytics.top3Pct.toFixed(0)}% of your revenue comes from 3 items. A supplier disruption on any of them creates serious cashflow risk.` },
              analytics.wowChange < -5 && { icon: "🔴", text: `Revenue dropped ${Math.abs(analytics.wowChange).toFixed(1)}% week-over-week. Investigate whether specific items or days are responsible.` },
              analytics.costHeavy.length > 3 && { icon: "🟡", text: `${analytics.costHeavy.length} items have cost ratios above 70%. Even small theft or spoilage on these results in a net loss.` },
              analytics.peakHour >= 0 && { icon: "ℹ️", text: `Your busiest hour is ${analytics.peakHour}:00–${analytics.peakHour + 1}:00. Make sure you're fully stocked and staffed for that window.` },
            ].filter(Boolean).map((a, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 10 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                <span style={{ color: "var(--text)" }}>{a.text}</span>
              </div>
            ))}
            {analytics.grossMarginPct >= 25 && analytics.deadStock.length === 0 && analytics.wowChange >= 0 &&
              <div style={{ color: "var(--green)", padding: "8px 0" }}>✅ No critical issues detected in this period.</div>}
          </div>
        </div>
      </>}

      {anaTab === "performance" && <>
        <div className="section-label">🏆 Top Items by Revenue</div>
        <div className="alert-panel">
          <div className="alert-panel-header"><div className="alert-panel-title">Best sellers this period</div></div>
          {analytics.topItems.map((it, i) => (
            <div key={it.id} className="alert-row">
              <div className="alert-left">
                <div className="alert-name"><span style={{ color: "var(--muted)", marginRight: 8 }}>#{i + 1}</span>{it.emoji} {it.name}</div>
                <div className="alert-desc">{it.qty} units sold</div>
              </div>
              <div className="alert-right">
                <div className="r1" style={{ color: "var(--green)" }}>{fmt(it.revenue)}</div>
                <div className="r2">{fmt(it.lineProfit)} profit</div>
                <div style={{ marginTop: 4 }}>
                  <div className="margin-bar-wrap">
                    <div className="margin-bar-bg"><div className="margin-bar-fill" style={{ width: `${analytics.totalRev > 0 ? (it.revenue / analytics.totalRev * 100) * 3 : 0}%`, background: "var(--green)", maxWidth: "100%" }} /></div>
                    <span className="margin-val">{analytics.totalRev > 0 ? (it.revenue / analytics.totalRev * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="section-label">📉 Profit Margin Trend (Last 14 Days)</div>
        <div className="chart-card">
          <div className="chart-title">Daily profit margin % — should stay above 20%</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.profitTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,50,80,.5)" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fill: "var(--muted)", fontSize: 9 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip formatter={(v, n) => [`${v.toFixed(1)}%`, n]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="margin" name="Margin %" stroke="#f4a261" strokeWidth={2} dot={{ r: 3, fill: "#f4a261" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-title">Category Revenue Share</div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={analytics.catArr} cx="50%" cy="50%" outerRadius={75} dataKey="revenue"
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""} labelLine={false} fontSize={9}>
                  {analytics.catArr.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-title">Payment Method Split</div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={analytics.methodArr} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {analytics.methodArr.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>}
    </div>
  );
}
