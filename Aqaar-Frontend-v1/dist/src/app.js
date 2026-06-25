const API_BASE = window.AQAAR_API_BASE || "/api";

const state = {
  sessionId: `web-${Date.now()}`,
  dashboard: [],
  recommendations: [],
  searchResults: [],
  leads: [],
  selectedProjects: [],
  runtime: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const known = (value) => value !== undefined && value !== null && String(value).trim() !== "" && String(value).trim().toLowerCase() !== "unknown";
const display = (value) => (known(value) ? value : "Contact Aqaar for details.");

async function api(path, body = null) {
  const options = body
    ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
    : {};
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) throw new Error(`API ${path} failed`);
  return response.json();
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
}

function addMessage(role, text, sources = []) {
  const log = $("#chatLog");
  const node = document.createElement("div");
  node.className = `message ${role}`;
  node.innerHTML = `<div>${escapeHtml(text)}</div>${sources.length ? `<small>Sources: ${sources.slice(0, 3).map((s) => escapeHtml(s.entity_name || s.source_url || "KB")).join(", ")}</small>` : ""}`;
  log.appendChild(node);
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

async function loadInitialData() {
  addMessage("assistant", "Welcome to Aqaar AI Concierge. Ask about buy, rent, invest, commercial, a project name, location, or unit type.");
  const [dashboard, recommend, qualifyBuy] = await Promise.all([
    api("/dashboard"),
    api("/recommend", {}),
    api("/qualify", { intent: "Buy Property" })
  ]);

  state.dashboard = dashboard.metrics || [];
  state.recommendations = recommend.recommendations || [];
  state.selectedProjects = state.recommendations.slice(0, 2).map((item) => item.project);
  renderMetrics();
  renderRecommendations(state.recommendations);
  renderComparison();
  renderVerified();
  renderQualification(qualifyBuy);
  renderIntentGrid();
  renderFlowList();
  renderCharts();
  renderRuntime("Application loaded from backend APIs.");
}

function renderIntentGrid() {
  const intents = ["Buy Property", "Rent Property", "Investment", "Commercial"];
  $("#intentGrid").innerHTML = intents
    .map((intent) => `<button class="intent-card" data-action="qualify" data-intent="${intent}"><strong>${intent}</strong><span class="meta">Open guided flow</span></button>`)
    .join("");
}

function renderFlowList() {
  const order = [
    "Landing / intro page",
    "AI Concierge chat",
    "Guided buyer flow",
    "Buy / Rent / Invest / Commercial intent flows",
    "Property recommendation results",
    "Project comparison view",
    "Lead capture form",
    "Lead summary card",
    "Sales handoff message",
    "Admin dashboard",
    "Lead intelligence dashboard",
    "Lead table",
    "Lead detail drawer",
    "Charts",
    "Runtime activity/events section",
    "Search and filters",
    "Export CSV",
    "Download guide/brochure",
    "Toast notifications",
    "Empty states"
  ];
  $("#flowList").innerHTML = order.map((item) => `<li>${item}</li>`).join("");
}

function renderQualification(payload) {
  const questions = payload.qualification_questions || [];
  const next = payload.next_steps || [];
  $("#qualificationPanel").innerHTML = `
    <p class="eyebrow">${escapeHtml(payload.intent || "Intent")}</p>
    <h2>Qualification Tree</h2>
    <div class="comparison-row">
      <div>
        <h3>Questions</h3>
        <ul>${questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("") || "<li>Contact Aqaar for details.</li>"}</ul>
      </div>
      <div>
        <h3>Next steps</h3>
        <ul>${next.map((q) => `<li>${escapeHtml(q)}</li>`).join("") || "<li>Contact Aqaar for details.</li>"}</ul>
      </div>
    </div>
  `;
}

function renderRecommendations(items) {
  const grid = $("#recommendationGrid");
  $("#emptyRecommendations").hidden = items.length > 0;
  grid.innerHTML = items
    .map((item, index) => {
      const project = item.project || {};
      const firstUnit = (item.units || [])[0] || {};
      return `
        <article class="project-card">
          <p class="eyebrow">${escapeHtml(project.property_type || "Project")}</p>
          <h3>${escapeHtml(display(project.project_name))}</h3>
          <p class="meta">${escapeHtml(display(project.city))} / ${escapeHtml(display(project.district || project.community))}</p>
          <div class="comparison-row">
            <span><strong>Developer</strong><br>${escapeHtml(display(project.developer))}</span>
            <span><strong>Status</strong><br>${escapeHtml(display(project.status))}</span>
          </div>
          <div class="comparison-row">
            <span><strong>Unit</strong><br>${escapeHtml(display(firstUnit.unit_type))}</span>
            <span><strong>Price</strong><br>${escapeHtml(display(firstUnit.price_min))} ${escapeHtml(known(firstUnit.currency) ? firstUnit.currency : "")}</span>
          </div>
          <p class="meta">Source: ${escapeHtml(project.source_url || item.source?.source_url || "Contact Aqaar for details.")}</p>
          <div class="actions">
            <button type="button" class="ghost-button" data-action="compare" data-index="${index}" onclick="window.aqaarCardAction('compare', ${index})">Compare</button>
            <button type="button" class="ghost-button" data-action="ask-ai" data-index="${index}" onclick="window.aqaarCardAction('ask-ai', ${index})">Ask AI</button>
            <button type="button" class="accent-button" data-action="enquire-project" data-index="${index}" onclick="window.aqaarCardAction('enquire-project', ${index})">Enquire</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderComparison() {
  const projects = state.selectedProjects.slice(0, 2);
  if (!projects.length) {
    $("#comparisonView").innerHTML = `<div class="empty-state"><h3>No comparison selected</h3><p>Choose Compare from a recommendation card.</p></div>`;
    return;
  }
  $("#comparisonView").innerHTML = projects
    .map(
      (project) => `
      <div class="project-card">
        <h3>${escapeHtml(display(project.project_name))}</h3>
        <p class="meta">${escapeHtml(display(project.city))} / ${escapeHtml(display(project.district || project.community))}</p>
        <p><strong>Type:</strong> ${escapeHtml(display(project.property_type))}</p>
        <p><strong>Sub type:</strong> ${escapeHtml(display(project.sub_type))}</p>
        <p><strong>Status:</strong> ${escapeHtml(display(project.status))}</p>
        <p><strong>Source:</strong> ${escapeHtml(display(project.source_url))}</p>
      </div>`
    )
    .join("");
}

function renderMetrics() {
  const cards = $("#metricCards");
  cards.innerHTML = state.dashboard
    .map((metric) => `<div class="metric-card"><span class="eyebrow">${escapeHtml(metric.metric_group)}</span><strong>${escapeHtml(metric.metric_value)}</strong><p>${escapeHtml(metric.metric_name)}</p><small class="meta">${escapeHtml(metric.metric_label)}</small></div>`)
    .join("");
  const projectCount = state.dashboard.find((m) => m.metric_id === "project_records")?.metric_value;
  $("#heroProjectCount").textContent = projectCount ? `${projectCount} projects` : "KB loaded";
}

function renderCharts() {
  const projectCount = Number(state.dashboard.find((m) => m.metric_id === "project_records")?.metric_value || 0);
  const inventoryCount = Number(state.dashboard.find((m) => m.metric_id === "inventory_records")?.metric_value || 0);
  const ragCount = Number(state.dashboard.find((m) => m.metric_id === "rag_chunks")?.metric_value || 0);
  drawLineChart($("#leadsChart"), [projectCount, inventoryCount, ragCount, Math.max(1, state.recommendations.length)]);
  renderBars("#intentChart", [["Buy", 1], ["Rent", 1], ["Invest", 1], ["Commercial", 1]]);
  renderBars("#topProjectsChart", state.recommendations.slice(0, 6).map((item, index) => [item.project.project_name, 6 - index]));
  renderBars("#locationChart", [["Ajman", projectCount || 1]]);
  renderBars("#unitTypeChart", [["Inventory rows", inventoryCount || 1], ["RAG chunks", ragCount || 1]]);
  renderBars("#timelineChart", [["Unknown", 1]]);
}

function drawLineChart(canvas, values) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const max = Math.max(...values, 1);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#2d332c";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = 20 + (i * (h - 40)) / 4;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#d9ff3f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = 30 + (index * (w - 60)) / Math.max(values.length - 1, 1);
    const y = h - 24 - (value / max) * (h - 52);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function renderBars(selector, rows) {
  const max = Math.max(...rows.map((row) => Number(row[1]) || 0), 1);
  $(selector).innerHTML = rows
    .map(([label, value]) => `<div class="bar-row"><span>${escapeHtml(label)}</span><span class="bar" style="width:${Math.max(8, (Number(value) / max) * 100)}%"></span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");
}

function renderLeadTable() {
  const filter = ($("#leadFilter")?.value || "").toLowerCase();
  const rows = state.leads.filter((lead) => JSON.stringify(lead).toLowerCase().includes(filter));
  $("#emptyLeads").hidden = rows.length > 0;
  $("#leadTable").innerHTML = rows
    .map((lead, index) => `<tr><td>${escapeHtml(display(lead.name))}</td><td>${escapeHtml(display(lead.phone || lead.email))}</td><td>${escapeHtml(display(lead.purpose))}</td><td>${escapeHtml(display(lead.message))}</td><td>Captured</td><td><button class="ghost-button" data-action="open-drawer" data-index="${index}">Details</button></td></tr>`)
    .join("");
}

function renderRuntime(message) {
  const item = { time: new Date().toLocaleTimeString(), message };
  state.runtime.unshift(item);
  state.runtime = state.runtime.slice(0, 8);
  $("#runtimeEvents").innerHTML = state.runtime.map((event) => `<div class="runtime-item"><span>${escapeHtml(event.message)}</span><strong>${escapeHtml(event.time)}</strong></div>`).join("");
}

function renderVerified() {
  const rows = [
    ["KB package", "AQAAR-KB-ACQ-FINAL-v3"],
    ["Intelligence package", "AQAAR-INTELLIGENCE-LAYER-v2"],
    ["Backend APIs", "Concierge-Backend-v1"],
    ["Unknown policy", "Contact Aqaar for details."]
  ];
  $("#verifiedGrid").innerHTML = rows.map(([label, value]) => `<div class="verified-card"><strong>${label}</strong><p>${value}</p></div>`).join("");
}

async function handleSearch(query) {
  const text = query ?? $("#searchInput").value;
  let payload = await api("/search", { query: text, limit: 8 });
  let recommendationPayload = await api("/recommend", known(text) && text.length > 2 ? { message: text } : {});
  let items = recommendationPayload.recommendations || [];

  if (known(text) && text.length <= 2) {
    const needle = text.toLowerCase();
    items = items.filter((item) => JSON.stringify(item).toLowerCase().includes(needle));
  }

  if (!items.length && payload.results?.length) {
    const titles = new Set(payload.results.map((result) => result.title.toLowerCase()));
    const all = (await api("/recommend", {})).recommendations || [];
    items = all.filter((item) => titles.has(String(item.project.project_name).toLowerCase()));
  }

  state.searchResults = payload.results || [];
  renderRecommendations(items);
  renderRuntime(`Search completed: ${text || "all recommendations"}`);
  toast(items.length ? "Search results updated." : "No exact KB recommendation found.");
}

async function sendChat(message, context = "") {
  addMessage("user", message);
  const payload = await api("/chat", { session_id: state.sessionId, message: `${message} ${context}`.trim() });
  addMessage("assistant", payload.answer || "Contact Aqaar for details.", payload.sources || []);
  if (payload.recommendations?.length) {
    state.recommendations = payload.recommendations;
    renderRecommendations(state.recommendations);
    renderCharts();
  }
  renderRuntime(`Chat turn completed with intent: ${payload.intent?.intent || "unknown"}`);
  return payload;
}

async function saveLead(lead) {
  const score = await api("/lead-score", {
    purpose: lead.purpose,
    project_id: "unknown",
    budget: "unknown",
    timeline: "unknown"
  });
  state.leads.unshift({ ...lead, lead_score: score.lead_score, lead_grade: score.lead_grade, created_at: new Date().toISOString() });
  renderLeadTable();
  renderLeadSummary(state.leads[0]);
  renderRuntime("Lead captured from user-provided fields.");
  toast("Lead captured. Chat remains active.");
}

function renderLeadSummary(lead) {
  $("#leadSummary").classList.remove("empty");
  $("#leadSummary").innerHTML = `<h3>${escapeHtml(display(lead.name))}</h3><p><strong>Purpose:</strong> ${escapeHtml(display(lead.purpose))}</p><p><strong>Contact:</strong> ${escapeHtml(display(lead.phone || lead.email))}</p><p><strong>Context:</strong> ${escapeHtml(display(lead.message))}</p><p><strong>Lead score:</strong> ${escapeHtml(display(lead.lead_score))}</p>`;
  $("#handoffMessage").classList.remove("empty");
  $("#handoffMessage").innerHTML = `<p>Aqaar enquiry captured from user-provided fields. Backend handoff template: unknown. Project context: ${escapeHtml(display(lead.message))}</p>`;
}

function openLeadModal(context = "") {
  $("#modalMessage").value = context;
  const modal = $("#leadModal");
  if (!modal.open) modal.showModal();
}

function openDrawer(index) {
  const lead = state.leads[index];
  $("#leadDrawerContent").innerHTML = `<p class="eyebrow">Lead detail</p><h2>${escapeHtml(display(lead.name))}</h2><p><strong>Phone:</strong> ${escapeHtml(display(lead.phone))}</p><p><strong>Email:</strong> ${escapeHtml(display(lead.email))}</p><p><strong>Purpose:</strong> ${escapeHtml(display(lead.purpose))}</p><p><strong>Message:</strong> ${escapeHtml(display(lead.message))}</p><pre>${escapeHtml(JSON.stringify(lead, null, 2))}</pre>`;
  $("#leadDrawer").classList.add("open");
  $("#leadDrawer").setAttribute("aria-hidden", "false");
}

function exportCsv() {
  const rows = state.leads.length ? state.leads : state.dashboard;
  const headers = Object.keys(rows[0] || { status: "unknown" });
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "unknown")).join(","))].join("\n");
  download("aqaar-export.csv", csv, "text/csv");
  toast("CSV exported.");
}

function downloadGuide() {
  const guide = {
    generated_from: "Concierge-Backend-v1 APIs",
    recommendations: state.recommendations,
    dashboard: state.dashboard,
    unknown_policy: "Contact Aqaar for details."
  };
  download("aqaar-ai-concierge-guide.json", JSON.stringify(guide, null, 2), "application/json");
  toast("Guide downloaded.");
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  const target = event.target.closest("[data-action]");
  if (action === "scroll") $(target.dataset.target)?.scrollIntoView({ behavior: "smooth" });
  if (action === "prompt") {
    $("#chatInput").value = target.dataset.prompt;
    $("#chatForm").requestSubmit();
  }
  if (action === "qualify") {
    const result = await api("/qualify", { intent: target.dataset.intent });
    renderQualification(result);
    toast(`${target.dataset.intent} flow loaded.`);
  }
  if (action === "search") handleSearch();
  if (action === "search-example") {
    $("#searchInput").value = target.dataset.query;
    handleSearch(target.dataset.query);
  }
  if (action === "compare") {
    const project = state.recommendations[Number(target.dataset.index)]?.project;
    if (project) state.selectedProjects = [project, ...state.selectedProjects.filter((item) => item.project_id !== project.project_id)].slice(0, 2);
    renderComparison();
    toast("Comparison updated.");
  }
  if (action === "ask-ai") {
    const item = state.recommendations[Number(target.dataset.index)];
    if (item) sendChat(`Tell me about ${item.project.project_name}`, JSON.stringify(item.project));
  }
  if (action === "enquire-project") {
    const item = state.recommendations[Number(target.dataset.index)];
    openLeadModal(item?.project?.project_name || "");
  }
  if (action === "open-lead-modal") openLeadModal();
  if (action === "modal-submit") {
    await saveLead({
      name: $("#modalName").value,
      phone: $("#modalPhone").value,
      email: $("#modalEmail").value,
      purpose: "unknown",
      message: $("#modalMessage").value
    });
  }
  if (action === "refresh-dashboard") {
    const payload = await api("/dashboard");
    state.dashboard = payload.metrics || [];
    renderMetrics();
    renderCharts();
    toast("Dashboard refreshed.");
  }
  if (action === "export-csv") exportCsv();
  if (action === "download-guide") downloadGuide();
  if (action === "open-drawer") openDrawer(Number(target.dataset.index));
  if (action === "close-drawer") {
    $("#leadDrawer").classList.remove("open");
    $("#leadDrawer").setAttribute("aria-hidden", "true");
  }
});

$("#recommendationGrid").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  event.stopPropagation();
  const index = Number(button.dataset.index);
  const item = state.recommendations[index] || state.recommendations.find((entry) => entry.project?.project_name === button.closest(".project-card")?.querySelector("h3")?.textContent);
  if (button.dataset.action === "compare" && item?.project) {
    state.selectedProjects = [item.project, ...state.selectedProjects.filter((project) => project.project_id !== item.project.project_id)].slice(0, 2);
    renderComparison();
    toast("Comparison updated.");
  }
  if (button.dataset.action === "ask-ai" && item?.project) {
    await sendChat(`Tell me about ${item.project.project_name}`, JSON.stringify(item.project));
  }
  if (button.dataset.action === "enquire-project") {
    openLeadModal(item?.project?.project_name || button.closest(".project-card")?.querySelector("h3")?.textContent || "");
  }
});

window.aqaarCardAction = async (action, index) => {
  const item = state.recommendations[index];
  if (action === "compare" && item?.project) {
    state.selectedProjects = [item.project, ...state.selectedProjects.filter((project) => project.project_id !== item.project.project_id)].slice(0, 2);
    renderComparison();
    toast("Comparison updated.");
  }
  if (action === "ask-ai" && item?.project) {
    await sendChat(`Tell me about ${item.project.project_name}`, JSON.stringify(item.project));
  }
  if (action === "enquire-project") {
    openLeadModal(item?.project?.project_name || "");
  }
};

$("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitChatInput();
});

$(".round-send").addEventListener("click", async (event) => {
  event.preventDefault();
  await submitChatInput();
});

async function submitChatInput() {
  const input = $("#chatInput");
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  await sendChat(message);
}

$("#leadForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  saveLead(data);
  event.currentTarget.reset();
});

$("#leadFilter").addEventListener("input", renderLeadTable);

$("#purposeTabs").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-purpose]");
  if (!button) return;
  $$("#purposeTabs button").forEach((item) => item.classList.toggle("active", item === button));
  renderQualification(await api("/qualify", { intent: button.dataset.purpose }));
});

loadInitialData().catch((error) => {
  console.error(error);
  toast("Backend unavailable. Start Concierge-Backend-v1 first.");
  addMessage("assistant", "Backend unavailable. Start Concierge-Backend-v1 and refresh this page.");
});
