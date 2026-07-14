import { fmt } from "../utils/format";

const QUICK_PROMPTS = [
  "What are my top 5 selling items this month?",
  "Which category generates the most revenue?",
  "What are my peak hours?",
  "Project next month's revenue based on current trends",
  "Which items should I restock urgently?",
  "What's my estimated tax obligation for this period?",
  "Which items have the lowest profit margin?",
  "Suggest 3 ways to increase average transaction value",
];

export default function AIAdvisor({
  chatMsgs, chatLoading, chatInput, setChatInput, sendChat, chatEndRef,
  apiKey, setApiKey, apiKeyLocked, setApiKeyLocked,
  dateFrom, dateTo, analytics, inventoryCount, lowStockCount,
}) {
  return (
    <div className="chat-layout">
      <div className="chat-main">
        <div className="chat-messages">
          {chatMsgs.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              <div className={`msg-bubble ${m.role}`} style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              <div className="msg-time">{m.time}</div>
            </div>
          ))}
          {chatLoading && (
            <div className="chat-msg ai">
              <div className="msg-bubble ai">
                <div className="typing">
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-area">
          <div className="chat-input-row">
            <textarea className="chat-input" rows={2} placeholder="Ask about your sales, inventory, projections…"
              value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(chatInput); } }} />
            <button className="chat-send" disabled={chatLoading || !chatInput.trim()} onClick={() => sendChat(chatInput)}>↑</button>
          </div>
        </div>
      </div>
      <div className="chat-panel">
        <div className="api-key-panel">
          <div className="api-key-label">🔑 Anthropic API Key</div>
          <input className="api-key-input" type={apiKeyLocked ? "password" : "text"}
            placeholder="sk-ant-…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <div className="api-key-row">
            <button className="btn btn-secondary" style={{ fontSize: 10, padding: "4px 10px" }}
              onClick={() => setApiKeyLocked((p) => !p)}>{apiKeyLocked ? "Show" : "Hide"}</button>
            <span className={`api-status ${apiKey.startsWith("sk-ant") ? "ok" : "err"}`}>
              {apiKey.startsWith("sk-ant") ? "● Connected" : "● Not set"}
            </span>
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 6 }}>Key stays in-browser only. For production, move to environment variable.</div>
        </div>

        <div className="chat-panel-title">Quick Questions</div>
        {QUICK_PROMPTS.map((q, i) => (
          <button key={i} className="quick-btn" onClick={() => sendChat(q)}>{q}</button>
        ))}

        <div className="chat-panel-title" style={{ marginTop: 14 }}>Live Context</div>
        <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.6 }}>
          <div>📅 Range: {dateFrom || "All"} → {dateTo || "Today"}</div>
          <div>💰 Revenue: {fmt(analytics.totalRev)}</div>
          <div>🧾 Transactions: {analytics.txnCount}</div>
          <div>📦 SKUs: {inventoryCount}</div>
          <div>⚠️ Low stock: {lowStockCount}</div>
        </div>
      </div>
    </div>
  );
}
