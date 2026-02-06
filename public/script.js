// ============================================================================
// AI TRADING COACH - Frontend Script (FINAL VERSION - BUG FIXED)
// Cloudflare Pages Ready | Backend: Render
// ============================================================================

const BASE_URL = "https://deriv-ai-trade-coach.onrender.com";

// Demo trades fallback (when backend offline)
const DEMO_TRADES = [
  { symbol: "BTCUSD", type: "Long", entry: "64250", exit: "64820", pl: "+$570", date: "2024-01-15", status: "Win" },
  { symbol: "ETHUSD", type: "Short", entry: "3450", exit: "3420", pl: "+$30", date: "2024-01-14", status: "Win" },
  { symbol: "TSLA", type: "Long", entry: "245.50", exit: "243.20", pl: "-$230", date: "2024-01-13", status: "Loss" }
];

let currentSection = "dashboard";

// Boot app
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 AI Trading Coach Frontend Loaded");

  initNavigation();
  setupRefreshButtons();
  setupQuickQuestions();
  setupChat();

  checkBackendStatus();
  loadTradesData();
});

// ============================================================================
// Navigation
// ============================================================================
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(item => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      const section = this.dataset.section;
      if (!section) return;

      if (section === currentSection) return;

      navItems.forEach(i => i.classList.remove("active"));
      this.classList.add("active");

      document.querySelectorAll(".dashboard-section, .coach-section").forEach(sec => {
        sec.classList.remove("active");
      });

      const targetSection = document.getElementById(`${section}-section`);
      if (targetSection) targetSection.classList.add("active");

      document.getElementById("page-title").textContent =
        section === "dashboard" ? "Trading Dashboard" : "AI Trading Coach";

      document.getElementById("page-subtitle").textContent =
        section === "dashboard"
          ? "Real-time insights and performance metrics"
          : "Get personalized trading advice";

      currentSection = section;
    });
  });
}

// ============================================================================
// Backend Status Check
// ============================================================================
async function checkBackendStatus() {
  const statusBadge = document.getElementById("status-badge");
  const coachStatus = document.getElementById("coach-status");

  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Backend Healthy:", data);

      statusBadge.textContent = "Online";
      statusBadge.className = "status-badge online";

      coachStatus.textContent = "Online";
      coachStatus.style.color = "#10b981";
    } else {
      throw new Error("Backend not healthy");
    }
  } catch (error) {
    console.warn("⚠️ Backend Offline:", error);

    statusBadge.textContent = "Offline";
    statusBadge.className = "status-badge offline";

    coachStatus.textContent = "Offline (Demo Mode)";
    coachStatus.style.color = "#ef4444";

    showToast("Backend Offline - Running in Demo Mode", "warning");
  }
}

// ============================================================================
// Load Trades + Render Table + Update KPIs
// ============================================================================
async function loadTradesData() {
  try {
    const response = await fetch(`${BASE_URL}/api/trades`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      // Handle both { trades: [...] } and direct array responses
      const trades = data.trades || data || [];
      console.log("📊 Trades Loaded:", trades);

      renderTrades(trades);
      updateKPIs(trades);
    } else {
      throw new Error("Failed to fetch trades");
    }
  } catch (error) {
    console.warn("⚠️ Using demo trades:", error);
    renderTrades(DEMO_TRADES);
    updateKPIs(DEMO_TRADES);
  }
}

// Render trade table rows
function renderTrades(trades) {
  const tableBody = document.getElementById("trades-table-body");
  if (!tableBody) return;

  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color: var(--text-muted)">
          <i class="fas fa-exchange-alt" style="font-size: 24px; margin-bottom: 12px; display:block;"></i>
          No trades found
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = "";

  trades.forEach(trade => {
    const row = document.createElement("tr");

    const status = trade.status || "Pending";
    const statusClass =
      status.toLowerCase() === "win"
        ? "status-win"
        : status.toLowerCase() === "loss"
          ? "status-loss"
          : "status-pending";

    const plText = trade.pl || trade.profit || "N/A";
    const plColor =
      plText.toString().startsWith("+")
        ? "color: var(--positive);"
        : plText.toString().startsWith("-")
          ? "color: var(--negative);"
          : "";

    row.innerHTML = `
      <td><strong>${trade.symbol || "N/A"}</strong></td>
      <td><span class="status-badge trade ${statusClass}">${trade.type || "N/A"}</span></td>
      <td>${trade.entry || trade.entryPrice || "N/A"}</td>
      <td>${trade.exit || trade.exitPrice || "N/A"}</td>
      <td style="${plColor} font-weight:600;">${plText}</td>
      <td>${trade.date || "N/A"}</td>
      <td><span class="status-badge trade ${statusClass}">${status}</span></td>
    `;

    tableBody.appendChild(row);
  });
}

// KPI Update
function updateKPIs(trades) {
  const portfolioValueEl = document.getElementById("portfolio-value");
  const winRateEl = document.getElementById("win-rate");
  const totalTradesEl = document.getElementById("total-trades");
  const riskScoreEl = document.getElementById("risk-score");

  if (!trades || !Array.isArray(trades)) {
    trades = [];
  }

  const total = trades.length;
  const wins = trades.filter(t => (t.status || "").toLowerCase() === "win").length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const totalPL = trades.reduce((sum, trade) => {
    const raw = trade.pl || trade.profit || "0";
    const num = parseFloat(raw.toString().replace(/[^0-9.-]+/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  // Fake portfolio base + profit
  const portfolioValue = Math.max(0, 10000 + totalPL);

  // Risk score formula (simple demo)
  const riskScore = Math.min(100, Math.max(10, 100 - winRate + Math.floor(Math.random() * 15)));

  if (portfolioValueEl) portfolioValueEl.textContent = `$${portfolioValue.toLocaleString()}`;
  if (winRateEl) winRateEl.textContent = `${winRate}%`;
  if (totalTradesEl) totalTradesEl.textContent = total;
  if (riskScoreEl) riskScoreEl.textContent = `${riskScore}/100`;

  const riskTrend = document.querySelector("#risk-score + .kpi-trend");
  if (riskTrend) {
    if (riskScore > 70) {
      riskTrend.className = "kpi-trend negative";
      riskTrend.innerHTML = `<i class="fas fa-arrow-down"></i><span>Needs improvement</span>`;
    } else if (riskScore > 40) {
      riskTrend.className = "kpi-trend";
      riskTrend.innerHTML = `<span>Moderate risk</span>`;
    } else {
      riskTrend.className = "kpi-trend positive";
      riskTrend.innerHTML = `<i class="fas fa-arrow-up"></i><span>Low risk</span>`;
    }
  }
}

// ============================================================================
// Chat System (AI Coach)
// ============================================================================
function setupChat() {
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.getElementById("typing-indicator");

  if (!messageInput || !sendButton || !chatMessages) return;

  sendButton.addEventListener("click", sendMessage);

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function sendMessage() {
    const msg = messageInput.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    messageInput.value = "";

    showTyping(true);

    // Try backend first
    try {
      const aiReply = await getAIResponse(msg);
      showTyping(false);

      if (aiReply) {
        addMessage(aiReply, "ai");
      } else {
        addMessage(generateFallbackReply(msg), "ai");
      }
    } catch (error) {
      console.warn("⚠️ AI Backend Error:", error);
      showTyping(false);
      addMessage(generateFallbackReply(msg), "ai");
    }
  }

  function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (sender === "user") {
      messageDiv.innerHTML = `
        <div class="message-content" style="margin-left:auto; max-width:80%;">
          <div class="message-sender">You</div>
          <div class="message-text">${escapeHtml(text)}</div>
          <div class="message-time">${timestamp}</div>
        </div>
        <div class="message-avatar">
          <i class="fas fa-user"></i>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <div class="message-sender">AI Coach</div>
          <div class="message-text">${escapeHtml(text)}</div>
          <div class="message-time">${timestamp}</div>
        </div>
      `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping(show) {
    if (!typingIndicator) return;
    typingIndicator.style.display = show ? "flex" : "none";
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function getAIResponse(message) {
    try {
      const response = await fetch(`${BASE_URL}/api/coach/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      return data.response || data.advice || data.message || 
             "I analyzed your question but the response format was unexpected.";
    } catch (error) {
      throw error;
    }
  }
}

// Demo fallback AI replies
function generateFallbackReply(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes("hello") || msg.includes("hi")) {
    return "Hello! I'm your AI Trading Coach. While the backend is offline, I can provide general advice based on common trading principles.";
  }

  if (msg.includes("risk")) {
    return "⚠️ General risk advice: Never risk more than 2% of your capital on a single trade. Use stop-loss orders and diversify across different asset classes.";
  }

  if (msg.includes("win") || msg.includes("rate")) {
    return "📈 To improve win rate: Focus on quality setups over quantity. Wait for confirmation signals and avoid emotional trading. Backtest your strategy thoroughly.";
  }

  if (msg.includes("pattern") || msg.includes("trend")) {
    return "🔍 Common successful patterns include: Support/resistance bounces, trend continuations, and consolidation breakouts. Always confirm with volume.";
  }

  if (msg.includes("analyze") || msg.includes("performance")) {
    return "📊 Key metrics to track: Win rate, risk/reward ratio, maximum drawdown, and consistency. Aim for at least 1:2 risk/reward ratio.";
  }

  return "🤖 Good question! Remember: Trading success is 80% psychology, 15% risk management, and 5% strategy. Focus on discipline and consistency over chasing profits.";
}

// ============================================================================
// Quick Questions Buttons
// ============================================================================
function setupQuickQuestions() {
  const quickButtons = document.querySelectorAll(".quick-question");

  quickButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const question = btn.dataset.question;
      const input = document.getElementById("message-input");
      const send = document.getElementById("send-button");

      if (input && send && question) {
        input.value = question;
        send.click();
      }
    });
  });
}

// ============================================================================
// Refresh Buttons
// ============================================================================
function setupRefreshButtons() {
  const refreshDataBtn = document.getElementById("refresh-data");
  const refreshTradesBtn = document.getElementById("refresh-trades");

  if (refreshDataBtn) {
    refreshDataBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadTradesData();
      checkBackendStatus();
      showToast("Data refreshed successfully", "success");
    });
  }

  if (refreshTradesBtn) {
    refreshTradesBtn.addEventListener("click", () => {
      loadTradesData();
      showToast("Trades refreshed", "success");
    });
  }
}

// ============================================================================
// Toast Notification
// ============================================================================
function showToast(message, type = "success") {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('[toast-type]');
  existingToasts.forEach(toast => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  });

  const toast = document.createElement("div");
  toast.setAttribute("toast-type", type);

  const borderColor =
    type === "success" ? "var(--neon-cyan)" :
    type === "warning" ? "var(--warning)" :
    "var(--negative)";

  const icon =
    type === "success" ? "fa-check-circle" :
    type === "warning" ? "fa-exclamation-triangle" :
    "fa-exclamation-circle";

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 12px 20px;
    border-radius: var(--border-radius);
    border-left: 4px solid ${borderColor};
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    z-index: 9999;
    animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
    animation-fill-mode: forwards;
    font-size: 14px;
  `;

  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <i class="fas ${icon}" style="color:${borderColor};"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// ============================================================================
// Utils
// ============================================================================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Add toast animation styles once
if (!document.querySelector('#toast-styles')) {
  const style = document.createElement("style");
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
