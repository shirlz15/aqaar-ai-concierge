/**
 * Aqaar AI Concierge — Admin Dashboard (Pages 7, 8, 9)
 */
import { getDashboard } from '../api.js';
import { openLeadDrawer } from '../components/drawer.js';
import { renderIntentBarChart, renderProjectDoughnutChart, renderActivityLineChart, destroyAllCharts } from '../components/charts.js';
import { state } from '../state.js';

let dashboardData = null;

export async function renderDashboard() {
  const content = document.getElementById('page-content');
  if (!content) return;

  // Simple PIN gate
  if (!state.isAuthenticated) {
    renderPinGate();
    return;
  }

  content.innerHTML = `
    <div class="dashboard-page">
      <aside class="dashboard-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-section-title">Overview</div>
          <button class="sidebar-link active" id="sb-dashboard"><span class="sidebar-link-icon">📊</span> Dashboard</button>
          <button class="sidebar-link" id="sb-leads"><span class="sidebar-link-icon">👥</span> Lead Management</button>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title">Settings</div>
          <button class="sidebar-link" id="sb-logout"><span class="sidebar-link-icon">🔒</span> Logout</button>
        </div>
      </aside>

      <main class="dashboard-main" id="dashboard-main">
        <div class="spinner-overlay"><div class="spinner"></div></div>
      </main>
    </div>
  `;

  // Bind sidebar
  document.getElementById('sb-dashboard')?.addEventListener('click', () => renderDashboardView());
  document.getElementById('sb-leads')?.addEventListener('click', () => {
    document.getElementById('leads-table-section')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('sb-logout')?.addEventListener('click', () => {
    state.isAuthenticated = false;
    destroyAllCharts();
    renderDashboard();
  });

  try {
    const data = await getDashboard();
    dashboardData = data?.data || data;
    renderDashboardView();
  } catch (err) {
    document.getElementById('dashboard-main').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load dashboard data</h3>
        <p>Could not connect to the Aqaar backend. ${err.message}</p>
        <button class="btn btn-outline" onclick="window.location.reload()" style="margin-top:16px;">Retry</button>
      </div>
    `;
  }
}

function renderDashboardView() {
  const main = document.getElementById('dashboard-main');
  if (!main || !dashboardData) return;

  const m = normalizeMetrics(dashboardData);
  const leads = dashboardData.leads || [];
  state.leads = leads;

  main.innerHTML = `
    <div class="dashboard-topbar">
      <div>
        <h1>Admin Dashboard</h1>
        <p>Overview of Aqaar AI Concierge performance and lead generation</p>
      </div>
      <button class="btn btn-primary" id="db-refresh-btn">🔄 Refresh Data</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-value">${m.total_leads || 'unknown'}</div>
        <div class="kpi-label">Total Leads Captured</div>
        <div class="kpi-delta">From dashboard metrics</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">⭐</div>
        <div class="kpi-value">${m.qualified_leads || 'unknown'}</div>
        <div class="kpi-label">Projects Represented</div>
        <div class="kpi-delta">From Intelligence seed data</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🎯</div>
        <div class="kpi-value" style="text-transform:capitalize;">${getTopIntent(m.intents) || 'unknown'}</div>
        <div class="kpi-label">Top Intent</div>
        <div class="kpi-delta">Derived from KB seed rows</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💬</div>
        <div class="kpi-value">${m.total_sessions || 'unknown'}</div>
        <div class="kpi-label">Published Price Rows</div>
        <div class="kpi-delta">From Intelligence seed data</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card chart-card-full">
        <h3 class="chart-title">Chat Activity (Last 7 Days)</h3>
        <p class="chart-subtitle">Daily user sessions engaging with the AI Concierge</p>
        <div class="chart-container"><canvas id="activity-chart"></canvas></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Leads by Intent</h3>
        <p class="chart-subtitle">Distribution of user inquiries</p>
        <div class="chart-container"><canvas id="intent-chart"></canvas></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Top Projects Queried</h3>
        <p class="chart-subtitle">Most frequent property recommendations</p>
        <div class="chart-container"><canvas id="projects-chart"></canvas></div>
      </div>
    </div>

    <div class="leads-card" id="leads-table-section">
      <div class="leads-card-header">
        <h3 class="leads-card-title">Recent Leads</h3>
        <div class="leads-actions">
          <input type="text" id="leads-search" class="leads-search-input" placeholder="Search leads..." />
          <button class="btn btn-outline btn-sm" id="export-csv-btn">Export CSV</button>
        </div>
      </div>
      <div class="leads-table-wrapper">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Intent</th>
              <th>Score</th>
              <th class="sort-desc">Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="leads-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('db-refresh-btn')?.addEventListener('click', async () => {
    try {
      const data = await getDashboard();
      dashboardData = data?.data || data;
      renderDashboardView();
    } catch (e) {
      console.error(e);
    }
  });

  document.getElementById('export-csv-btn')?.addEventListener('click', exportLeadsCsv);
  document.getElementById('leads-search')?.addEventListener('input', (e) => {
    state.leadsFilter = e.target.value.toLowerCase();
    renderLeadsTable();
  });

  // Render Charts
  setTimeout(() => {
    renderActivityLineChart('activity-chart', { activity: m.activity || [] });
    renderIntentBarChart('intent-chart', { intents: m.intents || { buy: 0, rent: 0, invest: 0, commercial: 0 } });
    renderProjectDoughnutChart('projects-chart', { top_projects: m.top_projects || [] });
  }, 50);

  renderLeadsTable();
}

function normalizeMetrics(payload) {
  const metrics = payload?.metrics || payload || [];
  if (!Array.isArray(metrics)) return payload || {};
  const map = Object.fromEntries(metrics.map(metric => [metric.metric_id || metric.metric_name, metric.metric_value]));
  const seed = payload?.seed_metrics || {};
  const charts = payload?.chart_data || {};
  return {
    total_leads: seed.total_leads || map.total_leads || 'unknown',
    qualified_leads: seed.projects_represented || 'unknown',
    total_sessions: seed.units_with_published_budget || 'unknown',
    intents: charts.intents || { buy: 0, rent: 0, invest: 0, commercial: 0 },
    activity: charts.activity || [],
    top_projects: charts.top_projects || [
      { name: 'Project records', value: Number(map.project_records || 0) },
      { name: 'Inventory records', value: Number(map.inventory_records || 0) },
      { name: 'RAG chunks', value: Number(map.rag_chunks || 0) },
    ],
  };
}

function renderLeadsTable() {
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  const filter = state.leadsFilter;
  let filtered = state.leads;

  if (filter) {
    filtered = filtered.filter(l =>
      (l.name && l.name.toLowerCase().includes(filter)) ||
      (l.intent && l.intent.toLowerCase().includes(filter)) ||
      (l.email && l.email.toLowerCase().includes(filter))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;">No leads found</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => {
    const score = lead.score || lead.lead_score;
    const scoreNum = typeof score === 'number' ? score : parseInt(score);
    const scoreTier = !isNaN(scoreNum) ? (scoreNum >= 70 ? 'high' : scoreNum >= 40 ? 'medium' : 'low') : 'medium';
    const contacted = state.contactedLeads.has(lead.id || lead.name);

    return `
      <tr data-id="${lead.id || lead.name}" class="lead-row">
        <td><div style="font-weight:600;color:var(--text-primary);">${lead.name || 'Unknown'}</div></td>
        <td>
          <div style="font-size:13px;">${lead.phone || lead.contact || 'N/A'}</div>
          <div style="font-size:11px;color:var(--text-muted);">${lead.email || ''}</div>
        </td>
        <td><span class="intent-badge">${lead.intent || 'Unknown'}</span></td>
        <td><span class="lead-score-badge ${scoreTier}">${!isNaN(scoreNum) ? scoreNum : '-'}</span></td>
        <td style="font-size:12px;">${lead.date ? new Date(lead.date).toLocaleDateString() : 'Recent'}</td>
        <td>
          <span class="badge ${contacted ? 'badge-success' : 'badge-warning'}">
            ${contacted ? 'Contacted' : 'New'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.lead-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      const lead = filtered.find(l => (l.id || l.name) === id);
      if (lead) openLeadDrawer(lead);
    });
  });
}

function exportLeadsCsv() {
  if (!state.leads || !state.leads.length) return;
  const headers = ['Name', 'Phone', 'Email', 'Intent', 'Budget', 'Property', 'Score', 'Date'];
  const rows = state.leads.map(l => [
    `"${l.name || ''}"`,
    `"${l.phone || l.contact || ''}"`,
    `"${l.email || ''}"`,
    `"${l.intent || ''}"`,
    `"${l.budget || ''}"`,
    `"${l.property_name || l.property || ''}"`,
    `"${l.score || l.lead_score || ''}"`,
    `"${l.date || ''}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aqaar_leads_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getTopIntent(intents) {
  if (!intents) return null;
  let max = 0; let top = null;
  for (const [k, v] of Object.entries(intents)) {
    if (v > max) { max = v; top = k; }
  }
  return top;
}

function renderPinGate() {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = `
    <div class="pin-gate">
      <div class="pin-card">
        <div class="pin-icon">🔒</div>
        <h2>Admin Dashboard</h2>
        <p>Please enter the admin PIN to access</p>
        <input type="password" id="pin-input" class="pin-input" maxlength="4" placeholder="••••" autocomplete="off" />
        <div id="pin-error" class="pin-error"></div>
        <p style="margin-top:16px;font-size:12px;color:var(--text-muted);">Hint: Try 1234 for demo</p>
      </div>
    </div>
  `;
  const input = document.getElementById('pin-input');
  input?.focus();
  input?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.length === 4) {
      if (val === '1234') {
        state.isAuthenticated = true;
        renderDashboard();
      } else {
        const err = document.getElementById('pin-error');
        if (err) err.textContent = 'Incorrect PIN';
        e.target.value = '';
        setTimeout(() => { if (err) err.textContent = ''; }, 2000);
      }
    }
  });
}
