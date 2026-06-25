/**
 * Aqaar AI Concierge — Chart.js Wrappers
 * All charts styled with Aqaar dark theme + lime accent
 */

const ACCENT = '#c8e63c';
const ACCENT_DIM = 'rgba(200,230,60,0.15)';
const GRID_COLOR = 'rgba(255,255,255,0.05)';
const TEXT_COLOR = '#666666';

const chartInstances = new Map();

function destroyChart(id) {
  if (chartInstances.has(id)) {
    chartInstances.get(id).destroy();
    chartInstances.delete(id);
  }
}

const baseFont = { family: "'Inter', sans-serif", size: 12 };

/**
 * Bar chart — Leads by Intent
 */
export function renderIntentBarChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const intents = data?.intents || { buy: 0, rent: 0, invest: 0, commercial: 0 };
  const labels = Object.keys(intents).map(k => k.charAt(0).toUpperCase() + k.slice(1));
  const values = Object.values(intents);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Leads',
        data: values,
        backgroundColor: [ACCENT_DIM, 'rgba(200,230,60,0.25)', 'rgba(200,230,60,0.35)', ACCENT_DIM],
        borderColor: ACCENT,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: ACCENT,
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#b8b8b8',
          titleFont: baseFont,
          bodyFont: baseFont,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} leads`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont },
          border: { color: 'transparent' },
        },
        y: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont, precision: 0 },
          border: { color: 'transparent' },
          beginAtZero: true,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

/**
 * Doughnut chart — Project Popularity
 */
export function renderProjectDoughnutChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const projects = data?.top_projects || data?.projects || [];
  const limited = projects.slice(0, 6);
  const labels = limited.map(p => (p.name || p.title || 'Not published').substring(0, 20));
  const values = limited.map(p => Number(p.count || p.queries || p.value || 0));

  const colors = [
    ACCENT,
    'rgba(200,230,60,0.7)',
    'rgba(200,230,60,0.5)',
    'rgba(200,230,60,0.35)',
    'rgba(200,230,60,0.2)',
    'rgba(255,255,255,0.1)',
  ];

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#161616',
        borderWidth: 3,
        hoverBorderColor: ACCENT,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#b8b8b8',
            font: baseFont,
            boxWidth: 12,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: ACCENT,
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#b8b8b8',
          titleFont: baseFont,
          bodyFont: baseFont,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

/**
 * Line chart — Chat sessions / activity over time
 */
export function renderActivityLineChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const sessions = data?.sessions_by_day || data?.activity || [];
  const labels = sessions.length > 0
    ? sessions.map(s => s.date || s.day || 'Seed')
    : ['Seed'];
  const values = sessions.length > 0
    ? sessions.map(s => s.count || s.sessions)
    : [0];

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Chat Sessions',
        data: values,
        borderColor: ACCENT,
        backgroundColor: 'rgba(200,230,60,0.07)',
        borderWidth: 2,
        pointBackgroundColor: ACCENT,
        pointBorderColor: '#161616',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: ACCENT,
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#b8b8b8',
          titleFont: baseFont,
          bodyFont: baseFont,
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont },
          border: { color: 'transparent' },
        },
        y: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont, precision: 0 },
          border: { color: 'transparent' },
          beginAtZero: true,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function destroyAllCharts() {
  chartInstances.forEach(c => c.destroy());
  chartInstances.clear();
}
