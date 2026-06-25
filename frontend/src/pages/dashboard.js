import { getDashboard } from '../api.js';
import { openLeadDrawer } from '../components/drawer.js';
import { renderIntentBarChart, renderProjectDoughnutChart, renderActivityLineChart, destroyAllCharts } from '../components/charts.js';
import { state } from '../state.js';

const NOT_PUBLISHED = 'Not published by Aqaar';
let dashboardData = null;

export async function renderDashboard() {
  const content = document.getElementById('page-content');
  if (!content) return;

  if (!state.isAuthenticated) {
    renderPinGate();
    return;
  }

  content.innerHTML = `
    <div class="dashboard-page">
      <aside class="dashboard-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-section-title">Overview</div>
          <button class="sidebar-link active" id="sb-dashboard">Dashboard</button>
          <button class="sidebar-link" id="sb-leads">Lead Management</button>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title">Settings</div>
          <button class="sidebar-link" id="sb-logout">Logout</button>
        </div>
      </aside>
      <main class="dashboard-main" id="dashboard-main">
        <div class="spinner-overlay"><div class="spinner"></div></div>
      </main>
    </div>
  `;

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
    dashboardData = await getDashboard();
    renderDashboardView();
  } catch (err) {
    document.getElementById('dashboard-main').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">!</div>
        <h3>Failed to load dashboard data</h3>
        <p>Could not connect to the Aqaar backend. ${escapeHtml(err.message)}</p>
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
        <p>${escapeHtml(display(m.data_label))}</p>
      </div>
      <button class="btn btn-primary" id="db-refresh-btn">Refresh Data</button>
    </div>

    <div class="kpi-grid">
      ${kpiCard('Total Leads', m.total_leads, 'From aqaar_leads_seed.csv')}
      ${kpiCard('Qualified Leads', m.qualified_leads, 'Rows with published budget')}
      ${kpiCard('Top Intent', getTopIntent(m.intents), 'Derived from seed purpose/unit type')}
      ${kpiCard('Active Chats', m.total_sessions, 'Runtime events or seed proxy')}
    </div>

    <div class="charts-grid">
      <div class="chart-card chart-card-full">
        <h3 class="chart-title">Runtime Activity</h3>
        <p class="chart-subtitle">Demo intelligence activity from verified Aqaar KB seed rows</p>
        <div class="chart-container"><canvas id="activity-chart"></canvas></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Intent Distribution</h3>
        <p class="chart-subtitle">Buy, rent, invest, and commercial split</p>
        <div class="chart-container"><canvas id="intent-chart"></canvas></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Top Projects</h3>
        <p class="chart-subtitle">Most represented projects in seed data</p>
        <div class="chart-container"><canvas id="projects-chart"></canvas></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Locations</h3>
        <p class="chart-subtitle">Seed rows by location/community</p>
        <div class="chart-container"><canvas id="locations-chart"></canvas></div>
      </div>
    </div>

    <div class="leads-card" id="leads-table-section">
      <div class="leads-card-header">
        <h3 class="leads-card-title">Lead Intelligence Table</h3>
        <div class="leads-actions">
          <input type="text" id="leads-search" class="leads-search-input" placeholder="Search lead, project, location..." />
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
              <th>Project</th>
              <th>Budget</th>
              <th>Location</th>
              <th>Unit Type</th>
              <th>Timeline</th>
              <th>Tags</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="leads-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('db-refresh-btn')?.addEventListener('click', async () => {
    dashboardData = await getDashboard();
    renderDashboardView();
  });
  document.getElementById('export-csv-btn')?.addEventListener('click', exportLeadsCsv);
  document.getElementById('leads-search')?.addEventListener('input', (event) => {
    state.leadsFilter = event.target.value.toLowerCase();
    renderLeadsTable();
  });

  setTimeout(() => {
    renderActivityLineChart('activity-chart', { activity: m.activity });
    renderIntentBarChart('intent-chart', { intents: m.intents });
    renderProjectDoughnutChart('projects-chart', { top_projects: m.top_projects });
    renderProjectDoughnutChart('locations-chart', { top_projects: m.location_distribution });
  }, 50);

  renderLeadsTable();
}

function normalizeMetrics(payload) {
  const seed = payload?.seed_metrics || {};
  const charts = payload?.chart_data || {};
  return {
    total_leads: seed.total_leads,
    qualified_leads: seed.qualified_leads || seed.units_with_published_budget,
    total_sessions: seed.active_chats,
    data_label: seed.data_label || 'Demo intelligence data from verified Aqaar KB',
    intents: charts.intents || { buy: 0, rent: 0, invest: 0, commercial: 0 },
    activity: charts.activity || [],
    top_projects: charts.top_projects || [],
    location_distribution: charts.location_distribution || [],
  };
}

function kpiCard(label, value, detail) {
  return `
    <div class="kpi-card">
      <div class="kpi-value">${escapeHtml(display(value))}</div>
      <div class="kpi-label">${escapeHtml(label)}</div>
      <div class="kpi-delta">${escapeHtml(detail)}</div>
    </div>
  `;
}

function renderLeadsTable() {
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  const filter = state.leadsFilter;
  let filtered = state.leads || [];
  if (filter) {
    filtered = filtered.filter(lead => JSON.stringify(lead).toLowerCase().includes(filter));
  }

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:32px;">No leads found</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => `
    <tr data-id="${escapeHtml(lead.id || lead.name)}" class="lead-row">
      <td><strong>${escapeHtml(display(lead.name))}</strong></td>
      <td>${escapeHtml(display(lead.contact || lead.phone || lead.email))}</td>
      <td><span class="intent-badge">${escapeHtml(display(lead.intent || lead.purpose))}</span></td>
      <td>${escapeHtml(display(lead.interested_project || lead.project_name || lead.property_name))}</td>
      <td>${escapeHtml(display(lead.budget))}</td>
      <td>${escapeHtml(display(lead.location || lead.region))}</td>
      <td>${escapeHtml(display(lead.unit_type))}</td>
      <td>${escapeHtml(display(lead.timeline))}</td>
      <td>${escapeHtml(display(lead.tags))}</td>
      <td>${escapeHtml(displayDate(lead.date))}</td>
      <td><span class="badge badge-success">${escapeHtml(display(lead.status))}</span></td>
    </tr>
  `).join('');

  document.querySelectorAll('.lead-row').forEach(row => {
    row.addEventListener('click', () => {
      const lead = filtered.find(item => String(item.id || item.name) === row.dataset.id);
      if (lead) openLeadDrawer(lead);
    });
  });
}

function exportLeadsCsv() {
  if (!state.leads?.length) return;
  const headers = ['Name', 'Contact', 'Intent', 'Project', 'Budget', 'Location', 'Unit Type', 'Timeline', 'Tags', 'Date', 'Status'];
  const rows = state.leads.map(lead => [
    lead.name,
    lead.contact,
    lead.intent,
    lead.interested_project || lead.project_name,
    lead.budget,
    lead.location,
    lead.unit_type,
    lead.timeline,
    lead.tags,
    lead.date,
    lead.status,
  ].map(value => `"${String(display(value)).replace(/"/g, '""')}"`));
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aqaar_leads_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function display(value) {
  if (value === undefined || value === null || value === '' || String(value).toLowerCase() === 'unknown') return NOT_PUBLISHED;
  return String(value);
}

function displayDate(value) {
  const safe = display(value);
  if (safe === NOT_PUBLISHED) return safe;
  const date = new Date(safe);
  return Number.isNaN(date.getTime()) ? safe : date.toLocaleDateString();
}

function getTopIntent(intents) {
  if (!intents) return null;
  return Object.entries(intents).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPinGate() {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = `
    <div class="pin-gate">
      <div class="pin-card">
        <div class="pin-icon">Lock</div>
        <h2>Admin Dashboard</h2>
        <p>Please enter the admin PIN to access</p>
        <input type="password" id="pin-input" class="pin-input" maxlength="4" placeholder="0000" autocomplete="off" />
        <div id="pin-error" class="pin-error"></div>
        <p style="margin-top:16px;font-size:12px;color:var(--text-muted);">Hint: Try 1234 for demo</p>
      </div>
    </div>
  `;
  const input = document.getElementById('pin-input');
  input?.focus();
  input?.addEventListener('input', (event) => {
    if (event.target.value.length === 4) {
      if (event.target.value === '1234') {
        state.isAuthenticated = true;
        renderDashboard();
      } else {
        const err = document.getElementById('pin-error');
        if (err) err.textContent = 'Incorrect PIN';
        event.target.value = '';
      }
    }
  });
}
